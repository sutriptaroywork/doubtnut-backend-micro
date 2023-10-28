/* eslint-disable guard-for-in */
import { ServiceSchema, Context } from "moleculer";
import moment from "moment";
import QueueService from "moleculer-bull";
import _ from "lodash";
import { redisUtility } from "../../../common";
import WhatsappBaseService = require("./whatsapp.base");

const WhatsappService: ServiceSchema = {
    name: "$whatsapp",
    mixins: [QueueService(process.env.QUEUE_REDIS), WhatsappBaseService],
    settings: {
        rest: "/whatsapp",
    },
    queues: {
        whatsapp: {
            name: "sendDelayedMsg",
            async process(job: { data: { source: number; phone: number; studentId: number; id: number; msg: string; condition: string; replyType: string; entities: { [key: string]: string } } }) {
                this.logger.debug("JOB", job.data);
                try {
                    if (job.data.condition) {
                        const conditionEntities: { [key: string]: string } = await this.broker.call("$dialogue.checkCondition", {
                            source: job.data.source,
                            phone: job.data.phone,
                            studentId: job.data.studentId,
                            // msgId: job.data.id,
                            condition: job.data.condition,
                            entities: job.data.entities,
                        });
                        if (conditionEntities) {
                            const { msg } = await this.broker.call("$dialogue.buildTextFromTemplate", {
                                source: job.data.source,
                                phone: job.data.phone,
                                studentId: job.data.studentId,
                                // msgId: job.data.id,
                                template: job.data.msg,
                                replyType: job.data.replyType,
                                entities: { ...job.data.entities, ...conditionEntities },
                                finalize: true,
                            });
                            this.sendMsg(job.data.source, job.data.phone, { msg });
                            this.logEvent(job.data.source, job.data.phone, job.data.studentId, null, { msg }); // TODO add context and incoming text later
                        }
                    } else {
                        const { msg } = await this.broker.call("$dialogue.buildTextFromTemplate", {
                            source: job.data.source,
                            phone: job.data.phone,
                            studentId: job.data.studentId,
                            // msgId: job.data.id,
                            template: job.data.msg,
                            replyType: job.data.replyType,
                            entities: job.data.entities,
                            finalize: true,
                        });
                        this.sendMsg(job.data.source, job.data.phone, { msg });
                        this.logEvent(job.data.source, job.data.phone, job.data.studentId, null, { msg }); // TODO add context and incoming text later
                    }
                    return this.Promise.resolve({
                        done: true,
                        id: job.data.msg,
                        worker: process.pid,
                    });
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
    },
    dependencies: ["$gupshup", "$netcore"],
    actions: {
        sendMsg: {
            rest: "PUT /send-text-msg",
            params: {
                phone: "string",
                studentId: "number",
                text: "string",
                preview: { type: "boolean", required: false, default: false },
                campaign: { type: "string", required: false },
                campaignEndTime: { type: "string", required: false },
                fallbackToHSM: { type: "boolean", required: false, default: false },
                hsmData: { type: "object", require: false },
                header : { type: "string", required: false },
                footer : { type: "string", required: false },
                replyType: { type: "string", required: false },
                action : { type: "object", required: false },
                bulk: { type: "boolean", required: false, default: true },
                sources: { type: "array", optional: true, items: "string", default: ["8400400400"] },
            },
            internal: true,
            // TODO add bulk param wherever api required
            async handler(ctx: Context<{ phone: string; text: string; studentId: number; preview: boolean; campaign?: string; campaignEndTime?: string; fallbackToHSM: boolean; hsmData: any; header?: string; footer?: string; replyType?: string; action?: any; bulk?: boolean; sources?: string[] }>) {
                try {
                    this.logger.debug("Sending msg", JSON.stringify(ctx.params));
                    const reqSources = ctx.params.sources || ["8400400400"];
                    const sources = _.intersection(reqSources, Object.keys(this.settings.accounts));
                    const sessionActiveData = await Promise.all(sources.map(x => this.broker.cacher.get(`${x}:${ctx.params.phone}`)));
                    let sentSources = [];
                    for (let i = 0; i < sessionActiveData.length; i++) {
                        const x = sessionActiveData[i];
                        const source = sources[i];
                        if (!x) {
                            continue;
                        }
                        if (ctx.params.campaign && ctx.params.campaignEndTime) {
                            const campaignAlreadySent = await redisUtility.getHashField.call(this, `${source}:${ctx.params.campaign}`, ctx.params.phone);
                            if (campaignAlreadySent) {
                                throw new Error("Campaign already sent");
                            }
                            const campaignTTL = Math.floor(moment(ctx.params.campaignEndTime).diff(moment()) / 1000);
                            redisUtility.addHashField.call(this, `${source}:${ctx.params.campaign}`, ctx.params.phone, { sent: new Date().toISOString() }, campaignTTL);
                        }
                        this.broker.emit("sendTxtMsg", {
                            source,
                            phone: ctx.params.phone,
                            payload: { text: ctx.params.text, header: ctx.params.header, footer: ctx.params.footer, replyType: ctx.params.replyType, action: ctx.params.action  },
                            preview: ctx.params.preview || false,
                            bulk: ctx.params.bulk,
                        }, this.settings.accounts[source].service);
                        this.broker.emit("log", {
                            source,
                            phone: ctx.params.phone,
                            studentId: ctx.params.studentId,
                            event: ctx.params.campaign ? `campaign-${ctx.params.campaign}` : "campaign",
                            reply: ctx.params.text,
                        }, "$whatsapp-event");
                        sentSources.push(sources[i]);
                    }
                    if (!sentSources.length && ctx.params.fallbackToHSM) {
                        if (!(ctx.params.hsmData && ctx.params.hsmData.sources && ctx.params.hsmData.attributes)) {
                            throw new Error("HSM template data is empty");
                        }
                        sentSources = await this.sendByHSM(ctx.params.phone, ctx.params.studentId, ctx.params.hsmData, ctx.params.campaign);
                    }
                    return { sentSources };
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
        sendMediaMsg: {
            rest: "PUT /send-media-msg",
            params: {
                phone: "string",
                studentId: "number",
                mediaUrl: "string",
                mediaType: { type: "string", required: false },
                caption: { type: "string", required: false },
                campaign: { type: "string", required: false },
                campaignEndTime: { type: "string", required: false },
                footer : { type: "string", required: false },
                replyType: { type: "string", required: false },
                action : { type: "object", required: false },
                bulk: { type: "boolean", required: false, default: true },
                sources: { type: "array", optional: true, items: "string", default: ["8400400400"] },
            },
            internal: true,
            async handler(ctx: Context<{ phone: string; studentId: number; mediaUrl: string; mediaType?: string; caption?: string; campaign?: string; campaignEndTime?: string; header?: string; footer?: string; replyType?: string; action?: any; bulk?: boolean; fallbackToHSM: boolean; hsmData: any; sources?: string[] }>) {
                try {
                    this.logger.debug("Sending Media msg", JSON.stringify(ctx.params));
                    const reqSources = ctx.params.sources || ["8400400400"];
                    const sources = _.intersection(reqSources, Object.keys(this.settings.accounts));
                    const sessionActiveData = await Promise.all(sources.map(x => this.broker.cacher.get(`${x}:${ctx.params.phone}`)));
                    let sentSources = [];
                    for (let i = 0; i < sessionActiveData.length; i++) {
                        const x = sessionActiveData[i];
                        const source = sources[i];
                        if (!x) {
                            continue;
                        }
                        if (ctx.params.campaign && ctx.params.campaignEndTime) {
                            const campaignAlreadySent = await redisUtility.getHashField.call(this, `${source}:${ctx.params.campaign}`, ctx.params.phone);
                            if (campaignAlreadySent) {
                                throw new Error("Campaign already sent");
                            }
                            const campaignTTL = Math.floor(moment(ctx.params.campaignEndTime).diff(moment()) / 1000);
                            redisUtility.addHashField.call(this, `${source}:${ctx.params.campaign}`, ctx.params.phone, { sent: new Date().toISOString() }, campaignTTL);
                        }
                        this.broker.emit("sendMediaMsg", {
                            source,
                            phone: ctx.params.phone,
                            payload: { media: ctx.params.mediaUrl, mediaType: ctx.params.mediaType, caption: ctx.params.caption, header: ctx.params.header, footer: ctx.params.footer, replyType: ctx.params.replyType, action: ctx.params.action  },
                            bulk: ctx.params.bulk,
                        }, this.settings.accounts[source].service);
                        this.broker.emit("log", {
                            source,
                            phone: ctx.params.phone,
                            studentId: ctx.params.studentId,
                            event: ctx.params.campaign ? `campaign-${ctx.params.campaign}` : "campaign",
                        }, "$whatsapp-event");
                        sentSources.push(sources[i]);
                    }
                    if (!sentSources.length && ctx.params.fallbackToHSM) {
                        if (!(ctx.params.hsmData && ctx.params.hsmData.sources && ctx.params.hsmData.attributes)) {
                            throw new Error("HSM template data is empty");
                        }
                        sentSources = await this.sendByHSM(ctx.params.phone, ctx.params.studentId, ctx.params.hsmData, ctx.params.campaign);
                    }
                    return { sentSources };
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
        pushDialogueEntities: {
            rest: "PUT /dialogue-entities",
            params: {
                phone: "string",
                studentId: "number",
                replies: {
                    type: "array",
                    items: {
                        type: "object",
                        props: {
                            id: "number",
                            validity: { type: "number", required: false },
                            entities: { type: "object", required: false },
                        },
                    },
                },
                source: { type: "number", required: false },
            },
            internal: true,
            async handler(ctx: Context<{ phone: string; studentId: number; replies: { id: number; validity?: number; entities: { [key: string]: string } }[]; source: number }>) {
                this.logger.debug("Scheduling msg", JSON.stringify(ctx.params));
                const sources = ctx.params.source ? [ctx.params.source] : [""];
                sources.forEach(source => {
                    ctx.mcall(ctx.params.replies.map(reply => ({
                        action: "$dialogue.setApiStatus",
                        params: {
                            source,
                            phone: ctx.params.phone,
                            msgId: reply.id,
                            entities: reply.entities,
                            ttl: reply.validity,
                        },
                    })));
                });
            },
        },
    },
    events: {
        sendDelayedMsg(params) {
            this.createJob("whatsapp", "sendDelayedMsg", params, {
                delay: params.delay || 0,
                removeOnComplete: true,
                removeOnFail: true,
            });
        },
    },
    methods: {
        async sendByHSM(phone: string, studentId: number, hsmData: { sources: { [source: string]: string }; attributes: string[]; payload?: any }, campaign?: string ): Promise<string[]> {
            // TODO fetch from optins later, currently assuming user is already opted in
            const sentSources = [];
            for (const source in hsmData.sources) {
                const account = this.settings.accounts[source];
                if (!account) {
                    continue;
                }
                // TODO create $sync-whatsappOptin
                const whatsappOptinSource = account.whatsappOptinSource;
                const optinRequired = await this.broker.call("$sync-whatsappOptin.find", { query: { source: whatsappOptinSource, phone: `${phone}` } });
                console.log("#####optinRequired ", optinRequired);
                if (!optinRequired.length){
                    try {
                        await this.broker.call("$gupshup.optin", { phone, locale: "en", source });
                    } catch (err) {
                        this.logger.error(err);
                        return [];
                    }
                    this.broker.call("$sync-whatsappOptin.insert", { entity: { source: whatsappOptinSource, phone } });
                }
                const service = account.service;
                const text = hsmData.sources[source];
                const hsmPayload = hsmData.payload || {};
                if (hsmPayload.mediaMessage) {
                    this.broker.emit("sendMediaHSM", { source, phone, text, attributes: hsmData.attributes, payload: hsmPayload, bulk: true }, service);
                } else {
                    this.broker.emit("sendTextHSM", { source, phone, text, attributes: hsmData.attributes, payload: hsmPayload, bulk: true }, service);
                }
                this.broker.emit("log", {
                    source,
                    phone,
                    studentId,
                    event: campaign ? `campaign-${campaign}` : "campaign",
                    reply: text,
                }, "$whatsapp-event");
                sentSources.push(source);
            }
            return sentSources;
        },
    },
    async started() {
        this.getQueue("otp").on("global:completed", async (job, res) => {
            this.logger.info(`Job #${job.id} completed!. Result:`, res);
        });
    },
};

export = WhatsappService;
