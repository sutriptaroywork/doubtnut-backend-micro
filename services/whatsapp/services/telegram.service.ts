import https from "https";
import http from "http";
import _ from "lodash";
import { ServiceSchema, Context } from "moleculer";
import axios, { AxiosInstance } from "axios";
import moment from "moment";
import { TelegramEvent } from "./telegram.interface";
import WhatsappTextService from "./whatsapp.text";
import WhatsappImageService from "./whatsapp.image";

const TelegramService: ServiceSchema = {
    name: "$telegram",
    mixins: [WhatsappTextService, WhatsappImageService],
    settings: {
        rest: "telegram",
        handledMessageTypes: ["photo", "text"],
        api: {
            ax: axios.create({
                httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
                httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
                baseURL: "https://api.telegram.org",
                headers: { "Content-Type": "application/json" },
            }),
            callMethod: "/{botName}:{botToken}/{method}",
            getFile: "https://api.telegram.org/file/{botName}:{botToken}/{filePath}",
            methodMapping: {
                IMAGE: { key: "photo", method: "sendPhoto" },
                VIDEO: { key: "video", method: "sendVideo" },
                DOCUMENT: { key: "document", method: "sendDocument" },
            },
        },
        accounts: {
            bot1608037509: {
                credentials: {
                    token: process.env.TELEGRAM_uday_test_bot_TOKEN,
                },
            },
            bot622056890: {
                credentials: {
                    token: process.env.TELEGRAM_doubtnut_bot_TOKEN,
                },
            },
        },
    },
    actions: {
        webhook: {
            rest: "POST /:botName",
            params: {
                botName: "string",
            },
            async handler(ctx: Context<TelegramEvent>) {
                this.logger.debug("Telegram handling", JSON.stringify(ctx.params));
                if (ctx.params.message) {
                    ctx.params.message.from.id = ctx.params.message.from.id.toString();
                } else {
                    ctx.params.callback_query.from.id = ctx.params.callback_query.from.id.toString();
                }
                const account = this.settings.accounts[ctx.params.botName];
                if (!account) {
                    this.logger.error("Unknown account");
                    return;
                }
                // this.broker.cacher.set(`${ctx.params.sourceNumber}:${ctx.params.mobile}`, { status: true }, this.settings.oneDayTTL);
                // console.log("WEBHOOK PAYLOAD\n", ctx.params);
                this.handleEvent(ctx.params.botName, ctx.params);
            },
        },
    },
    events: {
        sendTxtMsg: {
            handler(ctx: Context<{ source: number; phone: string; payload: any; preview?: boolean }>) {
                // Remove try-catch when telegram bot used primarily
                try {
                    const account = this.settings.accounts[ctx.params.source];
                    this.logger.info(ctx.params.phone, ctx.params.payload.text, ctx.params.preview);
                    const replyType = (ctx.params.payload.replyType || "text").toUpperCase();
                    switch (replyType) {
                        case "TEXT":
                            return (this.settings.api.ax as AxiosInstance).post(this.settings.api.callMethod.replace("{botName}", ctx.params.source).replace("{botToken}", account.credentials.token).replace("{method}", "sendMessage"), {
                                chat_id: ctx.params.phone,
                                text: this.responseMsgParser(ctx.params.source, ctx.params.payload.text),
                                disable_web_page_preview: !ctx.params.preview,
                                parse_mode: "HTML",
                            });
                        case "BUTTONS":
                            const textButton = this.getRawTextFromInteractive(ctx.params.payload);
                            return (this.settings.api.ax as AxiosInstance).post(this.settings.api.callMethod.replace("{botName}", ctx.params.source).replace("{botToken}", account.credentials.token).replace("{method}", "sendMessage"), {
                                chat_id: ctx.params.phone,
                                text: this.responseMsgParser(ctx.params.source, textButton.text),
                                disable_web_page_preview: !ctx.params.preview,
                                reply_markup: textButton.reply_markup,
                                parse_mode: "HTML",
                            });
                        case "LIST":
                            const textList = this.getRawTextFromInteractive(ctx.params.payload);
                            return (this.settings.api.ax as AxiosInstance).post(this.settings.api.callMethod.replace("{botName}", ctx.params.source).replace("{botToken}", account.credentials.token).replace("{method}", "sendMessage"), {
                                chat_id: ctx.params.phone,
                                text: this.responseMsgParser(ctx.params.source, textList.text),
                                reply_markup: textList.reply_markup,
                                disable_web_page_preview: !ctx.params.preview,
                                parse_mode: "HTML",
                            });
                    }
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
        sendMediaMsg: {
            handler(ctx: Context<{ source: number; phone: string; payload: any }>) {
                try {
                    const account = this.settings.accounts[ctx.params.source];
                    this.logger.info(ctx.params.phone, ctx.params.payload.media);
                    const replyType = (ctx.params.payload.replyType || "image").toUpperCase();
                    const mediaType = (ctx.params.payload.mediaType || "image").toUpperCase();
                    let apiMethod;
                    switch (replyType) {
                        case "IMAGE":
                        case "VIDEO":
                        case "DOCUMENT":
                            apiMethod = this.settings.api.methodMapping[replyType] || this.settings.api.methodMapping.DOCUMENT;
                            return (this.settings.api.ax as AxiosInstance).post(this.settings.api.callMethod.replace("{botName}", ctx.params.source).replace("{botToken}", account.credentials.token).replace("{method}", apiMethod.method), {
                                chat_id: ctx.params.phone,
                                [apiMethod.key]: ctx.params.payload.media,
                                caption: this.responseMsgParser(ctx.params.source, ctx.params.payload.caption),
                                parse_mode: "HTML",
                            });
                        case "BUTTONS":
                            apiMethod = this.settings.api.methodMapping[mediaType] || this.settings.api.methodMapping.DOCUMENT;
                            const textButton = this.getRawTextFromInteractive(ctx.params.payload);
                            return (this.settings.api.ax as AxiosInstance).post(this.settings.api.callMethod.replace("{botName}", ctx.params.source).replace("{botToken}", account.credentials.token).replace("{method}", apiMethod.method), {
                                chat_id: ctx.params.phone,
                                [apiMethod.key]: ctx.params.payload.media,
                                caption: this.responseMsgParser(ctx.params.source, ctx.params.payload.caption),
                                reply_markup: textButton.reply_markup,
                                parse_mode: "HTML",
                            });
                    }
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
    },
    methods: {
        async handleEvent(source: number, event: TelegramEvent) {
            const account = this.settings.accounts[source];
            const [student, dailyCountData, context] = await Promise.all([
                this.broker.call("$whatsapp-student.createAndGet", {
                    source,
                    fingerprint: account.defaultCampaignFingerprint,
                    phone: event.message ? event.message.from.id : event.callback_query.from.id,
                    campaignText: event.message ? event.message.text : event.callback_query.message.text,
                    name: event.message ? event.message.from.first_name : event.callback_query.from.first_name,
                }),
                this.getDailyCount(source, event.message ? event.message.from.id : event.callback_query.from.id),
                this.getConversationContext(source, event.message ? event.message.from.id : event.callback_query.from.id),
            ]);
            const lock = context && context.active && context.createdAt && ((moment().add("5:30").diff(moment(context.createdAt))) < 300000);
            if (lock) {
                return;
            }
            // add another event depending on webhook payload
            if (event.message && !(event.message.text || event.message.photo)) {
                this.sendMsg(source, event.message.from.id, this.settings.replyEvents.unhandledMessage, student.locale);
                this.logEvent(source, event.message.from.id, student.id, { lock: true }, this.settings.replyEvents.unhandledMessage, context);
                this.logger.warn(event.message);
                return;
            }
            this.handleMsg(source, event, student, dailyCountData, context);
        },
        async handleMsg(source: number, event: TelegramEvent, student, dailyCountData, context) {
            // TODO refactor this
            if (event.message && event.message.photo) {
                const maxSizeObj = event.message.photo.reduce((prev, curr) => (prev.file_size > curr.file_size) ? prev : curr);
                this.handleImage(source, {
                    phone: event.message.from.id,
                    studentId: student.id,
                    name: event.message.from.first_name,
                    studentClass: student.class,
                    image: await this.getMedia(source, maxSizeObj.file_id),
                    dailyCountData,
                    context,
                    locale: student.locale,
                    ccmIdList: student.ccmIdList,
                });
                return;
            }
            const selectedOption = event.callback_query ? event.callback_query.data : null;
            const text = event.message ? event.message.text : event.callback_query.message.reply_markup.inline_keyboard.find(x => x[0].callback_data === event.callback_query.data)[0].text;
            this.handleText(source, {
                phone: event.message ? event.message.from.id : event.callback_query.from.id,
                studentId: student.id,
                name: event.message ? event.message.from.first_name : event.callback_query.from.first_name,
                studentClass: student.class,
                text,
                textLower: text.toLowerCase(),
                selectedOption,
                dailyCountData,
                context,
                locale: student.locale,
                ccmIdList: student.ccmIdList,
            });
        },
        async getMedia(source: number, mediaId: string) {
            const account = this.settings.accounts[source];
            const { data } = await (this.settings.api.ax as AxiosInstance).post(this.settings.api.callMethod.replace("{botName}", source).replace("{botToken}", account.credentials.token).replace("{method}", "getFile"), {
                file_id: mediaId,
            });
            this.logger.info(data);
            // const { fileData } = await ax.get(this.settings.api.getFile.replace("{botName}", source).replace("{botToken}", account.credentials.token).replace("{filePath}", data.result.file_path), {
            //     responseType: "arraybuffer",
            // });
            // this.logger.debug(typeof fileData);
            return this.settings.api.getFile.replace("{botName}", source).replace("{botToken}", account.credentials.token).replace("{filePath}", data.result.file_path);
        },
        getRawTextFromInteractive(payload: { replyType: "LIST" | "BUTTONS"; text: string; action: any; header?: string; footer?: string; caption?: string }): { text: string; reply_markup?: any } {
            let text = [payload.header, payload.text || payload.caption].filter(Boolean).join("\n");
            let reply_markup;
            switch (payload.replyType) {
                case "BUTTONS":
                    reply_markup = { inline_keyboard: payload.action.buttons.map(x => ([{ text: x.reply.title, callback_data: x.reply.id }])) };
                    text = [text, payload.footer].filter(Boolean).join("\n\n");
                    text = `${text}\n`;
                    return { text, reply_markup };
                case "LIST":
                    if (_.flatten(payload.action.sections.map(x => x.rows) as any[]).find(x => x.description)) {
                        text = `${text}\n\n${_.flatten(payload.action.sections.map(x => x.rows) as any[]).map(x => `<strong>${x.id}</strong> - ${x.title}`).join("\n")}`;
                        return { text };
                    }
                    reply_markup = { inline_keyboard: _.flatten(payload.action.sections.map(x => x.rows) as any[]).map(x => ([{ text: x.title, callback_data: x.id }])) };
                    text = [text, payload.footer].filter(Boolean).join("\n\n");
                    text = `${text}\n`;
                    return { text, reply_markup };
            }
            return { text };
        },
    },
};

export = TelegramService;
