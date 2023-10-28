import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema, Context } from "moleculer";
import QueueService from "moleculer-bull";
import puppeteer from "puppeteer";
import { S3 } from "aws-sdk";
import { adapter } from "../config";
import { staticBucket, staticCDN } from "../../../common";

const s3 = new S3({
    signatureVersion: "v4",
    region: "ap-south-1",
});

const modelAttributes: Sequelize.ModelAttributes = {
    studentId: { type: Sequelize.INTEGER, allowNull: false },
    courseId: { type: Sequelize.INTEGER, allowNull: false },
    certificate: { type: Sequelize.STRING, allowNull: false },
};

const CertificateService: ServiceSchema = {
    name: "$CourseCertificate",
    mixins: [QueueService(process.env.QUEUE_REDIS), DbService],
    settings: {
        fields: ["studentId", "courseId", "certificate"],
        certificate: {
            puppeteerArgs: {
                headless: true,
                executablePath: process.env.CHROME_BIN || null,
                args: ["--no-sandbox", "--headless", "--disable-gpu", "--disable-dev-shm-usage", "--font-render-hinting=none"],
                defaultViewport: null,
            },
            options: {
                printBackground: true,
                width: 900,
                height: 636,
            },
        },
    },
    adapter,
    model: {
        name: "course_certificates",
        define: modelAttributes,
        options: {
            underscored: true,
            freezeTableName: true,
        },
    },
    queues: {
        certificate: {
            name: "create",
            concurrency: 1,
            async process(job: { data: { data: { html: string; studentId: number; courseId: number; questionId: number } } }) {
                this.logger.info("Creating Certificate");
                const { html, studentId, courseId } = job.data.data;

                try {
                    const buf = await this.transform(html);
                    const Key = `certificates/${studentId}_${courseId || "default"}_${Date.now()}.pdf`;
                    await s3.putObject({
                        Bucket: staticBucket,
                        Key,
                        ContentType: "application/pdf",
                        Body: buf,
                    }).promise();
                    this.logger.info("Created Certificate");
                    const certificate = `${staticCDN}${Key}`;

                    await this.broker.call("$CourseCertificate.create", {
                        studentId,
                        courseId,
                        certificate,
                    });

                    return `${staticCDN}${Key}`;
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
    },
    dependencies: [],
    actions: {
        generatePdf: {
            async handler(ctx: Context<{ html: string; studentId: number; courseId: number }>) {
                const { html, studentId, courseId } = ctx.params;

                await this.broker.emit("certificate.create", {
                    html,
                    studentId,
                    courseId,
                }, ["$CourseCertificate"]);
            },
        },
    },
    events: {
        "certificate.create": {
            async handler(ctx: Context<{ html: string; studentId: number; courseId: number; nextEvent: string; nextEventGroup: string }>) {
                this.createJob("certificate", "create", { data: { ...ctx.params } }, { removeOnComplete: true, removeOnFail: true });
            },
        },
    },
    methods: {
        async transform(html: string): Promise<Buffer> {
            if (typeof html !== "string") {
                this.logger.error("Invalid Argument: HTML expected as type of string and received a value of a different type. Check your request body and request headers.");
                throw new Error("Invalid html");
            }

            try {
                let browser;
                const { puppeteerArgs, options } = this.settings.certificate;

                if (puppeteerArgs) {
                    browser = await puppeteer.launch(puppeteerArgs);
                } else {
                    browser = await puppeteer.launch();
                }

                const page = await browser.newPage();
                await page.evaluateHandle("document.fonts.ready");
                await page.setContent(html, { waitUntil: "networkidle2", timeout: 0 });

                const result = await page.pdf(options);
                await browser.close();

                return result;
            } catch (e) {
                this.logger.error(e);
            }
        },

    },
};

export = CertificateService;
