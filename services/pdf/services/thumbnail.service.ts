import { readFileSync } from "fs";
import { ServiceSchema, Context } from "moleculer";
import puppeteer from "puppeteer";
import sharp from "sharp";
import { S3 } from "aws-sdk";
import { staticBucket, staticCDN } from "../../../common";

const s3 = new S3({
    signatureVersion: "v4",
    region: "ap-south-1",
});

const ThumbnailService: ServiceSchema = {
    name: "$thumbnail",
    settings: {
        rest: "/thumbnail",
        templates: {
            VMC: {
                LC: readFileSync("./services/pdf/template/thumbnail/VMC/VMC_LC.html", "utf8"),
                MC: readFileSync("./services/pdf/template/thumbnail/VMC/VMC_MC.html", "utf8"),
                STRATEGY: readFileSync("./services/pdf/template/thumbnail/VMC/VMC_STRATEGY.html", "utf8"),
                TUT: readFileSync("./services/pdf/template/thumbnail/VMC/VMC_TUT.html", "utf8"),
            },
            DN: {
                OCR: readFileSync("./services/pdf/template/thumbnail/DN/OCR.html", "utf8"),
            },
        },
        thumbnailDir: {
            VMC: "q-thumbnail",
            DN: "q-thumbnail-localized",
        },
        thumbnail: {
            puppeteerArgs: {
                headless: true,
                executablePath: process.env.CHROME_BIN || null,
                args: ["--no-sandbox", "--headless", "--disable-gpu", "--disable-dev-shm-usage"],
            },
            options: {
                VMC: {
                    width: 1080,
                    height: 720,
                    deviceScaleFactor: 1,
                },
                DN: {
                    width: 800,
                    height: 1080,
                    deviceScaleFactor: 1,
                },
            },
            screenshotBounds: {
                DN: "#main-div",
            },
        },
    },
    dependencies: [],
    actions: {
        generate: {
            rest: "PUT /:templateId/:entityId",
            internal: true,
            params: {
                templateId: "string",
                entityId: "string",
                questionId: "string",
            },
            async handler(ctx: Context<{
                templateId: string;
                entityId: string;
                questionId: string;
                subject: string;
                chapter: string;
                facultyName: string;
                facultyImage: boolean;
                exam: string;
                class: number;
                ocr: string;
                locale?: string;
            }>) {
                const templateParent = this.settings.templates[ctx.params.templateId];
                if (!templateParent) {
                    throw new Error("Bad template");
                }
                const template = templateParent[ctx.params.entityId];
                if (!templateParent) {
                    throw new Error("Bad entityId");
                }
                const t = template
                    .replace("##SUB##", ctx.params.subject)
                    .replace("##CHAP##", ctx.params.chapter)
                    .replace("##FNAME##", ctx.params.facultyName)
                    .replace("##FIMAGE##", ctx.params.facultyImage)
                    .replace("##EXAM##", ctx.params.exam)
                    .replace("##CLASS##", ctx.params.class)
                    .replace("##OCR##", ctx.params.ocr);
                let buf = await this.transform(t, ctx.params.templateId);
                const prefix = ctx.params.locale
                    ? `${this.settings.thumbnailDir[ctx.params.templateId]}/${ctx.params.questionId}/${ctx.params.locale}`
                    : `${this.settings.thumbnailDir[ctx.params.templateId]}/${ctx.params.questionId}`;
                const png = `${prefix}.png`;
                s3.putObject({
                    Bucket: staticBucket,
                    Key: png,
                    Body: buf,
                    ContentType: "image/png",
                    CacheControl: "max-age=2592000",
                }).promise();
                buf = await sharp(buf).webp().toBuffer();
                const webp = `${prefix}.webp`;
                s3.putObject({
                    Bucket: staticBucket,
                    Key: webp,
                    Body: buf,
                    ContentType: "image/webp",
                    CacheControl: "max-age=2592000",
                }).promise();
                return {
                    png: `${staticCDN}${png}`,
                    webp: `${staticCDN}${webp}`,
                };
            },
        },
    },
    methods: {
        async transform(html: string, templateId: string): Promise<Buffer> {
            if (typeof html !== "string") {
                this.logger.error("Invalid Argument: HTML expected as type of string and received a value of a different type");
                throw new Error("Invalid html");
            }

            try {
                const browser = this.settings.browser;

                const page = await browser.newPage();
                if (this.settings.thumbnail.options[templateId]) {
                    await page.setViewport(this.settings.thumbnail.options[templateId]);
                }
                await page.setContent(html, { waitUntil: "networkidle2", timeout: 0 });
                await page.evaluateHandle("document.fonts.ready");

                let result;
                if (this.settings.thumbnail.screenshotBounds[templateId]) {
                    const element = await page.$(this.settings.thumbnail.screenshotBounds[templateId]);
                    const boundingBox = await element.boundingBox();

                    result = await element.screenshot({
                        clip: {
                            x: boundingBox.x,
                            y: boundingBox.y,
                            width: Math.min(boundingBox.width, page.viewport().width),
                            height: Math.min(boundingBox.height, page.viewport().height),
                        },
                    });
                } else {
                    result = await page.screenshot();
                }
                await page.close();

                return result;
            } catch (e) {
                this.logger.error(e);
            }
        },

    },
    async started() {
        this.settings.browser = await puppeteer.launch(this.settings.thumbnail.puppeteerArgs);
    },
    async stopped() {
        await this.settings.browser.close();
    },
};

export = ThumbnailService;
