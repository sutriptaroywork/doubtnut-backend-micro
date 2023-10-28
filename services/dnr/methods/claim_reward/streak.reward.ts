/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import WalletService from "../wallet";

const weeklyStreakSchema: ServiceSchema = {
    name: "$weeklyStreakReward",
    mixins: [WalletService],
    methods: {

        async weeklyStreakReward(milestones: any, currentTime: object, request: any) {
            try {
                // Reward for maintaining a streak for 7 days
                let popUpContainer = null;

                const milestone = _.filter(milestones, item => item.type === request.params.type);

                if (milestone.length) {
                    popUpContainer = this.createPopupResponse(request.meta.user.locale, request.params.type, milestone[0].prize_dnr);
                }

                return popUpContainer;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = weeklyStreakSchema;
