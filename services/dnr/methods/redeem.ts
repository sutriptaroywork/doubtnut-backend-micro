/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import {ObjectId} from "mongodb";
import moment from "moment";
import _ from "lodash";
import dnrData from "../data/dnr.data";
import {redisUtility} from "../../../common";
import GyftrService from "./redeem_vendors/gyftr";
import DoubtnutRewardService from "./redeem_vendors/doubtnut";
import QwickCilverRewardService from "./redeem_vendors/qwickcilver";

const redeemSchema: ServiceSchema = {
    name: "$redeem",
    mixins: [GyftrService, DoubtnutRewardService, QwickCilverRewardService],
    methods: {

        voucherPageData(voucherData: any, locale: string, userTotalDNR: number) {
            // response structure
            const toolbarData = this.getToolbarData(voucherData.brand + " Vouchers", userTotalDNR);
            const content = locale === "hi" ? voucherData.content.hi : voucherData.content.en;

            const infoData = {
                title: content.title,
                offer_title: locale === "hi" ? dnrData.voucherPage.offer_title.hi : dnrData.voucherPage.offer_title.en,
                offer_description: content.offer,
                info_items: [],
                deeplink: "",
                cta: (locale === "hi" ? dnrData.voucherPage.unlockCta.hi : dnrData.voucherPage.unlockCta.en).replace("{dnr}", voucherData.dnr),
            };
            if (content.about) {
                infoData.info_items = infoData.info_items.concat({
                    title: "About " + voucherData.brand,
                    description: content.about,
                });
            }

            if (content.avail_process) {
                infoData.info_items = infoData.info_items.concat({
                    title: locale === "hi" ? dnrData.voucherPage.availTitle.hi : dnrData.voucherPage.availTitle.en,
                    description: content.avail_process,
                });
            }

            if (content.tnc) {
                infoData.info_items = infoData.info_items.concat({
                    title: locale === "hi" ? dnrData.voucherPage.tncTitle.hi : dnrData.voucherPage.tncTitle.en,
                    description: content.tnc,
                });
            }

            return {
                toolbar_data: toolbarData,
                info_data: infoData,
            };
        },

        storeTestRedeemCoupons(studentId: number, voucherData: any, redeemedDetails: any, orderId: string) {
            try {
                return this.adapter.db.collection(this.settings.testRedemptionsCollection).insertOne({
                    brand: voucherData.brand,
                    voucher_id: voucherData._id,
                    orderId,
                    product_code: voucherData.product_code,
                    voucher_code: redeemedDetails.coupon_code,
                    voucher_pin: redeemedDetails.voucher_pin,
                    redeem_url: redeemedDetails.activation_url ? redeemedDetails.activation_url : voucherData.redeem_url,
                    expire_on: moment(redeemedDetails.expiry_date).toDate(),
                    redeemed_by: studentId,
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        createPendingState(locale: string, orderStatus: string) {
            const widget = dnrData.orderStates.widget;
            widget.description = locale === "hi" ? dnrData.orderStates[orderStatus].hi : dnrData.orderStates[orderStatus].en;
            return widget;
        },

        redeemVoucherPage(ctx: any, voucherData: any, redeemVoucherDetails: any, userTotalDNR: number, orderId: string) {
            try {
                // creating structure, to show after the coupon has been redeemed

                let redeemedDetails = null;
                if (redeemVoucherDetails.status === 20) {
                    const redeemContent = ctx.meta.user.locale === "hi" ? dnrData.redeemedDetails.hi : dnrData.redeemedDetails.en;

                    redeemedDetails = {
                        title: redeemContent.title,
                        expire_on: redeemContent.expiry + moment(redeemVoucherDetails.expiry_date).format("DD MMM YYYY"),
                        voucher_code: redeemVoucherDetails.voucher_pin ? `${redeemVoucherDetails.coupon_code} - ${redeemVoucherDetails.voucher_pin}` : redeemVoucherDetails.coupon_code,
                        voucher_pin: redeemVoucherDetails.voucher_pin,
                        copy_code_text: redeemContent.copyCode,
                        cta: redeemContent.cta,
                        deeplink: redeemVoucherDetails.activation_url ? redeemVoucherDetails.activation_url : voucherData.redeem_url,
                    };

                    if (this.settings.testingStudentIds.includes(ctx.meta.user.student_id)) {
                        this.storeTestRedeemCoupons(ctx.meta.user.student_id, voucherData, redeemVoucherDetails, orderId);
                    }
                } else {
                    redeemedDetails = {
                        title: this.createPendingState(ctx.meta.user.locale, "pending").description,
                        expire_on: "",
                        voucher_code: "",
                        voucher_pin: "",
                        copy_code_text: "",
                        cta: "Go Back",
                        deeplink: "",
                    };
                }

                return {
                    ...this.voucherPageData(voucherData, ctx.meta.user.locale, userTotalDNR),
                    voucher_image_url: voucherData.brand_logo_large,
                    voucher_background_color: voucherData.voucher_background_color,
                    redeemed_details: redeemedDetails,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async checkBlockStatus(studentId) {
            try {
                let isUserBlocked = await redisUtility.getHashField.call(this, studentId, "DNR_REDEMPTION_BLOCKED");
                if (_.isNull(isUserBlocked)) {
                    const banEntry = await this.adapter.db.collection(this.settings.blockCollection).findOne({
                        studentId,
                    });
                    isUserBlocked = !_.isNull(banEntry);
                    await redisUtility.addHashField.call(this, studentId, "DNR_REDEMPTION_BLOCKED", isUserBlocked, this.settings.weeklyRedisTTL);
                }
                return isUserBlocked;
            } catch (e) {
                this.logger.error(e);
                return true;
            }
        },

        delNewUserClaimKey(voucherData: any, ctx: any) {
            try {
                if (this.daysDifference(moment().add(5, "hours").add(30, "minutes").toDate(), ctx.meta.user.timestamp) < 7) {
                    return redisUtility.deleteKey.call(this, `DNR_STREAK_${voucherData.product_code}:${ctx.meta.user.student_id}`);
                }
            } catch (e) {
                this.logger.error(e);
            }
        },

        async redeemVoucher(ctx: any) {
            try {
                const isUserBlocked = await this.checkBlockStatus(ctx.meta.user.student_id);
                if (isUserBlocked) {
                    this.logger.info("User is Blocked");
                    return null;
                }

                // keeping a redis lock for 1 minutes, No 2 redeems can be performed within 1 minutes
                const isInsideLock = await this.checkRedisLockStatus(`${ctx.meta.user.student_id}_IS_REDEEMING_VOUCHER`, this.settings.minuteRedisTTL);

                if (isInsideLock) {
                    this.logger.info(`${ctx.meta.user.student_id} Inside voucher redemption lock. Try Again after 1 minute.`);
                    return null;
                }

                // Limiting the voucher redemption per Student per day.
                const redemptionCount = await redisUtility.getRedisKeyData.call(this, `DNR_VOUCHER_COUNT_${ctx.meta.user.student_id}`);
                if (!_.isNull(redemptionCount) && redemptionCount >= this.settings.voucherRedemptionPerDay) {
                    this.logger.info("User has reached daily redemption limit.");
                    return null;
                }

                // keeping track of daily redeem voucher count
                await redisUtility.incrKeyData.call(this, `DNR_VOUCHER_COUNT_${ctx.meta.user.student_id}`, 1, this.getTodayEndTime());

                let userTotalDNR = await this.getWalletAmount(ctx.meta.user.student_id);
                // get details of voucher to be redeemed
                const voucherData = await this.getSpecificVoucher(ctx.params.voucher_id);
                if (["spin_wheel", "mystery_box", "better_luck_next_time"].includes(ctx.params.source)) {
                    const source = ctx.params.source === "better_luck_next_time" ? "spin_wheel" : ctx.params.source;
                    const data = await this.rangeData(userTotalDNR, parseInt(ctx.meta.versionCode, 10), source);
                    if (data.length) {
                        voucherData.dnr = data[0].redeem_dnr;
                    }
                }

                // check if transaction possible
                if (userTotalDNR < voucherData.dnr) {
                    console.log("Low Wallet Balance");
                    return null;
                }
                // deducting from dnr wallet
                await this.deductWalletAmount(ctx.meta.user.student_id, voucherData.dnr);
                userTotalDNR -= voucherData.dnr;

                // add transaction data
                this.broker.call("transactions.insert", {
                    transactionData: {
                        student_id: ctx.meta.user.student_id,
                        dnr: voucherData.dnr,
                        milestone_id: null,
                        voucher_id: new ObjectId(ctx.params.voucher_id),
                        type: 1,
                        closing_balance: userTotalDNR,
                        created_at: moment().add(5, "hours").add(30, "minutes").toDate(),
                        ref: "Voucher Redeem",
                    },
                });
                const orderId = `DN_${(moment(new Date()).format("YYYYMMDDHHmmssSSS")).toString() + Math.floor(Math.random() * 100)}`;
                let response = null;
                switch (voucherData.vendor) {
                    case "doubtnut":
                        // redeem internal vouchers/add DN cash
                        response = await this.redeemDNVouchers(ctx, voucherData, userTotalDNR, orderId);
                        break;
                    case "gyftr":
                        // redeem gyftr vouchers
                        response = await this.redeemGyftrVouchers(ctx, voucherData, userTotalDNR, orderId);
                        break;
                    case "qwickcilver":
                        // redeem qwickcilver vouchers
                        response = await this.redeemQwickcilverVouchers(ctx, voucherData, userTotalDNR, orderId);
                        console.log("response ", response);
                        break;
                }

                if (!_.isNull(response)) {
                    this.delNewUserClaimKey(voucherData, ctx);
                }

                return response;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async initiateOrder(data: any) {
            try {
                const requestingVoucherDetails = {
                    description: `Your ${data.brand} voucher has been redeemed successfully.`,
                    cta: "Check Now",
                    image: data.brand_logo,
                    auto_hide_duration: 5000,
                    deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                };
                await redisUtility.addHashField.call(this, data.studentId, "DNR_PENDING_REDEEM", requestingVoucherDetails, this.settings.weeklyRedisTTL);
                return this.adapter.db.collection(this.settings.redeemVoucherCollection).insertOne({
                    student_id: data.studentId,
                    version_code: data.versionCode,
                    product_guid: data.product_guid,
                    voucher_id: new ObjectId(data.voucherId),
                    expiry_date: data.expiryDate,
                    voucher_amount: data.voucherAmount,
                    coupon_code: data.couponCode,
                    voucher_pin: data.voucherPin,
                    vendor: data.vendor,
                    order_id: data.orderId,
                    reward_type: data.rewardType,
                    reward_amount: data.reward_amount || 0,
                    created_at: moment().add(5, "hours").add(30, "minutes").toDate(),
                    status: 10,
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        confirmOrder(studentId: number, voucherData: object, orderId: string) {
            try {
                return this.adapter.db.collection(this.settings.redeemVoucherCollection).updateOne({
                    student_id: studentId,
                    order_id: orderId,
                }, {
                    $set:
                    voucherData,
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getPendingRedemptionDetails(ctx: any) {
            const coursePurchasedData = await redisUtility.getHashField.call(this, ctx.meta.user.student_id, "DNR_PENDING_REDEEM");
            if (!_.isNull(coursePurchasedData)) {
                await redisUtility.deleteHashField.call(this, ctx.meta.user.student_id, "DNR_PENDING_REDEEM");
            }
            return coursePurchasedData;
        },
    },
};

export = redeemSchema;
