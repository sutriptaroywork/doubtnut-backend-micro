import { ServiceSchema, Context } from "moleculer";
import QcloudSms from "qcloudsms_js";

const TencentService: ServiceSchema = {
    name: "$tencent",
    settings: {
        templateId: 677330,
        ssender: QcloudSms(process.env.TENCENT_APP_ID, process.env.TENCENT_APP_KEY).SmsSingleSender(),
    },
    actions: {
        sendOtp: {
            params: {
                phone: "string",
                otp: "number",
            },
            handler(ctx: Context<{ phone: string; otp: number }>) {
                const phone = ctx.params.phone;
                const params = [ctx.params.otp];
                return new Promise((resolve, reject) => {
                    this.settings.ssender.sendWithParam(91, phone, this.settings.templateId, params, "", "", "", (err, res, resData) => {
                        if (err) {
                            return reject(err);
                        }
                        this.logger.info(resData);
                        if (resData && resData.result === 0 && resData.errmsg === "OK") {
                            return resolve(true);
                        }
                    });
                }).catch(e => this.logger.error(e));
            },
        },
    },
    events: {},
    methods: {},
};

export = TencentService;
