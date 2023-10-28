/* eslint-disable max-lines-per-function */
import { ServiceSchema, Context } from "moleculer";
import _ from "lodash";
import CoursePurchaseDialogueService from "../course-purchase/dialogue.course-purchase";
import QuizDialogueService from "../../quiz/dialogue.quiz";
import { redisUtility } from "../../../../../common";
import DailyQuizDialogueService from "../../quiz/dialogue.daily-quiz";
import DoubtCharchaDialogueService from "../../doubt-pe-charcha/dialogue.doubt-pe-charcha";
import WhatsappFreeClassService from "../../free_class/whatsapp.free-class";
import DialogueReferralService from "../../ceo-referral/dialogue.ceo-referral";
import DialogueReplyService from "./dialogue.reply.service";
import DialogueIncomingTextService from "./dialogue.incoming-text.service";
import DialogueIntentService from "./dialogue.intent.service";
import DialogueSequenceService from "./dialogue.sequence.service";
import { DialogueResponse, Reply } from "./dialogue.interface";
import DialogueSettingsService from "./dialogue.settings";

const DialogueService: ServiceSchema = {
    name: "$dialogue",
    mixins: [CoursePurchaseDialogueService, QuizDialogueService, DailyQuizDialogueService, WhatsappFreeClassService, DialogueSettingsService, DoubtCharchaDialogueService, DialogueReferralService],
    dependencies: [DialogueIncomingTextService, DialogueIntentService, DialogueReplyService, DialogueSequenceService],
    settings: {},
    actions: {
        handleText: {
            async handler(ctx: Context<{
                text: string;
                selectedOption?: string;
                intents: {
                    id: number;
                    intent: string;
                    entity?: string;
                    value?: string;
                    awaited: boolean;
                    selectedOption?: number;
                    replyId?: number;
                    replyTexts?: string[];
                }[];
                locale: string;
            }>): Promise<DialogueResponse> {
                const incomingTextObj: { text: string; value: string } = await this.actions.incomingTextParser(ctx.params);
                const selectedOption = ctx.params.selectedOption || incomingTextObj.value;
                const latestAwaitedIntent = ctx.params.intents[ctx.params.intents.length - 1];
                if (!latestAwaitedIntent) {    // fresh dialog
                    return this.actions.handleNewDialogue({ ...ctx.params, text: incomingTextObj.text, value: incomingTextObj.value }, { parentCtx: ctx });
                }

                if (ctx.params.selectedOption && latestAwaitedIntent.replyTexts && !latestAwaitedIntent.replyTexts.includes(ctx.params.text)) {
                    return this.actions.handleFailedDialogue({ ...ctx.params, text: incomingTextObj.text, value: incomingTextObj.value, selectedOption }, { parentCtx: ctx });
                }

                // dialog continue
                const incomingIntentByText: { intentId: number } = await ctx.call("$dialogue-incoming-text.find", {
                    query: { msg: (selectedOption || incomingTextObj.text), intentId: latestAwaitedIntent.id },
                }).then(([x]) => x);

                if (!incomingIntentByText) {   // Incoming intent not same as current intent
                    // check for new dialogue intent, if exists, start new dialogue, dialogue failure
                    const probableNewDialogue = await this.actions.handleNewDialogue({ ...ctx.params, text: incomingTextObj.text, value: incomingTextObj.value }, { parentCtx: ctx });
                    return probableNewDialogue
                        ? { ...probableNewDialogue, interrupted: true }
                        : this.actions.handleFailedDialogue({ ...ctx.params, text: incomingTextObj.text, value: incomingTextObj.value, selectedOption }, { parentCtx: ctx });
                }
                const incomingIntent: { id: number; intent: string; entity: string } = await ctx.call("$dialogue-intent.get", { id: incomingIntentByText.intentId });
                const intentSeq = [];
                const filteredIntents = [...ctx.params.intents.filter(x => !x.awaited), { ...incomingIntent, selectedOption }];
                this.buildIntentSeq(filteredIntents, filteredIntents.length - 1, "", intentSeq);
                const dialogueReplies: { replyId: number; failureReplyId: number }[] = await ctx.call("$dialogue-intent-sequence.find", {
                    query: {
                        intentSeq,
                    },
                });
                if (!dialogueReplies.length) {
                    return;
                }
                const replies = await ctx.mcall(dialogueReplies.map(x => ({ action: "$dialogue-reply-text.get", params: { id: x.replyId } }))) as Reply[];
                const awaitedIntentReply = replies.find(x => x.awaitedIntentId);
                const awaitedIntent: { id: number; intent: string; entity: string } = awaitedIntentReply ? await ctx.call("$dialogue-intent.get", { id: awaitedIntentReply.awaitedIntentId }) : null;
                return {
                    msg: await Promise.all(replies.map(async x => ({
                        id: x.id,
                        msg: await x.msg(ctx.params.locale),
                        delay: x.delay,
                        conditionFn: x.conditionFn,
                        replyType: x.replyType,
                    }))),
                    isFailure: false,
                    continueConversation: !!awaitedIntent,
                    intents: {
                        current: {
                            id: incomingIntent.id,
                            intent: incomingIntent.intent,
                            entity: incomingIntent.entity,
                            value: selectedOption,
                            selectedOption: +selectedOption,
                        },
                        awaited: awaitedIntent ? {
                            id: awaitedIntent.id,
                            intent: awaitedIntent.intent,
                            entity: awaitedIntent.entity,
                            replyId: awaitedIntentReply.id,
                            isOption: ["BUTTONS", "LIST"].includes(awaitedIntentReply.replyType),
                        } : null,
                    },
                };
            },
        },
        handleNewDialogue: {
            async handler(ctx: Context<{
                text: string;
                selectedOption?: string;
                value: string;
                intents: {
                    id: number;
                    intent: string;
                    entity?: string;
                    value?: string;
                    awaited: boolean;
                    selectedOption?: boolean;
                }[];
                locale: string;
            }>): Promise<DialogueResponse> {
                const incomingIntentByText: { intentId: number } = (await ctx.call("$dialogue-incoming-text.find", { query: { msg: ctx.params.text } }).then(([x]) => x)) ||
                    (ctx.params.text === "#val" ? await ctx.call("$dialogue-incoming-text.find", { query: { msg: ctx.params.value } }).then(([x]) => x) : null);
                if (!incomingIntentByText) {
                    return;
                }
                const incomingIntent: { id: number; intent: string; entity: string } = await ctx.call("$dialogue-intent.get", { id: incomingIntentByText.intentId });
                const dialogueReplies: { replyId: number; failureReplyId: number }[] = await ctx.call("$dialogue-intent-sequence.find", {
                    query: {
                        intentSeq: [incomingIntent.intent],
                    },
                });
                if (!dialogueReplies.length) {
                    return;
                }
                const replies = await ctx.mcall(dialogueReplies.map(x => ({ action: "$dialogue-reply-text.get", params: { id: x.replyId } }))) as Reply[];
                const awaitedIntentReply = replies.find(x => x.awaitedIntentId);
                const awaitedIntent: { id: number; intent: string; entity: string } = awaitedIntentReply ? await ctx.call("$dialogue-intent.get", { id: awaitedIntentReply.awaitedIntentId }) : null;
                return {
                    msg: await Promise.all(replies.map(async x => ({
                        id: x.id,
                        msg: await x.msg(ctx.params.locale),
                        delay: x.delay,
                        conditionFn: x.conditionFn,
                        replyType: x.replyType,
                    }))),
                    isFailure: false,
                    continueConversation: !!awaitedIntent,
                    intents: {
                        current: {
                            id: incomingIntent.id,
                            intent: incomingIntent.intent,
                            entity: incomingIntent.entity,
                            value: ctx.params.value,
                        },
                        awaited: awaitedIntent ? {
                            id: awaitedIntent.id,
                            intent: awaitedIntent.intent,
                            entity: awaitedIntent.entity,
                            replyId: awaitedIntentReply.id,
                            isOption: ["BUTTONS", "LIST"].includes(awaitedIntentReply.replyType),
                        } : null,
                    },
                };
            },
        },
        handleFailedDialogue: {
            async handler(ctx: Context<{
                text: string;
                selectedOption?: string;
                value: string;
                intents: {
                    id: number;
                    intent: string;
                    entity?: string;
                    value?: string;
                    awaited: boolean;
                }[];
                locale: string;
            }>): Promise<DialogueResponse> {
                const intentSeq = [];
                const filteredIntents = ctx.params.intents.filter(x => !x.awaited);
                this.buildIntentSeq(filteredIntents, filteredIntents.length - 1, "", intentSeq);
                const dialogueReplies: { replyId: number; failureReplyId: number }[] = await ctx.call("$dialogue-intent-sequence.find", {
                    query: {
                        intentSeq,
                    },
                });
                if (!dialogueReplies.length) {
                    return;
                }
                const dialogueFailureReplies = dialogueReplies.filter(x => x.failureReplyId);
                if (!dialogueFailureReplies.length) {
                    const lastSuccessReplies = await ctx.mcall([{ replyId: 58 }, ...dialogueReplies].map(x => ({ action: "$dialogue-reply-text.get", params: { id: x.replyId } }))) as Reply[];
                    return {
                        msg: [{
                            id: lastSuccessReplies[0].id,
                            msg: await lastSuccessReplies[0].msg(ctx.params.locale),
                            conditionFn: lastSuccessReplies[0].conditionFn,
                            replyType: lastSuccessReplies[0].replyType,
                        }, {
                            id: lastSuccessReplies[lastSuccessReplies.length - 1].id,
                            msg: await lastSuccessReplies[lastSuccessReplies.length - 1].msg(ctx.params.locale),
                            conditionFn: lastSuccessReplies[lastSuccessReplies.length - 1].conditionFn,
                            replyType: lastSuccessReplies[lastSuccessReplies.length - 1].replyType,
                        }],
                        isFailure: true,
                        continueConversation: true,
                        allowedRetries: lastSuccessReplies[lastSuccessReplies.length - 1].allowedRetries,
                        intents: {},
                    };
                }
                // FIXME not being used currently
                const failureReplies = await ctx.mcall(dialogueFailureReplies.map(x => ({ action: "$dialogue-reply-text.get", params: { id: x.failureReplyId } }))) as Reply[];
                return {
                    msg: await Promise.all(failureReplies.map(async x => ({
                        id: x.id,
                        msg: await x.msg(ctx.params.locale),
                        conditionFn: x.conditionFn,
                        replyType: x.replyType,
                    }))),
                    isFailure: true,
                    continueConversation: true,
                    intents: {},
                };
            },
        },
        getEntities: {
            async handler(ctx: Context<{
                source: number;
                phone: string;
                studentId: number;
                msgId: number;
                intents?: { id: number; entity?: string; value?: string }[];
                entities: { [key: string]: string };
                contextId: string;
            }>) {
                const cacheEntities = await redisUtility.getAllHashFields.call(this, `${this.settings.dialogueEntityCachePrefix}:${ctx.params.contextId}`);
                const apiStatus = await this.getApiStatus(ctx.params);
                let entities = ctx.params.intents ? {
                    ...cacheEntities,
                    ...ctx.params.entities,
                    ..._.chain(ctx.params.intents.filter(x => x.entity && x.value))
                        .keyBy("entity")
                        .mapValues("value")
                        .value(),
                } : { ...cacheEntities, ...ctx.params.entities };
                if (apiStatus) {
                    entities = { ...entities, ...apiStatus.entities };
                }
                return entities;
            },
        },
        buildTextFromTemplate: {
            async handler(ctx: Context<{
                source: number;
                phone: string;
                studentId: number;
                msgId: number;
                template: string;
                replyType: string;
                intents?: { id: number; entity?: string; value?: string }[];
                entities: { [key: string]: string };
                finalize: boolean;
                contextId: string;
            }>) {
                const entities = await this.actions.getEntities(ctx.params);
                let template = typeof ctx.params.template === "object" ? JSON.stringify(ctx.params.template) : ctx.params.template;
                const variables = template.match(new RegExp(this.settings.templatePattern, "g")) || [];
                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let i = 0; i < variables.length; i++) {
                    const variable = variables[i];
                    const [entity, defaultValue] = variable.replace(/{/g, "").replace(/}/g, "").split("|");
                    let val = entities[entity];
                    if (ctx.params.finalize) {
                        if (!val && this[entity] && typeof this[entity] === "function") {
                            val = await this[entity]({ ...ctx.params, entities });
                        }
                        if (val && typeof val === "object") {
                            template = template.replace(new RegExp(`"${variable}"`.replace(/\|/g, "\\\|"), "g"), JSON.stringify(val));
                        } else {
                            template = template.replace(new RegExp(variable.replace(/\|/g, "\\\|"), "g"), val || defaultValue || entity || "");
                        }
                    } else if (val) {
                        if (val && typeof val === "object") {
                            template = template.replace(new RegExp(`"${variable}"`.replace(/\|/g, "\\\|"), "g"), JSON.stringify(val));
                        } else {
                            template = template.replace(new RegExp(variable.replace(/\|/g, "\\\|"), "g"), val);
                        }
                    }
                }
                if (ctx.params.replyType && ctx.params.replyType !== "TEXT" && ctx.params.finalize) {
                    return { msg: { ...JSON.parse(template.replace(/\n/g, "\\n")), replyType: ctx.params.replyType }, entities };
                }
                return { msg: template, entities };
            },
        },
        setApiStatus: {
            handler(ctx: Context<{ source: number; phone: string; studentId: string; msgId: number; entities?: { [key: string]: string }; ttl?: number }>) {
                return this.broker.cacher.set(`${this.settings.dialogueCachePrefix}:${ctx.params.source}:${ctx.params.phone}:${ctx.params.msgId}`, ctx.params.entities, ctx.params.ttl || this.settings.oneDayTTL);
            },
        },
        checkCondition: {
            handler(ctx: Context<{ source: number; phone: string; studentId: number; msgId: number; condition: string; contextId: string }>) {
                try {
                    if (this.actions[ctx.params.condition] && typeof this.actions[ctx.params.condition] === "function") {
                        return this.actions[ctx.params.condition](ctx.params);
                    }
                    if (this[ctx.params.condition] && typeof this[ctx.params.condition] === "function") {
                        return this[ctx.params.condition](ctx.params);
                    }
                    return false;
                } catch (e) {
                    this.logger.error(e);
                }
                return false;
            },
        },
        incomingTextParser: {
            handler(ctx: Context<{ text: string }>): { text: string; value: string } {
                const arr = ctx.params.text.match(new RegExp(this.settings.incomingTemplatePattern, "g"));
                if (arr) {
                    return {
                        text: ctx.params.text.replace(arr[0], "#val"),
                        value: arr[0].substring(1),
                    };
                }
                return {
                    text: ctx.params.text,
                    value: ctx.params.text,
                };
            },
        },
    },
    methods: {
        buildIntentSeq(intents: { intent: string; selectedOption?: number }[], n, str, res) {
            if (n === 0) {
                res.push(`${intents[0].intent}${str}`);
                return;
            }
            this.buildIntentSeq(intents, n - 1, `-${intents[n].intent}${str}`, res);
            if (intents[n].selectedOption) {
                this.buildIntentSeq(intents, n - 1, `-${intents[n].intent}_${intents[n].selectedOption}${str}`, res);
            }
        },
        async getApiStatus(params: { source: number; phone: string; studentId: number; msgId: number }) {
            const [data1, data2] = await Promise.all([
                this.broker.cacher.get(`${this.settings.dialogueCachePrefix}:${params.source}:${params.phone}:${params.msgId}`),
                this.broker.cacher.get(`${this.settings.dialogueCachePrefix}::${params.phone}:${params.msgId}`),
            ]);
            return data1 || data2;
        },
        delApiStatus(params: { source: number; phone: string; studentId: number; msgId: number }) {
            this.broker.cacher.get(`${this.settings.dialogueCachePrefix}:${params.source}:${params.phone}:${params.msgId}`);
            this.broker.cacher.get(`${this.settings.dialogueCachePrefix}::${params.phone}:${params.msgId}`);
        },
        selectOption(params: { source: number; phone: string; studentId: number; msgId: number; entities: { [key: string]: string } }) {
            return params.entities[params.entities.option];
        },
    },
    events: {
        setEntities: {
            handler(ctx: Context<{ contextId: string; entities: { [entity: string]: any } }>) {
                return redisUtility.addMultiHashField.call(this, `${this.settings.dialogueEntityCachePrefix}:${ctx.params.contextId}`, ctx.params.entities);
            },
        },
        delEntities: {
            async handler(ctx: Context<{ contextId: string }>) {
                this.broker.cacher.client.del(`${this.settings.dialogueEntityCachePrefix}:${ctx.params.contextId}`);
            },
        },
    },
};

export = DialogueService;
