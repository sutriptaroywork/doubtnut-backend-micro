import { ServiceSchema, Context } from "moleculer";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SEND_GRID_KEY);

const MailUtility: ServiceSchema = {
    name: "$sendgrid",
    settings: {
        rest: "/sendgrid",
        fromID : process.env.MAIL_OTP_BY,
        cachePrefix: "SENDGRID",
        cacheTTL: 7200,
    },
    actions: {
        sendOtp: {
            params: {
                phone: "string",
                otp: "number",
            },
            async handler(ctx: Context<{ phone: string; otp: number; sessionId: string }>) {
                /* ! phone here is the email ID */
                const msg = {
                    to: ctx.params.phone,
                    from: this.settings.fromID,
                    subject: "Doubtnut Authentication",
                    // eslint-disable-next-line max-len
                    html: `<p>To authenticate, please use the following One Time Password (OTP): <br/> <h3><b>${ctx.params.otp}</b></h3> <br/> Do not share this OTP with anyone. Doubnut takes your account security very seriously. Doubtnut Customer Service will never ask you to disclose or verify your Doubtnut PIN, OTP, credit card, or banking account number. If you receive a suspicious email with a link to update your account information, do not click on the link—instead, report the email to Doubtnut for investigation.<br/>We hope to see you again soon</p>`,
                  };
                try {
                    const res = await sgMail.send(msg);
                    if (res.length && res[0].statusCode >= 200 && res[0].statusCode <= 210) {
                        const requestId = res[0].headers["x-message-id"];
                        // eslint-disable-next-line max-len
                        this.broker.cacher.set(`${this.settings.cachePrefix}:${requestId}`, { sessionId: ctx.params.sessionId }, this.settings.cacheTTL);
                        return requestId;
                    }
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
    },
    events: {},
    methods: {},
};

export = MailUtility;
