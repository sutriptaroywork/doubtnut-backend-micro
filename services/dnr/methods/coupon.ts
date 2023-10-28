import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import dnrData from "../data/dnr.data";

import Settings from "./settings";

const CouponSchema: ServiceSchema = {
    name: "$dnr_coupon",
    mixins: [Settings],
    methods: {

        makeSomeRandom(length) {
            // to generate new names for coupon
            let result = "";
            const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            const charactersLength = characters.length;
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result.toUpperCase();
        },

        async getRandomCoupon() {
            try {
                // To check generated coupon name should be unique
                let referralCoupon;
                let doesCouponAlreadyExist;
                do {
                    referralCoupon = this.makeSomeRandom(10);
                    doesCouponAlreadyExist = await this.broker.call("$dnrMysql.getInfoByStudentReferralCoupons", {
                        couponCode: referralCoupon,
                    });
                } while (doesCouponAlreadyExist.length);
                return referralCoupon;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async createRewardCoupon(studentId: number, discountPercentage: number, validity: number, maxLimit: number) {
            try {
                const couponCode = await this.getRandomCoupon();
                const {couponData} = dnrData.rewardCouponInfo;
                couponData.coupon_code = couponCode;
                couponData.start_date = moment().startOf("day").format("YYYY-MM-DD HH:mm:ss");
                couponData.end_date = moment().add(validity, "d").endOf("day").format("YYYY-MM-DD HH:mm:ss");
                couponData.value = discountPercentage;
                couponData.max_limit = maxLimit;
                await this.broker.call("$dnrMysql.insertCoupon", couponData);
                await this.broker.call("$dnrMysql.insertCouponStudentIdMappingObj", {
                    coupon_code: couponCode,
                    type: "specific",
                    value: studentId,
                });
                return {
                    coupon_code: couponCode,
                    expiry: moment(couponData.end_date).add(5, "hours").add(30, "minutes").toDate(),
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = CouponSchema;
