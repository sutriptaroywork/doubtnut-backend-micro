import {ServiceSchema} from "dn-moleculer";
import {reject, resolve} from "bluebird";
import request from "request";
import Settings from "./settings";


const FeatureSettings: ServiceSchema = {
    name: "$sms",
    mixins: [Settings],
    settings: {
        gupshupUrl: "http://enterprise.smsgupshup.com/GatewayAPI/rest",
        credentials: {
            user: process.env.GUPSHUP_USER,
            pass: process.env.GUPSHUP_PASS,
        },
    },
    methods: {
        async callGupshupUrl(options: any) {
            try {
                request(options, (error, response, body) => {
                    if (error) {
                        throw new Error(error);
                    }
                    const bodyResponse = JSON.parse(body);
                    if (bodyResponse.response.status === "success") {
                        const resp = {Status: "Success"};
                        return resolve(resp);
                    }
                    return reject({Status: "Fail"});
                });
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },

    events: {

        async sendSms(ctx) {
            try {
                const options = {
                    method: "POST",
                    url: this.settings.gupshupUrl,
                    form: {
                        method: "sendMessage",
                        send_to: ctx.params.mobile,
                        msg: ctx.params.message,
                        msg_type: "Unicode_Text",
                        userid: this.settings.credentials.user,
                        auth_scheme: "PLAIN",
                        password: this.settings.credentials.pass,
                        format: "JSON",
                    },
                };

                return await this.callGupshupUrl(options);
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};


export = FeatureSettings;
