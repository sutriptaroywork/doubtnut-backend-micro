import { exec } from "child_process";
import fs from "fs";
import path from "path";
import _ from "lodash";

import speech from "@google-cloud/speech";
import * as sttProtos from "@google-cloud/speech/build/protos/protos";

import mkdir from "mkdirp";

import { S3 } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

import { staticBucket } from "../../../common";

const uploadDir = path.join(__dirname, "__uploads");
mkdir.sync(uploadDir);

const envKey = process.env.GOOGLE_STT_PRIVATE_KEY;
let privateKey = "";

if (envKey) {
    privateKey = envKey.replace(/\\n/g, "\n");
}
const speechClient = new speech.SpeechClient({
    credentials: {
        private_key: privateKey,
        client_email: process.env.GOOGLE_STT_CLIENT_EMAIL,
    },
});


const s3 = new S3({
    signatureVersion: "v4",
    region: "ap-south-1",
});

const TranscriptService = {
    name: "transcript",
    settings: {
        rest: "/transcript",
    },
    actions: {
        health: {
            rest: "GET /health",
            async handler() {
                return "OK";
            },
        },
        speechToTextAudio: {
            rest: "POST /speech-to-text-audio",
            async handler(ctx) {
                const inFilePath = path.join(uploadDir, `${uuidv4()}`);

                if (_.isEmpty(ctx.params)) {
                    return "Please send audio";
                }
                const { audioLocation, language } = ctx.params;
                try {
                    await this.download(audioLocation, inFilePath);

                    let langCode = "en-IN";
                    if (language === "hi") {
                        langCode = "hi-IN";
                    }
                    const audioBufferin = await this.readFile(inFilePath);

                    // const outFilePath = path.join(uploadDir, `${uuidv4()}.flac`);

                    // const command = `ffmpeg -i "${inFilePath}" -ar 16000 "${outFilePath}"`;
                    // await this.transcodeFile(command, inFilePath);

                    // const audioBuffer = await this.readFile(outFilePath);
                    // const audioBase64 = audioBuffer.toString("base64");

                    const audio = {
                        content: audioBufferin.toString("base64"),
                    };
                    const config = {
                        encoding: sttProtos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.AMR,
                        languageCode: langCode,
                        sampleRateHertz: 8000,
                    };
                    const request = {
                        audio,
                        config,
                    };
                    const [response] = await speechClient.recognize(request);

                    const transcript = response.results
                        .map(result => result.alternatives[0].transcript);

                    return { transcript: [transcript[0] || ""] };
                } catch (e) {
                    throw (e);
                }
            },
        },
    },
    methods: {
        async download(key, filePath) {
            return new Promise(async (resolve, reject) => {
                const file = fs.createWriteStream(filePath);
                const s = s3.getObject({
                    Bucket: staticBucket,
                    Key: key,
                }).createReadStream().on("error", err => {
                    reject(err);
                    fs.unlinkSync(filePath);
                }).pipe(file);
                s.on("close", () => {
                    resolve("");
                });
            });

        },
        async readFile(filePath) {
            const data = fs.readFileSync(filePath);
            fs.unlinkSync(filePath);
            return data;
        },
        async transcodeFile(command, filePath) {
            return new Promise(resolve => {
                exec(command, () => {
                    fs.unlinkSync(filePath);
                    resolve("");
                });
            });
        },
    },
};

export = TranscriptService;
