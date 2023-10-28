import { ServiceSchema, Context } from "moleculer";
import request from "request-promise";
import { OcrResponse } from "./question.interface";

const rp = request.defaults({ forever: true });

const OcrService: ServiceSchema = {
    name: "$ocr",
    settings: {
        mathpixHost: "https://api.mathpix.com/v3/latex",
        googleVisionHost: `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_API_KEY}`,
    },
    dependencies: [],
    actions: {
        get: {
            visibility: "public",
            params: {
                url: { type: "string" },
                variantAttachment: { type: "object", required: false },
            },
            async handler(ctx: Context<{ url: string; variantAttachment?: any }>) {
                if (!(ctx.params.variantAttachment && ctx.params.variantAttachment.imageServiceVersion)) {
                    return this.getOcr(ctx.params.url);
                }
                return rp.post({
                    url: ctx.params.variantAttachment.url,
                    body: { ...ctx.params.variantAttachment, imageUrl: ctx.params.url },
                });
            },
        },
    },
    events: {

    },
    methods: {
        async getOcr(url: string) {
            const output = await this.getMathpixOcr(url);
            if (output) {
                return output;
            }
            return this.getGoogleVisionOcr(url);
        },
        async getMathpixOcr(url: string): Promise<OcrResponse> {
            const latex = await rp.post({
                url: this.settings.mathpixHost,
                body: {
                    url,
                    formats: ["asciimath", "text"],
                    ocr: ["math", "text"],
                    confidence_threshold: 0.005,
                },
                json: true,
                headers: {
                    app_id: process.env.MATHPIX_APP_ID,
                    app_key: process.env.MATHPIX_APP_KEY,
                },
            });
            this.logger.debug(JSON.stringify(latex));
            const handwritten = latex && latex.detection_map && latex.detection_map.is_printed && latex.detection_map.is_printed >= 0.8 ? false : true;
            const ocr = latex && latex.asciimath && latex.asciimath.length ? latex.asciimath : null; // TOSO should use text instead of asciimath
            if (!ocr) {
                this.logger.warn("Mathpix OCR fail", url);
                // TODO emit event mathpix ocr fail, and to log this data
                return;
            }
            // TODO detect locale either hi or en
            return { ocr, handwritten, source: "MP", ocrType: 0 };
        },
        async getGoogleVisionOcr(url: string): Promise<OcrResponse> {
            const latex = await rp.post({
                url: this.settings.googleVisionHost,
                body: {
                    requests: [
                        {
                            image: {
                                source: {
                                    imageUri: url,
                                },
                            },
                            features: [
                                {
                                    type: "DOCUMENT_TEXT_DETECTION",
                                },
                            ],
                        },
                    ],
                },
                json: true,
            });
            this.logger.debug(JSON.stringify(latex));
            // visionApiResp[0].textAnnotations[0].locale
            if (!(latex && latex.responses && latex.responses.length && latex.responses[0].textAnnotations && latex.responses[0].textAnnotations.length)) {
                return;
            }
            const ocr = latex.responses[0].textAnnotations[0].description;
            if (!ocr) {
                return;
            }
            const locale = latex.responses[0].textAnnotations[0].description.locale || "en";
            return { ocr, handwritten: false, source: "GV", ocrType: 1, locale };
        },
        async mathpixHindiTranslateParser(text: string) {
            let isHindi: boolean;
            const words = text.split(" ");

            const hindiWords = [];
            const hindiIndices = [];
            let translatedWords = [];

            for (let k = 0; k < words.length; k++) {
                if (this.isHindString(words[k])) {
                    isHindi = true;
                    hindiIndices.push(k);
                    hindiWords.push(words[k]);
                }
            }
            if (!isHindi) {
                return { text, locale: "en" };
            }

            let cursor = 0;
            const promiseCursors = [];
            const promiseStartIndex = [];
            const translateActions = [];


            let startIndex = hindiIndices[0];
            let endIndex = hindiIndices[0] + 1;
            promiseCursors.push(cursor);
            promiseStartIndex.push(startIndex);

            for (let m = 0; m < hindiIndices.length - 1; m++) {
                if (hindiIndices[m + 1] === hindiIndices[m] + 1) {
                    endIndex = endIndex + 1;
                }
                else {
                    translateActions.push({ action: "$translate.to", params: { text: words.slice(startIndex, endIndex).join(" ") } });
                    cursor = endIndex;
                    startIndex = hindiIndices[m + 1];
                    endIndex = hindiIndices[m + 1] + 1;
                    promiseCursors.push(cursor);
                    promiseStartIndex.push(startIndex);
                }
            }

            const translatedText: string[] = await this.broker.mcall(translateActions);
            for (let i = 0; i < translatedText.length; i++) {
                if (translatedText[i]) {
                    translatedWords = [...translatedWords, ...words.slice(promiseCursors[i], promiseStartIndex[i])];
                    translatedWords.push(translatedText[i]);
                }
            }

            translatedWords = [...translatedWords, ...words.slice(cursor, startIndex)];
            const translatedLastWord = await this.broker.call("$translate.to", { text: words.slice(startIndex, endIndex).join(" ") });
            if (translatedLastWord) {
                translatedWords.push(translatedLastWord);
            }
            translatedWords = [...translatedWords, ...words.slice(endIndex, words.length)];
            return { text: translatedWords.join(" ").replace(/\s\s+/g, " "), locale: "hi", translated: true };
        },
        isHindString(str: string) {
            const numberOfHindiCharacters = 128;
            const unicodeShift = 0x0900;
            const hindiAlphabet = [];
            for (let i = 0; i < numberOfHindiCharacters; i++) {
                hindiAlphabet.push(`\\u0${(unicodeShift + i).toString(16)}`);
            }
            const regex = new RegExp(`(?:^|\\s)[${hindiAlphabet.join("")}]+?(?:\\s|$)`, "g");
            return str.match(regex) ? true : false;
        },
    },
};

export = OcrService;
