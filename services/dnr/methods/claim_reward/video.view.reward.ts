/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import RewardPopService from "./popup";

const VideoViewSchema: ServiceSchema = {
    name: "$videoViewReward",
    mixins: [RewardPopService],
    methods: {

        async videoViewReward(milestones: any, currentTime: object, request: any) {
            try {
                // rewarding for watching qa/vv
                let popUpContainer = null;

                let milestoneType = null;
                if (request.params.source === "SRP" && request.params.duration >= 30000 && request.params.duration < 60000) {
                    milestoneType = "q_ask";
                } else if (request.params.source !== "SRP" && request.params.duration >= 60000) {
                    milestoneType = "video_view";
                }

                const milestone = _.filter(milestones, item => item.type === milestoneType);

                if (milestone.length) {

                    const transactionData = {
                        view_id: request.params.viewId,
                        question_id: request.params.questionId,
                        duration: request.params.duration,
                        source: request.params.source,
                        ref: milestoneType,
                    };
                    popUpContainer = await this.getPopupContainer(milestoneType, milestone, request, currentTime, transactionData);
                }

                if (request.params.type === "live_class" && popUpContainer) {
                    popUpContainer.max_popup_count = 0;
                }

                return popUpContainer;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = VideoViewSchema;
