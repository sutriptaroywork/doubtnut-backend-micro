/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import {apiUrl, redisUtility} from "../../../common";
import Settings from "./settings";

const milestoneSchema: ServiceSchema = {
    name: "$milestone",
    mixins: [Settings],
    methods: {

        async updateMilestoneStatus(milestoneName: string, milestoneActivationStatus: boolean, studentId: number) {
            try {
                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();

                const updateObj = {updated_at: currTime};
                updateObj[`is_${milestoneName}_active`] = milestoneActivationStatus;

                const updateStatus = await this.adapter.db.collection(this.settings.studentMilestoneCollection).updateOne({
                    student_id: studentId,
                }, {
                    $set: {
                        ...updateObj,
                    },
                });
                await redisUtility.deleteKey.call(this, `DNR_WHATSAPP:${studentId}`);

                console.log("updateStatus ", updateStatus);
                return {
                    status_updated: true,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async callAPIforWhatsappLastVV(ctx) {
            try {

                const { data } = await this.settings.AxiosInstance({
                    method: "GET",
                    url: `${apiUrl}v1/answers/get-last-whatsapp-video-view`,
                    headers: {
                        "Content-Type": "application/json",
                        "x-auth-token": ctx.meta.xAuthToken,
                    },
                    // timeout: 150,
                });

                return data.data;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async istWhatsappMilestoneApplicable(ctx) {
            try {
                let isRedisCall = true;
                let data = await redisUtility.getRedisKeyData.call(this, `DNR_WHATSAPP:${ctx.meta.user.student_id}`);

                if (_.isNull(data)) {
                    data = await this.callAPIforWhatsappLastVV(ctx);
                    isRedisCall = false;
                    redisUtility.setRedisKeyData.call(this, `DNR_WHATSAPP:${ctx.meta.user.student_id}`, data, this.settings.weeklyRedisTTL);
                }

                const dayDiff = this.daysDifference(moment().add(5, "hours").add("30", "minutes"), data.last_video_view_timestamp);
                return {
                    is_redis_call: isRedisCall,
                    is_applicable: dayDiff >= 30 || (dayDiff < 30 && data.reward_count < 5),
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getConditionalMilestone(ctx, milestones) {
            const nonConditionalMilestones = milestones.filter(item => !item.widget_data.is_conditional_milestone);
            const conditionalMilestones = milestones.filter(item => item.widget_data.is_conditional_milestone);
            try {
                const conditionalMilestoneData = await this.adapter.db.collection(this.settings.studentMilestoneCollection).findOne({
                    student_id: ctx.meta.user.student_id,
                });

                const applicableMilestones = [];
                for (const milestoneData of conditionalMilestones) {

                    if (!_.isNull(conditionalMilestoneData) && conditionalMilestoneData[`is_${milestoneData.widget_data.milestone_type}_active`]) {
                        applicableMilestones.push(milestoneData);
                        continue;
                    }

                    const isMilestoneApplicable = await this.istWhatsappMilestoneApplicable(ctx);

                    if (isMilestoneApplicable && isMilestoneApplicable.is_applicable) {
                        applicableMilestones.push(milestoneData);

                        const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                        const updateObj = {updated_at: currTime};
                        updateObj[`is_${milestoneData.widget_data.milestone_type}_active`] = true;

                        if (!isMilestoneApplicable.is_redis_call){
                            this.adapter.db.collection(this.settings.studentMilestoneCollection).updateOne({
                                student_id: ctx.meta.user.student_id,
                            }, {
                                $set: {
                                    ...updateObj,
                                },
                            }, {
                                upsert: true,
                            });
                        }
                    }
                }

                return _.orderBy([...nonConditionalMilestones, ...applicableMilestones], ["widget_data.rank"], ["asc"]);
            } catch (e) {
                this.logger.error(e);
                return nonConditionalMilestones;
            }
        },
    },
};

export = milestoneSchema;

