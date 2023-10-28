import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import studGroupData from "../../data/studygroup.data";
import {redisUtility} from "../../../../common";
import StudyGroupActionService from "./group.actions";

const StudyGroupBanService: ServiceSchema = {
    name: "$studygroup-ban",
    mixins: [StudyGroupActionService],
    methods: {

        async setBan(studentId: number, roomId: string) {

            /* 1. group ban
            2. student ban from any specific group */

            try {
                const banStatus = await this.broker.call("$studygroupMysql.checkBan", {
                    student_id: studentId,
                    study_group_id: roomId,
                });
                if (_.isEmpty(banStatus)) {
                    this.broker.call("$studygroupMysql.ban", {student_id: studentId, study_group_id: roomId});
                } else if (banStatus.status === 2) {
                    // previously user was approved
                    this.broker.call("$studygroupMysql.updateBan", {
                        student_id: studentId,
                        study_group_id: roomId,
                        updated_at: this.settings.currentDate,
                    });
                }
                await Promise.all([redisUtility.deleteHashField.call(this, roomId, "GROUP_INFO"),
                    redisUtility.deleteHashField.call(this, `USER:${studentId}`, "LIST_GROUPS"),
                    redisUtility.deleteHashField.call(this, `USER:${studentId}`, "GROUP_INVITE_COUNT")]);
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async isUserBanned(groupId: string, groupPk: number, members: any, ctx: any) {
            // banned stage
            // groupPk : pk of study_group table
            /* review status:
                0. banned
                1. requested
                2. approved
                3. rejected */
            let popupData = null;
            const redisKey = `BANNED:${ctx.user.id}`;
            let data = await redisUtility.getHashField.call(this, groupId, redisKey);
            if (_.isNull(data)) {
                data = await this.broker.call("$studygroupMysql.getUserBanData", {
                    studentId: ctx.user.id,
                    groupId,
                });
                if (!data.length) {
                    return popupData;
                }
                await redisUtility.addHashField.call(this, groupId, redisKey, data, this.settings.monthlyRedisTTL);
            }
            if (data.length && !_.isNull(data[0].status)) {
                const banStatus = data[0].status;
                // banStatus === 2 : approved state
                if (banStatus === 0) {
                    // banned state
                    popupData = ctx.user.locale === "hi" ? studGroupData.reportPopup.memberBanned.hi : studGroupData.reportPopup.memberBanned.en;
                } else if (banStatus === 1) {
                    // requested state
                    popupData = ctx.user.locale === "hi" ? studGroupData.reportPopup.memberRequested.hi : studGroupData.reportPopup.memberRequested.en;
                } else if (banStatus === 3) {
                    // rejected state
                    popupData = ctx.user.locale === "hi" ? studGroupData.reportPopup.memberRejected.hi : studGroupData.reportPopup.memberRejected.en;
                    if (groupPk) {
                        // permanently blocking from the group.
                        const studentData = _.filter(members, user => user.student_id === ctx.user.id);
                        if (studentData.length && studentData[0].is_admin) {
                            await this.broker.call("$studygroupMysql.blockAdmin", {
                                blockedBy: 0,
                                groupId: groupPk,
                                studentId: ctx.user.id,
                            });
                            const nextAdminStudentId = await this.getNextAdmin(members);
                            if (nextAdminStudentId) {
                                await this.broker.call("$studygroupMysql.assignNewAdmin", {
                                    groupId: groupPk,
                                    studentId: nextAdminStudentId,
                                });
                            } else {
                                this.settings.message = "Unable to assign new admin, some error occurred!";
                            }
                        } else {
                            await this.broker.call("$studygroupMysql.blockMember", {
                                blockedBy: 0,
                                groupId: groupPk,
                                studentId: ctx.user.id,
                            });
                        }
                        await Promise.all([
                            redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO"),
                            redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "GROUP_INVITE_COUNT"),
                            redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_GROUPS"),
                            this.removeReportedContainersAfterAction(ctx.user.id, groupId, "BLOCK")]);
                    }
                }
            }
            if (popupData) {
                popupData.image = studGroupData.reportPopup.image;
            }
            return popupData;
        },

        async getGroupBanBottomSheet(banStatus: number, ctx: any) {
            // banned stage
            /* review status:
                0. banned
                1. requested
                2. approved
                3. rejected */
            let popupData = null;
            if (banStatus === 0) {
                // banned state
                popupData = ctx.user.locale === "hi" ? studGroupData.reportPopup.groupBanned.hi : studGroupData.reportPopup.groupBanned.en;
                popupData.image = studGroupData.reportPopup.image;
            } else if (banStatus === 1) {
                // requested state
                popupData = ctx.user.locale === "hi" ? studGroupData.reportPopup.groupRequested.hi : studGroupData.reportPopup.groupRequested.en;
                popupData.image = studGroupData.reportPopup.image;
            } else if (banStatus === 2) {
                // approved state
                popupData = null;
            } else if (banStatus === 3) {
                // rejected state
                popupData = ctx.user.locale === "hi" ? studGroupData.reportPopup.groupRejected.hi : studGroupData.reportPopup.groupRejected.en;
                popupData.image = studGroupData.reportPopup.image;
            }
            return popupData;
        },

        async getMemberWarningBottomSheet(groupId: string, ctx: any) {
            // warning stage
            let popupData = null;
            const warningType = await redisUtility.getHashField.call(this, groupId, `REPORT:${ctx.user.id}`);
            if (!_.isNull(warningType)) {
                if (warningType === 1) {
                    // message report
                    popupData = ctx.user.locale === "hi" ? studGroupData.reportPopup.message.hi : studGroupData.reportPopup.message.en;
                } else if (warningType === 2) {
                    // member report
                    popupData = ctx.user.locale === "hi" ? studGroupData.reportPopup.member.hi : studGroupData.reportPopup.member.en;
                } else if (warningType === 3) {
                    // group report
                    popupData = ctx.user.locale === "hi" ? studGroupData.reportPopup.group.hi : studGroupData.reportPopup.group.en;
                }
            }
            if (popupData) {
                popupData.image = studGroupData.reportPopup.image;
            }
            return popupData;
        },

        async requestUnban(groupId: string, type: number, ctx: any) {
            try {
                this.settings.message = "Request submitted successfully";
                if (type === 0) {
                    // for group unban
                    await this.broker.call("$studygroupMysql.requestGroupUnban", {
                        groupId,
                        timestamp: this.settings.currentDate,
                    });
                    await Promise.all([
                        redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO"),
                        redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "GROUP_INVITE_COUNT"),
                        redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_GROUPS")]);
                } else if (type === 1) {
                    // for member unban
                    await this.broker.call("$studygroupMysql.requestUnban", {
                        studentId: ctx.user.id,
                        groupId,
                        timestamp: this.settings.currentDate,
                    });
                    await Promise.all([
                        redisUtility.deleteHashField.call(this, groupId, `BANNED:${ctx.user.id}`),
                        redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "GROUP_INVITE_COUNT"),
                        redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_GROUPS")]);
                }
                return {message: this.settings.message};
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async userBannedStatus(ctx: any) {
            try {
                const data = { bottom_sheet: null, is_banned: false };
                this.settings.message = "Request submitted successfully";
                const isStudentBanned = await this.broker.call("$studygroupMysql.isStudentBanned", {
                    studentId: ctx.user.id,
                });
                if (isStudentBanned[0].banned === 1) {
                    data.bottom_sheet =
                    {
                        image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/445C8F85-B25F-3DBD-FC89-30B1FEF8F2F2.webp",
                        heading: "Study Group is blocked for you",
                        description: "You were using offensive & vulgar language and so, study group has been blocked for you.",
                        cta_text: "Go Back",
                    };
                    data.is_banned = true;
                }
                return data;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyGroupBanService;
