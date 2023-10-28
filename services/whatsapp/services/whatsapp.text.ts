import { Context, ServiceSchema } from "moleculer";
import request from "request-promise";
import _ from "lodash";
import { staticCDN } from "../../../common";
import WhatsappBaseService from "./whatsapp.base";
import DialogueService from "./dialogues/common/dialogue.service";
import { DialogueResponse } from "./dialogues/common/dialogue.interface";
import WhatsappSettingsService from "./whatsapp.settings";

const rp = request.defaults({ forever: true, pool: { maxSockets: 10 } });

const WhatsappTextService: ServiceSchema = {
    name: "$whatsapp-text",
    mixins: [WhatsappBaseService, WhatsappSettingsService],
    settings: {
        factsHost: process.env.FACTS_HOST,
        loginUrl: "https://api.doubtnut.com/v2/student/whatsapp-login-one",
        salutations: ["hlo", "good morning", "good afternoon", "good evening", "good night", "/start", "हैलो", "गुड मॉर्निंग", "गुड आफ्टरनून", "गुड इवनिंग", "गुड नाईट", "शुरू"],
        messageForOptIn: ["#hl", "#asknow", "#1", "#2", "#askanydoubt", "#askadoubtnow", "#answermyquestion", "#askaquestionnow", "solve my doubt", "#askaquestion", "#solveadoubt", "#solvemydoubts", "#solvemyquestion", "#solvemydoubt", "#askdoubtnow", "#cleardoubt", "#askquestionnow", "how to ask doubt?", "#solvedoubt", "doubt ka solution kaise milega?", "#askquestion", "#askadoubt", "#clearmydoubt", "how to ask a doubt?", "apna sawaal kaise poochun?", "solve", "type 'solve' and click enter to solve your doubts", "apna sawaal kaise poochun?", "how to ask my doubt?", "sawaal puchhna shuru kaise karein?", "doubt kaise solve hoga?", "kaise milega solution?", "doubt solve kaise hoga?", "apna question kaise poochu?", "doubt kaise solve karu?", "how to ask maths question ?", "question poochne ke steps?", "answer kaise milega?", "question kaise poochna hai?", "solution kaise milega?", "sawal poochne ka tareeka kya hai?", "shuruat kaise karein?", "how to get solution to my question?", "kaise pooche sawal?", "sawaal kaise poochna hai?", "how to begin?", "how to start?", "sawaal kaise pooche?", "sawaal kaise pooche", "how to ask a question", "how to ask a question?", "how to ask a doubt?", "how to ask a doubt", "how to ask maths question?", "how to ask maths doubt ?", "#start", "#answermydoubt", "#askdoubt", "i saw this on facebook...", "i saw this on instagram...", "#vmc", "#अभी पूछें", "#कोई भी डाउट पूछें", "#अभी डाउट पूछें", "#मेरे प्रश्न का उत्तर दें", "#अभी प्रश्न पूछें", "मेरा डाउट हल करें", "#प्रश्न पूछें", "#डाउट हल करें", "#मेरे डाउट्स हल करें", "#मेरा प्रश्न हल करें", "#मेरा डाउट हल करें", "#अभी डाउट पूछें", "#डाउट दूर करें", "#अभी प्रश्न पूछें", "डाउट कैसे पूछें?", "#डाउट हल करें", "डाउट का हल कैसे मिलेगा?", "#प्रश्न पूछें", "#डाउट पूछें", "#मेरा डाउट दूर करें", "डाउट कैसे पूछें?", "अपना प्रश्न कैसे पूछें?", "हल", "अपना सवाल कैसे पूछें?", "अपना डाउट कैसे पूछूं?", "सवाल पूछना शुरू कैसे करें?", "डाउट कैसे हल होगा?", "सॉल्यूशन कैसे मिलेगा?", "डाउट कैसे हल होगा?", "अपना सवाल कैसे पूछूं?", "डाउट कैसे हल करूं?", "गणित का सवाल कैसे पूछें?", "सवाल पूछने के स्टेप्स?", "जवाब कैसे मिलेगा?", "सवाल कैसे पूछना है?", "सॉल्यूशन कैसे मिलेगा?", "सवाल पूछने का तरीका क्या है?", "शुरूआत कैसे करें?", "मेरे सवाल का सॉल्यूशन कैसे मिलेगा?", "कैसे पूछें सवाल?", "सवाल कैसे पूछना है?", "शुरुआत कैसे करें?", "शुरू कैसे करें?", "सवाल कैसे पूछें?", "सवाल कैसे पूछें?", "सवाल कैसे पूछें", "सवाल कैसे पूछें?", "डाउट कैसे पूछें?", "डाउट कैसे पूछें", "गणित का सवाल कैसे पूछें?", "गणित का डाउट कैसे पूछें?", "#शुरू", "#मेरे डाउट का जवाब दें", "#डाउट पूछें", "मैंने यह फेसबुक पर देखा...", "मैंने यह इंस्टाग्राम पर देखा..."],
        facts: ["#fact", "#facts", "#तथ्य", "#तथ्य"],
        loginText: ["doubtnut par log in karein", "doubtnut पर लॉग इन करें"],
        talkToAgent: ["mujhe sales agent se baat karni hai", "mein doubtnut pe available courses ke baare mein detail mein jaana chahunga!", "#coursekharidnahai", "मुझे सेल्स एजेंट से बात करनी है", "मैं doubtbut पर उपलब्ध कोर्स के बारे में विस्तार में जानना चाहूंगा", "#कोर्स खरीदना है"],
        resetConversation: ["home", "reset", "start quiz contest", "new image try karein", "ask a question", "change class", "watch free classes", "english mein",  "होम", "रिसेट", "क्विज शुरू करें", "नई फ़ोटो भेजें", "सवाल पूछें", "एक सवाल पूछें", "हिन्दी में", "kya hai ceo reward?", "get ceo coupon"],
    },
    // dependencies: ["$whatsapp-question"],
    dependencies: [DialogueService],
    actions: {
        handleAskText: {
            async handler(ctx: Context<{ source: number; obj }>) {
                try {
                    /* const qpcProperty: any[] = await ctx.call("$sync-dn-property.find", { query: { bucket: "wa_searching_msg", name: `banners_${ctx.params.obj.locale}`, is_active: 1 } });
                    const propertyValue = qpcProperty.map(x => x.value);
                    if (!propertyValue.length) {
                        this.logger.debug("Dn_property: No image");
                    }
                    const bucketImage = propertyValue.length ? _.sample(propertyValue[0].split("||")) : this.settings.qpcStaticImage; */
                    this.sendMsg(ctx.params.source, ctx.params.obj.phone, { ...this.settings.replyEvents.searchingForSoln }, ctx.params.obj.locale);
                    this.logEvent(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.studentId, { text: ctx.params.obj.context.text }, this.settings.replyEvents.searchingForSoln, ctx.params.obj.context);
                    this.updateConversationContext(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.context, { active: true });
                    const askResp: { questionId: string; urlArray: { questionId: number; url: string }[]; questionIds: string[] }
                        = await this.getUrlArrayFromText(ctx.params.source, ctx.params.obj.context.text, ctx.params.obj);
                    if (!askResp.urlArray.length) {
                        this.sendMsg(ctx.params.source, ctx.params.obj.phone, this.settings.replyEvents.askFailure, ctx.params.obj.locale);
                        this.logEvent(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.studentId, { text: ctx.params.obj.context.text }, this.settings.replyEvents.askFailure, ctx.params.obj.context);
                        this.setDailyCount(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.dailyCountData, this.settings.ContextType.ASK_TEXT);
                        this.stopConversation(ctx.params.source, ctx.params.obj.phone);
                        return;
                    }
                    for (const soln of askResp.urlArray) {
                        this.sendMsg(ctx.params.source, ctx.params.obj.phone, { ...soln, ...this.settings.replyEvents.solution, studentId: ctx.params.obj.studentId }, ctx.params.obj.locale);
                        await this.delay(this.settings.replyEvents.solution.delay);
                    }
                    this.logEvent(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.studentId, { text: ctx.params.obj.context.text }, askResp.urlArray, ctx.params.obj.context);
                    this.schedulePdf(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.studentId, askResp.questionId, askResp.questionIds);
                    this.updateConversationContext(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.context, { active: false, questionId: askResp.questionId, retryCount: 0 });
                    this.handlePostSolnSend(ctx.params.source, ctx.params.obj);
                    this.setDailyCount(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.dailyCountData, this.settings.ContextType.ASK_TEXT);
                } catch (err) {
                    this.logger.error(err);
                    this.sendMsg(ctx.params.source, ctx.params.obj.phone, this.settings.replyEvents.askFailure, ctx.params.obj.locale);
                    this.logEvent(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.studentId, { text: ctx.params.obj.context.text }, this.settings.replyEvents.askFailure, ctx.params.obj.context);
                    this.setDailyCount(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.dailyCountData, this.settings.ContextType.ASK_TEXT);
                    this.stopConversation(ctx.params.source, ctx.params.obj.phone);
                }
            },
        },
    },
    methods: {
        async handleText(source: number, obj) {
            if (this.settings.resetConversation.includes(obj.textLower)) {
                await this.stopConversation(source, obj.phone, true);
                delete obj.context;
            }
            this.logger.debug("Source: ", source, "\nobj: ", obj);
            let continueConversation: boolean;
            if (obj.context && obj.context.contextType === this.settings.ContextType.TALK_TO_AGENT) {
                this.forwardMsgToAgent(obj.source, obj.phone, obj.studentId, obj.text);
                continueConversation = true;
            } else if (obj.context && [this.settings.ContextType.ASK, this.settings.ContextType.ASK_TEXT].includes(obj.context.contextType)) {
                continueConversation = obj.context.questionId ? this.handleTextAfterAskContext(source, obj) : this.handleTextBeforeAskContext(source, obj);
            } else if (obj.context && obj.context.contextType === this.settings.ContextType.DIALOG) {
                continueConversation = await this.handleDialog(source, obj);
            } else {
                continueConversation = await this.handleTextWithoutContext(source, obj);
            }
            if (!continueConversation) {
                if (obj.context) {
                    this.broker.emit("delEntities", { contextId: obj.context.contextId }, "$dialogue");
                }
                this.stopConversation(source, obj.phone);
            }
        },
        // eslint-disable-next-line max-lines-per-function
        async handleDialog(source: number, obj): Promise<boolean> {
            let context: any;
            let replies: DialogueResponse;
            let intents: {
                id: number; intent: string; entity?: string; value?: string; selectedOption?: number; awaited?: boolean; replyId?: number;
            }[] = obj.context && obj.context.intents ? obj.context.intents : [];
            try {
                replies = await this.broker.call("$dialogue.handleText", { text: obj.textLower, selectedOption: obj.selectedOption, intents, locale: obj.locale});
            } catch (e) {
                this.logger.error(e);
                this.sendMsg(source, obj.phone, this.settings.replyEvents.systemFailure, obj.locale);
                this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, this.settings.replyEvents.systemFailure, obj.context);
                return;
            }
            if (!replies) {
                if (obj.context) {
                    this.sendMsg(source, obj.phone, this.settings.replyEvents.systemFailure, obj.locale);
                    this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, this.settings.replyEvents.systemFailure, obj.context);
                    return;
                }
                const interruptedContext = obj.context ? obj.context.interruptedContext : null;
                context = this.startConversation(source, obj.phone, this.settings.ContextType.RANDOM, { interruptedContext });
                this.setDailyCount(source, obj.phone, obj.dailyCountData, this.settings.ContextType.RANDOM);
                this.handleRandomText(source, { ...obj, context });
                return;
            }
            if (!intents.length || replies.interrupted) {
                // new dialogue
                intents = [replies.intents.current];
                if (replies.intents.awaited) {
                    intents.push({ ...replies.intents.awaited, awaited: true });
                }
                const interruptedContext = obj.context ? obj.context.interruptedContext : null;
                context = this.startConversation(source, obj.phone, this.settings.ContextType.DIALOG, { intents, active: false, interruptedContext });
            } else {
                // continue dialogue
                if (replies.intents.current) {
                    const latestExistingIntent = intents[intents.length - 1];
                    latestExistingIntent.value = replies.intents.current.value;
                    if (replies.intents.current.selectedOption) {
                        latestExistingIntent.selectedOption = replies.intents.current.selectedOption;
                    }
                    latestExistingIntent.awaited = false;
                    const loopingIntentIndex = replies.intents.awaited ? intents.findIndex(x => x.replyId === replies.intents.awaited.replyId) : -1;
                    if (loopingIntentIndex > 0) {
                        // Delete loop intents
                        intents.splice(loopingIntentIndex);
                        // this.broker.emit("delEntities", { contextId: obj.context.contextId }, "$dialogue"); // TODO delete entities afler all msg sent
                    }
                    if (replies.intents.awaited) {
                        intents.push({ ...replies.intents.awaited, awaited: true });
                    }
                    this.updateConversationContext(source, obj.phone, obj.context, { intents, active: false, retryCount: 0 });
                    context = { ...obj.context, intents, retryCount: 0 };
                } else {
                    // failure
                    if (!obj.context.retryCount || obj.context.retryCount < (replies.allowedRetries || 1)) {
                        // Awaited intent not equal to current intent, so retry once and continue conversation
                        const retryCount = obj.context.retryCount || 0;
                        for (const reply of replies.msg) {
                            const allEntities = { student_name: obj.name };
                            const { msg, entities } = await this.broker.call("$dialogue.buildTextFromTemplate", { template: reply.msg, intents, replyType: reply.replyType, entities: allEntities, contextId: obj.context.contextId });
                            Object.assign(allEntities, entities);
                            const conditionEntities: { [key: string]: string } = await this.broker.call("$dialogue.checkCondition", {
                                source,
                                phone: obj.phone,
                                studentId: obj.studentId,
                                // msgId: job.data.id,
                                condition: reply.conditionFn,
                                entities: allEntities,
                                contextId: obj.context.contextId,
                                isFailure: true,
                            });
                            Object.assign(allEntities, conditionEntities);
                            const { msg: finalMsg, entities: finalEntities } = await this.broker.call("$dialogue.buildTextFromTemplate", { template: msg, intents, entities: allEntities, replyType: reply.replyType, contextId: obj.context.contextId, finalize: true });
                            Object.assign(allEntities, finalEntities);
                            const replyEvent = {
                                id: reply.id,
                                msg: finalMsg,
                            };
                            this.sendMsg(source, obj.phone, replyEvent, obj.locale);
                            this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, replyEvent, obj.context);
                            this.broker.emit("setEntities", { contextId: obj.context.contextId, entities: allEntities }, "$dialogue");
                        }
                        this.updateConversationContext(source, obj.phone, obj.context, { retryCount: retryCount + 1 });
                        return true;
                    } else {
                        // Awaited intent not equal to current intent and retry limit exceeded, so stop conversation
                        this.sendMsg(source, obj.phone, this.settings.replyEvents.unhandledMessage, obj.locale);
                        this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, this.settings.replyEvents.unhandledMessage, obj.context);
                        return;
                    }
                }
            }
            this.setDailyCount(source, obj.phone, obj.dailyCountData, this.settings.ContextType.DIALOG);
            return this.sendDialogueReply(source, obj, context || obj.context, intents, replies);
        },
        // eslint-disable-next-line max-lines-per-function
        async sendDialogueReply(source, obj, context, intents, replies: DialogueResponse): Promise<boolean> {
            let stopConversationOverride;
            // const awaitedIntent = intents.find(x => x.awaited);
            const allEntities = { student_name: obj.name };
            for (let i = 0; i < replies.msg.length; i++) {
                const reply = replies.msg[i];
                await this.delay((reply.delay || i * 2) * 1000);
                // const isAwaitedReply = awaitedIntent && reply.id === awaitedIntent.replyId;
                const { msg, entities } = await this.broker.call("$dialogue.buildTextFromTemplate", {
                    source,
                    phone: obj.phone,
                    studentId: obj.studentId,
                    msgId: reply.id,
                    template: reply.msg,
                    replyType: reply.replyType,
                    intents,
                    entities: allEntities,
                    contextId: context.contextId,
                });
                Object.assign(allEntities, entities);
                // const replyEvent = {
                //     id: reply.id,
                //     msg,
                //     delay: reply.delay,
                //     condition: reply.conditionFn,
                //     replyType: reply.replyType,
                //     entities,
                // };
                // this.scheduleMsg(source, obj.phone, obj.studentId, replyEvent);
                if (reply.conditionFn) {
                    const conditionEntities: { [key: string]: string } = await this.broker.call("$dialogue.checkCondition", {
                        source,
                        phone: obj.phone,
                        studentId: obj.studentId,
                        // msgId: id,
                        condition: reply.conditionFn,
                        entities,
                        contextId: context.contextId,
                    });
                    if (conditionEntities) {
                        Object.assign(allEntities, conditionEntities);
                        const { msg: finalMsg, entities: finalEntities } = await this.broker.call("$dialogue.buildTextFromTemplate", {
                            source,
                            phone: obj.phone,
                            studentId: obj.studentId,
                            // msgId: obj.id,
                            template: msg,
                            replyType: reply.replyType,
                            entities: allEntities,
                            finalize: true,
                            contextId: context.contextId,
                        });
                        Object.assign(allEntities, finalEntities);
                        const awaitedIntent = intents ? intents.find(x => x.awaited) : null;
                        if (awaitedIntent && awaitedIntent.replyId === reply.id && awaitedIntent.isOption) {
                            const replyTexts = this.getReplyTexts(reply.replyType, finalMsg);
                            if (replyTexts.length) {
                                awaitedIntent.replyTexts = replyTexts;
                                this.updateConversationContext(source, obj.phone, context, { intents });
                            }
                        }
                        this.sendMsg(source, obj.phone, { id: reply.id, msg: finalMsg }, obj.locale);
                        this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, { msg });
                        this.broker.emit("setEntities", { contextId: context.contextId, entities: allEntities }, "$dialogue");
                    } else {
                        stopConversationOverride = true;
                        break;
                    }
                } else {
                    const { msg: finalMsg, entities: finalEntities } = await this.broker.call("$dialogue.buildTextFromTemplate", {
                        source,
                        phone: obj.phone,
                        studentId: obj.studentId,
                        // msgId: job.data.id,
                        template: msg,
                        replyType: reply.replyType,
                        entities: allEntities,
                        contextId: context.contextId,
                        finalize: true,
                    });
                    Object.assign(allEntities, finalEntities);
                    const awaitedIntent = intents ? intents.find(x => x.awaited) : null;
                    if (awaitedIntent && awaitedIntent.replyId === reply.id && awaitedIntent.isOption) {
                        const replyTexts = this.getReplyTexts(reply.replyType, finalMsg);
                        if (replyTexts.length) {
                            awaitedIntent.replyTexts = replyTexts;
                            this.updateConversationContext(source, obj.phone, context, { intents });
                        }
                    }
                    this.sendMsg(source, obj.phone, { id: reply.id, msg: finalMsg }, obj.locale);
                    this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, { msg });
                    this.broker.emit("setEntities", { contextId: context.contextId, entities: allEntities }, "$dialogue");
                }
            }
            return stopConversationOverride ? false : replies.continueConversation;
        },
        async handleTextWithoutContext(source: number, obj): Promise<boolean> {
            const txtSplits = obj.textLower.split("\n");
            const txtToFind = txtSplits[txtSplits.length - 1].trim();
            let context;
            if (this.settings.talkToAgent.includes(obj.textLower)) {
                context = this.startConversation(source, obj.phone, this.settings.ContextType.TALK_TO_AGENT, { active: false });
                this.setDailyCount(source, obj.phone, obj.dailyCountData, this.settings.ContextType.TALK_TO_AGENT);
                this.handlePredefinedText(source, { ...obj, context }, this.settings.ContextType.TALK_TO_AGENT);
                return true;
            }
            if (this.settings.salutations.includes(obj.textLower)) {
                context = this.startConversation(source, obj.phone, this.settings.ContextType.SALUTATION);
                this.setDailyCount(source, obj.phone, obj.dailyCountData, this.settings.ContextType.SALUTATION);
                this.handlePredefinedText(source, { ...obj, context }, this.settings.ContextType.SALUTATION);
                return;
            }
            if (this.settings.messageForOptIn.includes(txtToFind)) {
                context = this.startConversation(source, obj.phone, this.settings.ContextType.CAMPAIGN);
                this.setDailyCount(source, obj.phone, obj.dailyCountData, this.settings.ContextType.SALUTATION); // Purposely ContextType.SALUTATION
                this.handlePredefinedText(source, { ...obj, context }, this.settings.ContextType.CAMPAIGN);
                return;
            }
            if (this.settings.facts.includes(obj.textLower)) {
                context = this.startConversation(source, obj.phone, this.settings.ContextType.FACTS);
                this.setDailyCount(source, obj.phone, obj.dailyCountData, this.settings.ContextType.FACTS);
                this.handlePredefinedText(source, { ...obj, context }, this.settings.ContextType.FACTS);
                return;
            }
            if (obj.text.length > this.settings.TEXT_QUESTION_MIN_LENGTH) {
                context = this.startConversation(source, obj.phone, this.settings.ContextType.ASK_TEXT, { active: false, text: obj.text });
                this.setDailyCount(source, obj.phone, obj.dailyCountData, this.settings.ContextType.ASK_TEXT);
                this.sendMsg(source, obj.phone, this.settings.replyEvents.longText, obj.locale);
                this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, this.settings.replyEvents.longText, context, obj.context);
                return true;
            }
            return this.handleDialog(source, obj);
        },
        handleTextBeforeAskContext(source: number, obj): boolean {
            if (Object.keys(this.settings.replyEvents.contextImageCourse).includes(obj.textLower)) {
                if (obj.context.contextType === this.settings.ContextType.ASK && obj.context.interruptedContext && obj.context.interruptedContext.contextType === this.settings.ContextType.TALK_TO_AGENT) {
                    this.uploadImage(source, Buffer.from(obj.context.image, "base64"), false).then((x: { url: any }) => this.forwardMsgToAgent(source, obj.phone, obj.studentId, x.url));
                    return;
                }
                return;
            }
            if (Object.keys(this.settings.replyEvents.longTextFalse).includes(obj.textLower)) {
                this.sendMsg(source, obj.phone, this.settings.replyEvents.longTextFalse[obj.textLower], obj.locale);
                this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, this.settings.replyEvents.longTextFalse[obj.textLower], obj.context);
                return;
            }
            if (Object.keys(this.settings.replyEvents.longTextTrue).includes(obj.textLower) || Object.keys(this.settings.replyEvents.contextImageQuestion).includes(obj.textLower)) {
                if (obj.context.contextType === this.settings.ContextType.ASK) {
                    obj.image = Buffer.from(obj.context.image, "base64");
                    this.actions.handleAskImage({ source, obj }, { timeout: 120000 });
                } else {
                    this.actions.handleAskText({ source, obj }, { timeout: 120000 });
                }
                return true;
            }
            if (!obj.context.retryCount || obj.context.retryCount < this.settings.replyEvents.longText.retries.length) {
                const retryCount = obj.context.retryCount || 0;
                this.updateConversationContext(source, obj.phone, obj.context, { retryCount: retryCount + 1 });
                this.sendMsg(source, obj.phone, this.settings.replyEvents.longText.retries[retryCount], obj.locale);
                // eslint-disable-next-line max-len
                this.logEvent(source, obj.phone, obj.studentId, { text: obj.text, retryCount }, this.settings.replyEvents.longText.retries[retryCount], obj.context);
                return true;
            }
            this.sendMsg(source, obj.phone, this.settings.replyEvents.unhandledMessage, obj.locale);
            this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, this.settings.replyEvents.unhandledMessage, obj.context);
        },
        handleTextAfterAskContext(source: number, obj): boolean {
            if (Object.keys(this.settings.replyEvents.solnFeedbackYesNo).includes(obj.textLower)) {
                const account = this.settings.accounts[source];
                const msgDataIndex = obj.dailyCountData[obj.textLower] || 0;
                const replies = this.settings.replyEvents.solnFeedbackYesNo[obj.textLower];
                const reply = replies[msgDataIndex] || replies[replies.length - 1];
                this.setDailyCount(source, obj.phone, obj.dailyCountData, obj.textLower);
                this.sendMsg(source, obj.phone, {
                    ...reply,
                    questionId: obj.context.questionId,
                    studentId: obj.studentId,
                    feedbackLink: account.feedbackLink,
                    displayNumber: account.displayNumber,
                    channelType: account.channelType,
                }, obj.locale);
                this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, reply, obj.context);
                return;
            }
            if ([this.settings.ContextType.ASK, this.settings.ContextType.ASK_TEXT].includes(obj.context.contextType) && obj.context.interruptedContext && obj.context.interruptedContext.contextType === this.settings.ContextType.TALK_TO_AGENT) {
                this.forwardMsgToAgent(source, obj.phone, obj.studentId, obj.text);
                return;
            }
            if (obj.text.length > this.settings.TEXT_QUESTION_MIN_LENGTH) {
                const interruptedContext = obj.context ? obj.context.interruptedContext : null;
                const context = this.startConversation(source, obj.phone, this.settings.ContextType.ASK_TEXT, { active: false, text: obj.text, interruptedContext });
                this.setDailyCount(source, obj.phone, obj.dailyCountData, this.settings.ContextType.ASK_TEXT);
                this.sendMsg(source, obj.phone, this.settings.replyEvents.longText, obj.locale);
                this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, this.settings.replyEvents.longText, context, obj.context);
                return true;
            }
            if (!obj.context.retryCount || obj.context.retryCount < this.settings.replyEvents.solnFeedback.retries.length) {
                const retryCount = obj.context.retryCount || 0;
                this.updateConversationContext(source, obj.phone, obj.context, { retryCount: retryCount + 1 });
                this.sendMsg(source, obj.phone, this.settings.replyEvents.solnFeedback.retries[retryCount], obj.locale);
                // eslint-disable-next-line max-len
                this.logEvent(source, obj.phone, obj.studentId, { text: obj.text, retryCount }, this.settings.replyEvents.solnFeedback.retries[retryCount], obj.context);
                return true;
            }
            this.sendMsg(source, obj.phone, this.settings.replyEvents.unhandledMessage, obj.locale);
            this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, this.settings.replyEvents.unhandledMessage, obj.context);
        },
        handleRandomText(source, obj): boolean {
            // TODO handle random text as lead-agent conversation
            const msgDataIndex = obj.dailyCountData[this.settings.ContextType.RANDOM] || 0;
            const reply = this.settings.replyEvents.randomMessageReply[msgDataIndex];
            if (!reply) {
                return;
            }
            this.sendMsg(source, obj.phone, reply, obj.locale);
            this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, reply, obj.context);
        },
        handlePredefinedText(source: number, obj, contextType: string): boolean {
            const i = obj.dailyCountData[contextType] || 0;
            let reply;
            let params = {};
            switch (contextType) {
                case this.settings.ContextType.SALUTATION:
                    if (this.settings.replyEvents.salutation) {
                        reply = this.settings.replyEvents.salutation[i];
                        params = { salutation: obj.name ? `${_.startCase(obj.text)} ${obj.name}` : _.startCase(obj.text) };
                    }
                    break;
                case this.settings.ContextType.CAMPAIGN:
                    reply = this.settings.replyEvents.salutation[i];
                    params = { salutation: obj.name ? `Hi ${obj.name}` : "Hi" };
                    break;
                case this.settings.ContextType.FACTS:
                    reply = this.settings.replyEvents.facts[i];
                    params = {
                        condition: this.getFacts,
                        factsEntityId: this.settings.accounts[source].factsEntityId,
                        studentId: obj.studentId,
                        source,
                    };
                    break;
                case this.settings.ContextType.TALK_TO_AGENT:
                    reply = this.settings.replyEvents.talkToAgent;
                    params = { condition: this.forwardMsgToAgent, source, phone: obj.phone, studentId: obj.studentId, text: obj.text };
                    break;
                default:
                    reply = null;
            }
            if (!reply) {
                this.logger.error("Unknown context type");
                // this.logEvent(source, obj.phone, obj.studentId, null, null, obj.context);
                return;
            }
            this.sendMsg(source, obj.phone, { ...reply, ...params }, obj.locale);
            this.logEvent(source, obj.phone, obj.studentId, { text: obj.text }, reply, obj.context);
        },
        async getUrlArrayFromText(source: number, text: string, obj) {
            try {
                const askResp: {
                    questionId: string;
                    locale?: string;
                    results: {
                        _id: string;
                        resource_type?: string;
                        _source: {
                            ocr_text: string; is_answered: number; is_text_answered: number; subject: string;
                        };
                    }[];
                } = await this.getAskResponse({
                    question_text: text,
                    question: this.settings.accounts[source].doubt,
                }, obj);
                this.logger.info("StringDiff length", askResp.questionId, askResp.results.length);
                this.logger.debug("StringDiff", askResp);
                const newWebpage = await this.getNewWebpage(obj.studentId) ;
                const fingerprint = newWebpage ? "WHA_new" : this.settings.accounts[source].fingerprint;
                const channel = newWebpage ? "WHA_new_web_page" : null;
                const webHost = newWebpage ? this.settings.ampHostNew : this.settings.ampHost;
                let c = 0;
                const urlArray: { questionId: number; webUrl: string; resourceType: string; title: string; subject: string; imageUrl?: string }[] = [];
                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let i = 0; i < askResp.results.length; i++) {
                    const q = askResp.results[i];
                    try {
                        // eslint-disable-next-line no-underscore-dangle
                        const question = { ocr_text: q._source.ocr_text, question_id: q._id, subject: q._source.subject };
                        const webUrl = await this.getWebUrl(fingerprint, question, obj.studentId, askResp.questionId, { webHost }); // TODO pass locale
                        // eslint-disable-next-line no-underscore-dangle
                        const resourceType = q.resource_type || (q._source.is_answered ? "video" : q._source.is_text_answered ? "text" : "video");
                        urlArray.push({
                            // eslint-disable-next-line no-underscore-dangle
                            questionId: parseInt(q._id, 10), webUrl, resourceType, title: q._source.ocr_text, subject: q._source.subject,
                            imageUrl: await this.getImageUrl(question.question_id, askResp.locale),
                        });
                        c++;
                        if (c >= 5) {
                            break;
                        }
                    } catch (e) {
                        this.logger.warn(e);
                    }
                }
                await this.generateDeeplink(source, obj.studentId, askResp.questionId, urlArray, fingerprint, channel);
                // TODO return data to update
                return {
                    questionId: askResp.questionId,
                    urlArray,
                    // eslint-disable-next-line no-underscore-dangle
                    questionIds: askResp.results.slice(0, 20).map(x => x._id.toString()),
                };
            } catch (err) {
                this.logger.error(err);
            }
        },
        async getFacts(type: string, studentId: string) {
            const { data } = await rp.post(this.settings.factsHost, {
                body: {
                    type,
                    // eslint-disable-next-line id-blacklist
                    number: 1,
                    student_id: studentId,
                },
                json: true,
            });
            return data[0];
        },
        async sendWhatsappLoginMsg(source: number, phone: string, text: string) {
            const { data } = await rp.post(this.settings.loginUrl, {
                body: {
                    phone,
                },
                json: true,
            });
            this.logger.debug(data);
            this.logEvent(source, phone, null, { text });
        },
        getReplyTexts(replyType: "BUTTONS" | "LIST", msg) {
            switch (replyType) {
                case "BUTTONS":
                    return msg.action.buttons.map(x => x.reply.title.toLowerCase());
                case "LIST":
                    return _.flatten(msg.action.sections.map(x => x.rows) as any[]).map(x => [x.title, x.description].filter(Boolean).join("\n").toLowerCase());
                default:
                    return [];
            }
        },
        async forwardMsgToAgent(source: number, phone: string, studentId: string, msg: string) {
            const { leadId, agentId } = await this.broker.call("$whatsapp-crm-chat.getLeadIdFromPhone", { phone, studentId });
            this.broker.call("$whatsapp-crm-chat.byLead", { leadId, source, phone, studentId, msg, agentId });
        },
    },
};

export = WhatsappTextService;
