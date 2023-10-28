import {ServiceSchema} from "dn-moleculer";
import studGroupData from "../../data/studygroup.data";
import {redisUtility} from "../../../../common";
import StudyGroupContainerActionsService from "../reporting/container.actions";

const StudyGroupActionService: ServiceSchema = {
    name: "$studygroup-actions",
    mixins: [StudyGroupContainerActionsService],
    methods: {
        async addMember(groupId: number, isAdmin: any, studentId: number) {
            try {
                await this.broker.call("$studygroupMysql.addMember", {
                    studentId,
                    studyGroupId: groupId,
                    isAdmin,
                });
                return true;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async leaveGroup(groupId: string, ctx: any) {
            try {
                let isGroupLeft = false;
                let socketMsg = null;
                const groupData = await this.broker.call("$studygroupMysql.getSpecificUserGroupData", {
                    studentId: ctx.user.id,
                    groupId,
                });
                if (groupData.length === 1) {
                    if (groupData[0].is_admin === 1) {
                        // user is admin
                        const groupMembers = await this.broker.call("$studygroupMysql.getGroupMembers", {groupId: groupData[0].id});
                        if (groupMembers.length === 1) {
                            // only one member in this group and requested user is admin :)
                            // we can deactivate the group as no-one has joined and admin requested to leave
                            await this.broker.call("$studygroupMysql.deactivateGroup", {
                                groupId: groupMembers[0].study_group_id,
                                studentId: ctx.user.id,
                            });
                            this.settings.message = "group deactivated as only requested member was added in this group";
                            socketMsg = studGroupData.socketLeftMsg.replace("<>", this.createChatName(ctx.user.student_fname, ctx.user.student_lname),);
                            isGroupLeft = true;
                        } else {
                            // more than one members in the group, need to assign admin who joined just after admin
                            const nextAdminStudentId = await this.getNextAdmin(groupMembers);
                            if (nextAdminStudentId) {
                                await this.broker.call("$studygroupMysql.leaveAdmin", {
                                    groupId: groupMembers[0].study_group_id,
                                    studentId: ctx.user.id,
                                });
                                await this.broker.call("$studygroupMysql.assignNewAdmin", {
                                    groupId: groupMembers[0].study_group_id,
                                    studentId: nextAdminStudentId,
                                });
                                this.settings.message = "New Admin successfully assigned to this group";
                                socketMsg = studGroupData.socketLeftMsg.replace("<>", this.createChatName(ctx.user.student_fname, ctx.user.student_lname),);
                                isGroupLeft = true;
                            } else {
                                this.settings.message = "Unable to assign new admin, some error occurred!";
                            }
                        }
                    } else {
                        // user is a member of the group
                        await this.broker.call("$studygroupMysql.leaveMember", {
                            groupId: groupData[0].id,
                            studentId: ctx.user.id,
                        });
                        this.settings.message = "this member has successfully left the group";
                        isGroupLeft = true;
                        socketMsg = studGroupData.socketLeftMsg.replace("<>", this.createChatName(ctx.user.student_fname, ctx.user.student_lname),);
                    }
                } else {
                    this.settings.message = "No active groups found";
                }
                if (isGroupLeft) {
                    await Promise.all([
                        this.updateMemberCount(groupId, "DECR"),
                        this.removeReportedContainersAfterAction(ctx.user.id, groupId, "LEAVE"),
                        redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO"),
                        redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "GROUP_INVITE_COUNT"),
                        redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_GROUPS")]);
                }
                return {message: this.settings.message, is_group_left: isGroupLeft, socket_msg: socketMsg};
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async getNextAdmin(groupMembers: any) {
            try {
                for (const member of groupMembers) {
                    if (member.is_admin === 2) {
                        return member.student_id;
                    }
                }
                for (const member of groupMembers) {
                    if (member.is_admin === 0) {
                        return member.student_id;
                    }
                }
                return false;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async blockFromGroup(groupId: string, studentId: number, ctx: any) {
            try {
                let isBlocked = false;
                let socketMsg = null;
                const groupData = await this.broker.call("$studygroupMysql.getSpecificUserGroupData", {
                    studentId: ctx.user.id,
                    groupId,
                });
                if (groupData.length === 1) {
                    if (groupData[0].is_admin !== 0) {
                        // user is admin, he/she can block other members
                        isBlocked = true;
                        const blockerUserDetails = await this.broker.call("$studygroupMysql.getStudentName", {studentId});
                        const blockedUser = blockerUserDetails ? blockerUserDetails[0].name : "Doubtnut User";
                        socketMsg = studGroupData.socketBlockedMsg.replace("[]", blockedUser).replace("<>", this.createChatName(ctx.user.student_fname, ctx.user.student_lname),).replace("{}", unescape(groupData[0].group_name));
                        this.settings.message = "user is successfully blocked from this group";
                        await Promise.all([
                            this.broker.call("$studygroupMysql.blockMember", {
                                blockedBy: ctx.user.id,
                                groupId: groupData[0].id,
                                studentId,
                            }),
                            this.removeReportedContainersAfterAction(studentId, groupId, "BLOCK"),
                            this.removeUserLevelCache(studentId, groupId)]);
                    } else {
                        // user is a member of the group, can't block anyone
                        this.settings.message = "this user is not the admin of this group";
                    }
                } else {
                    this.settings.message = "No active groups found";
                }
                return {message: this.settings.message, is_blocked: isBlocked, socket_msg: socketMsg};
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async updateMessageRestriction(groupId, onlySubAdminCanPost, ctx) {
            try {
                // type = 1: Only Admin/Sub-Admin can post, 0: Everyone can post
                const groupData = await this.broker.call("$studygroupMysql.getSpecificUserGroupData", {
                    studentId: ctx.user.id,
                    groupId,
                });
                this.settings.message = null;
                let isChatEnabled = true;
                let groupMinimumMemberWarningMessage = null;
                if (groupData.length === 1 && (groupData[0].group_type === 2 || groupData[0].group_type === 3)) {
                    if (groupData[0].is_admin !== 0) {
                        await this.broker.call("$studygroupMysql.updateMessageRestriction", {
                            studentId: ctx.user.id,
                            studyGroupId: groupData[0].id,
                            can_member_post: !onlySubAdminCanPost,
                        });
                        if (onlySubAdminCanPost) {
                            isChatEnabled = false;
                            groupMinimumMemberWarningMessage = ctx.user.locale === "hi" ? studGroupData.groupInfo.onlySubAdminCanPostMessage.hi : studGroupData.groupInfo.onlySubAdminCanPostMessage.en;
                            this.settings.message = ctx.user.locale === "hi" ? studGroupData.messageRestrictions.on.hi : studGroupData.messageRestrictions.on.en;
                        } else {
                            this.settings.message = ctx.user.locale === "hi" ? studGroupData.messageRestrictions.off.hi : studGroupData.messageRestrictions.off.en;
                        }
                        await redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO");
                    } else {
                        // user is a member of the group, can't change message restrictions
                        this.settings.message = "this user is not the admin of this group";
                    }
                } else {
                    this.settings.message = "No active groups found";
                }

                return {
                    is_chat_enabled: isChatEnabled,
                    group_minimum_member_warning_message: groupMinimumMemberWarningMessage,
                    message: this.settings.message,
                };

            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async updateSubAmin(groupId, studentId, adminStatus, ctx) {
            try {
                // to make/remove sub admin
                const groupData = await this.broker.call("$studygroupMysql.getSpecificUserGroupData", {
                    studentId: ctx.user.id,
                    groupId,
                });
                this.settings.message = null;
                if (groupData.length === 1 && groupData[0].group_type === 2) {
                    if (groupData[0].is_admin === 1) {
                        await this.broker.call("$studygroupMysql.updateSubAmin", {
                            studentId,
                            studyGroupId: groupData[0].id,
                            adminStatus,
                        });
                        await Promise.all([
                            redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO"),
                            redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "GROUP_INVITE_COUNT"),
                            redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_GROUPS")]);
                        if (adminStatus) {
                            this.settings.message = ctx.user.locale === "hi" ? studGroupData.subAdmin.make.hi : studGroupData.subAdmin.make.en;
                        } else {
                            this.settings.message = ctx.user.locale === "hi" ? studGroupData.subAdmin.remove.hi : studGroupData.subAdmin.remove.en;
                        }
                    } else {
                        // user is a member of the group, can't change message restrictions
                        this.settings.message = "this user is not the admin of this group";
                    }
                } else {
                    this.settings.message = "No active groups found";
                }
                return {message: this.settings.message};

            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async removeUserLevelCache(studentId, groupId) {
            try {
                await Promise.all([
                    this.updateMemberCount(groupId, "DECR"),
                    this.removeReportedContainersAfterAction(studentId, groupId, "LEAVE"),
                    redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO"),
                    redisUtility.deleteHashField.call(this, `USER:${studentId}`, "GROUP_INVITE_COUNT"),
                    redisUtility.deleteHashField.call(this, `USER:${studentId}`, "LIST_GROUPS")]);
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async markResolved(ctx: any) {
            try {
                const promises = [];
                const members = await this.broker.call("$studygroupMysql.getSupportMembersOfGroup", {groupId: ctx.params.group_id});
                for (let i = 0; i <= members.length; i++) {
                    if (members[i]) {
                        promises.push(redisUtility.deleteHashField.call(this, `USER:${members[i].student_id}`, "GROUP_INVITE_COUNT"),
                            redisUtility.deleteHashField.call(this, `USER:${members[i].student_id}`, "LIST_GROUPS"));
                    }
                }
                promises.push(this.broker.call("$studygroupMysql.markSupportResolved", {
                    groupId: ctx.params.group_id,
                }), redisUtility.deleteHashField.call(this, ctx.params.group_id, "GROUP_INFO"));
                await Promise.all(promises);
                return true;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyGroupActionService;
