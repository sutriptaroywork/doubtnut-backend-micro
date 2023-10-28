import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import {redisUtility} from "../../../../common";
import dnrData from "../../data/dnr.data";
import RewardPopService from "./popup";

const messageSchema: ServiceSchema = {
    name: "$messageReward",
    mixins: [RewardPopService],
    methods: {

        async studyGroupReward(milestones: any, currentTime: object, request: any) {
            try {
                // To claim reward for sending 100 study group messages
                let popUpContainer = null;

                const milestone = _.filter(milestones, item => item.type === request.params.type);

                if (milestone.length) {
                    const msgCount = await redisUtility.getHashField.call(this, request.meta.user.student_id, "SG_MESSAGE_COUNT");
                    if (!_.isNull(msgCount) && msgCount >= 100) {
                        const transactionData = {
                            message_count: msgCount,
                            ref: request.params.type,
                        };
                        await redisUtility.addHashField.call(this, `ACTIVITY_BASED_${request.meta.user.student_id}`, "STUDY_GROUP_100_MSG", dnrData.popUp.study_group.activity_image, this.settings.weeklyRedisTTL);
                        console.log("Deleting previous message count");
                        await redisUtility.deleteHashField.call(this, request.meta.user.student_id, "SG_MESSAGE_COUNT");
                        popUpContainer = await this.getPopupContainer(request.params.type, milestone, request, currentTime, transactionData);
                    }
                }

                return popUpContainer;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = messageSchema;
