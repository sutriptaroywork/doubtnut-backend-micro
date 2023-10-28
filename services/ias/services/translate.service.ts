import { ServiceSchema, Context } from "moleculer";
import { v2 as GoogleTranslateService } from "@google-cloud/translate";
import request from "request-promise";

const translator = new GoogleTranslateService.Translate({ projectId: process.env.GOOGLE_PROJECT_ID, key: process.env.GOOGLE_API_KEY });
const reqPromise = request.defaults({ forever: true, pool: { maxSockets: 50 } });

const OcrService: ServiceSchema = {
    name: "$translate",
    settings: {
    },
    dependencies: [],
    actions: {
        to: {
            async handler(ctx: Context<{ text: string; to: string }>) {
                const data: any = await translator.translate(ctx.params.text, ctx.params.to || "en");
                return data[0];
            },
        },

        getLang: {
            async handler(ctx) {
                const data: any = await translator.translate(ctx.params.text, "en");
                return data[1].data.translations[0];
            },
        },

        translateText : {
            handler(ctx) {
                try {
                    return reqPromise.get({
                        method: "GET",
                        timeout: 500,
                        json: true,
                        url: encodeURI(`https://inputtools.google.com/request?text=${ctx.params.text}&itc=hi-t-i0-und`),
                    });
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
    },
    events: {

    },
    methods: {

    },
};

export = OcrService;
