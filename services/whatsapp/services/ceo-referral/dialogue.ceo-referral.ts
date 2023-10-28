import { ServiceSchema, Context } from "moleculer";
import _ from "lodash";
import axios, { AxiosInstance } from "axios";
import WhatsappSettingsService, { metadata } from "../whatsapp.settings";
import WhatsappWebHandlingService from "../whatsapp.web-handling";
import DialogueSettingsService from "../dialogues/common/dialogue.settings";
import WhatsappBaseService from "../whatsapp.base";
import { DialogueCondition } from "../dialogues/dialogue.interface";

const DialogueReferralService: ServiceSchema = {
    name: "$dialogue-ceo-referral",
    mixins: [WhatsappWebHandlingService, WhatsappSettingsService, DialogueSettingsService, WhatsappBaseService],
    dependencies: [],
    settings: {
    },
    actions: {
        getCeoBranchLink: {
            async handler(ctx: Context<{studentId: string}>) {
                const token: string = await this.broker.call("$student.sign", { studentId: ctx.params.studentId });
                const { data } = await (this.settings.backendUrl as AxiosInstance).get("v2/course/referral-info", {
                    params: {
                        from_whatsapp: true,
                    },
                    headers: {
                        "x-auth-token": token,
                        // "x-auth-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDU5MTcyMDUsImlhdCI6MTYxNjQyMDIyMiwiZXhwIjoxNjc5NDkyMjIyfQ.5HyXFDdYkR2tVTgZsJ8tO7nWU7DhASQNRsOoAt38lIM",
                    },
                });
                this.logger.debug("###getCeoBranchLink", data.data);
                return data.data;
            },
        },
    },
    methods: {
        async getCeoCouponCode(params: DialogueCondition) {
            const referralResp = await this.actions.getCeoBranchLink({ studentId: params.studentId });
            this.logger.debug("###getCeoCouponCode: ", referralResp);
            return {
                branch_link: referralResp.branch_link,
                coupon_code: referralResp.coupon_code,
            };
        },
    },
};

export = DialogueReferralService;
