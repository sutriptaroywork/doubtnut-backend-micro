/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import redeemService from "../methods/redeem";
import SmsService from "../../studygroup/methods/sms";
import dnrData from "../../dnr/data/dnr.data";

const reinstallRewardSchema: ServiceSchema = {
    name: "$reinstallVoucher",
    mixins: [redeemService, SmsService],
    methods: {
        sendReinstallVoucherEarnedNotification(ctx: any,  notificationData) {
            return this.broker.emit("sendNotification", {
                studentId: [ctx.meta.user.student_id],
                gcmRegistrationId: [ctx.gcm_reg_id],
                notificationInfo: {
                    event: "dnr",
                    title: notificationData.title,
                    message: notificationData.message,
                    image: null,
                    firebase_eventtag: "dnr_reinstall_notif",
                },
                topic: "micro.push.notification",
            }, "newton");
        },

        fetchingLocaleOfSmsToBeSent(userLocale) {
            const allowedLocales = ["hi", "en"];
            let smsLocale = "other";
            if (allowedLocales.includes(userLocale)) {
                smsLocale = userLocale;
            }
            return smsLocale;
        },

        makingMsgContent(smsLocale, voucherData, redeemedVoucherData) {
            let msgContent = dnrData.reinstallSmsNotification[smsLocale].message;
            const voucherPin = redeemedVoucherData.voucher_pin !== "" ? `${dnrData.pinTitle[smsLocale]} : ${redeemedVoucherData.voucher_pin}` : "";
            msgContent = msgContent.replace("{voucherBrand}", voucherData.brand).replace("{voucherCode}", redeemedVoucherData.voucher_code).replace("{voucherPin}", voucherPin).replace("{voucherExpiry}", redeemedVoucherData.expire_on);
            return msgContent;
        },

        makingNotificationContent(smsLocale, voucherData, redeemedVoucherData) {
            let messageContent = dnrData. reinstallAppNotification[smsLocale].message;
            const voucherPin = redeemedVoucherData.voucher_pin !== "" ? `${dnrData.pinTitle[smsLocale]} : ${redeemedVoucherData.voucher_pin}` : "";
            messageContent = messageContent.replace("{voucherBrand}", voucherData.brand).replace("{voucherCode}", redeemedVoucherData.voucher_code).replace("{voucherPin}", voucherPin).replace("{voucherExpiry}", redeemedVoucherData.expire_on);
            return {
                title : dnrData.reinstallAppNotification[smsLocale].title,
                message : messageContent,
            };
        },
        async rewardingReinstallStudent(ctx: any) {
            try {
                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                const voucherCodes = ["MYNPC400", "1MGPC170", "MFPC350", "EGVGBPTM006"];
                const randomVoucherCode = _.sample(voucherCodes);

                const voucherData = await this.adapter.db.collection(this.settings.voucherCollection).findOne({
                    product_code: randomVoucherCode,
                });

                if (!_.isEmpty(voucherData)) {
                    // adding dnr required to reedem the voucher to user account
                    await this.addAmountToWallet(ctx.meta.user.student_id, voucherData.dnr, currTime);

                    // adding voucher id and source to the request
                    ctx.params.voucher_id = voucherData._id;
                    ctx.params.source = "redeem_voucher";
                    const redeemVoucherResponse = await this.redeemVoucher(ctx);
                    this.adapter.db.collection(this.settings.reinstallStudentRewardCollection).insertOne({
                        student_id: ctx.meta.user.student_id,
                        created_at: currTime,
                        product_code: randomVoucherCode,
                        voucher_code: redeemVoucherResponse.redeemed_details.voucher_code,
                    });

                    if (!_.isNull(redeemVoucherResponse)){
                        const smsLocale = this.fetchingLocaleOfSmsToBeSent(ctx.meta.user.locale);

                        // sending app notification to the user
                        const notificationData = this.makingNotificationContent(smsLocale, voucherData, redeemVoucherResponse.redeemed_details);
                        await this.sendReinstallVoucherEarnedNotification( ctx, notificationData);

                        const msg = this.makingMsgContent(smsLocale, voucherData, redeemVoucherResponse.redeemed_details);
                        // sending sms notification to the user
                        this.broker.emit("sendSms", {mobile:ctx.meta.user.mobile, message:msg}, "studygroup");
                    }
                }
                return null;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = reinstallRewardSchema;

