/* eslint-disable max-lines-per-function */
/* eslint-disable no-underscore-dangle */
import { ServiceSchema, Context } from "moleculer";
import { v4 as uuid } from "uuid";
import _ from "lodash";
import { S3 } from "aws-sdk";
import moment, { Moment } from "moment";
import { redisUtility, staticCDN } from "../../../../common";
import WhatsappBaseService from "../whatsapp.base";
import DialogueSettingsService from "../dialogues/common/dialogue.settings";
import { DialogueCondition } from "../dialogues/dialogue.interface";

const DailyQuizDialogueService: ServiceSchema = {
    name: "$dialogue-daily-quiz",
    mixins: [WhatsappBaseService, DialogueSettingsService],
    dependencies: [],
    settings: {
        rest: "/dialogue",
        languageMapping: {
            en: "English",
            hi: "Hindi",
        },
        dailyQuizKey: "WHATSAPP-DAILY-QUIZ",
        dailyQuizTime: {
            preStart: moment("11:00:00", "hh:mm:ss"),
            postEnd: moment("16:30:00", "hh:mm:ss"),
            batches: {
                1: {
                    reminder: moment("11:15:00", "hh:mm:ss").add("5:30").format("hh:mm A"),
                    startDisplay: moment("11:30:00", "hh:mm:ss").add("5:30").format("hh:mm A"),
                    start: moment("11:30:00", "hh:mm:ss"),
                    end: moment("12:00:00", "hh:mm:ss"),
                },
                2: {
                    reminder: moment("12:15:00", "hh:mm:ss").add("5:30").format("hh:mm A"),
                    startDisplay: moment("12:30:00", "hh:mm:ss").add("5:30").format("hh:mm A"),
                    start: moment("12:30:00", "hh:mm:ss"),
                    end: moment("13:00:00", "hh:mm:ss"),
                },
                3: {
                    reminder: moment("13:15:00", "hh:mm:ss").add("5:30").format("hh:mm A"),
                    startDisplay: moment("13:30:00", "hh:mm:ss").add("5:30").format("hh:mm A"),
                    start: moment("13:30:00", "hh:mm:ss"),
                    end: moment("14:00:00", "hh:mm:ss"),
                },
                4: {
                    reminder: moment("14:15:00", "hh:mm:ss").add("5:30").format("hh:mm A"),
                    startDisplay: moment("14:30:00", "hh:mm:ss").add("5:30").format("hh:mm A"),
                    start: moment("14:30:00", "hh:mm:ss"),
                    end: moment("15:00:00", "hh:mm:ss"),
                },
                5: {
                    reminder: moment("15:15:00", "hh:mm:ss").add("5:30").format("hh:mm A"),
                    startDisplay: moment("15:30:00", "hh:mm:ss").add("5:30").format("hh:mm A"),
                    start: moment("15:30:00", "hh:mm:ss"),
                    end: moment("16:00:00", "hh:mm:ss"),
                },
            },
        },
    },
    actions: {
        getDailyQuizTime: {
            rest: "GET /daily-quiz-time",
            internal: true,
            handler() {
                return this.settings.dailyQuizTime;
            },
        },
        generateDailyQuiz: {
            async handler(ctx: Context<{ source: number; quizId: string; cacheKey: string; quizDate: string; studentId: number }>) {
                this.logger.info("Generating quiz", ctx.params.cacheKey);
                const batchId = this._getBatchId(ctx.params.studentId);
                const c = await redisUtility.countHashFields.call(this, ctx.params.cacheKey);
                if (c > 60) {
                    return;
                }
                const locales = Object.keys(this.settings.languageMapping);
                const account = this.settings.accounts[ctx.params.source];
                const dbData: any[] = await ctx.call("$whatsapp-daily-quiz.find", { query: { source: ctx.params.source, quizDate: ctx.params.quizDate, batchId }, limit: 1, sort: { _id: 1 } });
                if (dbData.length) {
                    this.logger.debug("Daily quiz already exists");
                    for (const locale of locales) {
                        const localeData = dbData[0].questionData.find(x => x.locale === locale);
                        if (!localeData) {
                            continue;
                        }
                        for (let i = 0; i < localeData.questions.length; i++) {
                            redisUtility.addHashField.call(this, ctx.params.cacheKey, `${i}:${locale}`, localeData.questions[i], this.settings.oneDayTTL * 7);
                        }
                    }
                    redisUtility.addHashField.call(this, ctx.params.cacheKey, "META", { quizId: dbData[0].quizId }, this.settings.oneDayTTL * 7);
                    return;
                }

                const questionData: { questions: any[]; locale: string; pdfUrl: string }[] = [];
                for (const locale of locales) {
                    this.logger.info("Generating quiz", locale);
                    const questions: {
                        questionId: number;
                        correctOptions: string[];
                        resourceType: "video" | "text";
                        ocr: string;
                        subject: string;
                        deeplink: string;
                    }[] = [];
                    do {
                        const data: any[] = await ctx.call("$sync-raw.getDailyQuizQuestions", { limit: 40, locale });
                        const thumbQ = await Promise.all(data.map(x => (this.settings.s3 as S3).headObject({
                            Bucket: this.settings.bucket,
                            Key: `question-text/${locale}/${x.questionId}.png`,
                        }).promise().then(() => x).catch(e => this.logger.warn(e))));
                        questions.push(...thumbQ.filter(Boolean));
                    } while (questions.length < 30);
                    questions.splice(30);

                    const webUrls = await Promise.all(questions.map(x => this.getWebUrl(account.fingerprint, {
                        ocr_text: x.ocr,
                        question_id: x.questionId,
                        subject: x.subject,
                    }, 115, x.questionId)));
                    const deeplinkPayload = {
                        studentId: 115,
                        campaign: "WHA_VDO",
                        source: "WHA_7PM_QUIZ",
                        data: questions.map((x, i) => ({
                            questionId: x.questionId,
                            webUrl: webUrls[i],
                            resourceType: x.resourceType,
                            title: x.ocr,
                            subject: x.subject,
                        })),
                    };
                    const output: { url: string }[] = await this.broker.call("$deeplink.createBulk", deeplinkPayload);
                    for (let i = 0; i < output.length; i++) {
                        questions[i].deeplink = output[i].url;
                    }
                    const html = await ctx.call("$sendPdf.getPdfHtml", {
                        entityType: "whatsapp",
                        data: questions,
                        extra: { title: "Today's Quiz Solutions", subHeader: "" },
                    }, { timeout: 60000 });
                    let url: string;
                    do {
                        url = await ctx.call("$pdf.build", {
                            entityId: `Quiz_Solutions_${ctx.params.quizDate}_${batchId}_${locale}`,
                            entityType: "whatsapp",
                            html,
                            persist: false,
                            fileName: `Quiz_Solutions_${ctx.params.quizDate}_${batchId}_${locale}`,
                        }, { timeout: 300000 });
                    } while (!url);
                    questionData.push({
                        locale,
                        questions,
                        pdfUrl: url.replace(staticCDN, ""),
                    });
                    this.logger.info("Generated quiz", locale);
                }
                for (const questionObj of questionData) {
                    const { questions, locale } = questionObj;
                    for (let i = 0; i < questions.length; i++) {
                        redisUtility.addHashField.call(this, ctx.params.cacheKey, `${i}:${locale}`, questions[i], this.settings.oneDayTTL * 7);
                    }
                }
                redisUtility.addHashField.call(this, ctx.params.cacheKey, "META", { quizId: ctx.params.quizId }, this.settings.oneDayTTL * 7);
                ctx.call("$whatsapp-daily-quiz.create", { source: ctx.params.source, questionData, quizId: ctx.params.quizId, quizDate: ctx.params.quizDate, batchId });
            },
        },
        generateDailyQuizShareLink: {
            cache: {
                enabled: true,
                ttl: 86400,
            },
            async handler(ctx: Context<{ source: number }>) {
                const msg = this.responseMsgParser(ctx.params.source, `👋Hey Dost!\nDoubtnut <strong>Daily Quiz Contest</strong> ke liye aaj hi register karo aur ban jao maalamaal💵.\nIsmein har roz mil rahe hain pure 5️⃣0️⃣0️⃣0️⃣ ka <strong>cash prize</strong> 💵 aur har hafte ek bachhe ko milega ek <strong>brand new phone</strong>📱.\n\nFree Registration link👇\nDoubtnut  \nContest Date: ${this._getDailyQuizDate(true).data}\nContest time: 5PM to 9:30PM`);
                return ctx.call("$deeplink.createTinyUrl", { url: encodeURI(`https://api.whatsapp.com/send?text=${msg}`), tags: ["whatsapp"] });
            },
        },
    },
    methods: {
        _getTime(dt: Moment) {
            return moment({ h: dt.hours(), m: dt.minutes(), s: dt.seconds() });
        },
        _getBatchId(studentId: number) {
            return studentId % 5 + 1;
        },
        _getBatchTimings(studentId: number) {
            const batchId = this._getBatchId(studentId);
            return this.settings.dailyQuizTime.batches[batchId];
        },
        _getDailyQuizDate(forRegistration?: boolean) {
            let data;
            if (forRegistration) {
                const quizDate = moment().add(13, "h");
                data = { key: quizDate.format("YYYY-MM-DD"), data: quizDate.format("Do MMM YY") };
            } else {
                const quizDate = moment();
                data = { key: quizDate.format("YYYY-MM-DD"), data: quizDate.format("Do MMM YY") };
            }
            this.logger.debug("Daily quiz date", forRegistration, data);
            return data;
        },
        getDailyQuizRegistrationDate(params: DialogueCondition) {
            return { quiz_date: this._getDailyQuizDate(true).data };
        },
        _getDailyQuizKey(source: number, studentId: number, forRegistration?: boolean) {
            const batchId = this._getBatchId(studentId);
            return `${source}:${this.settings.dailyQuizKey}:${this._getDailyQuizDate(forRegistration).key}:${batchId}`;
        },
        async getDailyQuizShareUrl(params: DialogueCondition) {
            const quiz_share_url = await this.actions.generateDailyQuizShareLink({ source: params.source });
            return { quiz_share_url };
        },
        async _getDailyQuizData(params: DialogueCondition, forRegistration: boolean) {
            const cacheKey = this._getDailyQuizKey(params.source, params.studentId, forRegistration);
            const meta = await redisUtility.getHashField.call(this, cacheKey, "META");
            if (!meta) {
                const quizId = uuid();
                await redisUtility.addHashField.call(this, cacheKey, "META", { quizId }, this.settings.oneDayTTL * 7);
                if (forRegistration) {
                    this.actions.generateDailyQuiz({ source: params.source, quizId, cacheKey, quizDate: this._getDailyQuizDate(true).key, studentId: params.studentId }, { timeout: 360000 });
                }
                return { quizDate: this._getDailyQuizDate(true).data, quizId, isNew: true };
            }
            return { quizDate: this._getDailyQuizDate(true).data, quizId: meta.quizId };
        },
        async registerForDailyQuiz(params: DialogueCondition) {
            const quizLocale = +params.entities.option === 2 ? "hi" : "en";
            const quiz_language = this.settings.languageMapping[quizLocale];
            const batch_id = this._getBatchId(params.studentId);
            const batchTimings: { reminder: string; start: Moment; end: Moment; startDisplay: string } = this._getBatchTimings(params.studentId);
            const quiz_time = batchTimings.startDisplay;
            const dailyQuizData = await this._getDailyQuizData(params, true);
            if (dailyQuizData.isNew) {
                this.broker.call("$whatsapp-daily-quiz-register.create", { source: params.source, studentId: params.studentId, phone: params.phone, quizId: dailyQuizData.quizId, locale: quizLocale });
                return {
                    registration_status: "successfully register hogaye hain",
                    quiz_date: dailyQuizData.quizDate,
                    quiz_time,
                    quiz_reminder_time: batchTimings.reminder,
                    batch_id,
                    quiz_language,
                };
            }
            const data: any[] = await this.broker.call("$whatsapp-daily-quiz-register.find", { query: { studentId: params.studentId, quizId: dailyQuizData.quizId }, limit: 1 });
            if (data.length) {
                return {
                    registration_status: "already registered hain",
                    quiz_date: dailyQuizData.quizDate,
                    quiz_time,
                    quiz_reminder_time: batchTimings.reminder,
                    batch_id,
                    quiz_language: this.settings.languageMapping[data[0].locale],
                };
            }
            this.broker.call("$whatsapp-daily-quiz-register.create", { source: params.source, studentId: params.studentId, phone: params.phone, quizId: dailyQuizData.quizId, locale: quizLocale });
            return {
                registration_status: "successfully register hogaye hain",
                quiz_date: dailyQuizData.quizDate,
                quiz_time,
                quiz_reminder_time: batchTimings.reminder,
                batch_id,
                quiz_language,
            };
        },
        // eslint-disable-next-line max-lines-per-function
        async getDailyQuizQuestion(params: DialogueCondition) {
            if (params.isFailure) {
                this.logger.warn("Daily quiz wrong option select");
                return {};
            }
            const now = moment();
            const cacheKey = this._getDailyQuizKey(params.source, params.studentId);
            const meta = await redisUtility.getHashField.call(this, cacheKey, "META");
            if (!meta) {
                this.logger.warn("Quiz not generated", cacheKey);
                return;
            }
            let text: string; let msg: string;
            const batchTimings: { start: Moment; end: Moment; reminder: string } = this._getBatchTimings(params.studentId);
            let dailyQuizData;
            if (now.isBefore(this._getTime(this.settings.dailyQuizTime.preStart), "s") || now.isAfter(this._getTime(this.settings.dailyQuizTime.postEnd), "s")) {
                dailyQuizData = await this._getDailyQuizData(params, false);
                const data: any[] = await this.broker.call("$whatsapp-daily-quiz-register.find", { query: { studentId: params.studentId, quizId: dailyQuizData.quizId }, limit: 1 });
                if (data.length) {
                    text = this.settings.replyEvents.beforeTimeDailyQuiz.alreadyRegistered.msg.text
                        .replace("{{batch_id}}", this._getBatchId(params.studentId))
                        .replace("{{quiz_reminder_time}}", batchTimings.reminder);
                    msg = { ...this.settings.replyEvents.beforeTimeDailyQuiz.alreadyRegistered.msg, text };
                    this.sendMsg(params.source, params.phone, { ...this.settings.replyEvents.beforeTimeDailyQuiz.alreadyRegistered, msg });
                    return;
                }
                text = this.settings.replyEvents.beforeTimeDailyQuiz.notRegistered.msg.text
                    .replace("{{quiz_date}}", dailyQuizData.quizDate);
                msg = { ...this.settings.replyEvents.beforeTimeDailyQuiz.notRegistered.msg, text };
                this.sendMsg(params.source, params.phone, { ...this.settings.replyEvents.beforeTimeDailyQuiz.notRegistered, msg });
                return;
            }
            if (now.isBefore(this._getTime(batchTimings.start), "s")) {
                this.sendMsg(params.source, params.phone, this.settings.replyEvents.beforeTimeDailyQuiz.loop);
                return;
            }
            if (now.isAfter(this._getTime(batchTimings.end), "s")) {
                msg = this.settings.replyEvents.dailyQuizTimeUp.msg
                    .replace("{{batch_id}}", this._getBatchId(params.studentId));
                this.sendMsg(params.source, params.phone, { ...this.settings.replyEvents.dailyQuizTimeUp, msg });
                this.sendMsg(params.source, params.phone, this.settings.replyEvents.homeDailyQuiz);
                const finalScore = await this.broker.call("$whatsapp-daily-quiz-submit.getFinalScore", { quizId: meta.quizId }, { meta: { user: { id: params.studentId } } });
                this.broker.call("$whatsapp-daily-quiz-score.create", {
                    source: params.source,
                    studentId: params.studentId,
                    phone: params.phone,
                    quizId: meta.quizId,
                    totalScore: finalScore.totalScore,
                    incorrectCount: finalScore.incorrectCount,
                    correctCount: finalScore.correctCount,
                    skipCount: finalScore.skipCount,
                });
                return;
            }
            let quizLocale;
            if (params.entities.quizData) {
                quizLocale = params.entities.quizLocale;
                const answeredIndex = params.entities.quizQuestionsAnswered.length;
                const [currentQ, nextQ] = await redisUtility.getMultiHashField.call(this, this._getDailyQuizKey(params.source, params.studentId), [`${answeredIndex}:${quizLocale}`, `${answeredIndex + 1}:${quizLocale}`]);
                const selectedOption = params.entities.option.toUpperCase();
                const isSkipped = selectedOption === "SKIP";
                const isCorrect = currentQ.correctOptions.includes(selectedOption);
                const currentMarks = isCorrect ? 4 : (isSkipped ? 0 : - 1);
                this.broker.call("$whatsapp-daily-quiz-submit.create", {
                    source: params.source,
                    studentId: params.studentId,
                    phone: params.phone,
                    sessionId: params.entities.sessionId,
                    quizId: meta.quizId,
                    questionId: currentQ.questionId,
                    questionNumber: answeredIndex,
                    selectedOption,
                    marks: currentMarks,
                    locale: quizLocale,
                })
                    .then(async () => {
                        if (!nextQ) {
                            await this.delay(2000);
                            const finalScore = await this.broker.call("$whatsapp-daily-quiz-submit.getFinalScore", { quizId: meta.quizId }, { meta: { user: { id: params.studentId } } });
                            this.broker.call("$whatsapp-daily-quiz-score.create", {
                                source: params.source,
                                studentId: params.studentId,
                                phone: params.phone,
                                quizId: meta.quizId,
                                totalScore: finalScore.totalScore,
                                incorrectCount: finalScore.incorrectCount,
                                correctCount: finalScore.correctCount,
                                skipCount: finalScore.skipCount,
                                locale: quizLocale,
                            });
                        }
                    });
                if (nextQ) {
                    return {
                        [`q_${answeredIndex}_answered`]: selectedOption,
                        [`q_${answeredIndex + 1}_image`]: `${staticCDN}question-text/${quizLocale}/${nextQ.questionId}.png`,
                        quizQuestionsAnswered: [...params.entities.quizQuestionsAnswered, currentMarks],
                    };
                }
                return {
                    [`q_${answeredIndex}_answered`]: selectedOption,
                    quizQuestionsAnswered: [...params.entities.quizQuestionsAnswered, currentMarks],
                };
            }
            const alreadyCompletedQuiz = await this.broker.call("$whatsapp-daily-quiz-submit.find", { query: { studentId: params.studentId, quizId: meta.quizId, questionNumber: 29 }, limit: 1 });
            if (alreadyCompletedQuiz.length) {
                text = this.settings.replyEvents.alreadySubmittedDailyQuiz.msg.text
                    .replace("{{quiz_date}}", this._getDailyQuizDate().data)
                    .replace("{{quiz_date_registration}}", this._getDailyQuizDate(true).data);
                msg = { ...this.settings.replyEvents.alreadySubmittedDailyQuiz.msg, text };
                this.sendMsg(params.source, params.phone, { ...this.settings.replyEvents.alreadySubmittedDailyQuiz, msg });
                return;
            }

            dailyQuizData = await this._getDailyQuizData(params, false);
            const registerData: any[] = await this.broker.call("$whatsapp-daily-quiz-register.find", { query: { studentId: params.studentId, quizId: dailyQuizData.quizId }, limit: 1 });
            quizLocale = registerData.length ? registerData[0].locale : "en";

            const sessionId = uuid();
            const nextQuestion = await redisUtility.getHashField.call(this, this._getDailyQuizKey(params.source, params.studentId), `0:${quizLocale}`);
            return {
                quizData: { sessionId: uuid() },
                quizQuestionsAnswered: [],
                [`q_${0}_image`]: `${staticCDN}question-text/${quizLocale}/${nextQuestion.questionId}.png`,
                sessionId,
                quizLocale,
            };
        },
    },
    async started() {
        this.logger.debug(this.settings.dailyQuizTime);
    },
};

export = DailyQuizDialogueService;
