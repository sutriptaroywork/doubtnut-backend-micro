import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import dnrData from "../data/dnr.data";
import WalletService from "./wallet";
import VoucherService from "./vouchers";
import conditionalMilestoneService from "./conditional.milestones";

const milestoneSchema: ServiceSchema = {
    name: "$milestonePage",
    mixins: [WalletService, VoucherService, conditionalMilestoneService],
    methods: {

        getMilestoneData(versionCode: number, milestoneType: string) {
            try {
                return this.adapter.db.collection(this.settings.milestoneCollection).findOne({
                    is_active: true,
                    min_version: {$lte: versionCode},
                    max_version: {$gte: versionCode},
                    type: milestoneType,
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async earnedCombinedSummaryWidgetResponse(studentId: number, todayEarnings: number, locale: string) {
            try {
                // widget response for total earnings and today earnings shown on milestone page
                const walletAmount = await this.getWalletAmount(studentId);

                const earnedSummaryWidget = dnrData.milestoneScreen.earnedSummary.widget;
                earnedSummaryWidget.widget_data.today_dnr_data.title = locale === "hi" ? dnrData.milestoneScreen.earnedSummary.today_title.hi : dnrData.milestoneScreen.earnedSummary.today_title.en;
                earnedSummaryWidget.widget_data.today_dnr_data.dnr = todayEarnings;
                earnedSummaryWidget.widget_data.total_dnr_data.title = locale === "hi" ? dnrData.milestoneScreen.earnedSummary.total_title.hi : dnrData.milestoneScreen.earnedSummary.total_title.en;
                earnedSummaryWidget.widget_data.total_dnr_data.dnr = walletAmount;

                return earnedSummaryWidget;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async earnedSummary(studentId: number, transactionHistory: any, locale: string, currTime: object) {
            try {
                const dayTransactions = _.filter(transactionHistory, item => this.daysDifference(item.created_at, currTime) === 0);

                let todayEarnings = 0;
                let achievedMilestones = null;
                if (dayTransactions.length && dayTransactions[0].completed_milestones.length) {
                    todayEarnings = dayTransactions[0].total_dnr;
                    achievedMilestones = {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: locale === "hi" ? dnrData.milestoneScreen.achievedMilestoneHeading.hi : dnrData.milestoneScreen.achievedMilestoneHeading.en,
                            is_title_bold: true,
                            items: dayTransactions[0].completed_milestones,
                        },
                        layout_config: dnrData.layout_config,
                    };
                }

                return {todayEarnings, achievedMilestones};
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async generateWeekMilestones(transactionHistory: any, weekStartDate: object, locale: string) {
            try {
                // completed milestones in that particular week from transaction history
                const earnedRupyaHistoryWidget = dnrData.milestoneScreen.earnedRupyaHistoryWidget;

                const weekTransactions = transactionHistory.map(item => {
                    earnedRupyaHistoryWidget.widget_data.title = item.title;
                    earnedRupyaHistoryWidget.widget_data.subtitle = locale === "hi" ? "कमाए" : "Earned";
                    earnedRupyaHistoryWidget.widget_data.dnr = item.total_dnr;
                    earnedRupyaHistoryWidget.widget_data.created_at = item.created_at;
                    if (item.total_dnr === 0) {
                        earnedRupyaHistoryWidget.widget_data.subtitle = locale === "hi" ? "कोई गतिविधि नहीं" : "No Activity";
                        earnedRupyaHistoryWidget.widget_data.subtitle_color = "#ff0000";
                    }
                    return JSON.parse(JSON.stringify(earnedRupyaHistoryWidget));
                });
                const startDate = moment(weekStartDate).add(5, "hours").add(30, "minutes").format("D MMM");
                const endDate = moment(weekStartDate).add(5, "hours").add(30, "minutes").add(6, "days").format("D MMM");

                return {
                    widget_type: "widget_parent",
                    widget_data: {
                        title: locale === "hi" ? dnrData.milestoneScreen.earnHistory.title.hi : dnrData.milestoneScreen.earnHistory.title.en,
                        subtitle: (locale === "hi" ? dnrData.milestoneScreen.earnHistory.subtitle.hi : dnrData.milestoneScreen.earnHistory.subtitle.en) + `${startDate} - ${endDate}`,
                        subtitle_text_color: "#7379F8",
                        title_text_size: 20,
                        is_title_bold: true,
                        link_text: locale === "hi" ? dnrData.viewAll.hi : dnrData.viewAll.en,
                        deeplink: dnrData.earnHistory.deeplink,
                        items: weekTransactions,
                    },
                    layout_config: dnrData.layout_config,
                };


            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async milestoneData(request: any) {
            try {
                let widgets = [];
                const locale = request.meta.user.locale;
                const studentId = request.meta.user.student_id;
                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();

                const pageTitle = locale === "hi" ? dnrData.milestoneScreen.title.hi : dnrData.milestoneScreen.title.en;
                const toolbarData = this.getToolbarData(pageTitle, null);

                const {
                    weekStartDate, milestones, transactionHistory, todayEarnings, achievedMilestones,
                } = await this.getHomeMilestoneData(currTime, request);

                // create all milestone structure
                const milestoneWidget = dnrData.milestoneScreen.milestoneWidget;

                // Create widget response of all milestones
                let allMilestones = milestones.map(item => {
                    milestoneWidget.widget_data.title = (locale === "hi" ? item.content.hi : item.content.en).description;
                    milestoneWidget.widget_data.dnr = item.prize_dnr;
                    milestoneWidget.widget_data.is_conditional_milestone = item.is_conditional_milestone ? item.is_conditional_milestone : false;
                    milestoneWidget.widget_data.milestone_type = item.type;
                    milestoneWidget.widget_data.rank = item.rank;
                    if (item.type === "whatsapp_video_view") {
                        item.deeplink = locale === "hi" ? dnrData.whatsappDeeplink.hi : dnrData.whatsappDeeplink.en;
                    }
                    milestoneWidget.widget_data.deeplink = item.deeplink;
                    return JSON.parse(JSON.stringify(milestoneWidget));
                });
                allMilestones =  await this.getConditionalMilestone(request, allMilestones);

                widgets = widgets.concat(allMilestones);
                widgets = widgets.concat(achievedMilestones);

                const earnedSummaryWidget = await this.earnedCombinedSummaryWidgetResponse(studentId, todayEarnings, locale);
                widgets.unshift(earnedSummaryWidget);

                const weekTransactions = await this.generateWeekMilestones(transactionHistory, weekStartDate, locale);
                // completed milestone for that week
                widgets = widgets.concat(weekTransactions);

                const vouchers = await this.getVouchersWidget(request, currTime, 0, 3);
                // redeem vouchers
                widgets = widgets.concat(vouchers);

                return {
                    toolbar_data: toolbarData,
                    widgets: widgets.filter(item => item != null),
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = milestoneSchema;
