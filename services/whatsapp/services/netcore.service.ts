import https from "https";
import http from "http";
import { ServiceSchema, Context } from "moleculer";
import axios, { AxiosInstance } from "axios";
import rp from "request-promise";
import moment from "moment";
import _ from "lodash";
import { NetcoreMsg, NetcoreEvent } from "./netcore.interface";
import WhatsappTextService from "./whatsapp.text";
import WhatsappImageService from "./whatsapp.image";

const NetcoreService: ServiceSchema = {
    name: "$netcore",
    mixins: [WhatsappTextService, WhatsappImageService],
    settings: {
        rest: "whatsapp/netcore",
        handledMessageTypes: ["IMAGE", "TEXT"],
        api: {
            ax: axios.create({
                httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
                httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
                baseURL: "https://waapi.pepipost.com",
                headers: { "Content-Type": "application/json" },
            }),
            getMedia: "/api/v2/media/{mediaId}",
            addMedia: "/api/v2/media/upload/",
            sendMsg: "/api/v2/message/",
            optin: "/api/v2/consent/manage/",
        },
        accounts: {
            6003008001: {
                credentials: {
                    accountId: process.env.NETCORE_6003008001_ACCOUNT_ID,
                    token: `Bearer ${process.env.NETCORE_6003008001_TOKEN}`,
                },
            },
        },
    },
    dependencies: ["$whatsapp-student"],
    actions: {
        webhook: {
            rest: "POST /:sourceNumber",
            params: {
                sourceNumber: "string",
            },
            async handler(ctx: Context<NetcoreMsg>) {
                this.logger.debug("Netcore handling", ctx.params);
                const account = this.settings.accounts[ctx.params.sourceNumber];
                if (!account) {
                    this.logger.error("Unknown account");
                    return;
                }
                if (!ctx.params.incoming_message || !ctx.params.incoming_message.length) {
                    this.logger.warn("No msg");
                    return;
                }
                this.handleEvent(ctx.params.sourceNumber, ctx.params.incoming_message);
            },
        },
    },
    events: {
        sendTxtMsg: {
            async handler(ctx: Context<{ source: number; phone: string; payload: any; preview?: boolean }>) {
                const account = this.settings.accounts[ctx.params.source];
                this.logger.info(ctx.params.phone, ctx.params.payload.text, ctx.params.preview);
                const replyType = (ctx.params.payload.replyType || "text").toUpperCase();
                switch (replyType) {
                    case "TEXT":
                        return (this.settings.api.ax as AxiosInstance).post(this.settings.api.sendMsg, {
                            message: [{
                                recipient_whatsapp: ctx.params.phone,
                                message_type: "text",
                                recipient_type: "individual",
                                source: account.credentials.accountId,
                                type_text: [{ preview_url: (ctx.params.payload.text.match(/http/g) || []).length === 1 ? "true" : "false", content: this.responseMsgParser(ctx.params.source, ctx.params.payload.text) }],
                            }],
                        }, {
                            headers: {
                                Authorization: account.credentials.token,
                            },
                        });
                    case "BUTTONS":
                    case "LIST":
                        const text = this.getRawTextFromInteractive(ctx.params.payload);
                        this.logger.debug(text);
                        return (this.settings.api.ax as AxiosInstance).post(this.settings.api.sendMsg, {
                            message: [{
                                recipient_whatsapp: ctx.params.phone,
                                message_type: "text",
                                recipient_type: "individual",
                                source: account.credentials.accountId,
                                type_text: [{ preview_url: (text.match(/http/g) || []).length === 1 ? "true" : "false", content: this.responseMsgParser(ctx.params.source, text) }],
                            }],
                        }, {
                            headers: {
                                Authorization: account.credentials.token,
                            },
                        });
                }
            },
        },
        sendMediaMsg: {
            async handler(ctx: Context<{ source: number; phone: string; payload: any }>) {
                const account = this.settings.accounts[ctx.params.source];
                // let media = ctx.params.payload.media;
                this.logger.info(ctx.params.phone, ctx.params.payload.media);
                // if (media.startsWith("http")) {
                //     const resp = await axios.get(media, { responseType: "arraybuffer" });
                //     const mediaResp = await this.addMedia(ctx.params.source, resp.data, "facts.png");
                //     if (!mediaResp || !mediaResp.data) {
                //         throw new Error("Unable to create netcore media");
                //     }
                //     media = mediaResp.data.mediaId;
                // }
                const replyType = (ctx.params.payload.replyType || "image").toUpperCase();
                const mediaType = (ctx.params.payload.mediaType || "image").toUpperCase();
                switch (replyType) {
                    case "IMAGE":
                    case "VIDEO":
                    case "DOCUMENT":
                    case "AUDIO":
                        return (this.settings.api.ax as AxiosInstance).post(this.settings.api.sendMsg, {
                            message: [{
                                recipient_whatsapp: ctx.params.phone,
                                message_type: "media",
                                recipient_type: "individual",
                                source: account.credentials.accountId,
                                type_media: [{
                                    attachments: [{
                                        attachment_url: ctx.params.payload.media,
                                        attachment_type: replyType.toLowerCase(),
                                        caption: this.responseMsgParser(ctx.params.source, ctx.params.payload.caption || "#"),
                                    }],
                                }],
                            }],
                        }, {
                            headers: {
                                Authorization: account.credentials.token,
                            },
                        });
                    case "BUTTONS":
                        const text = this.getRawTextFromInteractive(ctx.params.payload);
                        return (this.settings.api.ax as AxiosInstance).post(this.settings.api.sendMsg, {
                            message: [{
                                recipient_whatsapp: ctx.params.phone,
                                message_type: "media",
                                recipient_type: "individual",
                                source: account.credentials.accountId,
                                type_media: [{
                                    attachments: [{
                                        attachment_url: ctx.params.payload.media,
                                        attachment_type: mediaType.toLowerCase(),
                                        caption: this.responseMsgParser(ctx.params.source, text || "#"),
                                    }],
                                }],
                            }],
                        }, {
                            headers: {
                                Authorization: account.credentials.token,
                            },
                        });
                }
            },
        },
        sendHSM: {
            async handler(ctx: Context<{ source: number; phone: string; text: string; attributes: string[] }>) {
                const account = this.settings.accounts[ctx.params.source];
                this.logger.info(ctx.params.phone, ctx.params.text);
                return (this.settings.api.ax as AxiosInstance).post(this.settings.api.sendMsg, {
                    message: [{
                        recipient_whatsapp: ctx.params.phone,
                        message_type: "template",
                        recipient_type: "individual",
                        source: account.credentials.accountId,
                        type_template: [{
                            name: this.responseMsgParser(ctx.params.source, ctx.params.text),
                            attributes: ctx.params.attributes || [],
                            language: {
                                locale: "en",
                                policy: "deterministic",
                            },
                        }],
                    }],
                }, {
                    headers: {
                        Authorization: account.credentials.token,
                    },
                });
            },
        },
    },
    methods: {
        async handleEvent(source: number, events: NetcoreEvent[]) {
            const event = events[0];
            this.logSession(source, event.from);
            const [student, dailyCountData, context] = await Promise.all([
                this.broker.call("$whatsapp-student.createAndGet", {
                    source,
                    fingerprint: this.settings.accounts[source].defaultCampaignFingerprint,
                    phone: event.from,
                    campaignText: event.text_type ? event.text_type.text : null,
                }),
                this.getDailyCount(source, event.from),
                this.getConversationContext(source, event.from),
            ]);
            const lock = context && context.active && context.createdAt && ((moment().add("5:30").diff(moment(context.createdAt))) < 300000);
            if (lock) {
                return;
            }
            if (!this.settings.handledMessageTypes.includes(event.message_type)) {
                this.sendMsg(source, event.from, this.settings.replyEvents.unhandledMessage, student.locale);
                this.logEvent(source, event.from, student.id, { lock: true }, this.settings.replyEvents.unhandledMessage, context);
                this.logger.warn(event.message_type);
                return;
            }
            this.handleMsg(source, event, student, dailyCountData, context);
        },
        async handleMsg(source: number, event: NetcoreEvent, student, dailyCountData, context) {
            // TODO refactor this
            if (event.message_type === "IMAGE") {
                this.handleImage(source, {
                    phone: event.from,
                    messageId: event.message_id,
                    studentId: student.id,
                    studentClass: student.class,
                    image: await this.getMedia(source, event.image_type.id),
                    mimeType: event.image_type.mime_type,
                    dailyCountData,
                    context,
                    locale: student.locale,
                    ccmIdList: student.ccmIdList,
                });
                return;
            }
            this.handleText(source, {
                phone: event.from,
                messageId: event.message_id,
                studentId: student.id,
                studentClass: student.class,
                text: event.text_type.text,
                textLower: event.text_type.text.toLowerCase(),
                dailyCountData,
                context,
                locale: student.locale,
                ccmIdList: student.ccmIdList,
            });
        },
        async getMedia(source: number, mediaId: string) {
            const account = this.settings.accounts[source];
            const { data } = await (this.settings.api.ax as AxiosInstance).get(this.settings.api.getMedia.replace("{mediaId}", mediaId), {
                responseType: "arraybuffer",
                headers: {
                    Authorization: account.credentials.token,
                },
            });
            return data;
        },
        // deprecated
        async addMedia(source: number, buffer: Buffer, filename: string) {
            const account = this.settings.accounts[source];
            const data = await rp.post(this.settings.api.addMedia, {
                formData: {
                    file: {
                        value: buffer,
                        options: {
                            filename,
                        },
                    },
                },
                headers: {
                    "Authorization": account.credentials.token,
                    "Content-Type": "multipart/form-data",
                },
                json: true,
            });
            this.logger.debug("Facts data:", data);
            return data;
        },
    },
};

export = NetcoreService;
