/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import moment from "moment";
import redeemService from "../redeem";
import Settings from "../settings";
import {redisUtility} from "../../../../common";

const DailyStreakSchema: ServiceSchema = {
    name: "$DailyStreakReward",
    mixins: [redeemService, Settings],
    methods: {

        async giveReward(ctx: any, productCode: string, internalVoucher: boolean) {
            let isVoucherRedeemed = false;
            const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
            const voucherData = await this.adapter.db.collection(this.settings.voucherCollection).findOne({
                product_code: productCode,
            });

            if (!_.isEmpty(voucherData)) {
                // adding dnr required to redeem the voucher to user account
                await this.addAmountToWallet(ctx.meta.user.student_id, voucherData.dnr, currTime);

                if (internalVoucher) {
                    // adding voucher id and source to the request
                    ctx.params.voucher_id = voucherData._id;
                    ctx.params.source = "redeem_voucher";
                    ctx.params.reward_type = "daily_streak";
                    const redeemVoucherResponse = await this.redeemVoucher(ctx);

                    if (!_.isNull(redeemVoucherResponse)) {
                        this.adapter.db.collection(this.settings.appOpenRewardCollection).insertOne({
                            student_id: ctx.meta.user.student_id,
                            created_at: currTime,
                            product_code: productCode,
                            voucher_code: redeemVoucherResponse.redeemed_details.voucher_code,
                        });
                        isVoucherRedeemed = true;
                    }
                } else {
                    redisUtility.setRedisKeyData.call(this, `DNR_STREAK_${productCode}:${ctx.meta.user.student_id}`, true, this.settings.weeklyRedisTTL);
                }
            }
            return isVoucherRedeemed;
        },

        async makeStreakRewardActive(studentId: number, installTime: any) {
            return this.adapter.db.collection(this.settings.streakRewardStatusCollection).insertOne({
                student_id: studentId,
                is_reward_active: true,
                install_time: moment(installTime).add(5, "hours").add(30, "minutes").toDate(),
                created_at: moment().add(5, "hours").add(30, "minutes").toDate(),
            });
        },

        async makeStreakRewardInActive(studentId: number, installTime: any) {
            return this.adapter.db.collection(this.settings.streakRewardStatusCollection).updateOne({
                student_id: studentId,
            }, {
                $set: {
                    is_reward_active: false,
                    install_time: moment(installTime).add(5, "hours").add(30, "minutes").toDate(),
                    created_at: moment().add(5, "hours").add(30, "minutes").toDate(),
                },
            }, { upsert: true });
        },

        async inActiveStreakRewards(ctx: any) {
            await this.makeStreakRewardInActive(ctx.meta.user.student_id, ctx.meta.user.timestamp);
        },

        async checkRewardStatus(ctx) {
            // document not exist - check if D0 (in case of D0) - if no create false document
            // exist - true - poss
            // exist - false
            try {
                const currentTime = moment().add(5, "hours").add(30, "minutes").toDate();

                const rewardStatus = await this.adapter.db.collection(this.settings.streakRewardStatusCollection).findOne({
                    student_id: ctx.meta.user.student_id,
                });
                this.logger.info("rewardStatus ", rewardStatus);

                if (!_.isNull(rewardStatus)) {
                    let isRewardActive = rewardStatus.is_reward_active;
                    if (rewardStatus.is_reward_active) {
                        const installTime = this.daysDifference(currentTime, rewardStatus.install_time);
                        if (installTime === 7) {
                            isRewardActive = false;
                            await this.makeStreakRewardInActive(ctx.meta.user.student_id, rewardStatus.install_time);
                        }
                    }
                    return isRewardActive;
                }

                // check if user is D0 - create data as per that
                const installDay = this.daysDifference(currentTime, ctx.meta.user.timestamp);
                this.logger.info(`User is D${installDay}`);
                if (installDay === 1) {
                    this.logger.info("Making new entry on streak reward collection");
                    await this.makeStreakRewardActive(ctx.meta.user.student_id, ctx.meta.user.timestamp);
                    return true;
                }
                this.logger.info("Making streak reward collection InActive");
                await this.makeStreakRewardInActive(ctx.meta.user.student_id, ctx.meta.user.timestamp);
                return false;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async dailyStreakReward(ctx: any, day: number) {
            try {
                const isFlagrEnable = await this.getFlagr(ctx);
                if (!isFlagrEnable) {
                    return false;
                }
                const isRewardActive = await this.checkRewardStatus(ctx);

                if (!isRewardActive) {
                    this.logger.info("Reward inactive");
                    return isRewardActive;
                }
                // To claim reward for maintaining streak
                let isRewardClaimed = false;
                const dayReward = {
                    1: {
                        product_code: "EGVGBPTM006", // Paytm Rs.10 Voucher
                        is_internal_voucher: false,
                    },
                    2: {
                        product_code: "DNCASH50", // DN CASH Rs.50
                        is_internal_voucher: true,
                    },
                    3: {
                        product_code: "EGCGBAMZB2BRS001", // Amazon Pay Rs.10 Gift Card
                        is_internal_voucher: false,
                    },
                    4: {
                        product_code: "DN10OFF", // DN Discount of 10% on courses
                        is_internal_voucher: true,
                    },
                    5: {
                        product_code: "DN20OFF", // DN Discount of 20% on courses
                        is_internal_voucher: true,
                    },
                    6: {
                        product_code: "MR25", // Rs.25 GYFTR Recharge Voucher
                        is_internal_voucher: false,
                    },
                };
                const reward = dayReward[day];
                if (reward) {
                    isRewardClaimed = await this.giveReward(ctx, reward.product_code, reward.is_internal_voucher);
                }
                return isRewardClaimed;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = DailyStreakSchema;
