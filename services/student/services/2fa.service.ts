import { ServiceSchema, Context } from "moleculer";
import request from "request-promise";
import { TwoFaDLR } from "./2fa.interface";

const rp = request.defaults({ forever: true, pool: { maxSockets: 250 } });

const StudentService: ServiceSchema = {
    name: "$2fa",
    settings: {
        rest: "/2fa",
        baseUrl: "https://2factor.in",
        twofaKey: process.env.TWO_FA_KEY,
        otpTemplate: "doubtnut_latest",
        cachePrefix: "2FA",
        cacheTTL: 7200,
        phonePrefix: {
            US: "+1",
        },
    },
    actions: {
        sendOtp: {
            params: {
                phone: "string",
                otp: "number",
                sessionId: "string",
            },
            async handler(ctx: Context<{ phone: string; otp: number; sessionId: string }, { country: string }>) {
                try {
                    this.logger.debug(ctx.meta.country, ctx.params.phone);
                    const data = await rp.get({
                        baseUrl: this.settings.baseUrl,
                        url: `/API/V1/${this.settings.twofaKey}/SMS/${(this.settings.phonePrefix[ctx.meta.country] || "")}${ctx.params.phone}/${ctx.params.otp}/${this.settings.otpTemplate}`,
                        timeout: 5000,
                        json: true,
                    });
                    this.logger.info(data);
                    if (data.Status === "Success" && data.Details) {
                        this.broker.cacher.set(`${this.settings.cachePrefix}:${data.Details}`, { sessionId: ctx.params.sessionId }, this.settings.cacheTTL);
                        return data.Details;
                    }
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
        dlr: {
            rest: "GET /delivery-report",
            params: {
                SessionId: "string",
                Status: "string",
            },
            async handler(ctx: Context<TwoFaDLR>) {
                const requestId = ctx.params.SessionId;
                const payload = await this.broker.cacher.get(`${this.settings.cachePrefix}:${requestId}`);
                const deliveryStatus = ctx.params.Status === "DELIVERED" ? "DELIVERED" : "FAILED";
                this.broker.emit("dlr", { sessionId: payload.sessionId, requestId, deliveryStatus, statusCode: ctx.params.Error }, "$otp-event");
                this.broker.cacher.del(`${this.settings.cachePrefix}:${requestId}`);
            },
        },
    },
    events: {},
    methods: {},
};

export = StudentService;
