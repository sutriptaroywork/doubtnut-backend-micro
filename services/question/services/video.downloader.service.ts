import crypto from "crypto";
import { Context, ServiceSchema } from "moleculer";
import xmlparser from "fast-xml-parser";
import rp from "request-promise";
import moment from "moment";
import { videoCDN, staticCDN } from "../../../common";

const VideoDownloaderService: ServiceSchema = {
    name: "$video-downloader",
    settings: {
        rest: "/video-download",
        vdocipherApikey: process.env.VDOCIPHER_API_KEY,
        xmlOptions: {
            attributeNamePrefix: "",
            attrNodeName: "attr", // default is 'false'
            textNodeName: "#text",
            ignoreAttributes: false,
            ignoreNameSpace: true,
            allowBooleanAttributes: false,
            parseNodeValue: true,
            parseAttributeValue: true,
            trimValues: true,
            cdataTagName: "__cdata", // default is 'false'
            cdataPositionChar: "\\c",
            parseTrueNumberOnly: false,
            arrayMode: false, // "strict"
            stopNodes: ["parse-me-as-string"],
        },
        maxRentalDays: process.env.MAX_RENTAL_DAYS || 7,
        thumbnailGd: {
            color: "#508f17",
            start_gd: "#8967ff",
            mid_gd: "#8967ff",
            end_gd: "#01235b",
        },
    },
    dependencies: [],
    actions: {
        getDownloadOptions: {
            rest: "GET /options",
            params: {
                questionId: "string",
            },
            async handler(ctx: Context<{ questionId: string }>) {
                await this.actions.getSubscriptionValidity(ctx.params, { parentCtx: ctx });
                const answer = await this.getDownloadableAnswerRow(ctx.params.questionId);
                return {
                    cdnUrl: videoCDN,
                    thumbnail: `${staticCDN}q-thumbnail/${ctx.params.questionId}.webp`,
                    thumbnailGd: this.settings.thumbnailGd,
                    playlist: answer.answer_video,
                    options: await this.actions.getAvailableMPDResolutions({ path: answer.answer_video }),
                    aspectRatio: answer.aspect_ratio,
                    mediaType: "dash",
                };
            },
        },
        getAvailableMPDResolutions: {
            cache: {
                enabled: true,
                ttl: 604800, // 7 days
            },
            visibility: "private",
            async handler(ctx: Context<{ path: string }>) {
                const xmlString: string = await this.getMPDPlaylist(ctx.params.path);
                const mpd: any = xmlparser.parse(xmlString, this.settings.xmlOptions);
                const audio = mpd.MPD.Period.AdaptationSet.find(x => x.attr.contentType === "audio").Representation.BaseURL;
                const videos: any[] = mpd.MPD.Period.AdaptationSet.filter(x => x.attr.contentType === "video");
                return videos.map(video => ({
                    display: `${Math.min(video.attr.height, video.attr.width)}p`,
                    width: video.attr.width,
                    height: video.attr.height,
                    files: [audio, video.Representation.BaseURL],
                }));
            },
        },
        getSubscriptionValidity: {
            rest: "GET /validity",
            params: {
                questionId: "string",
                assortmentId: { type: "number", required: false },
            },
            async handler(ctx: Context<{ questionId: string; assortmentId?: number }, { user: { id: string }, $statusCode: number }>): Promise<Date> {
                const courseDetails: any[] = await ctx.call("$sync-raw.getCourseResourcesByResourceReference", { ref: ctx.params.questionId.toString(), resourceType: [1, 8], limit: 1 });
                if (!courseDetails.length) {
                    ctx.meta.$statusCode = 404;
                    throw new Error("Resource does not exist for given question ID");
                }
                const subscribedAssortments: { amount: number; start_date: Date, end_date: Date, assortment_id: number }[] = await ctx.call("$sync-raw.getActiveSubscriptions");
                if (!subscribedAssortments.length) {
                    ctx.meta.$statusCode = 403;
                    this.logger.error("You do not have any active subscriptions", ctx.meta.user.id);
                    throw new Error("You do not have any active subscriptions");
                }
                if (ctx.params.assortmentId) {
                    const subscription = subscribedAssortments.find(x => x.assortment_id == ctx.params.assortmentId);
                    if (!subscription) {
                        ctx.meta.$statusCode = 403;
                        throw new Error("You are not subscribed to the particular course");
                    }
                    if (subscription.amount === -1) {
                        ctx.meta.$statusCode = 403;
                        throw new Error("Trial users are not allowed to download videos");
                    }
                    return subscription.end_date;
                }
                return subscribedAssortments[0].end_date;
            },
        },
        generateRentalLicense: {
            rest: "GET /rental-license",
            params: {
                questionId: "string",
            },
            async handler(ctx: Context<{ questionId: string }, { user: { id: string } }>) {
                const endDate: Date = new Date(await this.actions.getSubscriptionValidity(ctx.params, { parentCtx: ctx }));
                const endDateMs = Math.floor(endDate.getTime());
                if (!endDate || endDateMs < moment().add("5:30").toDate().getTime()) {
                    throw new Error("Not allowed to download");
                }
                const answer = await this.getDownloadableAnswerRow(ctx.params.questionId);
                const maxRentalDate = moment().add(this.settings.maxRentalDays, "d").toDate();
                const rentalExpiryDateMs = Math.min(endDateMs, Math.floor(maxRentalDate.getTime()));
                this.logger.debug(ctx.meta.user.id, endDateMs, rentalExpiryDateMs);
                return {
                    validity: new Date(rentalExpiryDateMs),
                    licenseUrl: this.generateRentalLicenseUrl(answer.vdo_cipher_id, moment(rentalExpiryDateMs).diff(moment(), "s")),
                };
            },
        },
    },
    events: {},
    methods: {
        getMPDPlaylist(path) {
            return rp.get(`${videoCDN}${path}`);
        },
        hmac(key, input) {
            const hm = crypto.createHmac("sha256", key);
            hm.update(input);
            return hm.digest();
        },
        urlSafeB64(input) {
            return input.toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
        },
        generateLicenseUrl(contentAuthObj) {
            const signingDate = (new Date()).toISOString().replace(/[-.:]/g, "");
            const contentAuth = this.urlSafeB64(Buffer.from(JSON.stringify(contentAuthObj)));
            const signedDate = this.hmac(this.settings.vdocipherApikey, signingDate);
            const hash = this.urlSafeB64(this.hmac(signedDate, contentAuth));
            const keyId = this.settings.vdocipherApikey.substr(0, 16);
            const signature = `${keyId}:${signingDate}:${hash}`;
            const LICENSE_URL = `https://license.vdocipher.com/auth/wv/${
                this.urlSafeB64(Buffer.from(JSON.stringify({
                    contentAuth,
                    signature,
                })))}`;
            this.logger.debug(LICENSE_URL);
            return LICENSE_URL;
        },
        generateRentalLicenseUrl(contentId: string, rentalDuration, expiry = 300) {
            this.logger.debug("Rental duration seconds", rentalDuration);
            if (!rentalDuration || rentalDuration < expiry) {
                return;
            }
            const timestamp = Math.floor(new Date().getTime() / 1000);
            const contentAuthObj = {
                contentId,
                expires: timestamp + expiry,
                licenseRules: JSON.stringify({
                    canPersist: true,
                    rentalDuration,
                }),
            };
            this.logger.debug("Content auth obj", JSON.stringify(contentAuthObj));
            return this.generateLicenseUrl(contentAuthObj);
        },
        async getDownloadableAnswerRow(questionId: string) {
            const answers: any[] = await this.broker.call("$sync-answer.find", { query: { question_id: parseInt(questionId, 10) }, limit: 1 });
            if (!answers.length) {
                throw new Error("Resource does not exist for given video");
            }
            let answerResources: any[] = await this.broker.call("$sync-answer-video-resources.find", { query: { answer_id: answers[0].answer_id, is_active: 1, resource_type: "DASH" } }, { $cache: false });
            answerResources = answerResources.filter(x => x.vdo_cipher_id);
            if (!answerResources.length) {
                throw new Error("Resource not available for offline usage, please try after some time");
            }
            answers[0].vdo_cipher_id = answerResources[0].vdo_cipher_id;
            answers[0].answer_video = answerResources[0].resource;
            return answers[0];
        },
    },
};

export = VideoDownloaderService;
