import { ServiceSchema } from "moleculer";
import moment from "moment";
import { v4 as uuid } from "uuid";
import _ from "lodash";
import request from "request-promise";
import Sequelize from "sequelize";
import { redisUtility } from "../../../common";
import { staticCDN } from "../../../common";
import { OcrResponse } from "../../question/services/question.interface";
import WhatsappWebHandlingService from "./whatsapp.web-handling";
import WhatsappSettingsService from "./whatsapp.settings";

const rp = request.defaults({ forever: true, pool: { maxSockets: 100 } });

const WhatsappBaseService: ServiceSchema = {
    name: "$whatsapp-base",
    mixins: [WhatsappSettingsService, WhatsappWebHandlingService],
    methods: {
        delay(ms: number = 0) {
            return new Promise<void>((resolve: Function) => {
                setTimeout(() => {
                    resolve();
                }, ms);
            });
        },
        getSecsToDayEnd() {
            return Math.floor(moment().endOf("d").diff(moment()) / 1000);
        },
        // #region dailycount
        getDailyCountKey(source: number) {
            return `${source}:DAILY_COUNT`;
        },
        async getDailyCount(source: number, phone: string) {
            const obj = await redisUtility.getHashField.call(this, this.getDailyCountKey(source), phone);
            return obj || {};
        },
        setDailyCount(source: number, phone: string, countData, contextType: string, value = 1) {
            countData[contextType] = (countData[contextType] || 0) + value;
            return redisUtility.addHashField.call(this, this.getDailyCountKey(source), phone, countData, this.getSecsToDayEnd());
        },
        // #endregion
        // #region conversation
        getConversationContextKey(source) {
            return `${source}:CONTEXT`;
        },
        async getConversationContext(source: number, phone: string) {
            const context = await redisUtility.getHashField.call(this, this.getConversationContextKey(source), phone);
            if (!context) {
                return;
            }
            if (context.expiry && moment(context.expiry).diff(moment()) < 0) {
                // expired context -> reset
                const nestedContext = await this.stopConversation(source, phone);
                if (!nestedContext) {
                    return;
                }
                return this.getConversationContext(source, phone);
            }
            return context;
        },
        setConversationContext(source: number, phone: string, context?: any) {
            if (!context) {
                return redisUtility.deleteHashField.call(this, this.getConversationContextKey(source), phone);
            }
            const expiryMinutes = this.settings.ContextExpiry[context.contextType] || 5;
            context.expiry = moment().add(expiryMinutes, "minute").toDate();
            return redisUtility.addHashField.call(this, this.getConversationContextKey(source), phone, context, this.getSecsToDayEnd());
        },
        updateConversationContext(source, phone, context, params) {
            if (context.expiry && moment(context.expiry).diff(moment()) > 0) {
                const expiryMinutes = this.settings.ContextExpiry[context.contextType] || 5;
                context.expiry = moment().add(expiryMinutes, "minute").toDate();
            }
            context = { ...context, ...params, updatedAt: moment().add("5:30").toDate() };
            return this.setConversationContext(source, phone, context);
        },
        startConversation(source: number, phone: string, contextType: string, params = {}) {
            const context = {
                createdAt: moment().add("5:30").toDate(), contextType, active: true, ...params, contextId: uuid(),
            };
            this.setConversationContext(source, phone, context);
            return context;
        },
        async stopConversation(source: number, phone: string, reset: boolean = false) {
            const context = await redisUtility.getHashField.call(this, this.getConversationContextKey(source), phone);
            if (!context) {
                return;
            }
            return this.setConversationContext(source, phone, reset ? null : context.interruptedContext);
        },
        async getVendorAdvertismentBanner(ccmIdList: any[]) {
            return this.broker.call("$sync-dnAdvVendorData.find", {
                fields: ["extra_params", "banner_url", "ccm_id"],
                query: {
                    feature_id: 13,
                    is_active: 1,
                    ccm_id: [...ccmIdList, 0],
                    start_date: {
                        $lte: moment().add("5", "hours").add("30", "minutes").startOf("day").toDate(),
                    },
                    end_date: {
                        $gte: moment().add("5", "hours").add("30", "minutes").startOf("day").toDate(),
                    },
                },
            }).then(res => {
                res.sort((a, b) => b.ccm_id - a.ccm_id);
                return res[0];
            });
        },
        // #endregion
        async handlePostSolnSend(source: number, obj, context?) {
            const advertisementResponse = await this.getVendorAdvertismentBanner(obj.ccmIdList);
            this.sendMsg(source, obj.phone, this.settings.replyEvents.solnFeedback, obj.locale);
            // this.sendMsg(source, obj.phone, { ...this.settings.replyEvents.questionPuchoContest, dailyCountData: obj.dailyCountData, preview: false }, obj.locale);
            if (advertisementResponse) {
                this.sendMsg(source, obj.phone, { caption: advertisementResponse.extra_params, bannerUrl: advertisementResponse.banner_url, studentId: obj.studentId, ...this.settings.replyEvents.vendorAdvertisementPostAnswer, preview: false }, "en");
            }
            this.logEvent(source, obj.phone, obj.studentId, null, this.settings.replyEvents.solnFeedback, context || obj.context);
        },
        async generateDeeplink(source: number, studentId: number, questionId: number, urlArray: {
            questionId: number; webUrl: string; resourceType: string; url?: string; imageUrl?: string;
        }[], fingerprint?: string, channel?: string) {
            const data: { studentId: number; campaign: string; data: { questionId: number; resourceType: string }[]; source?: string; parentId?: string; channel?: string } = {
                studentId,
                campaign: `WHA_VDO_${questionId}`,
                source: fingerprint ? fingerprint : this.settings.accounts[source].fingerprint,
                parentId: questionId.toString(),
                data: urlArray,
                channel,
            };
            try {
                const output: { url: string }[] = await this.broker.call("$deeplink.createBulk", data);
                this.logger.debug(JSON.stringify(output));
                for (let i = 0; i < output.length; i++) {
                    urlArray[i].url = output[i].url;
                }
            } catch (e) {
                this.logger.error(e);
            }
        },
        getStringDiff(ocrData: OcrResponse, studentClass: number) {
            this.logger.info("Calling SS", ocrData.ocr);
            const iteration = this.settings.ssDefaultIteration;
            const body = {
                ...iteration,
                ocrText: ocrData.ocr,
                ocrType: ocrData.ocrType || 0,
                studentClass: studentClass.toString(),
            };
            return rp.post({
                baseUrl: this.settings.searchServiceHost,
                url: iteration.apiUrl,
                body,
                json: true,
                timeout: 5000,
            });
        },
        async sendSingleMsg(source: number, phone: string, params: any, msg: any, locale: string) {
            const service = this.settings.accounts[source].service;
            msg = await this.buildMsg(msg, params, locale);
            this.logger.debug("sendSingleMsg: ", msg);
            if (!msg) {
                return;
            }
            if (typeof msg === "object") {
                if (msg.text) {
                    return this.broker.emit("sendTxtMsg", { source, phone, payload: msg, preview: params.preview }, service);
                }
                return this.broker.emit("sendMediaMsg", { source, phone, payload: msg }, service);
            }
            return this.broker.emit("sendTxtMsg", { source, phone, payload: { text: msg }, preview: params.preview }, service);
        },
        async sendMsg(source: number, phone: string, params: any, locale: string) {
            this.logger.debug(source, phone, params);
            await this.delay(params.delay);
            if (!Array.isArray(params.msg)) {
                this.logger.debug("SendMsgIsArray: ", params);
                return this.sendSingleMsg(source, phone, params, params.msg, locale);
            }
            for (const obj of params.msg) {
                await this.delay(1000);
                this.logger.debug("SendMsgIsObj: ", params);
                this.sendSingleMsg(source, phone, params, obj, locale);
            }
        },
        buildMsg(msg, params, locale: string) {
            return typeof msg === "function" ? msg(locale, params) : msg;
        },
        async getAskResponse(body, obj) {
            const token = await this.broker.call("$student.sign", { studentId: obj.studentId });
            const resp = await rp.post(this.settings.askApiEndpoint, {
                body: { ...body, limit: 8, metadata: false },
                json: true,
                headers: {
                    "x-auth-token": token,
                },
            });
            this.logger.debug("askApiRequest: ", { ...body, limit: 8, metadata: false });
            this.logger.debug("askApiResponse: ", resp);
            return { questionId: resp.data.question_id, isBlur: resp.data.is_blur, isHandwritten: resp.data.is_image_handwritten, isLengthShort: resp.data.ocr_text.length <= 3, isExactMatch: resp.data.is_exact_match, results: resp.data.matched_questions, locale: resp.data.question_locale}; // TODO return locale
        },
        schedulePdf(source: number, phone: string, studentId: number, questionId: number, results: string[]) {
            this.broker.call("$whatsapp-pdf.create", {
                source: this.settings.accounts[source].fingerprint,
                phone,
                studentId: parseInt(studentId.toString(), 10),
                questionId: parseInt(questionId.toString(), 10),
                results,
            });
        },
        logEvent(source: number, phone: string, studentId: string, event, replyData, context, prevContext) {
            const reply = replyData && replyData.telemetryEvent ? replyData.telemetryEvent : replyData;
            this.broker.emit("log", {
                source,
                phone,
                studentId,
                event,
                reply,
                context,
                prevContext,
            }, "$whatsapp-event");
        },
        responseMsgParser(source, text: string) {
            if (!text) {
                return text;
            }
            const channelType = this.settings.accounts[source].channelType.toLowerCase();
            switch (channelType) {
                case "whatsapp":
                    return text
                        .replace(/<strong>/g, "*")
                        .replace(/<\/strong>/g, "*")
                        .replace(/<i>/g, "_")
                        .replace(/<\/i>/g, "_")
                        .replace(/<h6>/g, "```")
                        .replace(/<\/h6>/g, "```");
                case "telegram":
                    return text;
                default:
                    return text
                        .replace(/<strong>/g, "")
                        .replace(/<\/strong>/g, "")
                        .replace(/<i>/g, "")
                        .replace(/<\/i>/g, "")
                        .replace(/<h6>/g, "")
                        .replace(/<\/h6>/g, "");
            }
        },
        scheduleMsg(source: number, phone: string, studentId: number, params) {
            this.logger.debug("Scheduling", source, phone, params);
            this.broker.emit("sendDelayedMsg", { ...params, source, phone, studentId }, "$whatsapp");
        },
        logSession(source: number, phone: string, name: string) {
            this.logger.debug("Logging session", source, phone, name);
            this.broker.cacher.set(`${source}:${phone}`, { status: true }, this.settings.oneDayTTL);
            this.broker.emit("log", { source, phone, name }, "$whatsapp-session");
        },
        getRawTextFromInteractive(payload: { replyType: "LIST" | "BUTTONS"; text: string; action: any; header?: string; footer?: string }) {
            let text = [payload.header, payload.text].filter(Boolean).join("\n");
            switch (payload.replyType) {
                case "BUTTONS":
                    text = `${text}\n\n${payload.action.buttons.map(x => `<strong>${x.reply.title}</strong>`).join(" OR ")}`;
                    break;
                case "LIST":
                    text = `${text}\n\n${_.flatten(payload.action.sections.map(x => x.rows) as any[]).map(x => `<strong>${x.id}</strong> - ${x.title}`).join("\n")}`;
            }
            return [text, payload.footer].filter(Boolean).join("\n\n");
        },
        async getImageUrl(question_id, locale) {
            this.logger.debug("get thumbnail ");
            const bucket = this.settings.bucket;
            let thumbExists = false;
            if (locale && locale !== "en") {
                thumbExists = await this.settings.s3.headObject({Bucket: bucket, Key: `question-thumbnail/${locale}_${question_id}.png`}).promise().then(() => true).catch(() => false);
                if (thumbExists) {
                    return `${staticCDN}question-thumbnail/${locale}_${question_id}.png`;
                }
            }
            thumbExists = await this.settings.s3.headObject({Bucket: bucket, Key: `question-thumbnail/en_${question_id}.png`}).promise().then(() => true).catch(() => false);
            return thumbExists ? (`${staticCDN}question-thumbnail/en_${question_id}.png`) : null;
        },
    },
};

export = WhatsappBaseService;
