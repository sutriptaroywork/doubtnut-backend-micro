/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import moment from "moment";
import {ObjectId} from "mongodb";
import dnrData from "../data/dnr.data";
import studGroupData from "../../studygroup/data/studygroup.data";
import Settings from "./settings";

const WalletSchema: ServiceSchema = {
    name: "$dnr_wallet",
    mixins: [Settings],
    methods: {

        async addAmountToWallet(studentId: number, amount: number, currentTime: object) {
            try {
                // adding amount to wallet
                const data = await this.adapter.db.collection(this.settings.walletCollection).findOneAndUpdate({
                    student_id: studentId,
                }, {
                    $inc: {dnr_amount: amount},
                    $set: {
                        updated_at: currentTime,
                        is_active: true,
                        is_banned: false,
                    },
                }, {
                    upsert: true,
                });
                return (!_.isNull(data.value) ? data.value.dnr_amount : 0) + amount;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getWalletAmount(studentId: number) {
            try {
                const walletData = await this.adapter.db.collection(this.settings.walletCollection).findOne({
                    student_id: studentId,
                    is_active: true,
                });
                return _.isNull(walletData) ? 0 : walletData.dnr_amount;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        deductWalletAmount(studentId: number, amount: number) {
            try {
                return this.adapter.db.collection(this.settings.walletCollection).updateOne({
                    student_id: studentId,
                    is_active: true,
                }, {$inc: {dnr_amount: -Math.abs(amount)}});
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getRewardExpiry(studentId: number) {
            // get DN Cash Expiry date
            const today = moment().add(5, "hours").add(30, "minutes").toDate();
            let expiry = moment(today).add(30, "d").endOf("day").toDate(); // set default
            try {
                const flagrResponse = await this.broker.call("$app-config.get-flagr", {
                    capabilities: {"awards-expiry": {}},
                    entityId: `${studentId}`,
                });

                if (flagrResponse && flagrResponse["awards-expiry"] && flagrResponse["awards-expiry"].payload && flagrResponse["awards-expiry"].payload.enabled) {
                    const {days} = flagrResponse["awards-expiry"].payload;
                    expiry = moment(today).add(days, "d").endOf("day").toDate();
                }
                return expiry;
            } catch (e) {
                this.logger.error(e);
                return expiry;
            }
        },

        async addAmountDNCash(studentId: number, amount: number, rewardType?: string) {
            try {
                // crediting DN Cash in wallet
                // if daily streak - keeping expiry of 3 days
                let expiry = moment().add(3, "days").endOf("day").add(5, "hours").add(30, "minutes").toDate();
                if (rewardType !== "daily_streak") {
                    expiry = await this.getRewardExpiry(studentId);
                }
                await this.broker.call("wallet.createWalletTransaction",
                    {
                        reward_amount: amount,
                        student_id: studentId,
                        type: "CREDIT",
                        payment_info_id: "dedsorupiyadega",
                        reason: "dnr_reward",
                        expiry,
                    });
                return {expiry};
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
        async callAddMoneyToWalletMethod(ctx: any){
            try {
                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                const isInsideLock = await this.checkRedisLockStatus(`${ctx.meta.user.student_id}_AWARDED_MONEY`, this.settings.halfAnHourRedisTTL);

                if (isInsideLock) {
                    this.logger.info(`${ctx.meta.user.student_id} Is Already Awarded The Money.`);
                    return { is_credited: false, message: "Already Awarded The Money." };
                }
                const amount = this.settings.rewardTypeAndAmountMapping[ctx.params.reward_type].amount;
                const maxAmountCanBeCredited = this.settings.rewardTypeAndAmountMapping[ctx.params.reward_type].max_amount;
                const isNotification = this.settings.rewardTypeAndAmountMapping[ctx.params.reward_type].is_notification;
                const notificationContent = this.settings.rewardTypeAndAmountMapping[ctx.params.reward_type].notification_content;
                if (maxAmountCanBeCredited) {
                    const startDate = moment().subtract(30, "days").endOf("day").add(5, "hours").add(30, "minutes").toDate();
                    const endDate = moment().add(5, "hours").add(30, "minutes").toDate();
                    const creditHistoryOfThisReward = await this.adapter.db.collection(this.settings.transactionCollection).find({
                        _id: {$gte: this.getObjectIdFromDate(startDate), $lte: this.getObjectIdFromDate(endDate)},
                        student_id: ctx.meta.user.student_id,
                        ref: ctx.params.reward_type,
                    }).toArray();
                    const totalCredited = _.sumBy(creditHistoryOfThisReward, "dnr");
                    if (totalCredited >= maxAmountCanBeCredited) {
                        this.logger.info(`${ctx.meta.user.student_id} Is Already credited max money.`);
                        return { is_credited: false, message: "Already credited max money." };
                    }
                }
                const walletAmt = await this.addAmountToWallet(ctx.meta.user.student_id, amount, currTime);
                this.broker.call("transactions.insert", {
                    transactionData: {
                        student_id: ctx.meta.user.student_id,
                        ref: ctx.params.reward_type,
                        dnr: amount,
                        milestone_id: null,
                        voucher_id: null,
                        type: 0,
                        closing_balance: walletAmt,
                        created_at: currTime,
                    },
                });
                if (isNotification && ctx.params.reward_type === "bnb_course_page_visit" && ctx.params.deeplink) {
                    const notificationData = {
                        event: ctx.params.event,
                        title: notificationContent.title,
                        message: notificationContent.description,
                        image: null,
                        firebase_eventtag: ctx.params.reward_type,
                        data: {
                            id: ctx.params.course_id,
                        },
                    };
                    this.broker.emit("sendNotification", {
                        studentId: [ctx.meta.user.student_id],
                        gcmRegistrationId: [ctx.meta.user.student_id],
                        notificationInfo: notificationData,
                        topic: "micro.push.notification",
                    }, "newton");
                }
                return { is_credited: true, message: "Successfully credited" };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
        async rewardingDnrForSuccessfulReferral(ctx: any){
            try {
                const {inviter_id: inviterId, invitee_id: inviteeId} = ctx.params.referral_data;

                const referralEntryExists = await  this.broker.call("$dnrMysql.checkingReferralDataExistence", {
                    inviter_id: inviterId,
                    invitee_id: inviteeId,
                });

                if (referralEntryExists[0].EXIST) {
                    const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                    await this.addAmountToWallet(inviteeId, this.settings.rewardTypeAndAmountMapping[ctx.params.reward_type].amount, currTime);
                    await this.addAmountToWallet(inviterId, this.settings.rewardTypeAndAmountMapping[ctx.params.reward_type].amount, currTime);

                    if (ctx.params.inviter_referral_count % 5 === 0) {
                        await this.addAmountToWallet(inviterId, this.settings.rewardTypeAndAmountMapping.referral_reward_every_5_referrals.amount, currTime);

                    }
                }
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = WalletSchema;
