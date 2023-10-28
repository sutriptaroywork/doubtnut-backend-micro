import {ServiceSchema} from "dn-moleculer";
import {redisUtility} from "../../../../common";
import CouponService from "../coupon";
import dnrData from "../../data/dnr.data";

const DoubtnutRewardSchema: ServiceSchema = {
    name: "$DNReward",
    mixins: [CouponService],
    methods: {

        async generateRewardCoupon(ctx: any, voucherData: any, userTotalDNR: number, orderId: string) {
            try {
                // generating DN discount coupon
                let voucherResponse = null;
                const data = {
                    studentId: ctx.meta.user.student_id,
                    versionCode: parseInt(ctx.meta.versionCode, 10),
                    product_guid: null,
                    voucherId: ctx.params.voucher_id,
                    expiryDate: null,
                    voucherAmount: voucherData.dnr,
                    couponCode: null,
                    voucherPin: null,
                    vendor: voucherData.vendor,
                    orderId,
                    rewardType: "coupon",
                    brand: voucherData.brand,
                    brandLogo: voucherData.brand_logo,
                    reward_amount: voucherData.discount_value,
                };
                await this.initiateOrder(data);
                let validity = 30;
                if (ctx.params.reward_type === "daily_streak") {
                    validity = 3;
                }
                const couponVoucherRequest = await this.createRewardCoupon(ctx.meta.user.student_id, voucherData.discount_value, validity, voucherData.max_limit);
                if (couponVoucherRequest) {
                    const finalVoucherData = {
                        expiry_date: couponVoucherRequest.expiry,
                        coupon_code: couponVoucherRequest.coupon_code,
                        voucher_pin: "",
                        voucher_name: `Doubtnut ${voucherData.discount_value}% Coupon`,
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

        async rewardDNCash(ctx: any, voucherData: any, userTotalDNR: number, orderId: string) {
            try {
                // Credit DN Cash in Wallet
                let voucherResponse = null;
                const data = {
                    studentId: ctx.meta.user.student_id,
                    versionCode: parseInt(ctx.meta.versionCode, 10),
                    product_guid: null,
                    voucherId: ctx.params.voucher_id,
                    expiryDate: null,
                    voucherAmount: voucherData.dnr,
                    couponCode: null,
                    voucherPin: null,
                    vendor: voucherData.vendor,
                    orderId,
                    rewardType: "wallet",
                    brand: voucherData.brand,
                    brandLogo: voucherData.brand_logo,
                    reward_amount: voucherData.discount_value,
                };
                await this.initiateOrder(data);
                const rewardRequest = await this.addAmountDNCash(ctx.meta.user.student_id, voucherData.discount_value, ctx.params.reward_type);
                if (rewardRequest) {
                    const finalVoucherData = {
                        expiry_date: rewardRequest.expiry,
                        voucher_name: `Doubtnut ${voucherData.discount_value} DN Cash`,
                        status: 20,
                    };
                    await this.confirmOrder(ctx.meta.user.student_id, finalVoucherData, orderId);

                    const pageData = this.voucherPageData(voucherData, ctx.meta.user.locale, userTotalDNR);
                    pageData.info_data.title = (ctx.meta.user.locale === "hi" ? dnrData.voucherPage.dnCashTitle.hi : dnrData.voucherPage.dnCashTitle.en).replace("{amt}", voucherData.discount_value);
                    pageData.info_data.deeplink = dnrData.voucherPage.walletDeeplink;
                    pageData.info_data.cta = ctx.meta.user.locale === "hi" ? dnrData.voucherPage.walletCta.hi : dnrData.voucherPage.walletCta.en;

                    voucherResponse = {
                        ...pageData,
                        voucher_image_url: voucherData.brand_logo_large,
                        voucher_background_color: voucherData.voucher_background_color,
                    };
                    await redisUtility.deleteHashField.call(this, ctx.meta.user.student_id, "DNR_PENDING_REDEEM");
                }
                return voucherResponse;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async redeemDNVouchers(ctx: any, voucherData: any, userTotalDNR: number, orderId: string) {
            try {
                let voucherResponse = null;
                switch (voucherData.type) {
                    case "wallet":
                        // type = wallet means DN Cash has to be credited
                        voucherResponse = await this.rewardDNCash(ctx, voucherData, userTotalDNR, orderId);
                        break;
                    case "coupon":
                        // type = coupon means internal discount coupon has to be provided
                        voucherResponse = await this.generateRewardCoupon(ctx, voucherData, userTotalDNR, orderId);
                        break;
                }
                return voucherResponse;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

    },
};

export = DoubtnutRewardSchema;
