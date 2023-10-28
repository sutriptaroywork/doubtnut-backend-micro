/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import {redisUtility} from "../../../../common";
import studyGroupData from "../../data/report.data";
import StudyGroupResponseStructureService from "./response.structure";
import StudyGroupContainerActionsService from "./container.actions";

const StudyGroupReportDashboardService: ServiceSchema = {
    name: "$studygroup-report-dashboard",
    mixins: [StudyGroupResponseStructureService, StudyGroupContainerActionsService],
    methods: {
        async getAdminDashboard(page: number, roomId: string, ctx: any) {
            try {
                let response;
                if (page === 0) {
                    const redisData = await redisUtility.getHashField.call(this, roomId, "DASHBOARD");
                    if (!_.isNull(redisData)) {
                        response = redisData;
                    } else {
                        const reportedMessages = await this.getReportedMessages(page, roomId, ctx);
                        const reportedMembers = await this.getReportedMembers(page, roomId, ctx);
                        const reportedGroup = await this.getReportedGroup(roomId, ctx);
                        const data = [...reportedMessages, ...reportedMembers, ...reportedGroup];
                        response = _.orderBy(data, "widget_data.reported_at", "desc");
                        if (data.length) {
                            await redisUtility.addHashField.call(this, roomId, "DASHBOARD", response, this.settings.monthlyRedisTTL);
                        }
                    }
                } else {
                    const reportedMessages = await this.getReportedMessages(page, roomId, ctx);
                    const reportedMembers = await this.getReportedMembers(page, roomId, ctx);
                    const data = [...reportedMessages, ...reportedMembers];
                    response = _.orderBy(data, "widget_data.reported_at", "desc");
                }

                const groupInfo = await redisUtility.getHashField.call(this, roomId, "GROUP_INFO");
                if (!_.isNull(groupInfo)) {
                    const activeMembers = _.filter(groupInfo.members, user => user.is_active === 1);
                    response = response.filter(item => !_.includes(activeMembers, item.widget_data.student_id));
                }

                return response;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async getReportedMessages(page, roomId, ctx) {
            try {
                const reportedMessagesSenderWise = await this.adapter.db.collection(this.settings.reportedMessageCollection).aggregate([
                    {$match: {room_id: roomId, is_removed: false}},
                    {$sort: {_id: -1}},
                    {$group: {_id: "$sender_id", reported_messages: {$sum: 1}, message_ids: {$push: "$message_id"}}},
                    {$skip: page * this.settings.dashboard_pagination_ratio.messages},
                    {$limit: this.settings.dashboard_pagination_ratio.messages},
                ]).toArray();

                const messageIds = reportedMessagesSenderWise.map(messageData => messageData.message_ids[0]);
                const reportedReason = await this.adapter.db.collection(this.settings.reportedMessageCollection).aggregate([
                    {$match: {message_id: {$in: messageIds}}},
                    {
                        $group: {
                            _id: "$message_id",
                            reports: {$sum: 1},
                            reasons: {$push: "$reason"},
                            sender_id: {$first: "$sender_id"},
                            reported_at: {$first: "$reported_at"},
                        },
                    },
                    {$sort: {reported_at: -1}},
                ]).toArray();

                const messageCollectionName = roomId.split("-")[0] === "sg" ? this.settings.messageCollection : this.settings.publicMessageCollection;
                const messageDetails = await this.adapter.db.collection(messageCollectionName).find({
                    _id: {$in: messageIds},
                }).toArray();

                const messageList = reportedMessagesSenderWise.map(t1 => ({...t1, ...reportedReason.find(t2 => t1._id === t2.sender_id)}));
                const reportedMessages = messageDetails.map(t1 => ({...t1, ...messageList.find(t2 => (t2._id).toString() === (t1._id).toString())}));

                const messages = [];
                for (const messageData of reportedMessages) {

                    const {
                        title,
                        containerData,
                        childWidget,
                        primaryCta,
                        secondaryCta,
                        viewMore,
                        studentName,
                    } = this.messageResponse(messageData, "dashboard", ctx);

                    messages.push(this.responseStructure({
                        childWidget,
                        title,
                        warningMessage: null,
                        viewMore,
                        reasons: messageData.reasons,
                        reportedAt: messageData.reported_at,
                        primaryCta,
                        secondaryCta,
                        containerData,
                        student_id: messageData.student_id,
                        studentName,
                    }, ctx));
                }
                return messages;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getReportedMembers(page, roomId, ctx) {
            try {
                const reportedMembers = await this.adapter.db.collection(this.settings.reportedMemberCollection).aggregate([
                    {$match: {room_id: roomId, is_removed: false}},
                    {$sort: {_id: -1}},
                    {
                        $group: {
                            _id: "$reported_student_id",
                            reports: {$sum: 1},
                            reasons: {$push: "$reason"},
                            reported_at: {$first: "$reported_at"},
                            reported_student_name: {$first: "$reported_student_name"},
                        },
                    },
                    {$skip: page * this.settings.dashboard_pagination_ratio.messages},
                    {$limit: this.settings.dashboard_pagination_ratio.messages},
                ]).toArray();

                const viewMore = {
                    isViewMoreAvailable: false,
                    viewMoreContainer: null,
                };
                const members = [];
                for (const member of reportedMembers) {
                    let studentName = this.settings.getCorrectedName(member.reported_student_name);
                    if (member._id === ctx.user.id) {
                        studentName = ctx.user.locale === "hi" ? "आप" : "You";
                    }
                    const containerData = {
                        container_id: member._id,
                        container_type: "member",
                    };
                    const title = (ctx.user.locale === "hi" ? studyGroupData.title.member.hi : studyGroupData.title.member.en).replace("{reports}", member.reports).replace("{name}", studentName);
                    const primaryCta = this.ctaButtonResponse("block_cta", studentName, ctx);
                    primaryCta.sender_id = member._id;

                    members.push(this.responseStructure({
                        childWidget: null,
                        title,
                        warningMessage: null,
                        viewMore,
                        reasons: member.reasons,
                        reportedAt: member.reported_at,
                        primaryCta,
                        secondaryCta: null,
                        containerData,
                        student_id: member._id,
                        studentName,
                    }, ctx));
                }
                return members;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getReportedGroup(roomId, ctx) {
            try {
                const reportedGroup = await this.adapter.db.collection(this.settings.reportedGroupCollection).aggregate([
                    {$match: {room_id: roomId, is_removed: false}},
                    {$sort: {_id: -1}},
                    {
                        $group: {
                            _id: "$room_id",
                            reports: {$sum: 1},
                            reasons: {$push: "$reason"},
                            reported_at: {$first: "$reported_at"},
                        },
                    },
                ]).toArray();

                const response = [];
                if (reportedGroup.length) {
                    const viewMore = {
                        isViewMoreAvailable: false,
                        viewMoreContainer: null,
                    };
                    const primaryCta = {
                        title: ctx.user.locale === "hi" ? studyGroupData.block_multiple_cta.title.hi : studyGroupData.block_multiple_cta.title.en,
                        deeplink: (parseInt(ctx.versionCode, 10) >= 946 ? studyGroupData.block_multiple_cta.deeplinkV2 : studyGroupData.block_multiple_cta.deeplink).replace("{room_id}", roomId),
                    };
                    const containerData = {
                        container_id: roomId,
                        container_type: "group",
                    };
                    const title = (ctx.user.locale === "hi" ? studyGroupData.title.group.hi : studyGroupData.title.group.en).replace("{reports}", reportedGroup[0].reports);
                    const warningMessage = ctx.user.locale === "hi" ? studyGroupData.warning_message.hi : studyGroupData.warning_message.en;

                    response.push(this.responseStructure({
                        childWidget: null,
                        title,
                        warningMessage,
                        viewMore,
                        reasons: reportedGroup[0].reasons,
                        reportedAt: reportedGroup[0].reported_at,
                        primaryCta,
                        secondaryCta: null,
                        containerData,
                        student_id: this.student_id,
                        studentName: null,
                    }, ctx));
                }
                return response;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getStudentReportedMessages(reportedStudentId, roomId, page, ctx) {
            try {
                const reportedMessages = await this.adapter.db.collection(this.settings.reportedMessageCollection).aggregate([
                    {$match: {sender_id: reportedStudentId, room_id: roomId, is_removed: false}},
                    {$sort: {_id: -1}},
                    {
                        $group: {
                            _id: "$message_id",
                            reports: {$sum: 1},
                            reasons: {$push: "$reason"},
                            sender_id: {$first: "$sender_id"},
                            reported_at: {$first: "$reported_at"},
                        },
                    },
                    {$skip: page * this.settings.pageSize},
                    {$limit: this.settings.pageSize},
                ]).toArray();
                const messageIds = reportedMessages.map(message => message._id);
                const messageCollectionName = roomId.split("-")[0] === "sg" ? this.settings.messageCollection : this.settings.publicMessageCollection;
                const messageDetails = await this.adapter.db.collection(messageCollectionName).find({_id: {$in: messageIds}}).toArray();

                const messageList = messageDetails.map(t1 => ({...t1, ...reportedMessages.find(t2 => (t2._id).toString() === (t1._id).toString())}));

                const messages = [];
                let actualName = "Doubtnut User";
                for (const messageData of messageList) {

                    const {
                        title,
                        containerData,
                        childWidget,
                        primaryCta,
                        secondaryCta,
                        viewMore,
                        studentName,
                    } = this.messageResponse(messageData, "view_more", ctx);

                    messages.push(this.responseStructure({
                        childWidget,
                        title,
                        warningMessage: null,
                        viewMore,
                        reasons: messageData.reasons,
                        reportedAt: messageData.reported_at,
                        primaryCta,
                        secondaryCta,
                        containerData,
                        student_id: messageData.student_id,
                        studentName,
                    }, ctx));

                    actualName = studentName;
                }

                const widgetPrimaryCta = this.ctaButtonResponse("delete_multiple_cta", actualName, ctx);
                widgetPrimaryCta.message_id = null;

                const widgetSecondaryCta = this.ctaButtonResponse("block_cta", actualName, ctx);
                widgetSecondaryCta.sender_id = reportedStudentId;

                return {
                    messageContainer: _.orderBy(messages, "widget_data.reported_at", "desc"),
                    primary_cta: widgetPrimaryCta,
                    secondary_cta: widgetSecondaryCta,
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getStickyBar(adminId, roomId, ctx) {
            try {
                let title = null;
                let isStickyAvailable = false;
                let isReportAvailable = false;
                const deeplink = studyGroupData.dashboardDeeplink.replace("{room_id}", roomId);
                // checking if logged in user is admin
                if (adminId === ctx.user.id) {
                    const stickyExist = await redisUtility.getHashField.call(this, roomId, "STICKY");
                    if (!_.isNull(stickyExist)) {
                        const redisData = await this.getAdminDashboard(0, roomId, ctx);
                        if (!_.isEmpty(redisData)) {
                            const containerType = redisData[0].widget_data.container_type;
                            title = (ctx.user.locale === "hi" ? studyGroupData.stickyBar[containerType].hi : studyGroupData.stickyBar[containerType].en).replace("{name}", redisData[0].widget_data.student_name);
                            isStickyAvailable = true;
                            isReportAvailable = true;
                        }
                        await redisUtility.deleteHashField.call(this, roomId, "STICKY");
                    }
                }

                return {
                    isStickyAvailable,
                    isReportAvailable,
                    title,
                    deeplink,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyGroupReportDashboardService;
