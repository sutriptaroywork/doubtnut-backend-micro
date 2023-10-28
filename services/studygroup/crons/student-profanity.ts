import {ServiceSchema} from "dn-moleculer";
import DbService from "dn-moleculer-db";
import profanity from "profanity-hindi";
import moment from "moment";
import ImageProfanity from "../methods/profanity.checker";
import {customBadWords} from "../profanity/data/custom-bad-words";
profanity.addWords(customBadWords);
import Settings from "../methods/settings";
import {redisUtility} from "../../../common";
import dbMixin from "../config/db.mixin";
import {wordProfanity} from "../profanity";

const StudentProfanityCheckScriptService: ServiceSchema = {
    name: "student-profanity-check-script",
    mixins: [dbMixin("student_profanity"), DbService, ImageProfanity, Settings],
    methods: {

        async banProfanedStudents(activeStudents: any) {
            /* Steps:
                get All active student list
                check student name profanity
                check student image profanity
                ban profaned student ids and mongo entries for logs
            */
            const currentDate = moment().add(5, "hours").add(30, "minutes");

            for (const student of activeStudents) {

                let isImageProfaned = false;
                const studentName = student.student_name;
                const isNameProfaned = student.student_name && (await profanity.isMessageDirty(studentName) || await wordProfanity.isWordProfane(studentName));

                if (!isNameProfaned && student.img_url) {
                    isImageProfaned = await this.isImageProfaned(student.img_url);
                }


                if (isImageProfaned || isNameProfaned) {
                    this.logger.info(studentName, "=> name -", isNameProfaned, student.img_url, isImageProfaned);

                    await this.broker.call("$studygroupCronMysql.banStudent", {
                        studentId: student.student_id, banTill: currentDate.add(365, "days").format("YYYY-MM-DD HH:MM:SS"),
                    });
                    // student details is profaned, just adding for logs
                    await this.adapter.db.collection("student_profanity").insertOne({
                        student_name: studentName,
                        student_id: student.student_id,
                        student_image: student.img_url,
                        is_student_name_profaned: isNameProfaned,
                        is_image_profaned: isImageProfaned,
                        created_at: currentDate.toDate(),
                    });
                }
            }
            return true;
        },

        async banStudentsInitiator() {
            try {
                const chunk = 100;
                const index = await redisUtility.getRedisKeyData.call(this, "BAN_PROFANE_STUDENTS") || 0;
                console.log(index, " <== index from redis");

                for (let i = index; i < index + 50000000; i += chunk) {
                    const activeStudents = await this.broker.call("$studygroupCronMysql.getActiveStudents", {
                        offset: i,
                        limit: chunk,
                    });
                    if (!activeStudents.length) {
                        this.logger.info("Check on all students completed");
                        break;
                    }
                    await this.banProfanedStudents(activeStudents);
                    this.logger.info("banProfanedStudents done");
                    await redisUtility.incrKeyData.call(this, "BAN_PROFANE_STUDENTS", i, this.settings.dailyRedisTTL);
                }
                return true;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },

    actions: {},
};

export = StudentProfanityCheckScriptService;
