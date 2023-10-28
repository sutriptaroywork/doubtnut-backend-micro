/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import {ObjectId} from "mongodb";
import {redisUtility} from "../../../common";
import dnrData from "../data/dnr.data";
import PurchaseService from "./purchase";
import DailyStreakRewardService from "./claim_reward/daily.streak.reward";

const AppOpenSchema: ServiceSchema = {
    name: "$appOpen",
    mixins: [PurchaseService, DailyStreakRewardService],
    methods: {

        async updateWeekStatus(ctx: any, currentTime: object) {
            try {
                let isNewWeek = false;
                let showRewardPopUp = false;
                const weekData = await redisUtility.getHashField.call(this, ctx.meta.user.student_id, "DNR_WEEK_START");

                const newWeekObject = {
                    week_start_date: currentTime,
                    last_marked_date: currentTime,
                };
                if (!_.isNull(weekData)) {
                    // check if last_marked_streak yesterday or not to continue streak
                    if (this.daysDifference(currentTime, weekData.last_marked_date) === 1) {
                        // check if week is completed
                        const weekStartDayDiff = this.daysDifference(currentTime, weekData.week_start_date);
                        if (weekStartDayDiff === 0) {
                            isNewWeek = true;
                        }
                        this.dailyStreakReward(ctx, weekStartDayDiff);
                        if (weekStartDayDiff + 1 === 7) {

                            const milestone = await this.getMilestoneData(parseInt(ctx.meta.versionCode, 10), "weekly_streak");

                            if (!_.isNull(milestone)) {
                                // adding reward after streak complete
                                const walletAmt = await this.addAmountToWallet(ctx.meta.user.student_id, milestone.prize_dnr, currentTime);

                                this.broker.call("transactions.insert", {
                                    transactionData: {
                                        student_id: ctx.meta.user.student_id,
                                        dnr: milestone.prize_dnr,
                                        milestone_id: new ObjectId(milestone._id),
                                        voucher_id: null,
                                        type: 0,
                                        closing_balance: walletAmt,
                                        ref: "weekly_streak",
                                        created_at: currentTime,
                                    },
                                });
                                await redisUtility.addHashField.call(this, `ACTIVITY_BASED_${ctx.meta.user.student_id}`, "7_DAY_STREAK", dnrData.popUp.weekly_streak.activity_image, this.settings.weeklyRedisTTL);
                                showRewardPopUp = true;
                            }

                            // using newWeekObject as updated week data
                            newWeekObject.week_start_date = moment(newWeekObject.week_start_date).add(1, "day").toDate();
                        } else {
                            // if the week is still going on - keeping week_start_date as the initial date from redis and last marked date as currentTime
                            newWeekObject.week_start_date = weekData.week_start_date;
                        }
                    } else {
                        isNewWeek = true;
                        await this.inActiveStreakRewards(ctx);
                    }
                } else {
                    isNewWeek = true;
                }
                // update the object in every case
                await redisUtility.addHashField.call(this, ctx.meta.user.student_id, "DNR_WEEK_START", newWeekObject, this.settings.monthlyRedisTTL);
                return {showRewardPopUp, isNewWeek};
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getAppOpenData(studentId: number, limit: number, timestamp: any) {
            try {
                return this.adapter.db.collection(this.settings.appOpenCollection)
                    .find({
                        student_id: studentId,
                        timestamp: {
                            $gte: timestamp,
                        },
                    })
                    .limit(limit)
                    .toArray();

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async markAppOpen(ctx: any) {
            try {
                const currentTime = moment().add(5, "hours").add(30, "minutes").toDate();
                const studentId = ctx.meta.user.student_id;
                let showRewardPopUp = false;
                const timestamp = new Date(moment().format("YYYY-MM-DDT00:00:00Z"));

                const lastAppOpenData = await this.getAppOpenData(studentId, 1, timestamp);

                if (lastAppOpenData.length) {
                    // attendance has already been marked for today, no reward
                    this.adapter.db.collection(this.settings.appOpenCollection).updateOne({
                        _id: lastAppOpenData[0]._id,
                    }, {
                        $addToSet: {app_open_timings: currentTime},
                    });
                } else {
                    // marking new attendance

                    // checking if 7 day streak has been completed or not
                    const data = await this.updateWeekStatus(ctx, currentTime);
                    showRewardPopUp = data.showRewardPopUp;

                    this.adapter.db.collection(this.settings.appOpenCollection).insertOne({
                        student_id: studentId,
                        version_code: parseInt(ctx.meta.versionCode, 10),
                        student_class: parseInt(ctx.meta.user.student_class, 10),
                        timestamp: currentTime,
                        prev_timestamp_checked: timestamp,
                        app_open_timings: [currentTime],
                    });

                    this.broker.call("transactions.insert", {
                        transactionData: {
                            student_id: studentId,
                            dnr: 0,
                            milestone_id: null,
                            voucher_id: null,
                            type: 0,
                            is_new_week: data.isNewWeek,
                            created_at: currentTime,
                            ref: "attendance_mark",
                        },
                    });

                    this.adapter.db.collection(this.settings.streakReminderCollection).updateOne({
                        student_id: studentId,
                    }, {
                        $set: {
                            is_notification_opted: false,
                        },
                    });
                }

                return {
                    show_reward_pop_up: showRewardPopUp,
                    is_marked_app_open: true,
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async streakReminder(ctx) {
            try {
                const expiryTime = moment().set({hour: 11, minute: 0, second: 0}).add(1, "day").toDate();
                console.log("expiryTime ", expiryTime);
                await this.adapter.db.collection(this.settings.streakReminderCollection).updateOne({
                    student_id: ctx.meta.user.student_id,
                }, {
                    $set: {
                        is_notification_opted: true,
                        created_at: moment().add(5, "hours").add(30, "minutes").toDate(),
                        expiry_at: expiryTime,
                    },
                }, { upsert: true });

                return {
                    message: ctx.meta.user.locale === "hi" ? dnrData.streakReminderNotification.toastMessage.hi : dnrData.streakReminderNotification.toastMessage.en,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = AppOpenSchema;

