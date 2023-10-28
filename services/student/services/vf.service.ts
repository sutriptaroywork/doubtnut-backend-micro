import { ServiceSchema, Context } from "moleculer";
import request from "request-promise";
import { VFDLR } from "./vf.interface";

const rp = request.defaults({ forever: true, pool: { maxSockets: 250 } });

const VFService: ServiceSchema = {
    name: "$vf",
    settings: {
        rest: "/vf",
        baseUrl: "https://http.myvfirst.com",
        vfusername: process.env.VF_USERNAME,
        vfpassword: process.env.VF_PASSWORD,
        vfsender: "DOUBTN",
        messageText: "<#> {{otp}} is your OTP to login to the awesome world of Doubtnut.                                                                                Tp3vko4fb/t",
        cachePrefix: "VF",
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
                        url: "/smpp/sendsms",
                        qs: {
                            username: this.settings.vfusername,
                            password: this.settings.vfpassword,
                            to: ctx.params.phone,
                            from: this.settings.vfsender,
                            text: messageText,
                            category: "bulk",
                            "dlr-url": `${this.settings.hostName}/vf/delivery-report?session_id=%5&reason=%2&to=%p&time=%t&status=%16&status_code=%d&error=%4&circle=%8`,
                        },
                        timeout: 5000,
                    });
                    this.logger.debug(encodeURIComponent(`${this.settings.hostName}/vf/delivery-report?session_id=%5&reason=%2&to=%p&time=%t&status=%16&status_code=%d&error=%4&circle=%8`));
                    this.logger.info(data);
                    const response = JSON.parse('{"' + decodeURI(data).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                    if (response.guid && parseInt(response.errorcode, 10) === 0) {
                        this.broker.cacher.set(`${this.settings.cachePrefix}:${response.guid}`, { sessionId: ctx.params.sessionId }, this.settings.cacheTTL);
                        return response.guid;
                    }
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
        dlr: {
            rest: "GET /delivery-report",
            params: {
                session_id: "string",
                status: "string",
            },
            async handler(ctx: Context<VFDLR>) {
                const requestId = ctx.params.session_id;
                const payload = await this.broker.cacher.get(`${this.settings.cachePrefix}:${requestId}`);
                const deliveryStatus = ctx.params.status === "Delivered" ? "DELIVERED" : "FAILED";
                this.broker.emit("dlr", { sessionId: payload.sessionId, requestId, deliveryStatus, statusCode: ctx.params.error }, "$otp-event");
                this.broker.cacher.del(`${this.settings.cachePrefix}:${requestId}`);
            },
        },
    },
    events: {},
    methods: {},
};

export = VFService;
