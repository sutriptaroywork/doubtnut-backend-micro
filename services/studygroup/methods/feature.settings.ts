import {ServiceSchema} from "dn-moleculer";
import studyChatData from "../data/studychat.data";
import StudyGroupMuteService from "./general/mute";


const FeatureSettings: ServiceSchema = {
    name: "$feature-settings",
    mixins: [StudyGroupMuteService],
    methods: {

        async settingsHomePage(ctx) {

            const notificationContainer = {
                title: ctx.user.locale === "hi" ? studyChatData.featureSettings.notification.title.hi : studyChatData.featureSettings.notification.title.en,
                toggle: !(await this.isFeatureNotificationEnabled(ctx.user.id)),
            };

            const blockList = await this.broker.call("$studygroupMysql.countBlockUsers", {
                studentId: ctx.user.id,
            });
            let blockedListCount = 0;
            let countTitle = ctx.user.locale === "hi" ? studyChatData.featureSettings.blockList.count.singlular.hi : studyChatData.featureSettings.blockList.count.singlular.en;
            if (blockList.length) {
                blockedListCount = blockList[0].count;
                if (blockedListCount > 1) {
                    countTitle = ctx.user.locale === "hi" ? studyChatData.featureSettings.blockList.count.plural.hi : studyChatData.featureSettings.blockList.count.plural.en;
                }
            }

            const blockListContainer = {
                title: ctx.user.locale === "hi" ? studyChatData.featureSettings.blockList.title.hi : studyChatData.featureSettings.blockList.title.en,
                count: `${blockedListCount} ${countTitle}`,
                deeplink: studyChatData.featureSettings.blockList.deeplink,
            };

            return {
                title: ctx.user.locale === "hi" ? studyChatData.featureSettings.title.hi : studyChatData.featureSettings.title.en,
                student_name: this.createChatName(ctx.user.student_fname, ctx.user.student_lname),
                student_image: ctx.user.img_url || studyChatData.defaultUserImage,
                notification_container: notificationContainer,
                block_list_container: blockListContainer,
            };
        },
    },

    events: {},
};

export = FeatureSettings;
