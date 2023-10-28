import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { ServiceSchema, Context } from "moleculer";
import sharp from "sharp";
import { S3 } from "aws-sdk";
import QueueService from "moleculer-bull";
import MongoDBAdapter from "moleculer-db-adapter-mongo";
import mongoose from "mongoose";
import DbService from "dn-moleculer-db";
import { teslaBucket } from "../../../common";

const s3 = new S3({
    signatureVersion: "v4",
    region: "ap-south-1",
});

const TeslaPipelineService: ServiceSchema = {
    name: "$tesla-pipeline",
    mixins: [QueueService(process.env.QUEUE_REDIS), DbService],
    adapter: new MongoDBAdapter(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }),
    collection: "test",
    settings: {
        rest: "/tesla-pipeline",
        workingDir: "./media",
    },
    queues: {
        teslaPipeline: {
            name: "process",
            concurrency: 1,
            async process(job: { data: { feedId: string; entityType: "image" | "video"; resource: string } }) {
                this.logger.info("Processing", job.data.entityType, job.data.feedId);
                try {
                    let newKey;
                    switch (job.data.entityType) {
                        case "image":
                            newKey = await this.processImage(job.data.resource);
                            break;
                        case "video":
                            newKey = await this.processVideo(job.data.resource, job.data.feedId);
                            break;
                        default:
                            return this.Promise.resolve({
                                done: true,
                                id: job.data.feedId,
                                worker: process.pid,
                            });
                    }
                    this.logger.debug(job.data.feedId, newKey);
                    if (newKey) {
                        this.adapter.db.collection("tesla").updateOne({ _id: mongoose.Types.ObjectId(job.data.feedId) }, { $addToSet: { attachment_compressed: newKey } });
                    }
                    return this.Promise.resolve({
                        done: true,
                        id: job.data.feedId,
                        worker: process.pid,
                    });
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
    },
    actions: {
        process: {
            rest: "PUT /:entityType",
            params: {
                feedId: "string",
                resource: "string",
                entityType: { type: "enum", values: ["image", "video"] },
            },
            internal: true,
            async handler(ctx: Context<{ feedId: string; entityType: "image" | "video"; resource: string }>) {
                this.createJob("teslaPipeline", "process", ctx.params, { removeOnComplete: true, removeOnFail: true });
            },
        },
    },
    methods: {
        getNewFileName(filePath: string, newExt: string) {
            const ext = path.extname(filePath);
            return filePath.replace(ext, `-c.${newExt}`);
        },
        doCommand(command) {
            return new Promise(resolve => {
                exec(command, () => {
                    resolve();
                });
            });
        },
        async download(Key, filePath) {
            return new Promise(resolve => {
                const file = fs.createWriteStream(filePath);
                const s = s3.getObject({
                    Bucket: teslaBucket,
                    Key,
                }).createReadStream().pipe(file);
                s.on("close", () => {
                    resolve();
                });
            });

        },
        async processImage(Key: string): Promise<string> {
            try {
                const newKey = this.getNewFileName(Key, "webp");
                let buf = await s3.getObject({
                    Bucket: teslaBucket,
                    Key,
                }).promise().then(x => x.Body) as Buffer;
                buf = await sharp(buf)
                    .resize(480, 480, { fit: sharp.fit.inside })
                    .webp({
                        quality: 70,
                    })
                    .toBuffer();
                await s3.putObject({
                    Bucket: teslaBucket,
                    Key: newKey,
                    Body: buf,
                    ContentType: "image/webp",
                    CacheControl: "max-age=2592000",
                }).promise();
                return newKey;
            } catch (e) {
                this.logger.error(e);
            }
        },
        async processVideo(Key: string, feedId: string): Promise<string> {
            try {
                const newKey = this.getNewFileName(Key, "mp4");
                const inFile = `${this.settings.workingDir}/${feedId}`;
                const outFile = `${this.settings.workingDir}/${feedId}-out`;
                if (!fs.existsSync(this.settings.workingDir)) {
                    fs.mkdirSync(this.settings.workingDir);
                }
                await this.download(Key, inFile);
                if (!fs.existsSync(inFile)) {
                    return;
                }
                const command = `ffmpeg -y -i "${inFile}" -c:v libx264 -crf 32 -preset veryslow -c:a aac -profile:v main -q:a 0.5 -f mp4 "${outFile}" -hide_banner -loglevel panic`;
                this.logger.debug(command);
                await this.doCommand(command);
                this.logger.debug(feedId, "video processed");
                fs.unlinkSync(inFile);
                if (!fs.existsSync(outFile)) {
                    return;
                }
                await s3.putObject({
                    Bucket: teslaBucket,
                    Key: newKey,
                    Body: fs.createReadStream(outFile),
                    ContentType: "video/mp4",
                    CacheControl: "max-age=2592000",
                }).promise();
                this.logger.debug(feedId, "video uploaded", newKey);
                fs.unlinkSync(outFile);
                return newKey;
            } catch (e) {
                this.logger.error(e);
            }
        },
    },
};

export = TeslaPipelineService;
