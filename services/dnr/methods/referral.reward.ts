import {ServiceSchema} from "dn-moleculer";
import RewardPopService from "../methods/claim_reward/popup";

const referralSchema: ServiceSchema = {
    name: "$referralReward",
    mixins: [RewardPopService],
    methods: {

        async referAndEarnReward(request: any) {
            try {
                // for showing bottom sheet of successful referral
                return  await this.createReferralBottomSheet(request.meta.user.locale, request.meta.user.student_id);

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = referralSchema;
