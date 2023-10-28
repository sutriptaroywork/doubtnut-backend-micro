import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema, Context } from "moleculer";
import QueueService from "moleculer-bull";
import puppeteer from "puppeteer";
import { S3 } from "aws-sdk";
import { v4 as uuid } from "uuid";
import { adapter } from "../config";
import { staticBucket, staticCDN } from "../../../common";

const s3 = new S3({
    signatureVersion: "v4",
    region: "ap-south-1",
});

const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
    entityId: { type: Sequelize.UUID, allowNull: false },
    entityType: { type: Sequelize.STRING(24), allowNull: false },
    url: { type: Sequelize.STRING, allowNull: false },
};

const PdfService: ServiceSchema = {
    name: "$pdf",
    mixins: [QueueService(process.env.QUEUE_REDIS), DbService],
    settings: {
        pdf: {
            puppeteerArgs: {
                headless: true,
                executablePath: process.env.CHROME_BIN || null,
                args: ["--no-sandbox", "--headless", "--disable-gpu", "--disable-dev-shm-usage"],
            },
            options: {
                format: "A4",
                margin: {
                    top: "20px",
                    left: "20px",
                    right: "20px",
                    bottom: "20px",
                },
            },
        },
    },
    adapter,
    model: {
        name: "PDF",
        define: modelAttributes,
        options: {
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            indexes: [{
                unique: true,
                fields: ["entity_id", "entity_type"],
            }],
        },
    },
    dependencies: [],
    queues: {
        pdf: {
            name: "create",
            concurrency: 1,
            async process(job: { data: { data: { studentId: string; questionId: number; html: string; entityType: string; notificationInfo: any; reqTime: number }; nextEvent: string; nextEventGroup: string } }) {
                this.logger.info("Creating PDF", job.data.data.questionId);
                try {
                    const buf = await this.transform(job.data.data.html);
                    delete (job.data.data.html);
                    if (!buf) {
                        this.broker.emit(job.data.nextEvent, { url: null, ...job.data.data.notificationInfo }, job.data.nextEventGroup);
                        return;
                    }
                    this.logger.info("Created PDF", job.data.data.questionId);
                    const Key = `PDF/${job.data.data.entityType}/${job.data.data.questionId}/${job.data.data.reqTime}/${job.data.data.notificationInfo.fileName}.pdf`;
                    await s3.putObject({
                        Bucket: staticBucket,
                        Key,
                        ContentType: "application/pdf",
                        Body: buf,
                    }).promise();
                    await this.broker.call("$pdf.create", {
                        entityId: job.data.data.questionId,
                        entityType: job.data.data.entityType,
                        url: `${staticCDN}${Key}`,
                    });
                    await this.broker.emit(job.data.nextEvent, { url: `${staticCDN}${Key}`, ...job.data.data, ...job.data.data.notificationInfo }, job.data.nextEventGroup);
                    return this.Promise.resolve({
                        done: true,
                        id: job.data.data.questionId,
                        worker: process.pid,
                        url: `${staticCDN}${Key}`,
                    });
                } catch (e) {
                    this.logger.error(e);
                    this.broker.emit(job.data.nextEvent, { url: null, ...job.data.data.notificationInfo }, job.data.nextEventGroup);
                }
            },
        },
    },
    actions: {
        build: {
            visibility: "public",
            bulkhead: {
                enabled: true,
                concurrency: 1,
            },
            async handler(ctx: Context<{ entityId?: string; html: string; entityType: string; persist: boolean; fileName?: string }>) {
                const entityId = ctx.params.entityId || uuid();
                this.logger.info("Creating PDF", entityId);
                const buf = await this.transform(ctx.params.html);
                if (!buf) {
                    return;
                }
                this.logger.info("Created PDF", entityId);
                const Key = `PDF/${ctx.params.entityType}/${entityId}/${Date.now()}/${ctx.params.fileName || entityId}.pdf`;
                await s3.putObject({
                    Bucket: staticBucket,
                    Key,
                    ContentType: "application/pdf",
                    Body: buf,
                }).promise();
                if (ctx.params.persist) {
                    await this.broker.call("$pdf.create", {
                        entityId,
                        entityType: ctx.params.entityType.toUpperCase(),
                        url: `${staticCDN}${Key}`,
                    });
                }
                return `${staticCDN}${Key}`;
            },
        },
    },
    events: {
        async create(ctx: Context<{ data: { studentId: string; questionId: string; html: string; entityType: string; notificationInfo: any; reqTime: number }; nextEvent: string; nextEventGroup: string }>) {
            this.createJob("pdf", "create", ctx.params, { removeOnComplete: true, removeOnFail: true });
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
                const { puppeteerArgs, options } = this.settings.pdf;

                if (puppeteerArgs) {
                    browser = await puppeteer.launch(puppeteerArgs);
                } else {
                    browser = await puppeteer.launch();
                }

                const page = await browser.newPage();
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

export = PdfService;
