import { ServiceSchema, Context } from "moleculer";
import _ from "lodash";
import { AxiosInstance } from "axios";
import { staticCDN } from "../../../../common";
import WhatsappSettingsService from "../whatsapp.settings";
import WhatsappWebHandlingService from "../whatsapp.web-handling";
import DialogueSettingsService from "../dialogues/common/dialogue.settings";
import { DialogueCondition } from "../dialogues/dialogue.interface";

const QuizDialogueService: ServiceSchema = {
    name: "$dialogue-quiz",
    mixins: [WhatsappWebHandlingService, WhatsappSettingsService, DialogueSettingsService],
    dependencies: [],
    settings: {},
    actions: {
        getQuizDetails: {
            // cacher: {
            //     enabled: true,
            //     ttl: 60 * 60,
            // },
            async handler(ctx: Context<{ source: number; filter: { class: string; language?: string; subject?: string; chapter?: string }; key: "string" }, { user: { id: number } }>) {
                const token : string = await ctx.call("$student.sign", { studentId: ctx.meta.user.id });
                const account = this.settings.accounts[ctx.params.source];
                const { data } = await (this.settings.backendUrl as AxiosInstance).get("v3/quiz/get-details", {
                    params: {
                        source: account.fingerprint,
                        class: ctx.params.filter.class,
                        language: ctx.params.filter.language,
                        subject: ctx.params.filter.subject,
                        chapter: ctx.params.filter.chapter,
                    },
                    headers: { "x-auth-token": token },
                });
                this.logger.debug(JSON.stringify(data));
                return data.data
                    .widgets.find(x => x.type === "widget_quiz")
                    .data.items
                    .find(x => x.data.key === ctx.params.key)
                    .data.items;
            },
        },
        startQuiz: {
            async handler(ctx: Context<{ source: number; filter: { class: string; language?: string; subject?: string; chapter?: string }; key: "string" }, { user: { id: number } }>) {
                const token : string = await ctx.call("$student.sign", { studentId: ctx.meta.user.id });
                const account = this.settings.accounts[ctx.params.source];
                const { data } = await (this.settings.backendUrl as AxiosInstance).get("v3/quiz/start", {
                    params: {
                        source: account.fingerprint,
                        class: ctx.params.filter.class,
                        language: ctx.params.filter.language,
                        subject: ctx.params.filter.subject,
                        chapter: ctx.params.filter.chapter,
                    },
                    headers: { "x-auth-token": token },
                });
                this.logger.debug(JSON.stringify(data));

                const questions = data.data
                    .widgets.find(x => x.type === "widget_quiz_questions")
                    .data.items
                    .map(x => ({
                        questionId: x.question_id,
                        correctOptions: x.answer.map(op => op.toLowerCase()),
                        resourceType: x.button.is_video_available ? "video" : "text",
                        ocr: x.title,
                        subject: x.button.subject,
                        deeplink: null,
                    }))
                    .sort((a, b) => a.questionId - b.questionId);

                const webUrls = await Promise.all(questions.map(x => this.getWebUrl(account.fingerprint, {
                    ocr_text: x.ocr,
                    question_id: x.questionId,
                    subject: x.subject,
                }, ctx.meta.user.id, x.questionId)));

                const deeplinkPayload: { studentId: number; campaign: string; data: { questionId: number; resourceType: string }[]; source?: string; parentId?: string } = {
                    studentId: ctx.meta.user.id,
                    campaign: "WHA_VDO",
                    source: "WHA_QUIZ",
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
                return {
                    sessionId: data.data.session_id,
                    questions,
                };
            },
        },
        submitAnswer: {
            async handler(ctx: Context<{ source: number; sessionId: string; questionId: string; selectedOption: string }, { user: { id: string } }>) {
                const token : string = await ctx.call("$student.sign", { studentId: ctx.meta.user.id });
                const account = this.settings.accounts[ctx.params.source];
                return (this.settings.backendUrl as AxiosInstance).post("v3/quiz/submit", {
                    source: account.fingerprint,
                    session_id: ctx.params.sessionId,
                    question_id: ctx.params.questionId,
                    option_selected: ctx.params.selectedOption,
                }, {
                    headers: { "x-auth-token": token },
                });
            },
        },
        endQuiz: {
            async handler(ctx: Context<{ source: number; sessionId: string }, { user: { id: string } }>) {
                const token : string = await ctx.call("$student.sign", { studentId: ctx.meta.user.id });
                const account = this.settings.accounts[ctx.params.source];
                return (this.settings.backendUrl as AxiosInstance).post("v3/quiz/end", {
                    source: account.fingerprint,
                    session_id: ctx.params.sessionId,
                }, {
                    headers: { "x-auth-token": token },
                });
            },
        },
    },
    methods: {
        async getQuizClasses(params: DialogueCondition) {
            this.broker.emit("delEntities", { contextId: params.contextId }, "$dialogue");
            const classList = await this.actions.getQuizDetails({
                source: params.source,
                filter: {},
                key: "class",
            }, { meta: { user: { id: params.studentId } } });
            return {
                class_list: classList.map((x, i) => ({ id: (i + 1).toString(), title: x.text, description: "" })),
                classArray: classList.map(x => ({ text: x.text, value: x.value })),
            };
        },
        async getQuizLanguages(params: DialogueCondition) {
            const selectedClass = params.entities.classArray[+params.entities.option - 1];
            const languageList = await this.actions.getQuizDetails({
                source: params.source,
                filter: {
                    class: selectedClass.value,
                },
                key: "language",
            }, { meta: { user: { id: params.studentId } } });
            if (languageList.length > 1 && languageList[0].value === "en") {
                languageList.reverse();
            }
            return {
                class: selectedClass.text,
                classValue: selectedClass.value,
                language_list: languageList.filter(x => ["en", "hi"].includes(x.value)).map((x, i) => ({ type: "reply", reply: { id: (i + 1).toString(), title: x.text } })),
                languageArray: languageList.filter(x => ["en", "hi"].includes(x.value)).map(x => ({ text: x.text, value: x.value })),
            };
        },
        async getQuizSubjects(params: DialogueCondition) {
            const selectedLanguage = params.entities.languageArray[+params.entities.option - 1];
            const subjectList = await this.actions.getQuizDetails({
                source: params.source,
                filter: {
                    class: params.entities.classValue,
                    language: selectedLanguage.value,
                },
                key: "subject",
            }, { meta: { user: { id: params.studentId } } });
            return {
                language: selectedLanguage.text,
                languageValue: selectedLanguage.value,
                subject_list: subjectList.map((x, i) => ({ id: (i + 1).toString(), title: x.text, description: "" })),
                subjectArray: subjectList.map(x => ({ text: x.text, value: x.value })),
            };
        },
        async getRandomChapter(params: DialogueCondition) {
            const selectedSubject = params.entities.subjectArray[+params.entities.option - 1];
            const chapterList = await this.actions.getQuizDetails({
                source: params.source,
                filter: {
                    class: params.entities.classValue,
                    language: params.entities.languageValue,
                    subject: selectedSubject.value,
                },
                key: "chapter",
            }, { meta: { user: { id: params.studentId } } });
            const selectedChapter = _.sample(chapterList);
            return {
                subject: selectedSubject.text,
                subjectValue: selectedSubject.value,
                chapter: selectedChapter.text,
                chapterValue: selectedChapter.value,
            };
        },
        async getQuizQuestion(params: DialogueCondition) {
            if (params.isFailure) {
                return {};
            }
            if (params.entities.quizData) {
                const answeredIndex = params.entities.quizQuestionsAnswered.length;
                const selectedOption = params.entities.option.toLowerCase();
                const currentQ = params.entities.quizData.questions[answeredIndex];
                const isCorrect = currentQ.correctOptions.includes(selectedOption);

                this.actions.submitAnswer({
                    source: params.source,
                    sessionId: params.entities.quizData.sessionId,
                    questionId: currentQ.questionId,
                    selectedOption,
                }, { meta: { user: { id: params.studentId } } });

                return {
                    [`q_${answeredIndex}_answered`]: selectedOption.toUpperCase(),
                    quizQuestionsAnswered: [...params.entities.quizQuestionsAnswered, isCorrect],
                };
            }
            const quizData = await this.actions.startQuiz({
                source: params.source,
                filter: {
                    class: params.entities.classValue,
                    language: params.entities.languageValue,
                    subject: params.entities.subjectValue,
                    chapter: params.entities.chapterValue,
                },
            }, { meta: { user: { id: params.studentId } } });
            const obj = {
                quizData,
                quizQuestionsAnswered: [],
            };
            quizData.questions.forEach((nextQ, i) => {
                obj[`q_${i}_image`] = `${staticCDN}question-text/${params.entities.languageValue}/${nextQ.questionId}.png`;
                obj[`q_${i}_correct_options`] = nextQ.correctOptions.join(", ").toUpperCase();
                obj[`q_${i}_deeplink`] = nextQ.deeplink;
            });
            return obj;
        },
        async getQuizResults(params: DialogueCondition) {
            const answeredIndex = params.entities.quizQuestionsAnswered.length;
            const selectedOption = params.entities.option.toLowerCase();
            const currentQ = params.entities.quizData.questions[answeredIndex];
            const isCorrect = currentQ.correctOptions.includes(selectedOption);
            const quizQuestionsAnswered = [...params.entities.quizQuestionsAnswered, isCorrect];
            const correctCount = quizQuestionsAnswered.filter(Boolean).length;

            this.actions.submitAnswer({
                source: params.source,
                sessionId: params.entities.quizData.sessionId,
                questionId: currentQ.questionId,
                selectedOption,
            }, { meta: { user: { id: params.studentId } } }).then(() => {
                this.actions.endQuiz({
                    source: params.source,
                    sessionId: params.entities.quizData.sessionId,
                }, { meta: { user: { id: params.studentId } } });
            });

            let quiz_result = `Congratulation aapke ${correctCount}/10 marks aaye hai`;
            if (correctCount < 4) {
                quiz_result = `Oof aapke ${correctCount}/10 marks aaye hai.\n\nAapko kaafi mehnat karne ki jarurat hai`;
            } else if (correctCount < 8) {
                quiz_result = `Bahut khoob aapke ${correctCount}/10 marks aaye hai.\n\nThodi aur mehnat karke aap aur acha kar sakte hai`;
            }
            return {
                q_9_answered: selectedOption.toUpperCase(),
                quiz_result,
            };
        },
    },
};

export = QuizDialogueService;
