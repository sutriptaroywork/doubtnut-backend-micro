import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import dnrData from "../data/dnr.data";
import {redisUtility} from "../../../common";
import MilestoneService from "./milestones";

const homeSchema: ServiceSchema = {
    name: "$homePage",
    mixins: [MilestoneService],
    methods: {

        getUpcomingTabStructure(newDate: any, dayNumber: number, currTime: any) {
            const tabStructure = dnrData.homePageWidgets.tabStructure;
            tabStructure.key = `day${dayNumber}`;
            tabStructure.title = newDate.format("D MMM");
            const dayDiff = this.daysDifference(newDate, currTime);
            tabStructure.icon_url = dnrData.homePageWidgets.rewardIcon;
            tabStructure.is_selected = false;

            if (dayDiff === 1) {
                tabStructure.icon_url = dnrData.homePageWidgets.upcomingRewardIcon;
                tabStructure.is_selected = true;
            }
            return tabStructure;
        },

        getTabStructure(newDate: any, dayNumber: number, currTime: any) {
            const tabStructure = dnrData.homePageWidgets.tabStructure;
            tabStructure.key = `day${dayNumber}`;
            tabStructure.title = newDate.format("D MMM");
            const dayDiff = this.daysDifference(newDate, currTime);
            if (dayDiff <= 0) {
                tabStructure.icon_url = dnrData.homePageWidgets.markedIcon;
            }

            if (dayDiff === 0) {
                tabStructure.title += "- Today";
                tabStructure.is_selected = true;
            } else {
                tabStructure.is_selected = false;
            }

            if (dayDiff === 1) {
                tabStructure.icon_url = dnrData.homePageWidgets.upcomingRewardIcon;
            }

            if (dayDiff > 1) {
                tabStructure.icon_url = dnrData.homePageWidgets.rewardIcon;
            }
            return tabStructure;
        },

        async getHomePageTabWidget(weekStartDate: any, isFirstDay: boolean) {
            try {
                // 7 day streak widget - shown on homepage
                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                const tabs = [];
                let newDate = moment(weekStartDate).add(1, "day");
                for (let dayNumber = 1; dayNumber < 7; dayNumber++) {
                    if (isFirstDay) {
                        tabs.push(JSON.parse(JSON.stringify(this.getUpcomingTabStructure(newDate, dayNumber, currTime))));
                    } else {
                        tabs.push(JSON.parse(JSON.stringify(this.getTabStructure(newDate, dayNumber, currTime))));
                    }
                    newDate = moment(newDate).add(1, "day");
                }
                return tabs;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async updateVoucherDeeplink(ctx: any) {

            const vouchers = ctx.meta.user.locale === "hi" ? dnrData.homePageWidgets.dayItems.hi : dnrData.homePageWidgets.dayItems.en;

            for (let i = 1; i < 7; i++) {
                const voucherData = vouchers[`day${i}`][0];
                if (!voucherData.widget_data.is_internal_voucher) {
                    const isVoucherAvailed = await redisUtility.getRedisKeyData.call(this, `DNR_STREAK_${voucherData.widget_data.product_code}:${ctx.meta.user.student_id}`);
                    if (!_.isNull(isVoucherAvailed)) {
                        voucherData.widget_data.deeplink = voucherData.widget_data.redeem_deeplink;
                        voucherData.widget_data.image_deeplink = voucherData.widget_data.redeem_deeplink;
                        vouchers[`day${i}`][0] = voucherData;
                    }
                }
            }
            return vouchers;
        },

        async createActiveRewardTabs(ctx: any, currTime: any, isFirstDay: boolean) {
            const weekData = await redisUtility.getHashField.call(this, ctx.meta.user.student_id, "DNR_WEEK_START");
            const weekStartDate = !_.isNull(weekData) ? moment(weekData.week_start_date).toDate() : currTime;
            const widget = dnrData.homePageWidgets.widget;
            widget.widget_data.link_text_url = process.env.NODE_ENV === "production" ? "https://micro.doubtnut.com/api/dnr/remind-streak" : "https://micro-test.doubtnut.com/api/dnr/remind-streak";
            widget.widget_data.title = ctx.meta.user.locale === "hi" ? dnrData.homePageWidgets.widgetTitle.hi : dnrData.homePageWidgets.widgetTitle.en;
            widget.widget_data.link_text = ctx.meta.user.locale === "hi" ? dnrData.homePageWidgets.reminderTitle.hi : dnrData.homePageWidgets.reminderTitle.en;
            widget.widget_data.items = await this.updateVoucherDeeplink(ctx);
            widget.widget_data.tabs = await this.getHomePageTabWidget(weekStartDate, isFirstDay);

            return widget;
        },

        async homepageWidget(ctx: any) {
            try {
                const isFlagrEnable = await this.getFlagr(ctx);

                if (!isFlagrEnable) {
                    return {
                        message: "flagr disabled",
                        is_widget_available: false,
                        widget: {},
                    };
                }
                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                let isWidgetExist = false;
                let message = "";

                const isFirstDay = (this.daysDifference(currTime, ctx.meta.user.timestamp) === 0);
                if (isFirstDay) {
                    return {
                        is_widget_available: true,
                        message: "reward is active",
                        widget: await this.createActiveRewardTabs(ctx, currTime, true),
                    };
                }

                const rewardStatus = await this.adapter.db.collection(this.settings.streakRewardStatusCollection).findOne({
                    student_id: ctx.meta.user.student_id,
                });
                this.logger.info("rewardStatus ", rewardStatus);

                if (_.isNull(rewardStatus)) {
                    return {
                        message: "reward entry not exist",
                        is_widget_available: isWidgetExist,
                        widget: {},
                    };
                }

                let widget;

                if (rewardStatus.is_reward_active) {
                    isWidgetExist = true;
                    message = "reward is active";
                    widget = await this.createActiveRewardTabs(ctx, currTime, false);
                } else {
                    const installTime = this.daysDifference(currTime, rewardStatus.install_time);

                    if (installTime === 7) {
                        isWidgetExist = true;
                        message = "last day of widget";
                        widget = dnrData.homePageWidgets.lastDayWidget.widget;
                        widget.widget_data.title_line_1 = ctx.meta.user.locale === "hi" ? dnrData.homePageWidgets.lastDayWidget.title.hi : dnrData.homePageWidgets.lastDayWidget.title.en;
                        widget.widget_data.cta = ctx.meta.user.locale === "hi" ? dnrData.homePageWidgets.lastDayWidget.cta.hi : dnrData.homePageWidgets.lastDayWidget.cta.en;
                    } else if (installTime > 7) {
                        message = "install time is greater than 7 days";
                    }
                }

                return {
                    is_widget_available: isWidgetExist,
                    message,
                    widget: isWidgetExist ? widget : {},
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = homeSchema;
