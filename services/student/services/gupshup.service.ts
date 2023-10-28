import { ServiceSchema, Context } from "moleculer";
import request from "request-promise";
import { GUPSHUPDLR } from "./gupshup.interface";

const rp = request.defaults({ forever: true, pool: { maxSockets: 250 } });

const GupshupService: ServiceSchema = {
    name: "$gupshup-otp",
    settings: {
        rest: "/gupshup",
        url: "http://enterprise.smsgupshup.com/GatewayAPI/rest",
        callUrl: "http://products.smsgupshup.com",
        user: process.env.GUPSHUP_USER,
        pass: process.env.GUPSHUP_PASSWORD,
        authKey: process.env.GUPSHUP_AUTHKEY,
        cachePrefix: "GUPSHUP",
        cacheTTL: 7200,
        otpAutoReadHash: process.env.GUPSHUP_AUTO_READ_HASH,
        phonePrefix: {
            US: "001",
        },
    },
    actions: {
        sendOtp: {
            params: {
                phone: "string",
                otp: "number",
            },
            async handler(ctx: Context<{ phone: string; otp: number; sessionId: string }, { country: string }>) {
                // eslint-disable-next-line max-len
                const msg = `<#> ${ctx.params.otp} is your OTP to login to the awesome world of Doubtnut.                                                                                ${this.settings.otpAutoReadHash}`;
                this.logger.debug(ctx.meta.country, ctx.params.phone, msg);
                const options = {
                    url: this.settings.url,
                    form: {
                        method: "sendMessage",
                        send_to: `${(this.settings.phonePrefix[ctx.meta.country] || "")}${ctx.params.phone}`,
                        msg,
                        msg_type: "TEXT",
                        userid: this.settings.user,
                        auth_scheme: "PLAIN",
                        password: this.settings.pass,
                        format: "JSON",
                    },
                    json: true,
                    timeout: 5000,
                };
                try {
                    const res = await rp.post(options);
                    this.logger.info(res);
                    if (res.response && res.response.status === "success") {
                        // eslint-disable-next-line max-len
                        this.broker.cacher.set(`${this.settings.cachePrefix}:${res.data.response_messages[0].id}`, { sessionId: ctx.params.sessionId }, this.settings.cacheTTL);
                        return res.response.id;
                    }
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
        sendOtpOnCall: {
            params: {
                phone: "string",
                otp: "number",
            },
            async handler(ctx: Context<{ phone: string; otp: number }>) {
                try {
                    const res = await rp.get({
                        baseUrl: this.settings.callUrl,
                        url: "/FreeSpeech/incoming.php",
                        qs: {
                            userid: this.settings.user,
                            password: this.settings.pass,
                            authkey: this.settings.authKey,
                            text: `Your OTP is ${ctx.params.otp}`,
                            mobile: ctx.params.phone,
                            speed: 1,
                            repeat: 2,
                        },
                        json: true,
                        timeout: 2000,
                    });
                    this.logger.info("OTP on Call With Gupshup", "response", res);
                    if (res && res.response.status === "success") {
                        return true;
                    }
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
        dlr: {
            rest: "GET /delivery-report",
            params: {
                externalId: "number",
                status: "string",
                errCode: "number",
            },
            async handler(ctx: Context<GUPSHUPDLR>) {
                const requestId = ctx.params.externalId;
                const payload = await this.broker.cacher.get(`${this.settings.cachePrefix}:${requestId}`);
                const deliveryStatus = ctx.params.status === "SUCCESS" ? "DELIVERED" : "FAILED";
                this.broker.emit("dlr", { sessionId: payload.sessionId, requestId, deliveryStatus, statusCode: ctx.params.errCode }, "$otp-event");
                this.broker.cacher.del(`${this.settings.cachePrefix}:${requestId}`);
            },
        },
    },
    events: {},
    methods: {},
};

export = GupshupService;
