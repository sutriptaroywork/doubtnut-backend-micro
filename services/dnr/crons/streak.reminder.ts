import {ServiceSchema} from "dn-moleculer";
import moment from "moment";

const StreakReminderCronSchema: ServiceSchema = {
    name: "$streak-reminder-cron",
    methods: {

        sendReminder(students: any, gcmRegIds: any, notificationInfo: any) {
            return this.broker.emit("sendNotification", {
                studentId: students,
                gcmRegistrationId: gcmRegIds,
                notificationInfo,
                topic: "micro.push.notification",
            }, "newton");
        },

        getNotificationContent(locale: string) {
            const title = locale === "hi" ? "आज का DNR रिवॉर्ड अनलॉक हो गया हैं " : "Today's DNR reward unlocked";
            const message = locale === "hi" ? "अभी देखो!" : "Check Now";

            return {
                event: "camera",
                title,
                message,
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/FB2CC6C6-016F-7DF5-2B53-BA291B823A26.webp",
                firebase_eventtag: "dnr_streak_reminder",
                data: {},
            };
        },

        async createNotificationData(studentIds: any) {
            try {
                const studentData = await this.broker.call("$dnrMysql.getGcmId", {
                    studentIds,
                });
                this.logger.info("studentData ", studentData);
                this.logger.info("studentData ", studentData.length);

                const studentsHi = [];
                const gcmRegIdsHi = [];
                const students = [];
                const gcmRegIds = [];
                for (const student of studentData) {
                    this.logger.info("studentData[i] ", student);
                    if (student.locale === "hi") {
                        studentsHi.push(student.student_id);
                        gcmRegIdsHi.push(student.gcm_reg_id);
                    } else {
                        students.push(student.student_id);
                        gcmRegIds.push(student.gcm_reg_id);
                    }

                }

                this.logger.info("studentsHi ", studentsHi.length);
                if (studentsHi.length) {
                    this.sendReminder(studentsHi, gcmRegIdsHi, this.getNotificationContent("hi"));
                }

                this.logger.info("students En", students.length);
                if (students.length) {
                    this.sendReminder(students, gcmRegIds, this.getNotificationContent("en"));
                }
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async remindStreak() {
            try {
                let students = await this.adapter.db.collection(this.settings.streakReminderCollection).find({
                    is_notification_opted: true,
                    expiry_at: {$lt: moment().add(10, "hours").toDate()},
                }).toArray();
                this.logger.info("students length", students.length);

                students = students.map(x => x.student_id);
                this.logger.info("all students ", students);

                const chunk = 500;
                for (let i = 0; i < students.length; i += chunk) {
                    const studentData = students.slice(i, i + chunk);
                    if (studentData.length) {
                        await this.createNotificationData(studentData);
                    }
                }
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },

    actions: {},
};

export = StreakReminderCronSchema;
