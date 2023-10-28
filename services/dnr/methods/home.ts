import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import dnrData from "../data/dnr.data";
import faqData from "../data/faq.data";
import {redisUtility} from "../../../common";
import MilestoneService from "./milestones";
import conditionalMilestoneService from "./conditional.milestones";

const homeSchema: ServiceSchema = {
    name: "$homePage",
    mixins: [MilestoneService, conditionalMilestoneService],
    methods: {

        getWeeklyStreakProgressWidget() {
            return {
                widget_type: "widget_dnr_streak",
                widget_data: {
                    day_number: "",
                    card_width: "5",
                    is_marked: false,
                    show_gift: false,
                    is_current_day: false,
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                    margin_left: 15,
                    margin_right: 0,
                },
            };
        },

        async getAttendanceWidget(weekStartDate: any, studentId: number, locale: string) {
            try {
                // 7 day streak widget - shown on dnr homepage
                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                const widgets = [];
                let newDate = moment(weekStartDate);
                for (let i = 0; i < 7; i++) {
                    const attendanceWidget = this.getWeeklyStreakProgressWidget();
                    attendanceWidget.widget_data.day_number = newDate.format("D MMM");
                    const dayDiff = this.daysDifference(newDate, currTime);
                    if (dayDiff <= 0) {
                        // mark tick for all attended previous days of the week
                        attendanceWidget.widget_data.is_marked = true;
                    }

                    if (dayDiff === 0) {
                        attendanceWidget.widget_data.is_current_day = true;
                    }
                    widgets.push(JSON.parse(JSON.stringify(attendanceWidget)));
                    newDate = moment(newDate).add(1, "days");
                }
                return {
                    widget_type: "widget_parent",
                    widget_data: {
                        title: locale === "hi" ? dnrData.weeklyStreakProgress.title.hi : dnrData.weeklyStreakProgress.title.en,
                        subtitle: locale === "hi" ? dnrData.weeklyStreakProgress.subtitle.hi : dnrData.weeklyStreakProgress.subtitle.en,
                        subtitle_text_color: "#7379F8",
                        is_title_bold: true,
                        link_text: locale === "hi" ? dnrData.viewHistory.hi : dnrData.viewHistory.en,
                        title_text_size: 20,
                        deeplink: dnrData.earnHistory.deeplink,
                        items: widgets,
                    },
                    layout_config: {
                        margin_top: 0,
                        margin_bottom: 0,
                        margin_left: 16,
                        margin_right: 16,
                    },
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async totalEarnedWidgetResponse(request: any) {
            try {
                // total earning widget for homepage
                const walletAmount = await this.getWalletAmount(request.meta.user.student_id);

                const earnedSummaryWidget = dnrData.home.totalEarnedSummary.widget;
                earnedSummaryWidget.widget_data.info_text = request.meta.user.locale === "hi" ? dnrData.home.totalEarnedSummary.info_text.hi : dnrData.home.totalEarnedSummary.info_text.en;
                earnedSummaryWidget.widget_data.subtitle = walletAmount + " DNR";
                earnedSummaryWidget.widget_data.title = this.createStudentName(request.meta.user.student_fname, request.meta.user.student_lname);
                earnedSummaryWidget.widget_data.tnc_text = request.meta.user.locale === "hi" ? dnrData.home.totalEarnedSummary.tnc_text.hi : dnrData.home.totalEarnedSummary.tnc_text.en;
                earnedSummaryWidget.widget_data.tnc_dialog_data = request.meta.user.locale === "hi" ? dnrData.home.totalEarnedSummary.tnc_dialog_data.hi : dnrData.home.totalEarnedSummary.tnc_dialog_data.en;

                if (walletAmount > 0) {
                    earnedSummaryWidget.widget_data.cta = request.meta.user.locale === "hi" ? "रिडीम" : "Redeem";
                    earnedSummaryWidget.widget_data.cta_deeplink = dnrData.vouchers.deeplink.replace("{tab_id}", String(1));
                }

                return earnedSummaryWidget;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        todayEarningWidget() {
            return {
                widget_type: "widget_dnr_earning_detail",
                widget_data: {
                    title: "",
                    title_color: "#431381",
                    subtitle: "{dnr} DNR",
                    subtitle_color: "#431381",
                    deeplink: "",
                    background_color: "#FFFDFD",
                    border_color: "#DEDEDE",
                    dnr_image: dnrData.dnrLogo,
                },
                layout_config: {
                    margin_top: 22,
                    margin_bottom: 0,
                    margin_left: 16,
                    margin_right: 16,
                },
            };
        },

        todayEarnedWidgetResponse(todayEarning: number, locale: string) {
            try {
                // today earning widget for homepage
                const earningWidget = this.todayEarningWidget();
                earningWidget.widget_data.title = locale === "hi" ? dnrData.home.todayEarning.title.hi : dnrData.home.todayEarning.title.en;
                earningWidget.widget_data.subtitle = (earningWidget.widget_data.subtitle).replace("{dnr}", String(todayEarning));

                return earningWidget;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getMilestoneWidget(ctx, milestones: any, locale: string, limit: number) {
            try {
                // milestone widget for homepage (Only 3 milestones are being shown)
                let milestoneContainer = null;
                const milestoneWidget = dnrData.milestoneScreen.milestoneWidget;

                // Create widget response of all milestones
                const allMilestones = milestones.map(item => {
                    milestoneWidget.widget_data.dnr = item.prize_dnr;
                    milestoneWidget.widget_data.title = (locale === "hi" ? item.content.hi : item.content.en).description;
                    milestoneWidget.widget_data.rank = item.rank;
                    milestoneWidget.widget_data.milestone_type = item.type;
                    if (item.type === "whatsapp_video_view") {
                        item.deeplink = locale === "hi" ? dnrData.whatsappDeeplink.hi : dnrData.whatsappDeeplink.en;
                    }
                    milestoneWidget.widget_data.deeplink = item.deeplink;
                    milestoneWidget.widget_data.is_conditional_milestone = item.is_conditional_milestone ? item.is_conditional_milestone : false;
                    return JSON.parse(JSON.stringify(milestoneWidget));
                });

                const shownMilestones = await this.getConditionalMilestone(ctx, allMilestones);

                if (shownMilestones.length) {
                    milestoneContainer = {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: locale === "hi" ? "डाउटनट रूपया कमाएं" : "Earn Doubtnut Rupya",
                            link_text: locale === "hi" ? dnrData.viewAll.hi : dnrData.viewAll.en,
                            scroll_direction: "vertical",
                            remove_padding: true,
                            title_text_size: 20,
                            is_title_bold: true,
                            deeplink: dnrData.milestoneScreen.deeplink,
                            items: shownMilestones.slice(0, limit),
                        },
                        layout_config: dnrData.layout_config,
                    };
                }

                return milestoneContainer;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getHomeMilestoneData(currTime, request) {
            try {
                const weekData = await redisUtility.getHashField.call(this, request.meta.user.student_id, "DNR_WEEK_START");
                const weekStartDate = !_.isNull(weekData) ? moment(weekData.week_start_date).toDate() : currTime;

                const {
                    milestones,
                    transaction_history: transactionHistory,
                } = await this.getMilestonesAndTransactionsData({
                    activeDates: [currTime, weekStartDate],
                    studentId: request.meta.user.student_id,
                    locale: request.meta.user.locale,
                    versionCode: parseInt(request.meta.versionCode, 10),
                    source: "milestone_page",
                });

                const {
                    todayEarnings,
                    achievedMilestones,
                } = await this.earnedSummary(request.meta.user.student_id, transactionHistory, request.meta.user.locale, currTime);

                return {
                    weekStartDate, milestones, transactionHistory, todayEarnings, achievedMilestones,
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async home(request: any) {
            try {
                const locale = request.meta.user.locale;
                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                const widgets = [];
                const pageTitle = locale === "hi" ? dnrData.home.title.hi : dnrData.home.title.en;
                // for page title
                const toolbarData = this.getToolbarData(pageTitle, null);
                const {
                    weekStartDate, milestones, todayEarnings, achievedMilestones,
                } = await this.getHomeMilestoneData(currTime, request);

                const todayEarningWidget = this.todayEarnedWidgetResponse(todayEarnings, locale);
                // adding today earning widget
                widgets.unshift(todayEarningWidget);
                widgets.unshift(achievedMilestones);

                let milestoneLimit = 3;
                if (!_.isNull(achievedMilestones)) {
                    milestoneLimit = 1;
                }

                // create all milestone structure
                const shownMilestones = await this.getMilestoneWidget(request, milestones, locale, milestoneLimit);
                widgets.push(shownMilestones);

                widgets.unshift(dnrData.home.videoWidget);

                const earnedSummaryWidget = await this.totalEarnedWidgetResponse(request);
                widgets.unshift(earnedSummaryWidget);

                const vouchers = await this.getVouchersWidget(request, currTime, 0, 3);
                widgets.push(vouchers);

                const attendance = await this.getAttendanceWidget(weekStartDate, request.meta.user.student_id, locale);
                widgets.push(attendance);


                return {
                    toolbar_data: toolbarData,
                    widgets: widgets.filter(item => item != null),
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async faq(request) {
            try {
                const pageTitle = request.params.locale === "hi" ? faqData.faq.title.hi : faqData.faq.title.en;
                const toolbarData = this.getToolbarData(pageTitle, null);

                const widget = faqData.faq.widget;
                const faqList = request.params.locale === "hi" ? faqData.faq.faqList.hi : faqData.faq.faqList.en;
                const faqResponse = [];
                for (let i = 0; i < faqList.length; i++) {
                    widget.id = i + 1;
                    widget.priority = i + 1;
                    widget.question = faqList[i].question;
                    widget.answer = faqList[i].answer;
                    // if (faqList[i].type === "video") {
                    //     widget.question_id = faqList[i].question_id;
                    //     widget.thumbnail = faqList[i].thumbnail;
                    //     widget.video_resources = faqList[i].video_resources;
                    //     widget.video_icon_url = faqData.faq.videoIconUrl;
                    // }
                    faqResponse.push(JSON.parse(JSON.stringify(widget)));
                }

                const faq = {
                    widget_type: "faq",
                    widget_data: {
                        faq_list: faqResponse,
                    },
                };

                // const banner = faqData.faq.banner_widget;
                return {
                    toolbar_data: toolbarData,
                    // widgets: [banner, faq],
                    widgets: [faq],
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = homeSchema;
