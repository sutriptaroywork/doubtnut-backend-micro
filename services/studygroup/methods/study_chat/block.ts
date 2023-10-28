import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import {redisUtility} from "../../../../common";
import SettingsService from "../settings";
import studyChatData from "../../data/studychat.data";

const StudyChatBlockService: ServiceSchema = {
    name: "$studychat-block",
    mixins: [SettingsService],
    methods: {
        async block(chatId: string, studentId: number, ctx: any) {
            try {
                let isBlocked = false;
                const chatData = await this.broker.call("$studygroupMysql.getSpecificUserChatData", {
                    studentId: ctx.user.id,
                    chatId,
                });

                if (chatData.length === 1) {
                    // user can block other member
                    await this.broker.call("$studygroupMysql.blockFriend", {
                        chatId: chatData[0].id,
                        studentId,
                    });
                    isBlocked = true;
                    this.settings.message = ctx.user.locale === "hi" ? "यूज़र को सफलतापूर्वक ब्लॉक कर दिया गया है" : "user is successfully blocked";
                    await Promise.all([
                        redisUtility.deleteKey.call(this, `MOL-$studygroupMysql.getChatInfo:chatId|${chatId}`),
                        redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_CHATS")]);

                } else {
                    this.settings.message = "No active chat found";
                }
                return {message: this.settings.message, is_blocked: isBlocked};
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async unBlock(chatId: string, studentId: number, ctx: any) {
            try {
                let isUnblocked = false;
                const chatData = await this.broker.call("$studygroupMysql.getSpecificUserChatData", {
                    studentId: ctx.user.id,
                    chatId,
                });
                if (chatData.length === 1) {
                    // user can unblock other member
                    await this.broker.call("$studygroupMysql.unBlockFriend", {
                        chatId: chatData[0].id,
                        studentId,
                    });
                    isUnblocked = true;
                    this.settings.message = "user is successfully unblocked";
                    this.settings.message = ctx.user.locale === "hi" ? "यूज़र को सफलतापूर्वक अनब्लॉक कर दिया गया है" : "user is successfully unblocked";
                    await Promise.all([
                        redisUtility.deleteKey.call(this, `MOL-$studygroupMysql.getChatInfo:chatId|${chatId}`),
                        redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_CHATS")]);
                } else {
                    this.settings.message = "No active chat found";
                }
                return {message: this.settings.message, is_unblocked: isUnblocked};
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async listBlockedUsers(page: number, ctx: any) {
            try {
                let isBlockedUsersAvailable = true;
                const blockList = await this.broker.call("$studygroupMysql.listBlockUsers", {
                    studentId: ctx.user.id,
                    offset: page * 10,
                });

                if (page === 0 && blockList.length === 0) {
                    isBlockedUsersAvailable = false;
                }

                const blockedUsers = [];
                const userLocale = ctx.user.locale === "hi" ? "hi" : "en";
                for (const user of blockList) {
                    const studentName = this.createChatName(user.student_fname, user.student_lname);
                    const popupData = this.getBlockUnblockPopupData(studentName, userLocale);
                    const obj = {
                        chat_id: user.chat_id,
                        student_id: user.student_id,
                        student_name: studentName,
                        blocked_at: user.blocked_at ? moment(user.blocked_at).format("DD/MM/YYYY") : null,
                        // image: user.img_url === null ? studyChatData.defaultUserImage : user.img_url,
                        image: studyChatData.defaultUserImage,
                        confirmation_pop_up: popupData.unblock_popup,
                        cta_text: ctx.user.locale === "hi" ? studyChatData.unBlockCta.hi : studyChatData.unBlockCta.en,
                        deeplink: `doubtnutapp://study_group/personal_chat?chat_id=${user.chat_id}&other_student_id=${user.student_id}`,
                    };

                    blockedUsers.push({
                        widget_type: "widget_sg_blocked_member",
                        widget_data: obj,
                    });
                }
                return {
                    title: ctx.user.locale === "hi" ? studyChatData.blockTitle.hi : studyChatData.blockTitle.en,
                    is_widget_available: isBlockedUsersAvailable,
                    widgets: blockedUsers,
                    no_widget_container: ctx.user.locale === "hi" ? studyChatData.no_block_container.hi : studyChatData.no_block_container.en,
                    is_reached_end: (blockList.length < 10),
                    page: page + 1,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyChatBlockService;
