import { ServiceSchema, Context } from "moleculer";
import QueueService from "moleculer-bull";
import { v4 as uuid } from "uuid";
import _ from "lodash";

const OtpService: ServiceSchema = {
    name: "$otp",
    mixins: [QueueService(process.env.QUEUE_REDIS)],
    settings: {
        rest: "/otp",
        otpServices: process.env.OTP_SERVICE_SEQUENCE ? _.uniq(process.env.OTP_SERVICE_SEQUENCE.split(",")) : ["vf", "2fa", "msg91"], // DONT add same service multiple times -> infinite loop
        otpOnCall: "gupshup-otp",
        otpCachePrefix: "OTP",
        otpCacheTTL: 600,
        msg: {
            success: {
                en: "You willl be receiving a call from Doubtnut shortly",
                hi: "आप शीघ्र ही Doubtnut से एक कॉल प्राप्त करेंगे",
            },
            failure: {
                en: "Unable to place call for OTP",
                hi: "OTP के लिए कॉल करने में असमर्थ। कृपया पुन: प्रयास करें",
            },
        },
        mailService: "sendgrid",
    },
    dependencies: [],
    queues: {
        otp: {
            name: "checkLogin",
            concurrency: 20,
            async process(job: { id: string; data: any }) {
                this.logger.info("Recheck from OTP queue", job.data);
                const params: { phone: any; delay: number; sendByMail: boolean } = job.data;
                const payload = await this.getOtpFromCache(params.phone);
                this.logger.info("Phone OTP payload from cache", payload);
                if (!payload) {
                    return;
                }
                this.sendOtp(params, payload);
                return {
                    done: true,
                    id: params.phone,
                    data: job.data,
                    worker: process.pid,
                };
            },
        },
    },
    actions: {
        send: {
            rest: "PUT /send",
            internal: true,
            params: {
                phone: "string",
                retryDelay: { type: "number|integer|positive", default: 30 },
                sendByMail: { type: "boolean", default: false },
            },
            async handler(ctx: Context<{ phone: string; retryDelay: number; sendByMail: boolean }, { country: string }>) {
                const otpPayload: { sessionId: string; otp: number } = await this.getOtpFromCache(ctx.params.phone);
                if (otpPayload) {
                    return otpPayload; // this.sendOtp({ ...ctx.params, country: ctx.meta.country }, otpPayload, true);
                }
                const result = await this.sendOtp({ ...ctx.params, country: ctx.meta.country });
                if (!result) {
                    throw new Error("unable to send OTP");
                }
                const delay = (ctx.params.retryDelay || (ctx.params.sendByMail ? 300 : 30)) * 1000;
                this.createJob("otp", "checkLogin", { phone: ctx.params.phone, delay, sendByMail: ctx.params.sendByMail, country: ctx.meta.country }, { delay, removeOnComplete: true, removeOnFail: true });
                return result;
            },
        },
        verify: {
            rest: "PUT /verify",
            internal: true,
            params: {
                sessionId: "string",
                otp: { type: "number", required: false },
                channel: { type: "number", enum: ["OTP", "PIN", "TRUECALLER", "WHATSAPP"] },
                alreadyVerified: { type: "boolean", required: false, default: false },
            },
            async handler(ctx: Context<{ sessionId: string; otp?: number; channel: "OTP" | "PIN" | "TRUECALLER" | "WHATSAPP"; alreadyVerified: boolean }>) {
                const phone = ctx.params.sessionId.split(":")[0];
                if (ctx.params.alreadyVerified) {
                    this.deleteOtpFromCache(phone);
                    return;
                }
                const otpPayload: { sessionId: string; otp: number } = await this.getOtpFromCache(phone);
                if (!otpPayload) {
                    ctx.emit("verify", { sessionId: ctx.params.sessionId, verificationStatus: "EXPIRED" }, "$otp-event");
                    throw new Error("OTP expired");
                }
                this.logger.info("Got OTP:", phone, otpPayload);
                if (otpPayload.sessionId === ctx.params.sessionId && otpPayload.otp === ctx.params.otp) {
                    this.deleteOtpFromCache(phone);
                    ctx.emit("verify", { sessionId: ctx.params.sessionId, verificationStatus: "VERIFIED" }, "$otp-event");
                    return otpPayload;
                }
                ctx.emit("verify", { sessionId: ctx.params.sessionId, verificationStatus: "INVALID" }, "$otp-event");
                throw new Error("Wrong OTP");
            },
        },
        get: {
            rest: "GET /",
            internal: true,
            params: { phone: "string" },
            async handler(ctx: Context<{ phone: string }>) {
                return this.getOtpFromCache(ctx.params.phone);
            },
        },
        sendCall: {
            rest: "PUT /send-call",
            params: {
                phone: "string",
            },
            async handler(ctx: Context<{ phone: string }>) {
                const [otpPayload, student] = await Promise.all([
                    this.getOtpFromCache(ctx.params.phone),
                    ctx.call("$sync-student.find", { query: { mobile: ctx.params.phone }, limit: 1 }).then(res => res[0]),
                ]);
                const locale = student && student.locale === "hi" ? "hi" : "en";
                if (otpPayload) {
                    return this.sendOtpOnCall(ctx.params, otpPayload, locale);
                }
                throw new Error(this.settings.msg.failure[locale]);
            },
        },
    },
    events: {},
    methods: {
        // eslint-disable-next-line max-len
        async sendOtp(params: { phone: string; delay: number; sendByMail: boolean; country: string }, payload?: { sessionId: string; otp: number; service: string }, manualTrigger?: boolean): Promise<{ sessionId: string; otp: number; service: string }> {
            const sendByMail: boolean = params.sendByMail;
            let serviceToUse;
            if (payload) {
                serviceToUse = sendByMail
                    ? null
                    : (this.settings.otpServices[manualTrigger
                        ? this.settings.otpServices.indexOf(payload.service)
                        : (this.settings.otpServices.indexOf(payload.service) + 1)]
                    );
                if (!serviceToUse) {
                    return;
                }
                this.logger.info("Sending OTP", serviceToUse, params.phone, payload.otp);
                payload.service = serviceToUse;
                await this.setOtpInCache(params.phone, payload);
                // eslint-disable-next-line max-len
                const output = await this.broker.call(`$${serviceToUse}.sendOtp`, { phone: params.phone, otp: payload.otp, sessionId: payload.sessionId }, { meta: { country: params.country } });
                this.broker.emit("generate", { sessionId: payload.sessionId, service: `${serviceToUse}`, success: !!output, manualTrigger, requestId: output }, "$otp-event");
                if (!output) {
                    return this.sendOtp(params, payload);
                }
                if (!manualTrigger) {
                    this.createJob("otp", "checkLogin", params, { delay: params.delay, removeOnComplete: true, removeOnFail: true });
                }
                return payload;
            }
            serviceToUse = sendByMail ? this.settings.mailService : this.settings.otpServices[0];
            payload = { sessionId: `${params.phone}:${uuid()}`, otp: this.generateOtp(), service: serviceToUse, ...params };
            this.logger.info("Sending OTP", payload.service, params.phone, payload.otp);
            await this.setOtpInCache(params.phone, payload);
            const requestId = await this.broker.call(`$${serviceToUse}.sendOtp`, {
                phone: params.phone,
                otp: payload.otp,
                sessionId: payload.sessionId,
            }, { meta: { country: params.country } });
            this.broker.emit("generate", { sessionId: payload.sessionId, service: serviceToUse, success: !!requestId, manualTrigger: true, requestId }, "$otp-event");
            return requestId ? payload : this.sendOtp(params, payload);
        },
        setOtpInCache(phone: string, payload) {
            this.logger.info("Setting OTP:", phone, payload);
            return this.broker.cacher.set(`${this.settings.otpCachePrefix}:${phone}`, payload, this.settings.otpCacheTTL);
        },
        getOtpFromCache(phone: string) {
            return this.broker.cacher.get(`${this.settings.otpCachePrefix}:${phone}`);
        },
        deleteOtpFromCache(phone: string) {
            return this.broker.cacher.del(`${this.settings.otpCachePrefix}:${phone}`);
        },
        generateOtp(): number {
            return Math.floor(1000 + Math.random() * 9000);
        },
        // eslint-disable-next-line max-len
        async sendOtpOnCall(params: { phone: string }, payload: { sessionId: string; otp: number; service: string }, locale: string): Promise<{ sessionId: string; message: string }> {
            if (!payload) {
                throw new Error(this.settings.msg.failure[locale]);
            }
            this.logger.debug("OTP on call with", `${this.settings.otpOnCall}-call`, params.phone, payload.otp);
            payload.service = this.settings.otpOnCall;
            const output = await this.broker.call(`$${this.settings.otpOnCall}.sendOtpOnCall`, { phone: params.phone, otp: payload.otp });
            this.broker.emit("generate", { sessionId: payload.sessionId, service: `${this.settings.otpOnCall}-call`, success: !!output, requestId: output }, "$otp-event");
            if (!output) {
                throw new Error(this.settings.msg.failure[locale]);
            }
            return {
                sessionId: payload.sessionId,
                message: this.settings.msg.success[locale],
            };
        },
    },
    async started() {
        this.getQueue("otp").on("global:completed", async (job, res) => {
            this.logger.info(`Job #${job.id} completed!. Result:`, res);
        });
    },
};

export = OtpService;
