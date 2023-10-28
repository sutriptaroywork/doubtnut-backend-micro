/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import {ObjectId} from "mongodb";
import moment from "moment";
import appOpenService from "../app.open";
import ConditionalMilestoneService from "../conditional.milestones";
import RewardPopService from "./popup";

const whatsappRewardSchema: ServiceSchema = {
    name: "$whatsappReward",
    mixins: [RewardPopService, appOpenService, ConditionalMilestoneService],
    methods: {

        getLastRewardedData({studentId, milestoneId}) {
            try {
                return this.adapter.db.collection(this.settings.transactionCollection)
                    .find({
                        student_id: studentId,
                        milestone_id: new ObjectId(milestoneId),
                        _id: {
                            $gte: this.getObjectIdFromDate(this.getMonthStartOfTime()),
                            $lte: this.getObjectIdFromDate(this.getDayEndOfTime()),
                        },
                    })
                    .sort({_id:-1}).limit(1).toArray();
            } catch (e) {
                this.logger.error(e);
                return [];
            }
        },

        async checkLastRewardedValues({studentId, milestoneId, questionId}) {
            try {
                const lastRewardedData = await this.getLastRewardedData({studentId, milestoneId});
                return Boolean(lastRewardedData.length && lastRewardedData[0].question_id === questionId);
            } catch (e) {
                this.logger.error(e);
                return false;
            }
        },

        async checkDailyCondition({ studentId, milestoneId, prizeDnr, dailyLimit }) {
            try {
                const achievedAmount = await this.getAchievedDNR(studentId, milestoneId);
                const updatedWalletLimit = achievedAmount + prizeDnr;
                return updatedWalletLimit > dailyLimit;
            } catch (e) {
                this.logger.error(e);
                return false;
            }
        },

        async checkMonthlyCondition({ studentId, milestoneId, prizeDnr, monthlyLimit, milestoneType }) {
            try {
                const achievedAmount = await this.getMonthlyAchievedDNR(studentId, milestoneId);
                const updatedWalletLimit = achievedAmount + prizeDnr;
                if (updatedWalletLimit === monthlyLimit) {
                    this.updateMilestoneStatus(milestoneType, false, studentId);
                }
                return updatedWalletLimit > monthlyLimit;
            } catch (e) {
                this.logger.error(e);
                return false;
            }
        },

        async whatsappVideoViewReward(ctx: any) {
            try {
                let response = {
                    is_rewarded: false,
                    message: "Not Rewarded either because milestone inactive or daily/monthly limit reached.",
                };
                const milestoneType = "whatsapp_video_view";
                const studentId = ctx.params.student_id;
                const milestone = await this.getMilestoneData(parseInt(ctx.meta.versionCode, 10), milestoneType);

                if (!_.isNull(milestone)) {

                    const isAlreadyRewarded = await this.checkLastRewardedValues({
                        studentId,
                        milestoneId: milestone._id,
                        questionId: ctx.params.question_id,
                    });

                    if (!isAlreadyRewarded) {

                        const isDailyLimitAchieved = await this.checkDailyCondition({
                            studentId,
                            milestoneId: milestone._id,
                            prizeDnr: milestone.prize_dnr,
                            dailyLimit: milestone.limit_per_day,
                        });

                        const isMonthlyLimitAchieved = await this.checkMonthlyCondition({
                            studentId,
                            milestoneId: milestone._id,
                            prizeDnr: milestone.prize_dnr,
                            monthlyLimit: milestone.limit_per_day,
                            milestoneType,
                        });

                        if (!isDailyLimitAchieved && !isMonthlyLimitAchieved) {
                            const currentTime = moment().add(5, "hours").add(30, "minutes").toDate();
                            const walletAmt = await this.addAmountToWallet(studentId, milestone.prize_dnr, currentTime);

                            this.broker.call("transactions.insert", {
                                transactionData: {
                                    student_id: studentId,
                                    dnr: milestone.prize_dnr,
                                    milestone_id: new ObjectId(milestone._id),
                                    voucher_id: null,
                                    type: 0,
                                    closing_balance: walletAmt,
                                    created_at: currentTime,
                                    view_id: ctx.params.view_id,
                                    question_id: ctx.params.question_id,
                                    engage_time: ctx.params.engage_time,
                                    ref: milestoneType,
                                },
                            });
                            response = {
                                is_rewarded: true,
                                message: `${milestone.prize_dnr} DNR rewarded successfully`,
                            };
                            await this.markAppOpen(ctx);
                        }
                    }
                }
                return response;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = whatsappRewardSchema;
