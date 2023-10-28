/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import {ObjectId} from "mongodb";
import moment from "moment";
import {redisUtility} from "../../../../common";
import dnrData from "../../data/dnr.data";
import RewardPopService from "./popup";

const PurchasedRewardSchema: ServiceSchema = {
    name: "$purchasedReward",
    mixins: [RewardPopService],
    methods: {

        async purchasedReward(request: any) {
            try {

                // check if course/pdf has been purchased in last 30 seconds (to check its a recent purchase)
                const purchaseData = await this.broker.call("$dnrMysql.getLastPurchasedDetails", {
                    studentId: request.meta.user.student_id,
                    seconds: 30,
                });

                if (!_.isEmpty(purchaseData)) {
                    const payableAmt = purchaseData[0].net_payble;
                    let milestoneType = null;

                    // based on the request type defining milestone_type
                    switch (request.params.type) {
                        case "course":
                            milestoneType = payableAmt > 500 ? "course_greater_500" : "course_less_500";
                            await redisUtility.addHashField.call(this, `ACTIVITY_BASED_${request.meta.user.student_id}`, "COURSE_PURCHASE", dnrData.popUp.course_greater_500.activity_image, this.settings.weeklyRedisTTL);
                            break;
                        case "resource_pdf":
                            milestoneType = "pdf_purchase";
                            await redisUtility.addHashField.call(this, `ACTIVITY_BASED_${request.meta.user.student_id}`, "PDF_PURCHASE", dnrData.popUp.pdf_purchase.activity_image, this.settings.weeklyRedisTTL);
                            break;
                        case "resource_video":
                            milestoneType = "resource_video";
                            break;
                    }

                    const milestone = await this.getMilestoneData(parseInt(request.meta.versionCode, 10), milestoneType);

                    if (!_.isNull(milestone)) {
                        const achievedAmount = await this.getAchievedDNR(request.meta.user.student_id, milestone._id);
                        const updatedWalletLimit = achievedAmount + milestone.prize_dnr;

                        if (updatedWalletLimit <= milestone.limit_per_day) {
                            const currentTime = moment().add(5, "hours").add(30, "minutes").toDate();
                            const walletAmt = await this.addAmountToWallet(request.meta.user.student_id, milestone.prize_dnr, currentTime);

                            this.broker.call("transactions.insert", {
                                transactionData: {
                                    student_id: request.meta.user.student_id,
                                    dnr: milestone.prize_dnr,
                                    milestone_id: new ObjectId(milestone._id),
                                    voucher_id: null,
                                    type: 0,
                                    closing_balance: walletAmt,
                                    created_at: currentTime,
                                    assortment_id: request.params.assortment_id,
                                    assortment_type: request.params.assortment_type,
                                    order_id: purchaseData[0].order_id,
                                    variant_id: purchaseData[0].variant_id,
                                    source: purchaseData[0].source,
                                    paid_at: purchaseData[0].created_at,
                                    payable_amt: payableAmt,
                                    ref: milestoneType,
                                },
                            });
                            const purchaseObject = {
                                milestone_type: milestoneType,
                                prize_dnr: milestone.prize_dnr,
                            };
                            // temp store in redis - until users arrives on explore page (Will show reward pop for last purchase only)
                            await redisUtility.addHashField.call(this, request.meta.user.student_id, "DNR_PURCHASE_REWARD", purchaseObject, this.settings.weeklyRedisTTL);
                        }
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

export = PurchasedRewardSchema;
