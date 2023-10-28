import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import StreakReward from "./claim_reward/streak.reward";
import VideoViewReward from "./claim_reward/video.view.reward";
import PurchasedReward from "./claim_reward/purchase.reward";
import MessageReward from "./claim_reward/message.reward";
import SignReward from "./claim_reward/signup.reward";
import whatsappReward from "./claim_reward/whatsapp.reward";
import ReferralReward from "./referral.reward";

const claimRewardSchema: ServiceSchema = {
    name: "$claimReward",
    mixins: [StreakReward, VideoViewReward, PurchasedReward, MessageReward, SignReward, whatsappReward, ReferralReward],
    methods: {

        async claimReward(request: any) {
            try {
                // keeping a redis lock for 1 minutes, No 2 claims can be performed within 3 minutes
                const isInsideLock = await this.checkRedisLockStatus(`${request.meta.user.student_id}_IS_CLAIMING_DNR`, this.settings.minuteRedisTTL);

                if (isInsideLock) {
                    this.logger.info(`${request.meta.user.student_id} has already claimed reward in past 1 minute`);
                    return null;
                }

                // single api to anticipate different claims based on its type
                const currentTime = moment().add(5, "hours").add(30, "minutes").toDate();
                const versionCode = parseInt(request.meta.versionCode, 10);
                const milestones = await this.adapter.db.collection(this.settings.milestoneCollection).find({
                    is_active: true,
                    min_version: {$lte: versionCode},
                    max_version: {$gte: versionCode},
                }).toArray();

                let popUpContainer = null;
                switch (request.params.type) {
                    case "weekly_streak":
                        // 7 day streak milestone
                        popUpContainer = await this.weeklyStreakReward(milestones, currentTime, request);
                        break;
                    case "video_view":
                    case "live_class":
                        // video view milestone
                        popUpContainer = await this.videoViewReward(milestones, currentTime, request);
                        break;
                    case "course":
                    case "resource_pdf":
                        popUpContainer = await this.purchasedReward(request);
                        break;
                    case "resource_video":
                        // pdf milestone
                        // video view milestone
                        popUpContainer = await this.purchasedReward(request);
                        break;
                    case "signup":
                        // signup milestone
                        popUpContainer = await this.signUpReward(milestones, currentTime, request);
                        break;
                    case "study_group":
                        // signup milestone
                        popUpContainer = await this.studyGroupReward(milestones, currentTime, request);
                        break;
                    case "refer_and_earn_reward":
                        // referral reward
                        popUpContainer = await this.referAndEarnReward(request);
                        break;

                }

                return popUpContainer;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async claimWhatsappReward(ctx: any) {
            // keeping a redis lock for 1 minutes, No 2 claims can be performed within 3 minutes
            const isInsideLock = await this.checkRedisLockStatus(`${ctx.params.student_id}_IS_CLAIMING_WA_DNR`, this.settings.minuteRedisTTL);

            if (isInsideLock) {
                this.logger.info(`${ctx.params.student_id} has already claimed reward in past 1 minute`);
                return {
                    is_rewarded: false,
                    message: "Inside redis lock",
                };
            }

            return this.whatsappVideoViewReward(ctx);
        },
    },
};

export = claimRewardSchema;
