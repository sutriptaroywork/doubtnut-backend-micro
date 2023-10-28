import { ServiceSchema, Context } from "moleculer";
import request from "request-promise";

const rp = request.defaults({
    baseUrl: "https://api.msg91.com",
    json: true,
    timeout: 5000,
    forever: true,
    pool: { maxSockets: 250 },
});

const StudentService: ServiceSchema = {
    name: "$msg91",
    settings: {
        msg91Key: process.env.MSG91_KEY,
        otpTemplate: "5e4257d4d6fc0502f851727f",
        cachePrefix: "MSG91",
        cacheTTL: 7200,
    },
    actions: {
        sendOtp: {
            params: {
                phone: "string",
                otp: "number",
            },
            async handler(ctx: Context<{ phone: string; otp: number; sessionId: string }>) {
                try {
                    const mobNo = `91${ctx.params.phone}`;
                    const data = await rp.get({
                        baseUrl: this.settings.baseUrl,
                        url: `/api/v5/otp?authkey=${this.settings.msg91Key}&template_id=${this.settings.otpTemplate}&mobile=${mobNo}&otp=${ctx.params.otp}`,
                        timeout: 5000,
                        json: true,
                    });
                    this.logger.info(data);
                    if (data.type === "success" && data.request_id) {
                        this.broker.cacher.set(`${this.settings.cachePrefix}:${data.Details}`, { sessionId: ctx.params.sessionId }, this.settings.cacheTTL);
                        return data.request_id;
                    }
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
    },
    events: {},
    methods: {

    },
};

export = StudentService;
