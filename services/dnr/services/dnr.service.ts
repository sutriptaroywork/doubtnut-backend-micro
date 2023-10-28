import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import EarnHistoryService from "../methods/earn.history";
import appOpenService from "../methods/app.open";
import milestoneService from "../methods/milestones";
import HomeService from "../methods/home";
import claimRewardService from "../methods/claim.reward";
import redeemService from "../methods/redeem";
import qwickCilver from "../methods/redeem_vendors/qwickcilver";
import reinstallRewardService from "../methods/reinstall.reward";
import conditionalMilestonesService from "../methods/conditional.milestones";
import walletService from "../methods/wallet";
import HomepageWidgetService from "../methods/homepage.widget";
import achievedActivitiesService from "../methods/achieved.activities";

const DnrService: ServiceSchema = {
    name: "dnr-api",
    mixins: [DbService, HomeService, EarnHistoryService, appOpenService, milestoneService, claimRewardService, redeemService, qwickCilver, reinstallRewardService, conditionalMilestonesService, walletService, HomepageWidgetService, achievedActivitiesService],
    adapter: new MongoDBAdapter(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}),
    collection: "student_transactions",
    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {

        // earn history
        earnHistoryAPI: {
            rest: {
                method: "POST",
                path: "/earn-history",
            },
            params: {},
            async handler(request: any) {
                const data = await this.earnHistory(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // mark app open
        markAppOpenAPI: {
            rest: {
                method: "GET",
                path: "/mark-app-open",
            },
            params: {},
            async handler(request: any) {
                const returnObj = {
                    meta: this.settings.successResponse,
                    data: {
                        show_reward_pop_up: false,
                        is_marked_app_open: false,
                    },
                };
                const isDNREnabled = this.isDNREnabled(request);
                if (isDNREnabled) {
                    returnObj.data = await this.markAppOpen(request);
                }
                return returnObj;
            },
        },

        // mark course purchase
        markCoursePurchaseAPI: {
            rest: {
                method: "GET",
                path: "/get-course-purchase-popup",
            },
            params: {},
            async handler(request: any) {
                const data = await this.getPurchasePopup(request);
                const returnObj = {
                    meta: this.settings.successResponse,
                    data,
                };
                const isDNREnabled = this.isDNREnabled(request);
                if (!isDNREnabled) {
                    _.set(returnObj, "data.dialog_title", "");
                    _.set(returnObj, "data.cta", "");
                }
                return returnObj;
            },
        },


        homeAPI: {
            rest: {
                method: "GET",
                path: "/home",
            },
            params: {},
            async handler(request: any) {
                const data = await this.home(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        faqAPI: {
            rest: {
                method: "GET",
                path: "/faq",
            },
            params: {},
            async handler(request: any) {
                const data = await this.faq(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // mark app open
        milestonePageAPI: {
            rest: {
                method: "GET",
                path: "/milestones",
            },
            params: {},
            async handler(request: any) {
                const data = await this.milestoneData(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // claim-reward
        claimRewardAPI: {
            rest: {
                method: "POST",
                path: "/claim-reward",
            },
            params: {},
            async handler(request: any) {
                console.log("request.meta ", request.meta);
                const returnObj = {
                    meta: this.settings.successResponse,
                    data: {
                        type: "",
                        pop_up_count: 0,
                        max_popup_count: 0,
                    },
                };
                const isDNREnabled = this.isDNREnabled(request);
                if (isDNREnabled) {
                    returnObj.data = await this.claimReward(request);
                }
                return returnObj;
            },
        },

        voucherTabsAPI: {
            rest: {
                method: "GET",
                path: "/voucher-tabs",
            },
            params: {},
            async handler(request: any) {
                console.log("request.meta ", request.meta);
                const data = await this.voucherTabs(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        vouchersAPI: {
            rest: {
                method: "POST",
                path: "/list-redeem-vouchers",
            },
            params: {},
            async handler(request: any) {
                console.log("request.meta ", request.meta);
                const data = await this.listRedeemVouchers(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        unlockedVouchersAPI: {
            rest: {
                method: "POST",
                path: "/list-unlocked-vouchers",
            },
            params: {},
            async handler(request: any) {
                console.log("request.meta ", request.meta);
                const data = await this.listUnlockedVouchers(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        voucherPageAPI: {
            rest: {
                method: "POST",
                path: "/voucher-page",
            },
            params: {},
            async handler(request: any) {
                console.log("request.meta ", request.meta);
                const data = await this.voucherPage(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        spinWheelPageAPI: {
            rest: {
                method: "GET",
                path: "/spin-wheel-page",
            },
            params: {},
            async handler(request: any) {
                console.log("request.meta ", request.meta);
                const data = await this.spinWheelPage(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },
        redeemVoucher: {
            rest: {
                method: "POST",
                path: "/redeem-voucher",
            },
            params: {},
            async handler(request: any) {
                console.log("request.meta ", request.meta);
                const data = await this.redeemVoucher(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        mysteryBoxPageAPI: {
            rest: {
                method: "GET",
                path: "/mystery-box",
            },
            params: {},
            async handler(request: any) {
                console.log("request.meta ", request.meta);
                const data = await this.mysteryBoxPage(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        getPendingRedemptionDetails: {
            rest: {
                method: "GET",
                path: "/get-pending-redemption-details",
            },
            params: {},
            async handler(request: any) {
                console.log("request.meta ", request.meta);
                const data = await this.getPendingRedemptionDetails(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        qwickCilver: {
            rest: {
                method: "GET",
                path: "/qwickcilver",
            },
            internal: true,
            params: {},
            async handler(request: any) {
                console.log("request.meta ", request.meta);
                const data = await this.qwickCilverTesting(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        reinstallReward: {
            rest: {
                method: "POST",
                path: "/rewarding-reinstall-student",
            },
            internal: true,
            params: {},
            async handler(request: any) {
                const data = await this.rewardingReinstallStudent(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },
        addMoneyToWallet:{
            rest:{
                method: "POST",
                path: "/adding-money-to-wallet",
            },
            // internal: true,
            params: {},
            async handler(request: any) {
                const data = await this.callAddMoneyToWalletMethod(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        deactivateMilestone: {
            rest: {
                method: "POST",
                path: "/update-milestone-status",
            },
            internal: true,
            params: {},
            async handler(request: any) {
                const data = await this.updateMilestoneStatus(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // claim-whatsapp-reward
        claimWhatsappRewardAPI: {
            rest: {
                method: "POST",
                path: "/claim-whatsapp-reward",
            },
            internal: true,
            params: {},
            async handler(ctx: any) {
                console.log("request.meta ", ctx.meta);
                const data = await this.claimWhatsappReward(ctx);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        remindStreak: {
            rest: {
                method: "PUT",
                path: "/remind-streak",
            },
            params: {},
            async handler(ctx: any) {
                const data = await this.streakReminder(ctx);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        homepageWidgetAPI: {
            rest: {
                method: "GET",
                path: "/homepage-widget",
            },
            internal: true,
            params: {},
            async handler(ctx: any) {
                const data = await this.homepageWidget(ctx);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        achievedActivities: {
            rest: {
                method: "POST",
                path: "/achieved-activities",
            },
            internal: true,
            params: {},
            async handler(ctx: any) {
                const data = await this.getAchievedActivities(ctx);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },
        dnrRewardForSuccessfulReferral:{
            rest:{
                method: "POST",
                path: "/referral-rewarding",
            },
            internal: true,
            params: {},
            async handler(request: any) {
                const data = await this.rewardingDnrForSuccessfulReferral(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },
    },
    /**
     * Methods
     */
    methods: {},

    events: {},

    /**
     * Service created lifecycle event handler
     */
    created() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    },

    /**
     * Service started lifecycle event handler
     */
    async started() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    },

    /**
     * Service stopped lifecycle event handler
     */
    async stopped() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    },
};

export = DnrService;
