import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import studGroupData from "../../data/studygroup.data";
import {redisUtility} from "../../../../common";
import StudyGroupNotificationService from "./notification";

const StudyGroupInviteService: ServiceSchema = {
    name: "$studygroup-invite",
    mixins: [StudyGroupNotificationService],
    methods: {

        async invite(groupId, inviteeId, ctx) {
            try {
                // check if invitor is the member of the group
                let isMemberInvited = false;
                const groupData = await this.broker.call("$studygroupMysql.getSpecificUserGroupData", {
                    studentId: ctx.user.id,
                    groupId,
                });
                if (groupData.length === 1) {
                    this.settings.message = "Invitor is a active member of the group";
                    const inviteeData = await this.broker.call("$studygroupMysql.getSpecificUserGroupData", {
                        studentId: inviteeId,
                        groupId,
                    });
                    if (!inviteeData.length) {
                        const invitationStatus = await this.broker.call("$studygroupMysql.invitationStatus", {
                            inviter: ctx.user.id,
                            invitee: inviteeId,
                            groupId: groupData[0].id,
                        });
                        if (invitationStatus.length === 0) {
                            // can be invite
                            await this.broker.call("$studygroupMysql.inviteMember", {
                                inviter: ctx.user.id,
                                invitee: inviteeId,
                                groupId: groupData[0].id,
                                isAdmin: groupData[0].is_admin,
                            });
                            this.settings.message = "Successfully invited to the group";
                            isMemberInvited = true;
                            this.notificationToInvitee(inviteeId, groupId, groupData[0].group_name, ctx);
                            await redisUtility.deleteHashField.call(this, `USER:${inviteeId}`, "GROUP_INVITE_COUNT");
                        } else if (invitationStatus.length && invitationStatus[0].is_accepted === 1) {
                            await this.broker.call("$studygroupMysql.updateInviteMember", {
                                inviter: ctx.user.id,
                                invitee: inviteeId,
                                groupId: groupData[0].id,
                                isAdmin: groupData[0].is_admin,
                            });
                            this.settings.message = "Successfully invited to the group";
                            isMemberInvited = true;
                            this.notificationToInvitee(inviteeId, groupId, groupData[0].group_name, ctx);
                            await redisUtility.deleteHashField.call(this, `USER:${inviteeId}`, "GROUP_INVITE_COUNT");
                        } else {
                            this.settings.message = "requested invitor has already invited earlier for same group";
                        }
                    } else {
                        this.settings.message = "invitee is already member of this group";
                    }
                } else {
                    this.settings.message = "invitor is not a member of this group";
                }
                return {message: this.settings.message, is_invited: isMemberInvited};
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        // eslint-disable-next-line max-lines-per-function
        async accept(groupId, ctx, inviterId?) {
            try {
                let isMemberJoined = false;
                let description = null;
                let isAlreadyMember = false;
                let isPreviouslyBlocked = false;
                let ctaText = null;
                let socketMsg = null;
                if (parseInt(ctx.versionCode, 10) < 946 && groupId.split("-")[0] === "pg") {
                    // old users are not allowed to join public groups
                    this.settings.message = "Unable to join group, You have to update the Doubtnut App to join this group.";
                    description = ctx.user.locale === "hi" ? studGroupData.publicGroupJoiningErrorHi : studGroupData.publicGroupJoiningErrorEn;
                    ctaText = ctx.user.locale === "hi" ? studGroupData.ctaTextHi : studGroupData.ctaTextEn;
                    return {
                        message: this.settings.message,
                        is_member_joined: isMemberJoined,
                        description,
                        cta_text: ctaText,
                        is_already_member: isAlreadyMember,
                        is_previously_blocked: isPreviouslyBlocked,
                    };
                }
                // check if invitee is already the member of the group
                const inviteeGroupData = await this.broker.call("$studygroupMysql.getSpecificUserGroupData", {
                    studentId: ctx.user.id,
                    groupId,
                });
                if (!inviteeGroupData.length) {
                    const groupData = await this.broker.call("$studygroupMysql.getGroupId", {groupId});
                    if (!groupData.length) {
                        this.settings.message = "Sorry this group no longer exists.";
                        description = ctx.user.locale === "hi" ? studGroupData.groupNotExistHi : studGroupData.groupNotExistEn;
                        ctaText = ctx.user.locale === "hi" ? studGroupData.ctaTextHi : studGroupData.ctaTextEn;
                        return {
                            message: this.settings.message,
                            is_member_joined: isMemberJoined,
                            description,
                            cta_text: ctaText,
                            is_already_member: isAlreadyMember,
                            is_previously_blocked: isPreviouslyBlocked,
                        };
                    }
                    this.settings.message = "invitee is not a active member of the group, can join!";
                    const isBlocked = await this.broker.call("$studygroupMysql.isBlocked", {
                        studentId: ctx.user.id,
                        groupId: groupData[0].id,
                    });
                    const isPublicGroup = groupData[0].group_type === 2;
                    const totalMembersAllowedInGroup = isPublicGroup ? this.settings.TOTAL_ALLOWED_MEMBERS_IN_PUBLIC_GROUP : this.settings.TOTAL_ALLOWED_MEMBERS_IN_GROUP;
                    if (!isBlocked) {
                        // some error occurred;
                        this.settings.message = "Oops! There is some issue in joining group, please try again!";
                        description = ctx.user.locale === "hi" ? studGroupData.groupJoiningErrorHi : studGroupData.groupJoiningErrorEn;
                        ctaText = ctx.user.locale === "hi" ? studGroupData.ctaHomeHi : studGroupData.ctaTextEn;
                        return {
                            message: this.settings.message,
                            is_member_joined: isMemberJoined,
                            description,
                            cta_text: ctaText,
                            is_already_member: isAlreadyMember,
                            is_previously_blocked: isPreviouslyBlocked,
                        };
                    }
                    if (isBlocked && isBlocked[0].EXIST === 1) {
                        // user is blocked by admin on this group earlier
                        this.settings.message = "User is blocked";
                        description = ctx.user.locale === "hi" ? studGroupData.groupJoiningBlockHi : studGroupData.groupJoiningBlockEn;
                        ctaText = ctx.user.locale === "hi" ? studGroupData.ctaTextHi : studGroupData.ctaTextEn;
                        isPreviouslyBlocked = true;
                        return {
                            message: this.settings.message,
                            is_member_joined: isMemberJoined,
                            description,
                            cta_text: ctaText,
                            is_already_member: isAlreadyMember,
                            is_previously_blocked: isPreviouslyBlocked,
                        };
                    }

                    // checking if invited through profile or link, if entry found then user has invited through profile else
                    // invitee is trying to join through shared link on whatsapp or any social media
                    if (inviterId) {
                        const isInvited = await this.broker.call("$studygroupMysql.isInvited", {
                            inviter: inviterId,
                            invitee: ctx.user.id,
                            groupId: groupData[0].id,
                        });
                        if (!isInvited) {
                            // some error occurred;
                            this.settings.message = "Oops! There is some issue in joining group, please try again!";
                            description = ctx.user.locale === "hi" ? studGroupData.groupJoiningErrorHi : studGroupData.groupJoiningErrorEn;
                            ctaText = ctx.user.locale === "hi" ? "पुनः प्रयास करें" : "Retry";
                            return {
                                message: this.settings.message,
                                is_member_joined: isMemberJoined,
                                description,
                                cta_text: ctaText,
                                is_already_member: isAlreadyMember,
                                is_previously_blocked: isPreviouslyBlocked,
                            };
                        }
                        if (isInvited.length && isInvited[0].EXIST === 0) {
                            // user is joining through link, adding a entry in invite table.
                            await this.broker.call("$studygroupMysql.inviteMember", {
                                inviter: inviterId,
                                invitee: ctx.user.id,
                                groupId: groupData[0].id,
                                isAdmin: 0,
                            });
                            this.settings.message = "Successfully added to the group";
                        }
                    }
                    const totalMembers = await this.broker.call("$studygroupMysql.getTotalGroupMembers", {groupId: groupData[0].id});
                    if (totalMembers.length && totalMembers[0].TOTAL <= totalMembersAllowedInGroup) {
                        // checking if user was previously left the group
                        const isLeftPreviously = await this.broker.call("$studygroupMysql.isPreviouslyLeftThisStudyGroup", {
                            studentId: ctx.user.id,
                            groupId: groupData[0].id,
                        });
                        if (isLeftPreviously.length && isLeftPreviously[0].EXIST === 1) {
                            // rejoining member
                            await this.broker.call("$studygroupMysql.reJoinMember", {
                                studentId: ctx.user.id,
                                groupId: groupData[0].id,
                            });
                            this.settings.message = "User was previously left this group, now re-joined successfully";
                            isMemberJoined = true;
                            // !isPublicGroup means its a PrivateGroup, have to enter in the condition (can add additional check on inviterId)
                            // In case of isPublicGroup is true - only enter the condition if inviterId is available
                            if (inviterId) {
                                this.notifyIfInviterActive(inviterId, groupId, groupData[0].group_name, ctx);

                                this.broker.call("$studygroupMysql.acceptInvite", {
                                    studentId: ctx.user.id,
                                    groupId: groupData[0].id,
                                    inviter: inviterId,
                                });
                            }
                            await Promise.all([this.updateMemberCount(groupId, "INCR"),
                                redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO"),
                                redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "GROUP_INVITE_COUNT"),
                                redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_GROUPS")]);
                            socketMsg = `${this.createChatName(ctx.user.student_fname, ctx.user.student_lname)} joined back`;
                            return {
                                message: this.settings.message,
                                is_member_joined: isMemberJoined,
                                description,
                                cta_text: ctaText,
                                is_already_member: isAlreadyMember,
                                is_previously_blocked: isPreviouslyBlocked,
                                socket_msg: socketMsg,
                            };
                        }
                        // user can join
                        await this.broker.call("$studygroupMysql.addMember", {
                            studentId: ctx.user.id,
                            studyGroupId: groupData[0].id,
                            isAdmin: 0,
                        });
                        isMemberJoined = true;
                        socketMsg = `${this.createChatName(ctx.user.student_fname, ctx.user.student_lname)} joined`;
                        await Promise.all([this.updateMemberCount(groupId, "INCR"),
                            redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO"),
                            redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "GROUP_INVITE_COUNT"),
                            redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_GROUPS")]);
                        if (inviterId) {
                            this.notifyIfInviterActive(inviterId, groupId, groupData[0].group_name, ctx);

                            this.broker.call("$studygroupMysql.acceptInvite", {
                                studentId: ctx.user.id,
                                groupId: groupData[0].id,
                                inviter: inviterId,
                            });
                        }
                        this.settings.message = "Invitee is successfully joined";
                    } else {
                        this.settings.message = "Invited group is already full";
                        description = ctx.user.locale === "hi" ? studGroupData.groupFullHi : studGroupData.groupFullEn;
                        ctaText = ctx.user.locale === "hi" ? studGroupData.ctaHomeHi : studGroupData.ctaHomeEn;
                    }
                } else {
                    this.settings.message = "invitee is already a member of this group";
                    description = "invitee is already a member of this group";
                    isAlreadyMember = true;
                }
                return {
                    message: this.settings.message,
                    is_member_joined: isMemberJoined,
                    description,
                    cta_text: ctaText,
                    is_already_member: isAlreadyMember,
                    socket_msg: socketMsg,
                    is_previously_blocked: isPreviouslyBlocked,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async invitationStatus(inviteeId, ctx) {
            try {
                let activeGroups;
                if (parseInt(ctx.versionCode, 10) >= 946) {
                    activeGroups = await this.broker.call("$studygroupMysql.getActiveGroupsWithMembersCountV2", {studentId: ctx.user.id});
                } else {
                    activeGroups = await this.broker.call("$studygroupMysql.getActiveGroupsWithMembersCount", {studentId: ctx.user.id});
                }
                const data = [];
                for (let i = 0; i <= activeGroups.length; i++) {
                    if (activeGroups[i]) {
                        const groupData = {
                            group_id: activeGroups[i].group_id,
                            group_name: unescape(activeGroups[i].group_name),
                            // group_image: (activeGroups[i].group_image === null ? studGroupData.defaultGroupImage : activeGroups[i].group_image),
                            group_image: studGroupData.defaultGroupImage,
                            subtitle: `${activeGroups[i].total_members} Students`,
                            is_admin: activeGroups[i].is_admin,
                            last_message_sent_at: await this.getLastSentData(activeGroups[i].group_id),
                            invite_status: 0,
                        };
                        // invitation status -> 0 - (Invite), 1 - (Invite Sent), 2 - (Member)
                        const isMember = await this.broker.call("$studygroupMysql.isMember", {
                            studentId: inviteeId,
                            groupId: activeGroups[i].id,
                        });
                        if (isMember.length && isMember[0].EXIST === 1) {
                            groupData.invite_status = 2;
                            data.push(groupData);
                            continue;
                        }
                        const inviteStatus = await this.broker.call("$studygroupMysql.invitationStatus", {
                            invitee: inviteeId,
                            inviter: ctx.user.id,
                            groupId: activeGroups[i].id,
                        });
                        if (inviteStatus.length && inviteStatus[0].is_accepted === 0) {
                            groupData.invite_status = 1;
                            data.push(groupData);
                            continue;
                        }
                        groupData.invite_status = 0;
                        data.push(groupData);
                    }
                }
                const groups = _.orderBy(data, [o => o.last_message_sent_at || ""], ["desc"]);

                return {
                    groups,
                    no_group_container: ctx.user.locale === "hi" ? studGroupData.no_group_to_invite.hi : studGroupData.no_group_to_invite.en,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        // List Groups got invite from.
        async pendingGroupInvites(page: number, ctx: any) {
            try {
                const start = page * this.settings.TOTAL_GROUPS_SHOWN_PER_PAGE;
                const end = start + this.settings.TOTAL_GROUPS_SHOWN_PER_PAGE;
                const pendingGroupInviteWidgets = [];
                const pendingInvites = await this.broker.call("$studygroupMysql.pendingGroupInvites", {
                    studentId: ctx.user.id,
                    end,
                    start,
                });
                for (const group of pendingInvites) {
                    const data = studGroupData.pendingGroupInvitePage.widget;
                    data.widget_data.group_id = group.group_id;
                    data.widget_data.title = unescape(group.group_name);
                    data.widget_data.image = group.group_image;
                    data.widget_data.inviter = group.inviter;
                    data.widget_data.timestamp = await this.lastSeenTimeFormat(group.invited_at);
                    data.widget_data.subtitle = (ctx.user.locale === "hi" ? studGroupData.pendingGroupInvitePage.invite.invited_by.hi : studGroupData.pendingGroupInvitePage.invite.invited_by.en).concat(group.inviter_name);
                    data.widget_data.primary_cta = (ctx.user.locale === "hi" ? studGroupData.pendingGroupInvitePage.invite.primary_cta.hi : studGroupData.pendingGroupInvitePage.invite.primary_cta.en);
                    data.widget_data.primary_cta_deeplink = `doubtnutapp://study_group/join_group?group_id=${group.group_id}&inviter=${group.inviter}`;
                    data.widget_data.secondary_cta = (ctx.user.locale === "hi" ? studGroupData.pendingGroupInvitePage.invite.secondary_cta.hi : studGroupData.pendingGroupInvitePage.invite.secondary_cta.en);
                    data.widget_data.secondary_cta_deeplink = `doubtnutapp://study_group/reject?group_id=${group.group_id}&inviter=${group.inviter}`;
                    data.widget_data.deeplink = `doubtnutapp://study_group/chat?group_id=${group.group_id}&is_faq=false`;
                    pendingGroupInviteWidgets.push(JSON.parse(JSON.stringify(data)));
                }

                return {
                    title: ctx.user.locale === "hi" ? studGroupData.pendingGroupInvitePage.title.hi : studGroupData.pendingGroupInvitePage.title.en,
                    is_search_enabled: true,
                    min_search_characters: 1,
                    search_text: ctx.user.locale === "hi" ? studGroupData.search.people.hi : studGroupData.search.people.en,
                    widgets: pendingGroupInviteWidgets,
                    no_widget_container: ctx.user.locale === "hi" ? studGroupData.no_invites_container.hi : studGroupData.no_invites_container.en,
                    is_reached_end: (pendingGroupInviteWidgets.length < 10),
                    page: page + 1,
                    source: "pending_group_invites",
                };

            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        // reject group invite
        async reject(groupId, inviterId, ctx) {
            try {
                // check if invitee is already the member of the group
                const inviteeGroupData = await this.broker.call("$studygroupMysql.getSpecificUserGroupData", {
                    studentId: ctx.user.id,
                    groupId,
                });

                if (!inviteeGroupData.length) {
                    const groupData = await this.broker.call("$studygroupMysql.getGroupId", {groupId});
                    if (groupData.length) {
                        await this.broker.call("$studygroupMysql.rejectInvite", {
                            studentId: ctx.user.id,
                            groupId: groupData[0].id,
                            inviter: inviterId,
                        });
                    }
                    this.settings.message = "Invite request rejected";
                } else {
                    await this.broker.call("$studygroupMysql.acceptInvite", {
                        studentId: ctx.user.id,
                        groupId: inviteeGroupData[0].id,
                        inviter: inviterId,
                    });
                    this.settings.message = "You are already a member of this group";
                }
                await Promise.all([redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO"),
                    redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "GROUP_INVITE_COUNT"),
                    redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_GROUPS")]);
                return {message: this.settings.message};

            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyGroupInviteService;
