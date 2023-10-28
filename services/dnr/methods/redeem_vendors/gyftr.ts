import {ServiceSchema} from "dn-moleculer";
import request from "request-promise";
import moment from "moment";
import {redisUtility} from "../../../../common";
import CouponService from "../coupon";

const rp = request.defaults({forever: true, pool: {maxSockets: 250}});

const GyftrSchema: ServiceSchema = {
    name: "$gyftr",
    mixins: [CouponService],
    methods: {

        deactivateVoucher(productGUID: string) {
            try {
                return this.adapter.db.collection(this.settings.voucherCollection).updateOne({
                    product_guid: productGUID,
                }, {
                    $set: {
                        is_active: false,
                        is_visible: false,
                    },
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async checkVoucherAvailability(productGuid: string) {
            try {
                let remainingQuantity = 0;
                const gyfterVoucherQuantity = await rp.get({
                    baseUrl: this.settings.gyftrBaseURL,
                    url: this.settings.gyftrQuantityURL,
                    qs: {
                        buyerGUID: this.settings.gyfterBuyerId,
                        password: this.settings.gyfterPassword,
                        productguid: productGuid,
                    },
                    json: true,
                    timeout: 40000,
                });
                if (gyfterVoucherQuantity.VoucherQuantityResult.length && gyfterVoucherQuantity.VoucherQuantityResult[0].ResultType === "SUCCESS" && gyfterVoucherQuantity.VoucherQuantityResult[0].QuantityResponse.length) {
                    remainingQuantity = parseInt(gyfterVoucherQuantity.VoucherQuantityResult[0].QuantityResponse[0].AvailableQuantity, 10);
                    if (remainingQuantity < 2) {
                        this.deactivateVoucher(productGuid);
                    }
                }
                return true;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        requestGyftrVoucher(productGuid: string, orderId: string, dnr: number) {
            try {
                return rp.get({
                    baseUrl: this.settings.gyftrBaseURL,
                    url: this.settings.gyftrRedeemURL,
                    qs: {
                        BuyerGuid: this.settings.gyfterBuyerId,
                        Password: this.settings.gyfterPassword,
                        ProductGuid: productGuid,
                        ExternalOrderID: orderId,
                        Quantity: 1,
                        value: dnr,
                    },
                    json: true,
                    timeout: 40000,
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async redeemGyftrVouchers(ctx: any, voucherData: any, userTotalDNR: number, orderId: string) {
            try {
                let voucherResponse = null;
                const data = {
                    studentId: ctx.meta.user.student_id,
                    versionCode: parseInt(ctx.meta.versionCode, 10),
                    voucherId: ctx.params.voucher_id,
                    product_guid: voucherData.product_guid,
                    expiryDate: null,
                    voucherAmount: voucherData.dnr,
                    couponCode: null,
                    voucherPin: null,
                    vendor: voucherData.vendor,
                    orderId,
                    rewardType: "coupon",
                    brand: voucherData.brand,
                    brandLogo: voucherData.brand_logo,
                    reward_amount: 0,
                };
                await this.initiateOrder(data);
                this.checkVoucherAvailability(voucherData.product_guid);
                const gyfterVoucherRequest = await this.requestGyftrVoucher(voucherData.product_guid, orderId, voucherData.dnr);
                if (gyfterVoucherRequest.vPullVouchersResult.ResultType === "SUCCESS" && gyfterVoucherRequest.vPullVouchersResult.PullVouchers) {
                    const voucherDetails = gyfterVoucherRequest.vPullVouchersResult.PullVouchers[0].Vouchers[0];
                    let expiryDate = null;
                    if (ctx.params.reward_type === "daily_streak") {
                        expiryDate = moment().add(3, "days").endOf("day").add(5, "hours").add(30, "minutes").toDate();
                    } else {
                        try {
                            expiryDate = moment(voucherDetails.EndDate).add(5, "hours").add(30, "minutes").toDate();
                        } catch (e) {
                            expiryDate = moment().add(6, "month").add(5, "hours").add(30, "minutes").toDate();
                        }
                    }
                    const finalVoucherData = {
                        expiry_date: expiryDate,
                        coupon_code: voucherDetails.VoucherNo,
                        voucher_no: voucherDetails.VoucherGCcode,
                        voucher_pin: voucherDetails.Voucherpin,
                        voucher_name: gyfterVoucherRequest.vPullVouchersResult.PullVouchers[0].VoucherName,
                        status: 20,
                    };
                    await this.confirmOrder(ctx.meta.user.student_id, finalVoucherData, orderId);

                    voucherResponse = this.redeemVoucherPage(ctx, voucherData, finalVoucherData, userTotalDNR, orderId);
                    await redisUtility.deleteHashField.call(this, ctx.meta.user.student_id, "DNR_PENDING_REDEEM");
                }
                return voucherResponse;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = GyftrSchema;
