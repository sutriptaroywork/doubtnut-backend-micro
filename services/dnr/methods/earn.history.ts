/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import dnrData from "../data/dnr.data";
import AppOpenService from "./app.open";

const EarnHistorySchema: ServiceSchema = {
    name: "$earnHistory",
    mixins: [AppOpenService],
    methods: {

        getCompletedMilestoneWidget(data: any, locale: string) {
            const subtitle = {
                en: `Earned ${data.dnr} DNR today`,
                hi: `आज कमाए ${data.dnr}  DNR`,
            };
            return {
                widget_type: "widget_dnr_today_reward",
                widget_data: {
                    is_title_bold: true,
                    card_width: "2.5x",
                    serial_number: data.serial,
                    serial_number_color: data.color_code_dark,
                    serial_number_background_color: data.color_code_light,
                    title: data.title,
                    title_color: data.color_code_dark,
                    subtitle: locale === "hi" ? subtitle.hi : subtitle.en,
                    subtitle_color: "#ffffff",
                    subtitle_background_color: data.color_code_dark,
                    dnr_image: dnrData.dnrLogo,
                    deeplink: "doubtnutapp://dnr/widgets?screen=earned_history",
                    background_image: "#ffffff",
                    border_color: "#808080",
                    dnr: data.dnr,
                },
            };
        },

        structureCompletedMilestone(milestones: any, transactions: any, locale: string, source: string) {
            try {
                let serialCount = 0;
                let isNewWeek = false;
                let completedMilestones = _.chain(transactions)
                    .groupBy("milestone_id").map((value, key) => {
                        // group base on all the similar milestones completed on a particular day
                        const milestoneData = milestones.filter(ele => ele._id.toString() === key);

                        let title = null;
                        let colorCodeDark = null;
                        let colorCodeLight = null;
                        if (milestoneData.length) {
                            title = locale === "hi" ? milestoneData[0].content.hi : milestoneData[0].content.en;
                            title = source === "milestone_page" ? title.complete_title : `${title.earn_history_title} - ${value.length}`;
                            colorCodeDark = milestoneData[0].color_code_dark;
                            colorCodeLight = milestoneData[0].color_code_light;
                            serialCount++;
                        }
                        // total DNR earned for the specific milestone_id
                        const dnr = value.map(item => item.dnr).reduce((prev, next) => prev + next, 0);

                        let transactionWidget = dnrData.earnHistory.transactionWidget;
                        transactionWidget.widget_data.title = title;
                        transactionWidget.widget_data.dnr = dnr;
                        if (dnr === 0) {
                            // To check if the current day is new week or not - (dnr = 0 for only attendance entry)
                            isNewWeek = value ? value[0].is_new_week : false;
                        }
                        if (source === "milestone_page") {
                            const data = {
                                serial: serialCount,
                                color_code_dark: colorCodeDark,
                                color_code_light: colorCodeLight,
                                dnr,
                                title,
                            };
                            transactionWidget = this.getCompletedMilestoneWidget(data, locale);
                        }

                        return JSON.parse(JSON.stringify(transactionWidget));
                    }).value();
                // removing attendance widget
                completedMilestones = completedMilestones.filter(item => item.widget_data.dnr !== 0);
                const totalDNR = completedMilestones.map(item => item.widget_data.dnr).reduce((prev, next) => prev + next, 0);

                return {
                    completed_milestones: completedMilestones,
                    total_dnr: totalDNR,
                    is_new_week: isNewWeek,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async earnHistoryTransactionsResponse(milestones: any, transactions: any, selectedDate: any, locale: string, source: string) {
            try {
                // if app opened but no activity performed
                if (transactions.length === 1 && transactions[0].milestone_id === null) {
                    const appOpenTransaction = dnrData.earnHistory.noActivityWidget;
                    appOpenTransaction.widget_data.subtitle = locale === "hi" ? dnrData.earnHistory.appOpenTransaction.subtitle.hi : dnrData.earnHistory.appOpenTransaction.subtitle.en;
                    appOpenTransaction.widget_data.earned_title = locale === "hi" ? dnrData.earned_title.hi : dnrData.earned_title.en;
                    appOpenTransaction.widget_data.title = selectedDate.format("D MMM");
                    appOpenTransaction.widget_data.created_at = selectedDate.format("YYYY-MM-DD");
                    appOpenTransaction.widget_data.is_new_week = transactions[0].is_new_week;
                    return appOpenTransaction;
                }
                const milestoneData = this.structureCompletedMilestone(milestones, transactions, locale, source);

                let totalContainer = null;
                if (milestoneData.total_dnr !== 0) {
                    totalContainer = dnrData.earnHistory.totalContainer.widget;
                    totalContainer.title = locale === "hi" ? dnrData.earnHistory.totalContainer.title.hi : dnrData.earnHistory.totalContainer.title.en;
                    totalContainer.dnr = milestoneData.total_dnr;
                }

                return {
                    widget_type: "widget_dnr_earned_history",
                    widget_data: {
                        title: selectedDate.format("D MMM"),
                        completed_milestones: milestoneData.completed_milestones,
                        is_new_week: milestoneData.is_new_week,
                        total_container: totalContainer,
                        created_at: selectedDate.format("YYYY-MM-DD"),
                    },
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getDateTransactionsResponse(milestones: any, transactions: any, selectedDate: any, locale: string, source: string) {
            try {
                // if app opened but no activity performed
                if (transactions.length === 1 && transactions[0].milestone_id === null) {
                    return {
                        title: selectedDate.format("D MMM"),
                        completed_milestones: [],
                        total_dnr: 0,
                        created_at: selectedDate.format("YYYY-MM-DD"),
                    };
                }
                const milestoneData = this.structureCompletedMilestone(milestones, transactions, locale, source);
                return {
                    title: selectedDate.format("D MMM"),
                    ...milestoneData,
                    created_at: selectedDate.format("YYYY-MM-DD"),
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getCompletedMilestones(data: any) {
            try {
                // getting all milestone data
                const transactionHistory = [];
                for (let i = 0; i < data.activeDates.length; i++) {
                    const selectedDate = moment(data.activeDates[i]);
                    if (i > 0 && this.daysDifference(data.activeDates[i - 1], selectedDate) === 0) {
                        continue;
                    }
                    // to get all the transactions of a particular day
                    const dayTransactions = _.filter(data.transactions, item => this.daysDifference(item.created_at, selectedDate) === 0);

                    // creating response of all the completed milestones
                    let completedMilestones;
                    if (data.source === "earn_history") {
                        completedMilestones = await this.earnHistoryTransactionsResponse(data.milestones, dayTransactions, selectedDate, data.locale, data.source);
                    } else {
                        completedMilestones = await this.getDateTransactionsResponse(data.milestones, dayTransactions, selectedDate, data.locale, data.source);
                    }
                    transactionHistory.push(JSON.parse(JSON.stringify(completedMilestones)));
                }

                return transactionHistory;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getMilestonesAndTransactionsData(data: any) {
            try {
                const promises = [];
                promises.push(this.adapter.db.collection(this.settings.milestoneCollection).find({
                    is_active: true,
                    min_version: {$lte: data.versionCode},
                    max_version: {$gte: data.versionCode},
                }).toArray());
                let transactions;
                let milestones;
                if (data.activeDates.length) {
                    // When date range is provided, response will be calculated on its basis
                    const startDate = this.getDayStartOfTime(moment(data.activeDates[data.activeDates.length - 1]).subtract(5, "hours").subtract(30, "minutes"));
                    const endDate = this.getDayEndOfTime(moment(data.activeDates[0]).subtract(5, "hours").subtract(30, "minutes"));

                    // getting transactions between a date range
                    promises.push(this.adapter.db.collection(this.settings.transactionCollection).find({
                        _id: {$gte: this.getObjectIdFromDate(startDate), $lte: this.getObjectIdFromDate(endDate)},
                        student_id: data.studentId,
                        type: 0,
                        voucher_id: null,
                        ref: {$ne: "refund"},
                    }).toArray());

                    const promise = await Promise.all(promises);
                    milestones = promise[0];
                    transactions = promise[1];
                } else {
                    // When date range is not provided, response will be calculated on the basis of recentObjectId
                    promises.push(this.adapter.db.collection(this.settings.transactionCollection)
                        .find({
                            _id: {$lte: data.recentObjectId},
                            student_id: data.studentId,
                            type: 0,
                            voucher_id: null,
                            ref: {$ne: "refund"},
                        }).sort({_id: -1}).limit(100).toArray());

                    const promise = await Promise.all(promises);
                    milestones = promise[0];
                    transactions = promise[1];

                    // getting all unique dates in a list
                    data.activeDates = _.uniq(_.map(transactions, item => moment(this.getDayStartOfTime(moment(item.created_at).subtract(5, "hours").subtract(30, "minutes"))).format("YYYY-MM-DD")));
                }
                const transactionHistory = await this.getCompletedMilestones({
                    milestones,
                    transactions,
                    activeDates: data.activeDates,
                    locale: data.locale,
                    source: data.source,
                });
                return {
                    milestones,
                    transaction_history: transactionHistory,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getNotOpenedResponse(previousDate: any, dayDiff: number, locale: string) {
            try {
                let appNotOpenTransaction;
                if (dayDiff === 2) {
                    // response structure when day diff is for 2 day
                    const notOpenedDate = moment(previousDate).subtract(1, "days");
                    appNotOpenTransaction = dnrData.earnHistory.noActivityWidget;
                    appNotOpenTransaction.widget_data.title = notOpenedDate.format("D MMM");
                    appNotOpenTransaction.widget_data.subtitle = locale === "hi" ? dnrData.earnHistory.appNotOpenTransaction.subtitle.hi : dnrData.earnHistory.appNotOpenTransaction.subtitle.en;
                    appNotOpenTransaction.widget_data.description = locale === "hi" ? dnrData.earnHistory.appNotOpenTransaction.description.hi : dnrData.earnHistory.appNotOpenTransaction.description.en;
                    appNotOpenTransaction.widget_data.created_at = notOpenedDate.format("YYYY-MM-DD");

                } else {
                    // response structure when day diff is for more than 2 day
                    const notOpenedStartDate = moment(previousDate).subtract(dayDiff - 1, "days");
                    const notOpenedEndDate = moment(previousDate).subtract(1, "days");

                    appNotOpenTransaction = dnrData.earnHistory.noActivityWidget;
                    appNotOpenTransaction.widget_data.title = `${notOpenedStartDate.format("D MMM")} - ${notOpenedEndDate.format("D MMM")}`;
                    const subtitle = locale === "hi" ? dnrData.earnHistory.appNotOpenMultipleTransaction.subtitle.hi : dnrData.earnHistory.appNotOpenMultipleTransaction.subtitle.en;
                    appNotOpenTransaction.widget_data.subtitle = subtitle.replace("{days}", String(dayDiff - 1));
                    appNotOpenTransaction.widget_data.description = locale === "hi" ? dnrData.earnHistory.appNotOpenMultipleTransaction.description.hi : dnrData.earnHistory.appNotOpenMultipleTransaction.description.en;
                    appNotOpenTransaction.widget_data.created_at = notOpenedEndDate.format("YYYY-MM-DD");
                }
                appNotOpenTransaction.widget_data.earned_title = locale === "hi" ? dnrData.earned_title.hi : dnrData.earned_title.en;

                return [appNotOpenTransaction];
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getTitleWidget(locale: string, heading: string, subtitle: any) {
            try {
                const weekTitleWidget = {
                    en: {
                        widget_type: "widget_dnr_text_widget",
                        widget_data: {
                            title: `Week : ${heading}`,
                            title_color: "#7379f8",
                            subtitle, // Won - 100 DNR
                            subtitle_color: "#2f2f2f",
                        },
                    },
                    hi: {
                        widget_type: "widget_dnr_text_widget",
                        widget_data: {
                            title: `सप्ताह : ${heading}`,
                            title_color: "#7379f8",
                            subtitle, // Won - 100 DNR
                            subtitle_color: "#2f2f2f",
                        },
                    },
                };
                return locale === "hi" ? weekTitleWidget.hi : weekTitleWidget.en;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        pushWeekResponse(transactions: any, weekTransactions: any, locale: string) {
            try {
                // creating week wise widgets for earn history page
                let weekEnd = "";
                if (weekTransactions.length === 0) {
                    weekEnd = ` - ${moment(transactions[transactions.length - 1].widget_data.created_at).add(6, "days").format("D MMM")}`;
                } else {
                    weekEnd = transactions.length > 1 ? ` - ${transactions[0].widget_data.title}` : "";
                }
                const titleWidgetHeading = `${transactions[transactions.length - 1].widget_data.title + weekEnd}`;
                const titleWidget = this.getTitleWidget(locale, titleWidgetHeading, null);
                transactions.unshift(JSON.parse(JSON.stringify(titleWidget)));
                weekTransactions = weekTransactions.concat(JSON.parse(JSON.stringify(transactions)));
                return weekTransactions;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getLastAppOpenData(studentId: number, recentObjectId: object, limit: number) {
            try {
                return this.adapter.db.collection(this.settings.appOpenCollection)
                    .find({student_id: studentId, _id: {$lte: recentObjectId}})
                    .sort({_id: -1})
                    .limit(limit)
                    .toArray();

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async earnHistory(request: any) {
            try {
                const pageSize = 21;
                const studentId = request.meta.user.student_id;
                const locale = request.meta.user.locale;

                const pageTitle = locale === "hi" ? "अर्जित इतिहास" : "Earned History";
                const toolbarData = this.getToolbarData(pageTitle, null);

                // if last_entry is not provided, will consider present time as last entry
                let lastEntry = moment().add(5, "hours").add(30, "minutes");
                if (request.params.last_entry) {
                    lastEntry = moment(request.params.last_entry);
                }
                this.logger.info("last_entry ", lastEntry);
                // last entry is in present ist time but timestamp is still utc
                // passing lastEntry - 5:30 to make it utc for making _id
                const recentObjectId = this.getObjectIdFromDate(lastEntry.subtract(5, "hours").subtract(30, "minutes"));
                this.logger.info("recentObjectId ", recentObjectId);
                // converting lastEntry to present time
                lastEntry.add(5, "hours").add(30, "minutes");
                const appOpenData = await this.getLastAppOpenData(studentId, recentObjectId, pageSize);

                let activeDates = _.map(appOpenData, item => item.timestamp);
                const data = {
                    recentObjectId, activeDates, studentId, locale,
                    versionCode: parseInt(request.meta.versionCode, 10),
                    source: "earn_history",
                };
                let transactions = await this.getMilestonesAndTransactionsData(data);
                transactions = _.orderBy(transactions.transaction_history, ["widget_data.created_at"], ["desc"]);

                // if data is not present in app_open collection, will get last 100 days data and create a list of active dates from transactions data
                if (!activeDates.length) {
                    activeDates = _.uniq(_.map(transactions, item => item.widget_data.created_at));
                }

                let count = 1;
                let weekWiseTransactions = [];
                let tempTransactions = [];
                for (let i = 0; i <= activeDates.length - 1; i++) {
                    if (i > 0 && this.daysDifference(activeDates[i - 1], activeDates[i]) === 0) {
                        continue;
                    }
                    // finding present day transaction data
                    const presentDayTransaction = transactions.find(item => this.daysDifference(activeDates[i], item.widget_data.created_at) === 0);

                    const dayDiff = this.daysDifference(lastEntry, activeDates[i]);
                    if (dayDiff === 0 || dayDiff === 1) {
                        // if it is a present day or yesterday - means no streak break
                        tempTransactions = presentDayTransaction ? tempTransactions.concat(presentDayTransaction) : tempTransactions;
                        count++;
                    } else {
                        // streak break - difference between active days is more than 1

                        // add all absent data to main list
                        tempTransactions = await this.getNotOpenedResponse(lastEntry, dayDiff, locale);
                        if (tempTransactions.length) {
                            weekWiseTransactions = this.pushWeekResponse(tempTransactions, weekWiseTransactions, locale);
                            tempTransactions = [];
                        }

                        // add present data to temp list
                        tempTransactions = presentDayTransaction ? tempTransactions.concat(presentDayTransaction) : tempTransactions;
                        count++;
                    }
                    lastEntry = activeDates[i];

                    // once a week is completed, we will start another week
                    if (presentDayTransaction.widget_data.is_new_week) {
                        weekWiseTransactions = this.pushWeekResponse(tempTransactions, weekWiseTransactions, locale);
                        tempTransactions = [];
                        count = 1;
                    }
                }

                if (tempTransactions.length) {
                    lastEntry = tempTransactions[0].widget_data.created_at;
                } else {
                    lastEntry = moment(lastEntry).subtract(1, "day");
                }

                return {
                    toolbar_data: toolbarData,
                    is_widget_available: weekWiseTransactions.length !== 0,
                    widgets: weekWiseTransactions,
                    no_widget_container: locale === "hi" ? dnrData.earnHistory.no_widget_container.hi : dnrData.earnHistory.no_widget_container.en,
                    last_entry: lastEntry,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = EarnHistorySchema;
