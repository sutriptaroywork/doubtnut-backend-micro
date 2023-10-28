import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import studGroupData from "../../data/studygroup.data";
import StudyGroupMuteService from "./mute";
import studygroupData from "../../data/studygroup.data";

const StudyGroupNotificationService: ServiceSchema = {
    name: "$studygroup-notifications",
    mixins: [StudyGroupMuteService],
    methods: {

        async sendCreateGroupNotification(ctx) {
            try {
                const isNotificationMuted = await this.isFeatureNotificationEnabled(ctx.user.id);
                if (!isNotificationMuted) {
                    const notificationData = {
                        event: "video",
                        title: studGroupData.createGroupNotifTopic,
                        message: studGroupData.createGroupNotifDescription,
                        image: null,
                        firebase_eventtag: "studygroup_create",
                        data: {qid: 644931887, page: "STUDYGROUP"},
                    };
                    this.broker.emit("sendNotification", {
                        studentId: [ctx.user.id],
                        gcmRegistrationId: [ctx.user.gcm_reg_id],
                        notificationInfo: notificationData,
                        topic: "micro.push.notification",
                    }, "newton");
                }
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getInviteNotification(language, groupName, ctx) {
            const notification = {
                en: `${this.createChatName(ctx.user.student_fname, ctx.user.student_lname)} invited you to their study group ${unescape(groupName)}.`,
                hi: `${this.createChatName(ctx.user.student_fname, ctx.user.student_lname)} ने आपको अध्ययन समूह ${unescape(groupName)} के लिए आमंत्रित किया है।`,
            };
            return notification[language];
        },

        async notificationToInvitee(inviteeId, groupId, groupName, ctx) {
            try {
                const inviteeDetails = await this.broker.call("$studygroupMysql.getStudentDetailsById", {studentId: inviteeId});
                const isNotificationMuted = await this.isFeatureNotificationEnabled(inviteeId);
                if (inviteeDetails.length && inviteeDetails[0].gcm_reg_id && !isNotificationMuted) {
                    const locale = inviteeDetails[0].locale || "en";
                    const notificationData = {
                        event: "study_group_chat",
                        title: locale === "hi" ? this.getInviteNotification("hi", groupName, ctx) : this.getInviteNotification("en", groupName, ctx),
                        message: locale === "hi" ? studGroupData.inviteNotificationMessageHi : studGroupData.inviteNotificationMessageEn,
                        image: null,
                        firebase_eventtag: "studygroup_invite",
                        data: {
                            is_faq: false, inviter: ctx.user.id, invitee: inviteeId, group_id: groupId,
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

        async notifyIfInviterActive(inviterId, groupId, groupName, ctx) {
            try {
                // checking if inviter is still active on the same group, so we can notify him/her
                const isMember = await this.broker.call("$studygroupMysql.getMuteTime", {
                    studentId: inviterId,
                    groupId,
                });
                if (isMember.length && (isMember[0].muted_till === null || moment().add(5, "hours").add(30, "minutes").isAfter(moment(isMember[0].muted_till)))) {
                    await this.inviteAcceptanceNotification(inviterId, groupId, groupName, ctx);
                }
                return true;
            } catch (e) {
                this.logger.error(e);
                return false;
            }
        },

        async inviteAcceptanceNotification(inviterId, groupId, groupName, ctx) {
            try {
                const inviterDetails = await this.broker.call("$studygroupMysql.getStudentDetailsById", {studentId: inviterId});
                const isNotificationMuted = await this.isFeatureNotificationEnabled(inviterId);
                if (inviterDetails.length && inviterDetails[0].gcm_reg_id && !isNotificationMuted) {
                    const notificationData = {
                        event: "study_group_chat",
                        title: `${this.createChatName(ctx.user.student_fname, ctx.user.student_lname)} ne ${unescape(groupName)} group join karne ka invite accept kar liya.`,
                        message: studGroupData.accptanceNotificationMessage,
                        image: null,
                        firebase_eventtag: "studygroup_acceptance",
                        data: {group_id: groupId, is_faq: false},
                    };
                    this.broker.emit("sendNotification", {
                        studentId: [inviterId],
                        gcmRegistrationId: [inviterDetails[0].gcm_reg_id],
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

        async sendMessageNotification(roomId: string, notificationContent: any, activeStudents: any, studentName: string) {
            try {
                const allMembers = await this.broker.call("$studygroupMysql.getStudyGroupMembersForNotifications", {groupId: roomId});
                const offlineMembers = _.filter(allMembers, user => !_.includes(activeStudents, user.student_id));
                if (offlineMembers.length) {
                    const mutedMembers = await this.broker.call("$studygroupMysql.isFeatureMuteNotification", {studentIds: offlineMembers.map(x => x.student_id)});
                    const mutedMemberArray = mutedMembers.map(x => x.student_id);
                    const members = offlineMembers.filter(item => !_.includes(mutedMemberArray, item.student_id));
                    const gcmRegIdList = [];
                    const memberList = [];
                    for (let i = 0; i <= members.length; i++) {
                        if (members[i] && members[i].gcm_reg_id && ( isNaN(Date.parse(members[i].muted_till)) || moment().add(5, "hours").add(30, "minutes").isAfter(moment(members[i].muted_till)))) {
                            memberList.push(members[i].student_id);
                            gcmRegIdList.push(members[i].gcm_reg_id);
                        }
                    }
                    if (members.length && !_.isNull(notificationContent.message)) {
                        const notificationData = {
                            event: "study_group_chat",
                            title: `${unescape(members[0].group_name)} has new messages`,
                            image: notificationContent.image,
                            firebase_eventtag: "studygroup",
                            data: {group_id: roomId, is_faq: false},
                            message: studentName ? `${studentName}: ${notificationContent.message}` : notificationContent.message,
                            notification_id: parseInt(roomId.replace(/\D/g, "").slice(0, 8), 10),
                            big_content_title:"Study Group",
                            deeplink: `doubtnutapp://study_group_chat?group_id=${roomId}`,
                            summary_text: "Unread Messages...",
                            summary_deeplink: `doubtnutapp://study_group_chat?group_id=${roomId}`,
                        };
                        this.broker.emit("sendNotification", {
                            studentId: memberList,
                            gcmRegistrationId: gcmRegIdList,
                            notificationInfo: notificationData,
                            topic: "micro.push.notification",
                        }, "newton");
                    }
                }
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async supportGroupCreationNotify(roomId: string) {
            try {
                const allMembers = await this.broker.call("$studygroupMysql.getSupportExecutivesDetails", {groupId: roomId});
                const memberList = [];
                const gcmRegIdList = [];
                if (allMembers.length) {
                    for (let i = 0; i <= allMembers.length; i++) {
                        if (allMembers[i] && allMembers[i].gcm_reg_id) {
                            memberList.push(allMembers[i].student_id);
                            gcmRegIdList.push(allMembers[i].gcm_reg_id);
                        }
                    }
                    if (memberList.length) {
                        const notificationData = {
                            event: "study_group_chat",
                            title: `New Support Requested - ${unescape(allMembers[0].group_name)}`,
                            image: studygroupData.dnSupportIcon,
                            firebase_eventtag: "studygroup",
                            data: {group_id: roomId, is_faq: false},
                            message: "Please check and provide support",
                            notification_id: parseInt(roomId.replace(/\D/g, "").slice(0, 8), 10),
                            big_content_title:"Study Group",
                            deeplink: `doubtnutapp://study_group_chat?group_id=${roomId}`,
                            summary_text: "Unread Messages...",
                            summary_deeplink: `doubtnutapp://study_group_chat?group_id=${roomId}`,
                        };
                        this.broker.emit("sendNotification", {
                            studentId: memberList,
                            gcmRegistrationId: gcmRegIdList,
                            notificationInfo: notificationData,
                            topic: "micro.push.notification",
                        }, "newton");
                    }
                }
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyGroupNotificationService;
