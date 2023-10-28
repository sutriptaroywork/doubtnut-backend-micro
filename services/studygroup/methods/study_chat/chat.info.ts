import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import studyChatData from "../../data/studychat.data";
import {redisUtility} from "../../../../common";
import studGroupData from "../../data/studygroup.data";
import MuteService from "./mute";

const StudyChatInfoService: ServiceSchema = {
    name: "$studychat-chat-info",
    mixins: [MuteService],
    methods: {

        async chatInfo(chatId, otherStudentId, ctx) {
            try {
                let isChatEnabled = true; // to get bottom Sheet instead of text box
                let roomName = null;
                let roomImage = null;
                let inviteBottomSheet = null;
                let isMute = false;
                let ownBlockStatus = 0;
                let otherBlockedStatus = 0; // other members block status
                this.settings.message = "Chat is enabled for communications";

                const chatData = await this.broker.call("$studygroupMysql.getChatInfo", {chatId});

                // for other member
                let otherMemberData = _.filter(chatData, user => user.student_id !== ctx.user.id);

                // if other member has not joined yet.
                if (!otherMemberData.length) {
                    otherMemberData = await this.broker.call("$studygroupMysql.getStudentData", {studentId: otherStudentId});
                    if (!otherMemberData.length) {
                        return { message: "Some error occurred" };
                    }
                    otherMemberData[0].is_blocked = 0;
                    otherMemberData[0].image = !_.isNull(otherMemberData[0].image) ? otherMemberData[0].image : studyChatData.defaultUserImage;
                }
                roomName = this.createChatName(otherMemberData[0].student_fname, otherMemberData[0].student_lname);
                roomImage = otherMemberData[0].image;

                // if other member has been blocked by current member.
                const userLocale = ctx.user.locale === "hi" ? "hi" : "en";
                const popupData = this.getBlockUnblockPopupData(roomName, userLocale);
                if (otherMemberData[0].is_blocked) {
                    ownBlockStatus = 2;
                    otherBlockedStatus = 1;
                    this.settings.message = "Chat is not enabled for communications";
                }

                // for current member
                const currentUserData = _.filter(chatData, user => user.student_id === ctx.user.id);

                if (!currentUserData.length) {
                    this.settings.message = "You have to accept the request to start the conversation";
                    isChatEnabled = false;
                    inviteBottomSheet = this.getInviteBottomSheetData(roomName, userLocale);
                } else {
                    isMute = await this.isChatMute(chatId, currentUserData[0].muted_till, ctx);
                    ownBlockStatus = !ownBlockStatus && currentUserData[0].is_blocked ? 1 : ownBlockStatus;
                    otherBlockedStatus = currentUserData[0].is_blocked ? 2 : otherBlockedStatus;
                }

                const redisKey = `USER:${otherStudentId}`;
                let inviteUrl = await redisUtility.getHashField.call(this, redisKey, "PROFILE_INVITE");
                if (_.isNull(inviteUrl)) {
                    inviteUrl = await this.generateStudyChatBranchLink(roomName, roomImage, otherStudentId, ctx);
                    await redisUtility.addHashField.call(this, redisKey, "PROFILE_INVITE", inviteUrl, this.settings.monthlyRedisTTL);
                }

                return {
                    chat_data: {room_name: roomName, room_image: roomImage},
                    is_chat_enabled: isChatEnabled,
                    block_status: ownBlockStatus,
                    other_blocked_status: otherBlockedStatus,
                    is_mute: isMute,
                    message: this.settings.message,
                    faq_deeplink: studyChatData.faqDeeplink,
                    invite_text: `Start conversation with ${roomName}.\n${inviteUrl}`,
                    block_pop_up: popupData.block_popup,
                    unblock_pop_up: popupData.unblock_popup,
                    invite_bottom_sheet: inviteBottomSheet,
                    notification_id: parseInt(chatId.replace(/\D/g, "").slice(0, 8), 10),
                    other_student_profile_deeplink: `doubtnutapp://profile?student_id=${otherStudentId}&source=study_group`,
                    gif_container: studGroupData.gifDisable,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getBlockUnblockPopupData(roomName, locale) {
            const blockPopupData =  {
                en: {
                    title: `Are You Sure want to Block ${roomName}? `,
                    subtitle:  `${roomName} will not be able to send you messages anymore and to start talking again you will have to unblock`,
                    primary_cta: "Block",
                    secondary_cta: "Cancel",
                },
                hi: {
                    title: `क्या आप ${roomName} को ब्लॉक करना चाहते हैं? `,
                    subtitle: `इसके बाद ${roomName} आपको मैसेज नहीं भेज पाएंगे| फिर से बात करना शुरू करने के लिए आपको ${roomName} को अनब्लॉक करना होगा|`,
                    primary_cta: "ब्लॉक",
                    secondary_cta: "कैंसिल",
                },
            };

            const unblockPopupData = {
                en: {
                    title: `Are You Sure want to Unblock ${roomName}? `,
                    subtitle: `${roomName} will be able to send you messages, to start talking again you will have to unblock`,
                    primary_cta: "Unblock",
                    secondary_cta: "Cancel",
                },
                hi: {
                    title: `क्या आप ${roomName} को अनब्लॉक करना चाहते हैं? `,
                    subtitle: `क्या आप ${roomName} को अनब्लॉक करना चाहते हैं? अनब्लॉक करने के बाद, ${roomName} आपको मैसेज कर पाएंगे।`,
                    primary_cta: "अनब्लॉक",
                    secondary_cta: "कैंसिल",
                },
            };
            return {block_popup: blockPopupData[locale], unblock_popup: unblockPopupData[locale]};
        },

        getInviteBottomSheetData(roomName, locale) {
            const inviteBottomSheetData = {
                en: {
                    heading: `${roomName} has sent a Message`,
                    description: "Agar aap inse chat karna chahte ho toh is  chat request ko accept karo",
                    image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/13095E27-4352-40A7-A295-C6AF9AB53FE0.webp",
                    primary_cta: "Accept Chat",
                    primary_cta_event: "sc_invite_accepted",
                    secondary_cta: "Reject & Block Request",
                    secondary_cta_event: "sc_invite_rejected",
                    can_access_chat: false,
                },
                hi: {
                    heading: `${roomName} ने मैसेज भेजा है`,
                    description: "अगर आप इनसे चैट करना चाहते हैं तो चैट रिक्वेस्ट को एक्सेप्ट करें",
                    image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/13095E27-4352-40A7-A295-C6AF9AB53FE0.webp",
                    primary_cta: "चैट एक्सेप्ट करें",
                    primary_cta_event: "sc_invite_accepted",
                    secondary_cta: "रिक्वेस्ट को रिजेक्ट कर, ब्लॉक करें",
                    secondary_cta_event: "sc_invite_rejected",
                    can_access_chat: false,
                },
            };
            return inviteBottomSheetData[locale];
        },
    },
};

export = StudyChatInfoService;
