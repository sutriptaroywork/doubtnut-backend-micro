/* eslint-disable no-underscore-dangle */
import DbService from "dn-moleculer-db";
import {ServiceSchema} from "dn-moleculer";
import MongoDBAdapter from "moleculer-db-adapter-mongo";
import moment from "moment";
import {ObjectId} from "mongodb";
import _ from "lodash";
import {redisUtility} from "../../../common";
import Settings from "../methods/settings";
import Gyftr from "../methods/redeem_vendors/gyftr";
import QwickCilver from "../methods/redeem_vendors/qwickcilver";
import Redeem from "../methods/redeem";
import Voucher from "../methods/vouchers";
import Coupon from "../methods/coupon";
import Wallet from "../methods/wallet";


const CouponWebhook: ServiceSchema = {
    name: "$dnr-coupon-webhook-cron",
    mixins: [DbService, Settings, Gyftr, Redeem, Coupon, Wallet, QwickCilver, Voucher],
    adapter: new MongoDBAdapter(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}),
    collection: "dnr_redeem_voucher",
    methods: {
        objectIdFromDate(date) {
            const objectId = new ObjectId(Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000");
            this.logger.info("pending coupon time", date, objectId);
            return objectId;
        },

        getPendingCoupon(isScript?: boolean) {
            try {
                let startTime = moment().subtract(24, "hours").toDate();
                let endTime = moment().subtract(10, "minutes").toDate();

                if (isScript) {
                    startTime = moment().subtract(3, "months").toDate();
                    endTime = moment().subtract(7, "days").toDate();
                }

                return this.adapter.db.collection(this.settings.redeemVoucherCollection).find({
                    _id: {
                        $gte: this.objectIdFromDate(startTime),
                        $lte: this.objectIdFromDate(endTime),
                    },
                    status: 10,
                }).toArray();

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async storeTestCoupons(voucherData: any, redeemDetails: any) {
            const couponDetails = await this.getSpecificVoucher(voucherData.voucher_id);
            return this.storeTestRedeemCoupons(voucherData.student_id, couponDetails, redeemDetails, voucherData.order_id);
        },

        async requestQwickCilver(bearerToken: string, url: string, signature: string) {
            const { data } = await this.settings.AxiosInstance({
                method: "GET",
                url,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${bearerToken}`,
                    "dateAtClient": moment().toISOString(),
                    signature,
                },
                json: true,
                timeout: this.settings.qwickCilver.timeout,
            });

            return data;
        },

        async ActivatedCardsAPI(voucherNo: string, requestCount: number = 0) {
            try {
                const bearerToken = await this.getQwickCilverAuthToken();
                const url = this.settings.qwickCilver.BaseURL + (this.settings.qwickCilver.activatedCardsPath).replace("{id}", voucherNo);
                const signature = this.generateRequestSignature("GET", url);

                return this. requestQwickCilver(bearerToken, url, signature);
            } catch (e) {
                this.logger.error(e);
                if (e && e.response && e.response.data && e.response.data.code === 401 && e.response.data.message === "oauth_problem=token_rejected" && requestCount < 3) {
                    // First Request Failed - delete older redis auth token
                    await redisUtility.deleteKey.call(this, "DNR_QWICKCILVER_AUTH");
                    return this.ActivatedCardsAPI(voucherNo, ++requestCount);
                }
                throw (e);
            }
        },

        async orderStatusAPI(orderId: string, requestCount: number = 0) {
            try {
                const bearerToken = await this.getQwickCilverAuthToken();
                const url = this.settings.qwickCilver.BaseURL + (this.settings.qwickCilver.orderStatusPath).replace("{refno}", orderId);
                const signature = this.generateRequestSignature("GET", url);

                return this. requestQwickCilver(bearerToken, url, signature);
            } catch (e) {
                this.logger.error(e);
                if (e && e.response && e.response.data && e.response.data.code === 401 && e.response.data.message === "oauth_problem=token_rejected" && requestCount < 3) {
                    console.log("OAuth Request Failed");
                    // delete older redis auth token
                    await redisUtility.deleteKey.call(this, "DNR_QWICKCILVER_AUTH");
                    return this.orderStatusAPI(orderId, ++requestCount);
                }
                return null;
            }
        },


        async processQwickCilverVouchers(voucherData: any) {
            try {
                let isVoucherRedeemed = false;
                const orderStatus = await this.orderStatusAPI(voucherData.order_id);

                    if (orderStatus && orderStatus.status === "COMPLETE") {
                        const activatedCard = await this.ActivatedCardsAPI(orderStatus.orderId);

                        if (activatedCard && activatedCard.cards.length) {
                            isVoucherRedeemed = true;
                            const finalVoucherData = {
                                expiry_date: moment(activatedCard.cards[0].validity).add(5, "hours").add(30, "minutes").toDate(),
                                coupon_code: activatedCard.cards[0].cardNumber,
                                voucher_no: activatedCard.orderId,
                                voucher_pin: activatedCard.cards[0].cardPin,
                                voucher_name: activatedCard.cards[0].productName,
                                activation_code: activatedCard.cards[0].activationCode,
                                activation_url: activatedCard.cards[0].activationUrl,
                                status: 20,
                            };
                            await this.confirmOrder(voucherData.student_id, finalVoucherData, voucherData.order_id);
                            if (this.settings.testingStudentIds.includes(voucherData.student_id)) {
                                this.storeTestCoupons(voucherData, finalVoucherData);
                            }
                        }
                    }
                    return isVoucherRedeemed;
            } catch (e) {
                this.logger.error(e);
                return false;
            }
        },

        async processGyftrVouchers(voucherData: any) {
            try {
                let isVoucherRedeemed = false;
                const gyfterVoucherRequest = await this.requestGyftrVoucher(voucherData.product_guid, voucherData.order_id, voucherData.voucher_amount);
                if (gyfterVoucherRequest.vPullVouchersResult.ResultType === "SUCCESS" && gyfterVoucherRequest.vPullVouchersResult.PullVouchers) {
                    const voucherDetails = gyfterVoucherRequest.vPullVouchersResult.PullVouchers[0].Vouchers[0];
                    isVoucherRedeemed = true;
                    let expiry = null;
                    try {
                        expiry = moment(voucherDetails.EndDate).add(5, "hours").add(30, "minutes").toDate();
                    } catch (e) {
                        expiry = moment().add(6, "month").add(5, "hours").add(30, "minutes").toDate();
                    }
                    const finalVoucherData = {
                        expiry_date: expiry,
                        coupon_code: voucherDetails.VoucherNo,
                        voucher_no: voucherDetails.VoucherGCcode,
                        voucher_pin: voucherDetails.Voucherpin,
                        voucher_name: gyfterVoucherRequest.vPullVouchersResult.PullVouchers[0].VoucherName,
                        status: 20,
                    };
                    await this.confirmOrder(voucherData.student_id, finalVoucherData, voucherData.order_id);
                    if (this.settings.testingStudentIds.includes(voucherData.student_id)) {
                        this.storeTestCoupons(voucherData, finalVoucherData);
                    }
                }
                return isVoucherRedeemed;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async processDNWalletVoucher(voucherData) {
            try {
                let isVoucherRedeemed = false;
                const rewardRequest = await this.addAmountDNCash(voucherData.student_id, voucherData.reward_amount);
                if (rewardRequest) {
                    isVoucherRedeemed = true;
                    const finalVoucherData = {
                        expiry_date: rewardRequest.expiry,
                        voucher_name: `Doubtnut ${voucherData.reward_amount} DN Cash`,
                        status: 20,
                    };
                    await this.confirmOrder(voucherData.student_id, finalVoucherData, voucherData.order_id);
                }
                return isVoucherRedeemed;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async processDNCouponVoucher(voucherData) {
            try {
                let isVoucherRedeemed = false;
                const couponVoucherRequest = await this.createRewardCoupon(voucherData.student_id, voucherData.reward_amount, 30, 500);
                if (couponVoucherRequest) {
                    isVoucherRedeemed = true;
                    const finalVoucherData = {
                        expiry_date: couponVoucherRequest.expiry,
                        coupon_code: couponVoucherRequest.coupon_code,
                        voucher_name: `Doubtnut ${voucherData.reward_amount}% Coupon`,
                        status: 20,
                    };
                    await this.confirmOrder(voucherData.student_id, finalVoucherData, voucherData.order_id);
                    if (this.settings.testingStudentIds.includes(voucherData.student_id)) {
                        this.storeTestCoupons(voucherData, finalVoucherData);
                    }
                }
                return isVoucherRedeemed;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async processDoubtnutVouchers(voucherData: any) {
            try {
                let isVoucherRedeemed = true;
                switch (voucherData.reward_type) {
                    case "coupon":
                        isVoucherRedeemed = this.processDNCouponVoucher(voucherData);
                        break;
                    case "wallet":
                        isVoucherRedeemed = this.processDNWalletVoucher(voucherData);
                        break;
                }
                return isVoucherRedeemed;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },


        async processPendingCoupons(isScript?: boolean) {
            try {
                const pendingCoupons = await this.getPendingCoupon(isScript);
                this.logger.info("pending coupons available ", pendingCoupons.length);
                for (const couponData of pendingCoupons) {
                    let isVoucherRedeemed = false;
                    switch (couponData.vendor) {
                        case "gyftr":
                            isVoucherRedeemed = await this.processGyftrVouchers(couponData);
                            break;
                        case "doubtnut":
                            isVoucherRedeemed = await this.processDoubtnutVouchers(couponData);
                            break;
                        case "qwickcilver":
                            isVoucherRedeemed = await this.processQwickCilverVouchers(couponData);
                            break;
                    }
                    await redisUtility.deleteHashField.call(this, couponData.student_id, "DNR_PENDING_REDEEM");
                    if (!isVoucherRedeemed) {

                        const insertEntry = await this.adapter.db.collection(this.settings.transactionCollection).findOne({
                            ref: "refund",
                            ref_order_id: new ObjectId(couponData._id),
                        });

                        if (_.isNull(insertEntry)) {
                            const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                            await this.confirmOrder(couponData.student_id, {status: 30}, couponData.order_id);
                            const walletAmt = await this.addAmountToWallet(couponData.student_id, couponData.voucher_amount, currTime);
                            await this.broker.call("transactions.insert", {
                                transactionData: {
                                    student_id: couponData.student_id,
                                    dnr: couponData.voucher_amount,
                                    milestone_id: null,
                                    voucher_id: null,
                                    type: 0,
                                    closing_balance: walletAmt,
                                    created_at: currTime,
                                    ref: "refund",
                                    ref_order_id: new ObjectId(couponData._id),
                                },
                            });
                            await redisUtility.decrKeyData.call(this, `${couponData.student_id}_DNR_VOUCHER_COUNT`, 1, this.getTodayEndTime());
                        }
                    }
                }
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

    },

    actions: {},
};

export = CouponWebhook;
