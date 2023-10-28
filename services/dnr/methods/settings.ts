import http from "http";
import https from "https";
import {ServiceSchema} from "dn-moleculer";
import {ObjectId} from "mongodb";
import moment from "moment";
import axios from "axios";
import _ from "lodash";
import {redisUtility, staticCDN} from "../../../common";
import dnrData from "../data/dnr.data";

const SettingsService: ServiceSchema = {
    name: "$settings",
    settings: {
        rest: "/dnr",
        CDN_URL: staticCDN,
        dailyRedisTTL: 60 * 60 * 24, // 24 hours
        weeklyRedisTTL: 60 * 60 * 24 * 7, // 7 days
        monthlyRedisTTL: 60 * 60 * 24 * 30, // 30 days
        minuteRedisTTL: 60, // 1 minute
        halfAnHourRedisTTL: 60 * 30, // 30 minutes
        voucherRedemptionPerDay: 3,
        pageSize: 10,
        gyfterBuyerId: process.env.NODE_ENV === "production" ? "C10C90F4-3152-47A0-9E36-5EFA1258E9D5" : "3627544B-ED62-4483-A6EE-8C7BBA987308",
        gyfterPassword: process.env.NODE_ENV === "production" ? "5iaNqgDy5TVXDFwLp+TvJQ==" : "7757FE887C5",
        gyftrBaseURL: process.env.NODE_ENV === "production" ? "https://catalog.vouchagram.com/EPService.svc" : "https://catalog.vouchagram.net/EPService.svc",
        gyftrRedeemURL: "/PullVoucher",
        gyftrQuantityURL: "/VoucherQuantity",
        qwickCilver: {
            BaseURL: process.env.QWICKCILVER_BASE_URL,
            Username: process.env.QWICKCILVER_USER_NAME,
            Password: process.env.QWICKCILVER_USER_PASSWORD,
            ConsumerKey: process.env.QWICKCILVER_CONSUMER_KEY,
            ConsumerSecret: process.env.QWICKCILVER_CONSUMER_SECRET,
            timeout: process.env.NODE_ENV === "production" ? 40000 : 10000,
            OAuthVerifyURL: "/oauth2/verify",
            OAuthTokenURL: "/oauth2/token",
            createOrdersPath: "/rest/v3/orders",
            activatedCardsPath: "/rest/v3/order/{id}/cards",
            orderStatusPath: "/rest/v3/order/{refno}/status",
            productPath: "/rest/v3/catalog/products/",
            categoryPath: "/rest/v3/catalog/categories/121",
            productListPath: "/rest/v3/catalog/categories/121/products?offset=0&limit=100",
        },
        orderDeliveryAddress: {
            firstname: "Doubtnut",
            telephone: "+918699616342",
            country: "IN",
            postcode: "122009",
            billToThis: true,
        },
        walletCollection: "dnr_wallet",
        rewardTypeAndAmountMapping: {
            reinstall_after_120_days: { amount: 300, max_amount: null, is_notification: false, notification_content: null },
            bnb_course_page_visit: { amount: 50, max_amount: 2000, is_notification: true, notification_content: dnrData.coursePageVisitNotif },
            referral_reward: { amount: 300, max_amount: null, is_notification: false, notification_content: null },
            referral_reward_every_5_referrals: { amount: 1500, max_amount: null, is_notification: false, notification_content: null },
        },
        transactionCollection: "dnr_student_transactions",
        milestoneCollection: "dnr_milestones",
        studentMilestoneCollection: "dnr_student_milestones",
        voucherCollection: "dnr_vouchers",
        reinstallStudentRewardCollection: "reinstall_rewarded_students", // students who are rewarded for reinstalling the app
        streakRewardStatusCollection: "dnr_streak_reward_status",
        appOpenRewardCollection: "dnr_app_open_reward",
        redeemVoucherCollection: "dnr_redeem_voucher",
        appOpenCollection: "app_open",
        spinWheelCollection: "dnr_spin_wheel_vouchers",
        mysteryBoxCollection: "dnr_mystery_box_vouchers",
        blockCollection: "dnr_redemption_blocked",
        testRedemptionsCollection: "dnr_test_redemptions",
        streakReminderCollection: "dnr_streak_reminder",
        message: "Success",
        capitalize: s => {
            if (typeof s !== "string") {
                return "";
            }
            return s.charAt(0).toUpperCase() + s.slice(1);
        },
        successResponse: {
            code: 200,
            success: true,
            message: "SUCCESS",
        },
        AxiosInstance: axios.create({
            httpAgent: new http.Agent({keepAlive: true, maxSockets: 250}),
            httpsAgent: new https.Agent({keepAlive: true, maxSockets: 250}),
        }),
        stakeHolders: [8699616342],
        testingStudentIds: [81692214, 138668782],
    },
    methods: {

        getObjectIdFromDate(date) {
            date = moment(date).toDate();
            return new ObjectId(Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000");
        },

        async getAchievedDNR(studentId: number, milestoneId: any) {
            // to implement daily reward limit
            const achievementList = await this.adapter.db.collection(this.settings.transactionCollection)
                .find({
                    student_id: studentId,
                    milestone_id: new ObjectId(milestoneId),
                    _id: {
                        $gte: this.getObjectIdFromDate(this.getDayStartOfTime()),
                        $lte: this.getObjectIdFromDate(this.getDayEndOfTime()),
                    },
                }).toArray();
            return achievementList.map(item => item.dnr).reduce((prev, next) => prev + next, 0);
        },

        async getMonthlyAchievedDNR(studentId: number, milestoneId: any) {
            // to implement monthly reward limit
            const achievementList = await this.adapter.db.collection(this.settings.transactionCollection)
                .find({
                    student_id: studentId,
                    milestone_id: new ObjectId(milestoneId),
                    _id: {
                        $gte: this.getObjectIdFromDate(this.getMonthStartOfTime()),
                        $lte: this.getObjectIdFromDate(this.getDayEndOfTime()),
                    },
                }).toArray();
            return achievementList.map(item => item.dnr).reduce((prev, next) => prev + next, 0);
        },

        daysDifference(date1: any, date2: any) {
            // calculate day difference between two dates
            date1 = moment(date1);
            date2 = moment(date2);
            return moment(`${date1.format("DD-MM-YYYY")}`, "DD-MM-YYYY").diff(moment(`${date2.format("DD-MM-YYYY")}`, "DD-MM-YYYY"), "days");
        },

        createStudentName(studentFname: any, studentLname: any) {
            try {
                let name = `${this.settings.capitalize(studentFname)} ${this.settings.capitalize(studentLname)}`;
                name = name.replace(/^\s+|\s+$|\s+(?=\s)/g, "").trim();
                return unescape(name) || "Doubtnut User";
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getTodayEndTime() {
            const dateIST = new Date();
            dateIST.setHours(dateIST.getHours() + 5);
            dateIST.setMinutes(dateIST.getMinutes() + 30);
            const todayEnd = new Date().setHours(23, 59, 59, 999);
            return parseInt(String((todayEnd - dateIST.getTime()) / 1000), 10);
        },

        sendAlertMessage(APIName, exception) {
            const message = `Dear user, Error occurred in doubtnut studygroup - (dnr) ${APIName}, Exception: ${exception}`;
            if (process.env.NODE_ENV === "production") {
                for (const mobile of this.settings.stakeHolders) {
                    this.broker.emit("sendSms", {mobile, message}, "studygroup");
                }
            }
            return true;
        },

        getDayStartOfTime(existingDate?) {
            let time = moment();
            if (existingDate) {
                time = moment(existingDate);
            }
            return time.add(5, "hours").add(30, "minutes").format("YYYY-MM-DDT00:00:00Z");
        },

        getDayEndOfTime(existingDate) {
            let time = moment();
            if (existingDate) {
                time = moment(existingDate);
            }
            return time.add(5, "hours").add(30, "minutes").format("YYYY-MM-DDT23:59:59Z");
        },

        getMonthStartOfTime(existingDate?) {
            let time = moment();
            if (existingDate) {
                time = moment(existingDate);
            }
            return time.add(5, "hours").add(30, "minutes").subtract(30, "days").format("YYYY-MM-DDT00:00:00Z");
        },

        async checkRedisLockStatus(redisKey: string, ttl: number) {
            // redis lock - This is done to ensure cron doesn't run multiple times (It is happening because of multiple pods)
            const isCronLocked = await redisUtility.setNonExistKeyData.call(this, redisKey, true, ttl);
            return !isCronLocked.length || isCronLocked[0].length !== 2 || isCronLocked[0][1] === 0;
        },

        async getFlagr(ctx: any) {
            try {
                const flagrResponse = await this.broker.call("$app-config.get-flagr", {
                    capabilities: { streak_dnr_widget: {} },
                    entityId: `${ctx.meta.user.student_id}`,
                });
                return !!(flagrResponse && flagrResponse.streak_dnr_widget && flagrResponse.streak_dnr_widget.enabled && flagrResponse.streak_dnr_widget.payload.enabled);
            } catch (e) {
                console.error(e);
                return false;
            }
        },

        isVoucherOfAmazon(company) {
            return _.includes(["Amazon Pay", "Amazon"], company);
        },

        getCouponCode(couponCode, voucherPin, company, vendor) {

            if (vendor === "qwickcilver") {
                // swapping values
                ([couponCode, voucherPin] = [voucherPin, couponCode]);
            }

            if (!voucherPin || this.isVoucherOfAmazon(company)) {
                return couponCode;
            }

            if (!couponCode ) {
                return voucherPin;
            }
            return `${couponCode} - ${voucherPin}`;
        },

        // checking if DNR is active for the user id
        isDNREnabled(ctx: any) {
            try {
                const studentId = ctx.meta.user.student_id;
                return ((studentId < dnrData.dnrExpStartingSid || (studentId >= dnrData.dnrExpStartingSid && studentId % 2 !== 0)) && (ctx.meta.packageName !== "com.doubtnut.android.buniyad"));
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = SettingsService;
