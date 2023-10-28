import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import {ObjectId} from "mongodb";
import {redisUtility} from "../../../../common";
import StudyGroupBanService from "../general/ban";

const StudyGroupReportService: ServiceSchema = {
    name: "$studygroup-report",
    mixins: [StudyGroupBanService],
    methods: {

        async reportMessage(reportData, ctx) {
            try {
                reportData.sender_id = parseInt(reportData.sender_id, 10);
                reportData.reported_by = ctx.user.id;
                const currentDate = moment().add(5, "hours").add(30, "minutes");
                reportData.reported_at = currentDate.toISOString();
                reportData.updated_at = currentDate.toISOString();
                reportData.is_removed = false;
                reportData.is_action_taken = false;

                const totalMembers = await this.broker.call("$studygroupMysql.getTotalMembers", {groupId: reportData.room_id});
                const groupType = reportData.room_id.split("-")[0] === "sg" ? 1 : 2;
                const messageCollectionName = groupType === 1 ? this.settings.messageCollection : this.settings.publicMessageCollection;
                if (_.isNull(reportData.message_id)) {
                    // instant send and report (directly fetched through socket)
                    const message = await this.adapter.db.collection(messageCollectionName).findOne({
                        millis: reportData.millis,
                        student_id: reportData.sender_id,
                        room_id: reportData.room_id,
                    });
                    // eslint-disable-next-line no-underscore-dangle
                    reportData.message_id = new ObjectId(message._id);
                } else {
                    // reported from list message api response
                    reportData.message_id = new ObjectId(reportData.message_id);
                }
                const promise = [];
                // inserting new document only if it doesn't exist, based on message_id & reported_by
                promise.push(this.adapter.db.collection(this.settings.reportedMessageCollection).updateOne({
                    message_id: reportData.message_id,
                    reported_by: reportData.reported_by,
                }, {$set: reportData}, {upsert: true}));
                await Promise.all(promise);

                const reportCount = await this.adapter.db.collection(this.settings.reportedMessageCollection).countDocuments({
                    sender_id: reportData.sender_id,
                    room_id: reportData.room_id,
                    reported_at: {
                        $gte: currentDate.subtract(this.settings.REPORT_PERIOD, "days").toISOString(),
                    },
                });

                const minMessageReportCount = groupType === 1 ? this.settings.minGroupReportCountPrivate(totalMembers[0].total_members, this.settings.PERCENT_REPORT_PRIVATE) : this.settings.minGroupReportCountPublic(totalMembers[0].total_members, this.settings.PERCENT_REPORT_PUBLIC);

                if (reportCount >= minMessageReportCount) {
                    this.setBan(reportData.sender_id, reportData.room_id);
                    reportData.is_removed = true;
                    reportData.is_action_taken = true;
                    reportData.action = "BLOCK";
                    // meesage ban
                    await this.adapter.db.collection(this.settings.reportedMessageCollection).updateOne({
                        message_id: reportData.message_id,
                        reported_by: reportData.reported_by,
                    }, {$set: reportData}, {upsert: true});
                }

                // setting cache will show pop up in group_info api
                await redisUtility.addHashField.call(this, reportData.room_id, `REPORT:${reportData.sender_id}`, 1, this.settings.monthlyRedisTTL); // 1 shows message is reported
                await redisUtility.addHashField.call(this, reportData.room_id, "STICKY", 1, this.settings.monthlyRedisTTL); // 1 shows sticky is present

                // to delete previous admin dashboard cache
                await redisUtility.deleteHashField.call(this, reportData.room_id, "DASHBOARD");
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async reportMember(reportData, ctx) {
            try {
                reportData.reported_by = ctx.user.id;
                reportData.reported_student_id = parseInt(reportData.reported_student_id, 10);
                reportData.reported_student_name = reportData.reported_student_name ? reportData.reported_student_name.replace(/\r?\n|\r/g, " ").replace(/ +/g, " ") : "Doubtnut User";
                const currentDate = moment().add(5, "hours").add(30, "minutes");
                reportData.reported_at = currentDate.toISOString();
                reportData.updated_at = currentDate.toISOString();
                reportData.is_removed = false;
                reportData.is_action_taken = false;

                // inserting new document only if it doesn't exist, based on reported_student_id & reported_by & room_id
                await this.adapter.db.collection(this.settings.reportedMemberCollection).updateOne({
                    reported_by: reportData.reported_by,
                    reported_student_id: reportData.reported_student_id,
                    room_id: reportData.room_id,
                }, {$set: reportData}, {upsert: true});

                const totalMembers = await this.broker.call("$studygroupMysql.getTotalMembers", {groupId: reportData.room_id});
                const reportCount = await this.adapter.db.collection(this.settings.reportedMemberCollection).countDocuments({
                    reported_student_id: reportData.reported_student_id,
                    room_id: reportData.room_id,
                    reported_at: {
                        $gte: currentDate.subtract(this.settings.REPORT_PERIOD, "days").toISOString(),
                    },
                });

                const minMemberReportCount = reportData.room_id.split("-")[0] === "sg" ? this.settings.minGroupReportCountPrivate(totalMembers[0].total_members, this.settings.PERCENT_REPORT_PRIVATE) : this.settings.minGroupReportCountPublic(totalMembers[0].total_members, this.settings.PERCENT_REPORT_PUBLIC);
                if (reportCount >= minMemberReportCount) {
                    // to ban the student from using study group feature
                    this.setBan(reportData.reported_student_id, reportData.room_id);
                    reportData.is_removed = true;
                    reportData.is_action_taken = true;
                    reportData.action = "BLOCK";
                    // member ban
                    await this.adapter.db.collection(this.settings.reportedMemberCollection).updateOne({
                        reported_by: reportData.reported_by,
                        reported_student_id: reportData.reported_student_id,
                        room_id: reportData.room_id,
                    }, {$set: reportData}, {upsert: true});
                }
                // This redis cache will show pop up in group_info api
                await redisUtility.addHashField.call(this, reportData.room_id, `REPORT:${reportData.reported_student_id}`, 2, this.settings.monthlyRedisTTL); // 2 shows member is reported
                await redisUtility.addHashField.call(this, reportData.room_id, "STICKY", 1, this.settings.monthlyRedisTTL); // 1 shows sticky is present

                // to delete previous admin dashboard cache
                await redisUtility.deleteHashField.call(this, reportData.room_id, "DASHBOARD");
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async reportGroup(reportData, ctx) {
            try {
                reportData.admin_id = parseInt(reportData.admin_id, 10);
                reportData.reported_by = ctx.user.id;
                const currentDate = moment().add(5, "hours").add(30, "minutes");
                reportData.reported_at = currentDate.toISOString();
                reportData.updated_at = currentDate.toISOString();
                reportData.is_removed = false;
                reportData.is_action_taken = false;

                const totalMembers = await this.broker.call("$studygroupMysql.getTotalMembers", {groupId: reportData.room_id});
                // inserting new document only if it doesn't exist, based on room_id & reported_by
                await this.adapter.db.collection(this.settings.reportedGroupCollection).updateOne({
                    room_id: reportData.room_id,
                    reported_by: reportData.reported_by,
                }, {$set: reportData}, {upsert: true});

                const reportCount = await this.adapter.db.collection(this.settings.reportedGroupCollection).countDocuments({
                    room_id: reportData.room_id,
                    reported_at: {
                        $gte: currentDate.subtract(this.settings.REPORT_PERIOD, "days").toISOString(),
                    },
                });
                const minGroupReportCount = reportData.room_id.split("-")[0] === "sg" ? this.settings.minGroupReportCountPrivate(totalMembers[0].total_members, this.settings.PERCENT_REPORT_PRIVATE) : this.settings.minGroupReportCountPublic(totalMembers[0].total_members, this.settings.PERCENT_REPORT_PRIVATE);
                if (reportCount >= minGroupReportCount) {
                    // to ban the student from using study group feature
                    this.setBan(null, reportData.room_id);
                    reportData.is_removed = true;
                    reportData.is_action_taken = true;
                    reportData.action = "BLOCK";
                    // group ban
                    await this.adapter.db.collection(this.settings.reportedGroupCollection).updateOne({
                        room_id: reportData.room_id,
                        reported_by: reportData.reported_by,
                    }, {$set: reportData}, {upsert: true});
                }
                // This sql query will show pop up in group_info api
                await redisUtility.addHashField.call(this, reportData.room_id, `REPORT:${reportData.admin_id}`, 3, this.settings.monthlyRedisTTL); // 3 shows group is reported
                await redisUtility.addHashField.call(this, reportData.room_id, "STICKY", 1, this.settings.monthlyRedisTTL); // 1 shows sticky is present

                // to delete previous admin dashboard cache
                await redisUtility.deleteHashField.call(this, reportData.room_id, "DASHBOARD");
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyGroupReportService;
