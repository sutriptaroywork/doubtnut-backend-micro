import {ServiceSchema} from "moleculer";
import Cron from "moleculer-cron";
import PopularStudyGroups from "../crons/popular_study_groups";
import ReportCache from "../crons/delete-report-cache";
import TeacherGroupCron from "../crons/making_paid_user_groups";
import PromotionalMessages from "../crons/promotional_message";
import BanStudyGroups from "../crons/ban-script";
import InactiveStudyGroups from "../crons/group-profanity";
import BanProfaneStudents from "../crons/student-profanity";
import UnBanStudyGroups from "../crons/un-ban-script";
import createFreeTeachersGroup from "../crons/create-teachers-group";
import studyChatPromotional from "../crons/one_one_chat_promotional_message";
import paidGroupsCourseExpiredUserInactive from "../crons/removing_expired_users_course_study_group";
import Settings from "../methods/settings";


const CronJob: ServiceSchema = {
    name: "$studygroup-cron",   // Microservice name
    mixins: [Cron, PopularStudyGroups, ReportCache, TeacherGroupCron, PromotionalMessages, BanStudyGroups, UnBanStudyGroups, createFreeTeachersGroup, InactiveStudyGroups, BanProfaneStudents, studyChatPromotional, paidGroupsCourseExpiredUserInactive, Settings],
    // Dependencies goes here
    dependencies: [],

    // CRON SERVICE GOES HERE
    crons: [
        {
            name: "getting_popular_study_groups",
            cronTime: "45 */5 * * *", // Every four hours
            // cronTime: "*/1 * * * *", // For Testing to run cron in every 10 minutes
            async onTick() {
                let localService;
                try {
                    const serviceName = "$studygroup-cron";
                    localService = this.getLocalService(serviceName);
                    localService.logger.info("Checking lock state for popular study group cron");

                    const isInsideLock = await localService.checkRedisLockStatus("SG_POPULAR_CRON_LOCK", localService.settings.minuteRedisTTL * 10);

                    if (isInsideLock) {
                        localService.logger.info("popular study group cron already running");
                        return;
                    }
                    localService.logger.info("Starting popular study group cron");

                    await localService.setPopularStudyGroups();
                    localService.logger.info("popular study groups cron completed successfully");
                } catch (e) {
                    localService.sendAlertMessage("getting_popular_study_groups", e);
                    localService.logger.error(e);

                }
            },
        }, {
            name: "delete_reporting_cache",
            cronTime: "0 */6 * * *", // At every 6th hour.
            // cronTime: "*/10 * * * * *", // For Testing running cron in every 10 seconds
            async onTick() {
                let localService;
                try {
                    const serviceName = "$studygroup-cron";
                    localService = this.getLocalService(serviceName);
                    localService.logger.info("Checking lock state for delete reported cache cron");

                    const isInsideLock = await localService.checkRedisLockStatus("SG_REPORTING_CACHE_CRON_LOCK", localService.settings.minuteRedisTTL * 10);
                    if (isInsideLock) {
                        localService.logger.info("delete reported cache cron already running");
                        return;
                    }
                    localService.logger.info("Starting delete reported cache cron");

                    await localService.delReportedCache();
                    localService.logger.info("delete reported cache cron completed successfully");
                } catch (e) {
                    localService.logger.error(e);
                    localService.sendAlertMessage("delete_reporting_cache", e);
                }
            },
        }, {
            name: "promotional_messages",
            cronTime: "5 7,11,16,19,20 * * *", // At 07:05 AM, 11:05 AM, 04:05 PM ,07:05 and 09:05 PM
            // cronTime: "*/5 * * * *", // For Testing - to run cron in every 10 seconds
            async onTick() {
                let localService;
                try {
                    const serviceName = "$studygroup-cron";
                    localService = this.getLocalService(serviceName);
                    localService.logger.info("Checking lock state for study group promotional message cron");

                    const isInsideRedisLock = await localService.checkRedisLockStatus("SG_PROMOTIONAL_CRON_LOCK", localService.settings.minuteRedisTTL * 15);
                    if (isInsideRedisLock) {
                        localService.logger.info("study group promotional message cron already running");
                        return;
                    }
                    localService.logger.info("Starting study group promotional message cron");

                    await localService.sendPromotionalMessage();
                    localService.logger.info("study group promotional message cron completed successfully");
                } catch (e) {
                    localService.logger.error(e);
                    localService.sendAlertMessage("promotional_messages", e);
                }
            },
        },
            // {
        //     name: "ban_script",
        //     cronTime: "*/15 * * * *", // Every 15 minutes
        //     // cronTime: "*/30 * * * * *", // For Testing - to run cron in every 30 seconds
        //     async onTick() {
        //         let localService;
        //         try {
        //             const serviceName = "$studygroup-cron";
        //             localService = this.getLocalService(serviceName);
        //             localService.logger.info("Checking lock state for study group ban script");
        //
        //             const isInsideRedisLock = await localService.checkRedisLockStatus("SG_BAN_SCRIPT_LOCK", localService.settings.minuteRedisTTL * 60 * 24);
        //             if (isInsideRedisLock) {
        //                 localService.logger.info("study group ban script already running");
        //                 return;
        //             }
        //             localService.logger.info("Starting study group ban script");
        //
        //             await localService.banStudyGroups();
        //             localService.logger.info("study group ban script completed successfully");
        //         } catch (e) {
        //             localService.logger.error(e);
        //             localService.sendAlertMessage("ban_script", e);
        //         }
        //     },
        // },
        // {
        //     name: "unban_script",
        //     cronTime: "*/5 * * * *", // Every 5 minutes
        //     async onTick() {
        //         let localService;
        //         try {
        //             const serviceName = "$studygroup-cron";
        //
        //             localService = this.getLocalService(serviceName);
        //             localService.logger.info("Checking lock state");
        //             const isInsideLock = await localService.checkRedisLockStatus("SG_UNBAN_SCRIPT_LOCK", localService.settings.minuteRedisTTL * 60 * 24);
        //             if (isInsideLock) {
        //                 return;
        //             }
        //             localService.logger.info("Starting study group unban script");
        //
        //             await localService.unbanStudyGroups();
        //             localService.logger.info("study group unban script completed successfully");
        //         } catch (e) {
        //             localService.logger.error(e);
        //             localService.sendAlertMessage("unban_script", e);
        //         }
        //     },
        // },
        {
            name: "create_free_teachers_group",
            cronTime: "30 * * 5 *", // Every 1 hour
            // cronTime: "*/30 * * * * *", // For Testing - to run cron in every 30 seconds
            async onTick() {
                let localService;
                try {
                    const serviceName = "$studygroup-cron";
                    localService = this.getLocalService(serviceName);
                    localService.logger.info("Starting createFreeTeachersGroup script");

                    await localService.createFreeTeachersGroup();
                    localService.logger.info("createFreeTeachersGroup completed successfully");
                } catch (e) {
                    localService.logger.error(e);
                    localService.sendAlertMessage("createFreeTeachersGroup error ", e);
                }
            },
        },
        {
            name: "creating_paid_user_groups",
            cronTime: "15 3 * * *", // 8:45 am
            // cronTime: "*/30 * * * * *", // For Testing - to run cron in every 30 seconds
            async onTick() {
                let localService;
                try {
                    const serviceName = "$studygroup-cron";
                    localService = this.getLocalService(serviceName);
                    localService.logger.info("Starting creating paid user groups script");

                    await localService.makingPaidGroupsForAllAssortments();
                    localService.logger.info("createpPaidUserGroup completed successfully");
                } catch (e) {
                    localService.logger.error(e);
                    localService.sendAlertMessage("createFreeTeachersGroup error ", e);
                }
            },
        },
        {
            name: "deactivate_profaned_groups",
            cronTime: "5 17 * * *", // At 10:35 PM (IST)
            // cronTime: "*/1 * * * *", // For Testing to run cron in every 10 minutes
            async onTick() {
                let localService;
                try {
                    const serviceName = "$studygroup-cron";
                    localService = this.getLocalService(serviceName);
                    localService.logger.info("Checking lock state for deactivate_profaned_groups cron");

                    const isInsideLock = await localService.checkRedisLockStatus("SG_DEACTIVATE_CRON_LOCK", localService.settings.minuteRedisTTL * 120);

                    if (isInsideLock) {
                        localService.logger.info("deactivate_profaned_groups cron already running");
                        return;
                    }
                    localService.logger.info("Starting deactivate_profaned_groups cron");

                    await localService.inactiveGroups();
                    localService.logger.info("deactivate_profaned_groups cron completed successfully");
                } catch (e) {
                    localService.sendAlertMessage("deactivate_profaned_groups", e);
                    localService.logger.error(e);

                }
            },
        },
        // {
        //     name: "ban_profaned_students",
        //     cronTime: "0 * * * *", // every hour
        //     cronTime: "*/1 * * * *", // For Testing to run cron in every 10 minutes
            // async onTick() {
            //     let localService;
            //     try {
            //         const serviceName = "$studygroup-cron";
            //         localService = this.getLocalService(serviceName);
            //         localService.logger.info("Checking lock state for ban_profaned_students cron");
            //
            //         const isInsideLock = await localService.checkRedisLockStatus("BAN_PROFANITY_CRON_LOCK", localService.settings.minuteRedisTTL * 55);
            //
            //         if (isInsideLock) {
            //             localService.logger.info("ban_profaned_students cron already running");
            //             return;
            //         }
            //         localService.logger.info("Starting ban_profaned_students cron");
            //
            //         await localService.banStudentsInitiator();
            //         localService.logger.info("ban_profaned_students cron completed successfully");
            //     } catch (e) {
            //         localService.sendAlertMessage("ban_profaned_students", e);
            //         localService.logger.error(e);
            //
            //     }
            // },
        // },
        {
            name: "study_chat_promotional_messages",
            // cronTime: "*/30 * * * *", // At 07:20 AM, 11:20 AM, 04:20 PM and 09:20 PM
            cronTime: "50 1,5,9,12,13 * * *", // At 07:20 AM, 11:20 AM, 3:20 ,6:20 PM and 07:20 PM
            async onTick() {
                let localService;
                try {
                    const serviceName = "$studygroup-cron";
                    localService = this.getLocalService(serviceName);
                    localService.logger.info("Checking lock state for study chat promotional message cron");

                    const isInsideRedisLock = await localService.checkRedisLockStatus("SC_PROMOTIONAL_CRON_LOCK", localService.settings.minuteRedisTTL * 15);
                    if (isInsideRedisLock) {
                        localService.logger.info("study chat promotional message cron already running");
                        return;
                    }
                    localService.logger.info("Starting study chat promotional message cron");

                    await localService.sendStudyChatPromotionalMessage();
                    localService.logger.info("study chat promotional message cron completed successfully");
                } catch (e) {
                    localService.logger.error(e);
                    localService.sendAlertMessage("promotional_messages", e);
                }
            },
        },
        {
            name: "making_study_group_course_expired_user_inactive",
            cronTime: "45 18 * * *", // 12:15 pm
            // cronTime: "15 5 * * *", // 10:45 am
            async onTick() {
                let localService;
                try {
                    const serviceName = "$studygroup-cron";
                    localService = this.getLocalService(serviceName);
                    localService.logger.info("Checking lock state for study group course expired user making inactive cron");

                    const isInsideRedisLock = await localService.checkRedisLockStatus("SG_COURSE_EXPIRED_INACTIVE_CRON_LOCK", localService.settings.minuteRedisTTL * 15);
                    if (isInsideRedisLock) {
                        localService.logger.info("study group course expired user cron already running");
                        return;
                    }
                    localService.logger.info("Starting study group course expired user cron");

                    await localService.makingCourseStudyGroupUserInactive();
                    localService.logger.info("study group course expired user cron completed successfully");
                } catch (e) {
                    localService.logger.error(e);
                    localService.sendAlertMessage("promotional_messages", e);
                }
            },
        },
    ],

    // Actions goes here
    actions: {},

    methods: {},
};

export = CronJob;
