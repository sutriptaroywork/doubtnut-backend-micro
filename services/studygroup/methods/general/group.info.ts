import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import profanity from "profanity-hindi";
import moment from "moment";
import {redisUtility} from "../../../../common";
import {wordProfanity} from "../../profanity";
import studygroupData from "../../data/studygroup.data";
import StudyGroupMuteService from "./mute";
import StudyGroupBanService from "./ban";

const StudyGroupInfoService: ServiceSchema = {
    name: "$studygroup-group-info",
    mixins: [StudyGroupMuteService, StudyGroupBanService],
    methods: {

        async resetListGroupCache(groupPk: number) {

            /* Steps:
                block all members of provide study group pk
            */
            const affectedMembers = await this.broker.call("$studygroupMysql.getAllMembersOfSpecificGroupByGroupPk", {
                study_group_id: groupPk,
            });

            for (const member of affectedMembers) {
                await redisUtility.deleteHashField.call(this, `USER:${member.student_id}`, "LIST_GROUPS");
            }
            return true;
        },


        async updateGroupInfo(groupId, groupName, groupImage, ctx) {
            try {
                let isUpdated = false;
                const groupData = await this.broker.call("$studygroupMysql.getSpecificUserGroupData", {
                    studentId: ctx.user.id,
                    groupId,
                });
                if (groupData.length === 1) {
                    if (groupData[0].is_admin !== 0) {
                        // user is admin, he/she can update group info
                        if (groupName) {
                            // user wants to update group name
                            if (await profanity.isMessageDirty(groupName) || await wordProfanity.isWordProfane(groupName) || groupName.match(/[~`!@#$%^&()_={}[\]:;,.<>+\/?-]/)) {
                                this.settings.message = "Profane group names are not allowed";
                                await redisUtility.incrKeyData.call(this, `SG_PROFANE_TEXT_${ctx.user.id}`, 1, this.getTodayEndTime());
                                return {
                                    message: this.settings.message,
                                    is_updated: isUpdated,
                                    title: ctx.user.locale === "hi" ? studygroupData.profaneGroupNameHi : studygroupData.profaneGroupNameEn,
                                    cta: ctx.user.locale === "hi" ? studygroupData.ctaTextHi : studygroupData.ctaTextEn,
                                    group_guideline: studygroupData.groupMsgGuidLine,
                                };
                            }
                            await this.broker.call("$studygroupMysql.updateGroupName", {
                                groupName: escape(groupName),
                                studentId: ctx.user.id,
                                studyGroupId: groupData[0].id,
                            });
                            await redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO");
                            await this.resetListGroupCache(groupData[0].id);
                            this.settings.message = "user has successfully updated group name";
                            isUpdated = true;
                        } else if (groupImage) {
                            // user wants to update group image
                            const isImageProfaned = false;
                            // await this.isImageProfaned(`${this.settings.CDN_URL}images/${groupImage}`);
                            if (isImageProfaned) {
                                this.settings.message = "user has uploaded profaned group image";
                            } else {
                                await this.broker.call("$studygroupMysql.updateGroupImage", {
                                    groupImage: `${this.settings.CDN_URL}images/${groupImage}`,
                                    studentId: ctx.user.id,
                                    studyGroupId: groupData[0].id,
                                });
                                await redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO");
                                await this.resetListGroupCache(groupData[0].id);
                                this.settings.message = "user has successfully updated group image";
                                isUpdated = true;
                            }
                        }
                    } else {
                        // user is a member of the group, can't block anyone
                        this.settings.message = "this user is not the admin of this group";
                    }
                } else {
                    this.settings.message = "No active groups found";
                }
                return {message: this.settings.message, is_updated: isUpdated};
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        getMemberTitle(type: string, memberCount: number, ctx: any) {
            if (ctx.user.locale === "hi") {
                return `सदस्य(${memberCount})`;
            } else {
                return memberCount > 1 ? `Members(${memberCount})` : `Member(${memberCount})`;
            }
        },


        // eslint-disable-next-line max-lines-per-function
        async groupInfo(groupId, ctx) {
            try {
                let isGroupEnabled = true;
                let isGroupActive = true;
                let groupBanStatus = null;
                let groupInfo: any;
                let groupName = null;
                let reportBottomSheet = null;
                let groupMinimumMemberWarningMessage = null;
                let onlyActiveMembers;
                let remainingSubAdminCount = 0;
                let canEditGroupInfo = false;
                const isFaq = false;
                let isMemberBlocked = false;
                const memberIds = [];
                let adminId = null;
                let isSupportGroup = false;
                /* Admin(1),
                SubAdmin(2),
                Member(0)*/
                let memberStatus = 0;
                if (groupId && groupId === "study_group_faq") {
                    return (ctx.meta.user.locale === "hi" ? studygroupData.faqGroupInfoHi : studygroupData.faqGroupInfoEn);
                }
                this.settings.message = "Group is enabled for communications";
                let members = [];
                let totalGroupMembers;

                const data = await redisUtility.getHashField.call(this, groupId, "GROUP_INFO");
                // checking the attributes from redis first, if not available then sql will be performed
                if (!_.isNull(data)) {
                    members = data.members;
                    totalGroupMembers = members.length;
                    groupInfo = data.groupInfo;
                    groupInfo.group_image = (groupInfo.group_type === 5 ? studygroupData.dnSupportIcon : studygroupData.defaultGroupImage);
                    groupName = data.groupName;
                    groupBanStatus = data.groupBanStatus;
                    onlyActiveMembers = _.filter(data.members, user => user.is_active === 1);
                } else {
                    const groupData = await this.broker.call("$studygroupMysql.getGroupInfo", {groupId});
                    onlyActiveMembers = _.filter(groupData, user => user.is_active === 1);
                    totalGroupMembers = onlyActiveMembers.length;
                    members = this.getGroupMembers(groupData);
                    const admin = _.filter(members, item => item.is_admin === 1 && item.is_active === 1);
                    const subAdmin = _.filter(members, item => item.is_admin === 2 && item.is_active === 1);
                    const generalMembers = _.filter(members, item => item.is_admin === 0 && item.is_active === 1);
                    members = [...admin, ...subAdmin, ...generalMembers];

                    if (totalGroupMembers >= 1) {
                        groupInfo = {
                            group_type: groupData[0].group_type,
                            group_id: groupData[0].group_id,
                            group_name: unescape(groupData[0].group_name),
                            group_image: (groupData[0].group_type === 5 ? studygroupData.dnSupportIcon : studygroupData.defaultGroupImage),
                            // group_image: (groupData[0].group_image === null ? studygroupData.defaultGroupImage : groupData[0].group_image),
                            group_created_at: moment(groupData[0].group_created_at).add(5, "hours").add(30, "minutes").toDate(),
                            subtitle: null,
                            only_sub_admin_can_post: Boolean(!groupData[0].can_member_post),
                            is_paid_group: groupData[0].group_type === 3,
                        };
                        groupName = unescape(groupData[0].group_name);
                        const isGroupBannedData = await this.broker.call("$studygroupMysql.getGroupBanData", {groupId});
                        if (isGroupBannedData.length && !_.isNull(isGroupBannedData[0].status)) {
                            groupBanStatus = isGroupBannedData[0].status;
                        }

                        const obj = {
                            members,
                            groupInfo,
                            groupName,
                            groupBanStatus,
                        };
                        await redisUtility.addHashField.call(this, groupId, "GROUP_INFO", obj, this.settings.monthlyRedisTTL);
                    }
                }
                if (groupInfo && ((groupInfo.group_type || 1) === 2 || (groupInfo.group_type || 1) === 3) && groupInfo.only_sub_admin_can_post) {
                    this.settings.message = ctx.meta.user.locale === "hi" ? studygroupData.groupInfo.onlySubAdminCanPostMessage.hi : studygroupData.groupInfo.onlySubAdminCanPostMessage.en;
                    groupMinimumMemberWarningMessage = this.settings.message;
                }

                if (groupInfo && (groupInfo.group_type || 1) === 5){
                    isSupportGroup = true;
                }

                    const currentMemberDetails = onlyActiveMembers.filter(item => item.student_id === ctx.meta.user.id);
                const isMember = Boolean(currentMemberDetails.length && currentMemberDetails[0].is_active);

                let OnlySubAdminCanPostContainer = null;
                if (isMember && groupInfo && ((groupInfo.group_type || 1) === 2 || (groupInfo.group_type || 1) === 3)) {
                    // input box wouldn't come, if only_sub_admin_can_post is true
                    if (groupInfo.only_sub_admin_can_post && currentMemberDetails[0].is_admin === 0) {
                        isGroupEnabled = false;
                        this.settings.message = ctx.meta.user.locale === "hi" ? studygroupData.groupInfo.onlySubAdminCanPostMessage.hi : studygroupData.groupInfo.onlySubAdminCanPostMessage.en;
                        groupMinimumMemberWarningMessage = this.settings.message;
                    }

                    if (currentMemberDetails[0].is_admin !== 0) {
                        OnlySubAdminCanPostContainer = ctx.meta.user.locale === "hi" ? studygroupData.groupInfo.OnlySubAdminCanPostContainer.hi : studygroupData.groupInfo.OnlySubAdminCanPostContainer.en;
                        OnlySubAdminCanPostContainer.toggle = groupInfo.only_sub_admin_can_post || false;
                        OnlySubAdminCanPostContainer.message = this.getSettingUpdateMessage(this.createChatName(ctx.meta.user.student_fname, ctx.meta.user.student_lname),);
                    }
                    remainingSubAdminCount = this.settings.TOTAL_SUB_ADMINS_PER_PUBLIC_GROUP - (_.filter(members, item => item.is_admin === 2)).length;
                }

                if (isMember && currentMemberDetails[0].is_admin !== 0) {
                    canEditGroupInfo = true;
                    groupMinimumMemberWarningMessage = null;
                }

                const isBlocked = _.filter(members, user => user.student_id === ctx.meta.user.id);
                if (!_.isEmpty(isBlocked) && isBlocked[0].is_blocked) {
                    isGroupEnabled = false;
                    isMemberBlocked = true;
                    this.settings.message = ctx.meta.user.locale === "hi" ? studygroupData.groupBlockedMemberMessageHi : studygroupData.groupBlockedMemberMessageEn;
                    groupMinimumMemberWarningMessage = ctx.meta.user.locale === "hi" ? studygroupData.groupBlockedMemberMessageHi : studygroupData.groupBlockedMemberMessageEn;
                }

                if (totalGroupMembers === 0) {
                    isGroupActive = false;
                }

                if (totalGroupMembers < this.settings.MIN_MEMBERS_IN_GROUP_TO_ENABLE_COMMUNICATION) {
                    isGroupEnabled = false;
                    this.settings.message = "Sorry, this group is not available.";
                    groupMinimumMemberWarningMessage = ctx.meta.user.locale === "hi" ? studygroupData.deactivatedGroupMessage.hi : studygroupData.deactivatedGroupMessage.en;
                    groupInfo = studygroupData.deactivatedGroup;
                }

                let inviteUrl = await redisUtility.getHashField.call(this, groupId, `${ctx.meta.user.id}_INVITE`);
                if (_.isNull(inviteUrl) && groupInfo) {
                    inviteUrl = await this.generateStudyGroupBranchLink(groupId, groupName, groupInfo.group_image, ctx);
                    if (inviteUrl) {
                        await redisUtility.addHashField.call(this, groupId, `${ctx.meta.user.id}_INVITE`, inviteUrl, this.settings.monthlyRedisTTL);
                    }
                }
                const isMute = await this.isGroupMute(groupId, ctx.meta);

                if (!_.isNull(groupBanStatus)) {
                    // first checking if group is banned [level: REPORT]
                    reportBottomSheet = await this.getGroupBanBottomSheet(groupBanStatus, ctx.meta);
                } else if (isMember && parseInt(ctx.meta.versionCode, 10) >= 926) {
                    // checking if user is banned [level: REPORT]
                    reportBottomSheet = await this.isUserBanned(groupId, groupInfo.pk, members, ctx.meta);
                    if (_.isNull(reportBottomSheet)) {
                        // checking for warnings if any member has been reported for message/member/group [level: WARNING]
                        reportBottomSheet = await this.getMemberWarningBottomSheet(groupId, ctx.meta);
                        if (!_.isNull(reportBottomSheet)) {
                            // not null means, member was reported
                            await redisUtility.deleteHashField.call(this, groupId, `REPORT:${ctx.meta.user.id}`);
                        }
                    }
                }
                for (let i = 0; i <= members.length; i++) {
                    if (members[i] && members[i].student_id && members[i].is_active === 1) {
                        memberIds.push(members[i].student_id);
                        if (members[i].is_admin === 1) {
                            adminId = members[i].student_id;
                        }
                        if (members[i].student_id === ctx.meta.user.id) {
                            memberStatus = members[i].is_admin;
                        }
                    }
                }
                return {
                    title: ctx.meta.user.locale === "hi" ? studygroupData.groupInfo.title.hi : studygroupData.groupInfo.title.en,
                    group_data: {group_info: groupInfo, members },
                    can_edit_group_info: canEditGroupInfo,
                    is_mute: isMute,
                    is_member: isMember,
                    is_group_enabled: isGroupEnabled,
                    is_group_active: isGroupActive,
                    member_title: this.getMemberTitle("hi", totalGroupMembers, ctx.meta),
                    remaining_sub_admin_count: remainingSubAdminCount,
                    only_sub_admin_can_post_container: OnlySubAdminCanPostContainer,
                    is_faq: isFaq,
                    message: this.settings.message,
                    group_guideline: (ctx.meta.user.locale === "hi" ? studygroupData.groupGuideLineHi : studygroupData.groupGuideLineEn),
                    know_more_text: (ctx.meta.user.locale === "hi" ? studygroupData.knowMoreTextHi : studygroupData.knowMoreTextEn),
                    know_more_deeplink: studygroupData.knowMoreDeeplink,
                    group_minimum_member_warning_message: groupMinimumMemberWarningMessage,
                    faq_deeplink: studygroupData.faqDeeplink,
                    invite_text: this.getInviteText(this.createChatName(ctx.meta.user.student_fname, ctx.meta.user.student_lname), groupName, inviteUrl),
                    report_reasons: ctx.meta.user.locale === "hi" ? studygroupData.reportReasons.hi : studygroupData.reportReasons.en,
                    report_bottom_sheet: reportBottomSheet,
                    notification_id: parseInt(groupId.replace(/\D/g, "").slice(0, 8), 10),
                    gif_container: studygroupData.gifDisable,
                    member_ids: memberIds,
                    is_blocked: isMemberBlocked,
                    admin_id: adminId,
                    member_status: memberStatus,
                    is_support: isSupportGroup,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async groupMembers(page, groupId, ctx) {
            try {
                let members = [];
                const offset = page * this.settings.TOTAL_MEMBERS_SHOWN_PER_PAGE;
                const limit = offset + this.settings.TOTAL_MEMBERS_SHOWN_PER_PAGE;
                const data = await redisUtility.getHashField.call(this, groupId, "GROUP_INFO");
                // checking the attributes from redis first, if not available then sql will be performed
                if (!_.isNull(data)) {
                    members = data.members.slice(offset, limit);
                } else {
                    const groupData = await this.broker.call("$studygroupMysql.getPaginatedGroupMembers", {groupId, limit, offset});
                    members = this.getGroupMembers(groupData);
                }
                return {
                    members,
                    page: page + 1,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async updateGroupDetails(groupId, field) {
            try {
                if (groupId.startsWith("sg-") || groupId.startsWith("USER:")) {
                    await redisUtility.deleteHashField.call(this, groupId, field);
                }
                return true;
            } catch (e) {
                return false;
            }
        },

        getGroupMembers(groupData) {
            const members = [];
            for (let i = 0; i <= groupData.length; i++) {
                if (groupData[i] && groupData[i].name) {
                    members.push({
                        is_admin: groupData[i].is_admin,
                        name: groupData[i].name,
                        image: null,
                        // image: groupData[i].image,
                        student_id: groupData[i].student_id,
                        is_blocked: groupData[i].is_blocked,
                        is_left: groupData[i].is_left,
                        is_active: groupData[i].is_active,
                    });
                }
            }
            return members;
        },

        getSettingUpdateMessage(studentName) {
            return {
                true: `${studentName} changed this group settings to allow only admins to send messages to this group`,
                false: `${studentName} changed this group settings to allow all members to send messages to this group`,
            };
        },

        getInviteText(studentName, groupName, inviteUrl) {
            return `${studentName} Invited you to their study group ${unescape(groupName)}. Accept the invite to study together.\n${inviteUrl}`;
        },
    },
};

export = StudyGroupInfoService;
