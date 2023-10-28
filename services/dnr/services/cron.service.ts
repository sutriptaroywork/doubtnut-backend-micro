import {ServiceSchema} from "moleculer";
import Cron from "moleculer-cron";
import Webhook from "../crons/coupon_webhook";
import StreakReminder from "../crons/streak.reminder";
import Settings from "../methods/settings";

const CronJob: ServiceSchema = {
    name: "$dnr-cron",   // Microservice name
    mixins: [Cron, Webhook, Settings, StreakReminder],
    // Dependencies goes here
    dependencies: [],

    // CRON SERVICE GOES HERE
    crons: [
        {
            name: "dnr_webhook",
            cronTime: "*/15 * * * *", // Every 15 minutes
            // cronTime: "*/10 * * * * *", // For Testing - Running in every 10 seconds
            async onTick() {
                let localService;
                try {
                    const serviceName = "$dnr-cron";
                    localService = this.getLocalService(serviceName);
                    localService.logger.info("Checking lock for dnr coupon webhook");

                    const isInsideLock = await localService.checkRedisLockStatus("DNR_WEBHOOK_CRON_LOCK", localService.settings.minuteRedisTTL * 10);

                    if (isInsideLock) {
                        localService.logger.info("dnr coupon webhook cron already running");
                        return;
                    }
                    localService.logger.info("Starting dnr coupon webhook");

                    await localService.processPendingCoupons();
                    localService.logger.info("dnr coupon webhook completed successfully");
                } catch (e) {
                    localService.logger.error(e);
                    localService.sendAlertMessage("dnr webhook cron", e);
                }
            },
        },
        // {
        //     name: "dnr_webhook_script",
        //     cronTime: "*/15 * * * *", // Every 15 minutes
        //     // cronTime: "*/10 * * * * *", // For Testing - Running in every 10 seconds
        //     async onTick() {
        //         let localService;
        //         try {
        //             const serviceName = "$dnr-cron";
        //             localService = this.getLocalService(serviceName);
        //
        //             const isInsideRedisLock = await localService.checkRedisLockStatus("DNR_WEBHOOK_SCRIPT_LOCK", localService.settings.minuteRedisTTL * 60 * 24);
        //             if (isInsideRedisLock) {
        //                 return;
        //             }
        //             localService.logger.info("Starting dnr coupon webhook script");
        //
        //             const isScript = true;
        //             await localService.processPendingCoupons(isScript);
        //             localService.logger.info("dnr coupon webhook script completed successfully");
        //         } catch (e) {
        //             localService.logger.error(e);
        //             localService.sendAlertMessage("dnr webhook script", e);
        //         }
        //     },
        // }
        {
            name: "dnr_streak_reminder",
            cronTime: "* 9 * * *", // At 9:00 AM
            // cronTime: "*/5 * * * *", // For Testing
            async onTick() {
                let localService;
                try {
                    const serviceName = "$dnr-cron";
                    localService = this.getLocalService(serviceName);

                    const isInsideRedisLock = await localService.checkRedisLockStatus("DNR_STREAK_REMINDER_LOCK", localService.settings.minuteRedisTTL * 10);
                    if (isInsideRedisLock) {
                        return;
                    }
                    localService.logger.info("Starting dnr streak reminder");

                    await localService.remindStreak();
                    localService.logger.info("dnr streak reminder completed successfully");
                } catch (e) {
                    localService.logger.error(e);
                    localService.sendAlertMessage("dnr streak reminder", e);
                }
            },
        }],

    // Actions goes here
    actions: {},

    methods: {},
};

export = CronJob;
