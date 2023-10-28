import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import SettingsService from "../settings";
import studyChatData from "../../data/studychat.data";
import {redisUtility} from "../../../../common";

const StudyChatFriendService: ServiceSchema = {
    name: "$studychat-friends",
    mixins: [SettingsService],
    methods: {

        getWhatsappShareText(language: string) {
            const message = {
                en: "{name} has invited you to chat on Doubtnut study groups. Accept the invite to start chatting.\n{link}",
                hi: "{name} ने आपको डाउटनट स्टडी ग्रुप पर चैट करने के लिए आमंत्रित किया है। चैटिंग शुरू करने के लिए आमंत्रण स्वीकार करें।\n{link}",
            };
            return message[language];
        },

        async friendsTabs(ctx) {
            try {
                const studentName = this.createChatName(ctx.user.student_fname, ctx.user.student_lname);
                let whatsappCta = ctx.user.locale === "hi" ? studyChatData.friendList.whatsappButton.hi : studyChatData.friendList.whatsappButton.en;
                const redisKey = `USER:${ctx.user.id}`;
                let inviteUrl = await redisUtility.getHashField.call(this, redisKey, "SC_INVITE");
                if (_.isNull(inviteUrl)) {
                    inviteUrl = await this.generateStudyChatBranchLink(studentName, ctx.user.img_url, ctx.user.id, ctx);
                    await redisUtility.addHashField.call(this, redisKey, "SC_INVITE", inviteUrl, this.settings.monthlyRedisTTL);
                }

                if (_.isEmpty(inviteUrl)) {
                    whatsappCta = null;
                }
                const whatsappShareText = ctx.user.locale === "hi" ? this.getWhatsappShareText("hi") : this.getWhatsappShareText("en");
                return {
                    title: ctx.user.locale === "hi" ? studyChatData.friendList.title.hi : studyChatData.friendList.title.en,
                    subtitle: ctx.user.locale === "hi" ? studyChatData.friendList.subTitle.hi : studyChatData.friendList.subTitle.en,
                    send_invite_text: ctx.user.locale === "hi" ? studyChatData.friendList.sendCta.hi : studyChatData.friendList.sendCta.en,
                    number_invite: ctx.user.locale === "hi" ? studyChatData.friendList.numberInvite.hi : studyChatData.friendList.numberInvite.en,
                    search_placeholder: ctx.user.locale === "hi" ? studyChatData.friendList.searchPlaceholder.hi : studyChatData.friendList.searchPlaceholder.en,
                    cta: ctx.user.locale === "hi" ? studyChatData.friendList.cta.hi : studyChatData.friendList.cta.en,
                    tabs: ctx.user.locale === "hi" ? studyChatData.friendList.tabs.hi : studyChatData.friendList.tabs.en,
                    active_tab: 1,
                    whatsapp_cta: whatsappCta,
                    whatsapp_share_text: whatsappShareText.replace("{name}", studentName).replace("{link}", inviteUrl),
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async friends(listType: number, ctx: any) {
            try {
                let noMemberTitle;
                let noMemberSubtitle;
                let memberList;
                // listType = 1 (following) | listType = 2 (followers)
                // fetch the list of followers/following based on id
                if (listType === 1) {
                    memberList = await this.broker.call("$studygroupMysql.getFollowingList", {studentId: ctx.user.id});
                    noMemberTitle = ctx.user.locale === "hi" ? studyChatData.friendList.noFollowingTitle.hi : studyChatData.friendList.noFollowingTitle.en;
                    noMemberSubtitle = ctx.user.locale === "hi" ? studyChatData.friendList.noFollowingSubtitle.hi : studyChatData.friendList.noFollowingSubtitle.en;
                } else {
                    memberList = await this.broker.call("$studygroupMysql.getFollowersList", {studentId: ctx.user.id});
                    noMemberTitle = ctx.user.locale === "hi" ? studyChatData.friendList.noFollowersTitle.hi : studyChatData.friendList.noFollowersTitle.en;
                    noMemberSubtitle = ctx.user.locale === "hi" ? studyChatData.friendList.noFollowersSubtitle.hi : studyChatData.friendList.noFollowersSubtitle.en;
                }

                const friendList = memberList.map(item => {
                    item.name = this.createChatName(item.student_fname, item.student_lname);
                    item.image = item.image || studyChatData.defaultUserImage;
                    return item;
                });

                return {
                    user_data: friendList,
                    no_members_title: noMemberTitle,
                    no_members_subtitle: noMemberSubtitle,
                    is_search_enabled: true,
                    min_search_characters: 1,
                    search_text: ctx.user.locale === "hi" ? studyChatData.search.friend.hi : studyChatData.search.friend.en,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        getSMSShareText(language: string) {
            const sms = {
                en: "{name} has invited you to chat on Doubtnut study groups. Accept the invite to start chatting.\n{link}",
                hi: "{name} ने आपको डाउटनट स्टडी ग्रुप पर चैट करने के लिए आमंत्रित किया है। चैटिंग शुरू करने के लिए आमंत्रण स्वीकार करें।\n{link}",
            };
            return sms[language];
        },

        async smsToInvitee(mobile: number, ctx: any) {
            try {
                const studentName = this.createChatName(ctx.user.student_fname, ctx.user.student_lname);
                const inviteUrl = await this.generateStudyChatBranchLink(studentName, ctx.user.img_url, ctx.user.id, ctx);
                const message = (ctx.user.locale === "hi" ? this.getSMSShareText("hi") : this.getSMSShareText("en")).replace("{name}", studentName).replace("{link}", inviteUrl);
                await this.broker.emit("sendSms", {mobile, message}, "studygroup");
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async inviteWithNumber(mobile: number, ctx: any) {
            try {
                let isUserExist = false;
                let inviteeId = null;
                let chatDeeplink = null;
                let widgetData = null;
                // check if number exist in our databases - if available: send inviteeId
                const studentData = await this.broker.call("$studygroupMysql.getStudentIdByMobile", {mobile});

                this.smsToInvitee(mobile, ctx);
                // if user exists
                if (!_.isEmpty(studentData) && studentData[0].student_id) {
                    isUserExist = true;
                    inviteeId = studentData[0].student_id;
                    const startChatData = await this.startChat(studentData[0].student_id, ctx);
                    chatDeeplink = startChatData.deeplink;
                } else {
                    // if exist = false, has to show this message
                    widgetData = {
                        title: ctx.user.locale === "hi" ? studyChatData.userNotExist.title.hi : studyChatData.userNotExist.title.en,
                        secondary_cta: ctx.user.locale === "hi" ? studyChatData.userNotExist.cta_change.hi : studyChatData.userNotExist.cta_change.en,
                        primary_cta: ctx.user.locale === "hi" ? studyChatData.userNotExist.cta_invite.hi : studyChatData.userNotExist.cta_invite.en,
                    };
                }

                return {
                    user_exist: isUserExist,
                    invitee_id: inviteeId,
                    widget_data: widgetData,
                    chat_deeplink: chatDeeplink,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyChatFriendService;
