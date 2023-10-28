import { ServiceSchema, Context } from "moleculer";
import request from "request-promise";

const rp = request.defaults({ forever: true, pool: { maxSockets: 250 } });

const KLService: ServiceSchema = {
    name: "$kl",
    settings: {
        rest: "/kl",
        baseUrl: "https://api.in.kaleyra.io/v1/",
        klApiKey: process.env.KL_API_KEY,
        klSndrId: process.env.KL_SNDR_ID,
        klSender: "DBTNUT",
        klTemplateId: "1607100000000002454",
        messageText: "<#> {{otp}} is your OTP to login to the awesome world of Doubtnut.                                                                                Tp3vko4fb/t",
        cachePrefix: "KL",
        cacheTTL: 7200,
        hostName: process.env.NAMESPACE ? "https://micro.doubtnut.com" : "https://micro-test.doubtnut.com",
    },
    actions: {
        sendOtp: {
            params: {
                phone: "string",
                otp: "number",
                sessionId: "string",
            },
            async handler(ctx: Context<{ phone: string; otp: number; sessionId: string }>) {
                try {
                    const messageText = this.settings.messageText.replace("{{otp}}", ctx.params.otp);
                    const data = await rp.get({
                        baseUrl: this.settings.baseUrl,
                        url: `${this.settings.klSndrId}/messages`,
                        qs: {
                            to: `91${ctx.params.phone}`,
                            sender: this.settings.klSender,
                            type: "OTP",
                            body: messageText,
                            callback: {url:`${this.settings.hostName}/kl/delivery-report`,"method" : "POST"},
                            template_id: this.settings.klTemplateId,
                        },
                        headers: {
                            "api-key": this.settings.klApiKey,
                            "Content-Type": "application/json",
                        },
                        timeout: 5000,
                        json: true,
                    });
                    this.logger.debug(`${this.settings.hostName}/kl/delivery-report`);
                    this.logger.info(data);
                    if (data.id && Number(data.id) !== 0) {
                        this.broker.cacher.set(`${this.settings.cachePrefix}:${data.id}`, { sessionId: ctx.params.sessionId }, this.settings.cacheTTL);
                        return data.id;
                    }
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
        dlr: {
            rest: "POST /delivery-report",
            params: {
                status: "string",
                id: "string",
            },
            async handler(ctx: Context<{ status: string; id: string }>) {
                const requestId = ctx.params.id;
                const payload = await this.broker.cacher.get(`${this.settings.cachePrefix}:${requestId}`);
                const deliveryStatus = ctx.params.status === "Delivered" ? "DELIVERED" : "FAILED";
                this.broker.emit("dlr", { sessionId: payload.sessionId, requestId, deliveryStatus, statusCode: ctx.params.status }, "$otp-event");
                this.broker.cacher.del(`${this.settings.cachePrefix}:${requestId}`);
            },
        },
    },
    events: {},
    methods: {},
};

export = KLService;
