import {ServiceSchema} from "moleculer";
import _ from "lodash";
import {redisUtility} from "../../../common";

const courseExpiredUserInactiveCronService: ServiceSchema = {
    name: "$studygroup-paid-user-making-inactive-cron",
    methods: {
        async makingCourseStudyGroupUserInactive() {
            try {
                const assortmentIds = await this.broker.call("$studygroupCronMysql.getAllAssortmentBatchIdCombination", {});
                if (!_.isEmpty(assortmentIds)) {
                    for (const item of assortmentIds) {
                        const groupId = `tg-${item.assortment_id}-${item.batch_id}`;
                        // check if group already exists with the assortment Id or not
                        const data = await this.broker.call("$studygroupMysql.checkStudyGroupExists", {
                            groupId,
                        });
                        if (!_.isEmpty(data)) {
                            console.log("data", data);
                            // fetching all the students who have bought the course
                            const courseEnrolledStudents = await this.broker.call("$studygroupCronMysql.getAllMembersOfCourse", {
                                assortmentId: item.assortment_id,
                                batchId: item.batch_id,
                            });

                            console.log("courseEnrolledStudents", courseEnrolledStudents.length);
                            const allGroupMembers = await this.broker.call("$studygroupCronMysql.getAllMembersOfGroupExceptAdminSubadmin", {
                                study_group_id: data[0].id,
                            });

                            // updating study group admin and subadmin is_active as 1
                            await this.broker.call("$studygroupCronMysql.updatingAdminSubAdminIsActiveStatus", {
                                study_group_id: data[0].id,
                            });

                            // updating is_active of duplicate members in the group
                            await this.updatingDuplicateMembersIsActive(data[0].id);

                            console.log("allGroupMembers", allGroupMembers.length);

                            const courseExpiredStudents = this.removingMembersWhoseCourseExpired(courseEnrolledStudents, allGroupMembers);

                            console.log("courseExpiredStudents", courseExpiredStudents);

                            await this.makingCourseExpiredStudentsInactive(courseExpiredStudents, data[0].id);
                            await this.updatingGroupMembersCount(groupId, data[0].id);
                            await redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO");
                        }
                    }
                }
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async updatingDuplicateMembersIsActive(id){
            const allMembers = await this.broker.call("$studygroupCronMysql.getAllMembersOfGroup", {
                study_group_id: id,
            });

            for (const st of allMembers){
                // checking if multiple entries exists
                const multipleEntryExists = await this.broker.call("$studygroupCronMysql.checkingDuplicateStudentId", {
                    study_group_id: id,
                    student_id:st.student_id,
                });

                if (multipleEntryExists.length > 1){
                    const limit = multipleEntryExists.length - 1;
                    //  updating is_active 0 for multiple entries
                    await this.broker.call("$studygroupCronMysql.memberInactive", {
                        student_id: st.student_id,
                        study_group_id:id,
                        limit,
                    });
                    await redisUtility.deleteHashField.call(this, `USER:${st.student_id}`, "LIST_GROUPS");
                }
            }
            return true;
        },

        async updatingGroupMembersCount(studygroupId, id){
            const allGroupMembers = await this.broker.call("$studygroupCronMysql.getAllMembersOfGroup", {
                study_group_id: id,
            });

            console.log(allGroupMembers.length);
            this.broker.call("$studygroupMysql.updatingTeacherGroupCount", {// updating member count
                total_members: allGroupMembers.length,
                groupId:studygroupId,
            });
            return true;
        },
        async makingCourseExpiredStudentsInactive(courseExpiredStudents, studyGroupId){
            for (const student of courseExpiredStudents){
                await this.broker.call("$studygroupCronMysql.memberInactive", {
                    student_id: student,
                    study_group_id:studyGroupId,
                });
                redisUtility.deleteHashField.call(this, `USER:${student}`, "LIST_GROUPS");
            }
            return true;
        },
        removingMembersWhoseCourseExpired(enrolledStudentsArray, allGroupMembers) {
            const courseExpiredStudents = [];
            const allMembersId = _.map(allGroupMembers, st=> st.student_id);
            enrolledStudentsArray = _.map(enrolledStudentsArray, st=> st.student_id);
            _.map(allMembersId, student=>{
                if (!enrolledStudentsArray.includes(student)){
                    courseExpiredStudents.push(student);
                }
            });
            return courseExpiredStudents;
        },
    },

    actions: {},
};

export = courseExpiredUserInactiveCronService;
