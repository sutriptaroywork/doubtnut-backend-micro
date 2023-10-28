import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import StudyGroupMuteService from "../general/mute";
import studyChatData from "../../data/studychat.data";

const StudyChatNotificationService: ServiceSchema = {
    name: "$studychat-notifications",
    mixins: [StudyGroupMuteService],
    methods: {

        async sendChatMessageNotification(chatId: string, notificationContent: any, ctx: any) {
            try {
                const allMembers = await this.broker.call("$studygroupMysql.listChatMembers", {chatId});
                const otherMember = _.filter(allMembers, user => parseInt(user.student_id, 10) !== ctx.user.id);
                const currentMember = _.filter(allMembers, user => parseInt(user.student_id, 10) === ctx.user.id);
                if ((currentMember.length && currentMember[0].is_blocked) || _.isEmpty(currentMember)) {
                    return true;
                }

                if (!_.isEmpty(otherMember) && (otherMember[0].muted_till === null || moment().add(5, "hours").add(30, "minutes").isAfter(moment(otherMember[0].muted_till)))) {
                    const mutedMember = await this.broker.call("$studygroupMysql.isFeatureMuteNotification", {studentIds: [otherMember[0].student_id]});
                    if (!mutedMember.length) {
                        const notificationData = {
                            event: "study_group",
                            path: "personal_chat",
                            title: this.createChatName(ctx.user.student_fname, ctx.user.student_lname),
                            image: notificationContent.image,
                            firebase_eventtag: "study_chat_message",
                            data: {chat_id: chatId, other_student_id: ctx.user.id},
                            message: notificationContent.message,
                            notification_id: parseInt(chatId.replace(/\D/g, "").slice(0, 8), 10),
                            big_content_title: "Study Group",
                            deeplink: studyChatData.listMyChats.deeplink.replace("{groupId}", chatId).replace("{otherStudentId}", ctx.user.id),
                            summary_text: "Unread Messages...",
                            summary_deeplink: "doubtnutapp://study_group/list?tab_position=2",
                        };
                        this.broker.emit("sendNotification", {
                            studentId: [otherMember[0].student_id],
                            gcmRegistrationId: [otherMember[0].gcm_reg_id],
                            notificationInfo: notificationData,
                            topic: "micro.push.notification",
                        }, "newton");
                        console.log("Notification Sent ");
                    }
                }
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

         async notificationToInvitee(inviteeId: number, chatId: string, ctx: any) {
            try {
                const inviteeDetails = await this.broker.call("$studygroupMysql.getStudentDetailsById", {studentId: inviteeId});
                const isNotificationMuted = await this.isFeatureNotificationEnabled(inviteeId);
                if (inviteeDetails.length && inviteeDetails[0].gcm_reg_id && !isNotificationMuted) {
                    const notificationData = {
                        event: "study_group",
                        path: "personal_chat",
                        title: studyChatData.inviteNotificationTitle,
                        message: studyChatData.inviteNotificationMessage.replace("<>", this.createChatName(ctx.user.student_fname, ctx.user.student_lname)),
                        image: null,
                        firebase_eventtag: "studygroup_invite",
                        data: {
                            chat_id: chatId, other_student_id: ctx.user.id,
                        },
                    };
                    this.broker.emit("sendNotification", {
                        studentId: [inviteeId],
                        gcmRegistrationId: [inviteeDetails[0].gcm_reg_id],
                        notificationInfo: notificationData,
                        topic: "micro.push.notification",
                    }, "newton");
                }
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async notifyIfInviterActive(chatId: string, ctx: any) {
            try {
                // checking if inviter is still active on the same group, so we can notify him/her
                const inviterDetails = await this.broker.call("$studygroupMysql.getInviterDetails", {
                    studentId: ctx.user.id,
                    chatId,
                });
                if (inviterDetails.length && (inviterDetails[0].muted_till === null || moment().add(5, "hours").add(30, "minutes").isAfter(moment(inviterDetails[0].muted_till)))) {
                    await this.inviteAcceptanceNotification(inviterDetails[0], chatId, ctx);
                }
                return true;
            } catch (e) {
                this.logger.error(e);
                return false;
            }
        },

        async inviteAcceptanceNotification(inviterDetails: any, chatId: string, ctx: any) {
            try {
                const isNotificationMuted = await this.isFeatureNotificationEnabled(inviterDetails.student_id);
                if (inviterDetails.gcm_reg_id && !isNotificationMuted) {
                    const notificationData = {
                        event: "study_group",
                        path: "personal_chat",
                        title: studyChatData.accptanceNotificationTitle,
                        message: studyChatData.accptanceNotificationMessage.replace("<>", this.createChatName(ctx.user.student_fname, ctx.user.student_lname),),
                        image: null,
                        firebase_eventtag: "studygroup_acceptance",
                        data: {chat_id: chatId, other_student_id: ctx.user.id},
                    };
                    this.broker.emit("sendNotification", {
                        studentId: [inviterDetails.student_id],
                        gcmRegistrationId: [inviterDetails.gcm_reg_id],
                        notificationInfo: notificationData,
                        topic: "micro.push.notification",
                    }, "newton");
                }
                return true;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyChatNotificationService;
