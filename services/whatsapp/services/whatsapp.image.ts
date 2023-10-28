/* eslint-disable max-lines-per-function */
import { ServiceSchema, Context } from "moleculer";
import jimp from "jimp";
import sharp from "sharp";
import _ from "lodash";
import { AskResponse } from "../../question/services/question.interface";
import { staticCDN, staticCloudfrontCDN } from "../../../common";
import WhatsappBaseService from "./whatsapp.base";
import WhatsappSettingsService from "./whatsapp.settings";

const WhatsappImageService: ServiceSchema = {
    name: "$whatsapp-image",
    mixins: [WhatsappBaseService, WhatsappSettingsService],
    settings: {
        prefix: "images/",
    },
    // dependencies: ["$whatsapp-question"],
    actions: {
        handleAskImage: {
            async handler(ctx: Context<{ source: number; obj }>) {
                try {
                    /* const qpcProperty: any[] = await ctx.call("$sync-dn-property.find", { query: { bucket: "wa_searching_msg", name: `banners_${ctx.params.obj.locale}`, is_active: 1 } });
                    const propertyValue = qpcProperty.map(x => x.value);
                    if (!propertyValue.length) {
                        this.logger.debug("Dn_property: No image");
                    }
                    const bucketImage = propertyValue.length ? _.sample(propertyValue[0].split("||")) : this.settings.qpcStaticImage; */
                    this.sendMsg(ctx.params.source, ctx.params.obj.phone, { ...this.settings.replyEvents.searchingForSoln }, ctx.params.obj.locale);
                    const interruptedContext = ctx.params.obj.context ? ctx.params.obj.context.interruptedContext : null;
                    const context = this.startConversation(ctx.params.source, ctx.params.obj.phone, this.settings.ContextType.ASK, { interruptedContext });
                    this.logEvent(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.studentId, null, this.settings.replyEvents.searchingForSoln, context, ctx.params.obj.context);
                    // const rotatedImage: { image: Buffer; rotation: number } = await this.rotateImage(ctx.params.obj.image, ctx.params.obj.studentId);
                    const grayscale = await this.grayscaleImage(ctx.params.obj.studentId, ctx.params.obj.image);
                    const { key } = await this.uploadImage(ctx.params.source, grayscale);
                    ctx.params.obj.image = null;   // Free memory

                    const askResp: { questionId: number; isBlur: boolean; isHandwritten: boolean; isLengthShort: boolean; isExactMatch: boolean; urlArray: { questionId: string; url: string }[]; questionIds: string[] }
                        = await this.getUrlArrayFromImage(ctx.params.source, { key, rotation: 0 }, ctx.params.obj);
                    const qaEvent = await this.getQaEvent(askResp.isBlur, askResp.isHandwritten, askResp.isLengthShort, !askResp.urlArray.length);
                    this.logger.debug("AskResponse: ", askResp);
                    if (!askResp.urlArray.length) {
                        this.sendMsg(ctx.params.source, ctx.params.obj.phone, this.settings.replyEvents.noSolution, ctx.params.obj.locale);
                        this.sendMsg(ctx.params.source, ctx.params.obj.phone, this.settings.replyEvents[qaEvent], ctx.params.obj.locale);
                        this.logEvent(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.studentId, { key }, this.settings.replyEvents[qaEvent], context, ctx.params.obj.context);
                        this.setDailyCount(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.dailyCountData, this.settings.ContextType.ASK);
                        this.stopConversation(ctx.params.source, ctx.params.obj.phone);
                        return;
                    }
                    if (askResp.isExactMatch) {
                        this.sendMsg(ctx.params.source, ctx.params.obj.phone, { ...askResp.urlArray[0], ...this.settings.replyEvents.exactSolution, studentId: ctx.params.obj.studentId }, ctx.params.obj.locale);
                        await this.delay(this.settings.replyEvents.exactSolution.delay);
                    }
                    let i = askResp.isExactMatch ? 1 : 0;
                    for (; i < askResp.urlArray.length; i++) {
                        this.sendMsg(ctx.params.source, ctx.params.obj.phone, { ...askResp.urlArray[i], ...this.settings.replyEvents.solution, studentId: ctx.params.obj.studentId }, ctx.params.obj.locale);
                        await this.delay(this.settings.replyEvents.solution.delay);
                    }
                    this.sendMsg(ctx.params.source, ctx.params.obj.phone, this.settings.replyEvents[qaEvent], ctx.params.obj.locale);
                    this.logEvent(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.studentId, { key }, askResp.urlArray, context, ctx.params.obj.context);
                    this.schedulePdf(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.studentId, askResp.questionId, askResp.questionIds);
                    this.updateConversationContext(ctx.params.source, ctx.params.obj.phone, context, { active: false, questionId: askResp.questionId });
                    this.handlePostSolnSend(ctx.params.source, ctx.params.obj, context);
                    this.setDailyCount(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.dailyCountData, this.settings.ContextType.ASK);
                } catch (err) {
                    this.logger.error(err);
                    this.sendMsg(ctx.params.source, ctx.params.obj.phone, this.settings.replyEvents.askFailure, ctx.params.obj.locale);
                    this.logEvent(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.studentId, null, this.settings.replyEvents.askFailure, ctx.params.obj.context);
                    this.setDailyCount(ctx.params.source, ctx.params.obj.phone, ctx.params.obj.dailyCountData, this.settings.ContextType.ASK);
                    this.stopConversation(ctx.params.source, ctx.params.obj.phone);
                }
            },
        },
    },
    methods: {
        async handleImage(source: number, obj) {
            let context;
            if (obj.context && obj.context.contextType === this.settings.ContextType.TALK_TO_AGENT) {
                delete obj.context.interruptedContext;
                context = this.startConversation(source, obj.phone, this.settings.ContextType.ASK, { active: false, image: obj.image.toString("base64"), interruptedContext: obj.context });
                this.setDailyCount(source, obj.phone, obj.dailyCountData, this.settings.ContextType.ASK);
                this.sendMsg(source, obj.phone, this.settings.replyEvents.contextImage, obj.locale);
                this.logEvent(source, obj.phone, obj.studentId, { image: obj.image }, this.settings.replyEvents.contextImage, context, obj.context);
                return;
            }
            return this.actions.handleAskImage({ source, obj }, { timeout: 120000 });
        },
        async uploadImage(source: number, image: Buffer, isQA: boolean = true) {
            const key = isQA ? `${source}/${this.broker.nodeID}/${new Date().getTime()}` : `${source}-crm/${this.broker.nodeID}/${new Date().getTime()}`;
            await this.settings.s3.putObject({
                Bucket: this.settings.bucket,
                Key: isQA ? `${this.settings.prefix}${key}` : `${this.settings.prefix}${key}.png`,
                ContentType: "image/png",
                Body: image,
            }).promise();
            this.logger.debug(source, key);
            return {
                url: isQA ? `${staticCloudfrontCDN}${this.settings.prefix}${key}` : `${staticCDN}${this.settings.prefix}${key}.png`,
                key,
            };
        },
        async rotateImage(image: string | Buffer, studentId: number): Promise<{ image: Buffer; rotation: number }> {
            this.logger.debug("Jimp reading image");
            let rotation = 0;
            const j = await jimp.read(image as any);
            if ((j.bitmap.width / j.bitmap.height <= 0.5)) {
                rotation = studentId % 2 ? 90 : 270;
                return { image: await j.rotate(rotation).getBufferAsync(jimp.MIME_PNG), rotation };
            }
            return { image: await j.getBufferAsync(jimp.MIME_PNG), rotation };
        },
        async getUrlArrayFromImage(source: number, imgData: { key: string; rotation: number }, obj) {
            try {
                const askResp: AskResponse = await this.getAskResponse({
                    question_image: "image_url",
                    uploaded_image_name: imgData.key,
                    image_angle: imgData.rotation,
                    question: this.settings.accounts[source].doubt,
                    checkExactMatch: true,
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
                        this.logger.debug(question.question_id, webUrl);
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
                return {
                    questionId: askResp.questionId,
                    urlArray,
                    // eslint-disable-next-line no-underscore-dangle
                    questionIds: askResp.results.slice(0, 20).map(x => x._id.toString()),
                    isBlur: askResp.isBlur || false,
                    isHandwritten: askResp.isHandwritten || false,
                    isLengthShort: askResp.isLengthShort || false,
                    isExactMatch: askResp.isExactMatch || false,
                };
            } catch (err) {
                this.logger.error(err);
            }
        },
        grayscaleImage(studentId: number, image: Buffer) {
            if (studentId) {
                return sharp(image).toColorspace("srgb").removeAlpha().gamma().grayscale().toBuffer();
            }
            return sharp(image).toColorspace("srgb").grayscale().toBuffer();
        },
        getQaEvent(isBlur, isHandwritten, isLengthShort, isRespEmpty) {
            if (isBlur){
                if (isHandwritten) {
                    return isLengthShort ? "qaHandwrittenBlurLengthShort" : isRespEmpty ? "qaHandwrittenBlurNoSolution" : "qaHandwrittenBlur";
                }
                return isLengthShort ? "qaBlurLengthShort" : isRespEmpty ? "qaBlurNoSolution" : "qaBlur";
            }
            if (isHandwritten) {
                return isLengthShort ? "qaHandwrittenLengthShort" : isRespEmpty ? "qaHandwrittenNoSolution" : "qaHandwritten";
            }
            if (isRespEmpty) {
                return isLengthShort ? "qaLengthShort" : "qaCrop";
            }
            return "home";
        },
    },
};

export = WhatsappImageService;
