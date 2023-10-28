import {ServiceSchema} from "moleculer";
import _ from "lodash";
import moment from "moment";
import {redisUtility} from "../../../common";

const TOTAL_SUB_ADMINS_PER_TEACHER_GROUP = 50;


const StudyGroupPaidGroupCronService: ServiceSchema = {
    name: "$studygroup-paid-user-groups-making-cron",
    methods: {
        async makingPaidGroupsForAllAssortments() {
            try {
                const assortmentIds = await this.broker.call("$studygroupCronMysql.getAllAssortmentBatchIdCombination", {});
                if (!_.isEmpty(assortmentIds)) {
                    let groups = 0;
                    for (const item of assortmentIds) {
                        const groupId = `tg-${item.assortment_id}-${item.batch_id}`;
                        let groupExists = false;
                        // check if group already exists with the assortment Id or not
                        const data = await this.broker.call("$studygroupMysql.checkStudyGroupExists", {
                            groupId,
                        });
                        if (!_.isEmpty(data)) {
                            groupExists = true;
                        }
                        // fetching all the students who have bought the course
                        const enrolledStudents = await this.broker.call("$studygroupCronMysql.getAllMembersOfCourse", {
                            assortmentId: item.assortment_id,
                            batchId: item.batch_id,
                        });
                        const enrolledStudentsArray = [];
                        for (const st of enrolledStudents) {
                            if (st && st.student_id) {
                                enrolledStudentsArray.push(st.student_id);
                            }
                        }
                        if (groupExists) {
                            // since group already exists checking how many members are already present in the group
                            const currentMembersCount = await this.broker.call("$studygroupMysql.getTotalMembers", {
                                groupId,
                            });
                            if (!_.isEmpty(enrolledStudentsArray)) {
                                const studentsToBeAdded = await this.checkingIfMembersExists(enrolledStudentsArray, data[0].id);

                                if (!_.isEmpty(studentsToBeAdded)) {
                                    await this.insertMultipleMembersAtOnce(studentsToBeAdded, data[0].id);
                                }
                                await this.broker.call("$studygroupMysql.updatingTeacherGroupCount", {// updating member count
                                    total_members: studentsToBeAdded.length + currentMembersCount[0].total_members,
                                    groupId,
                                });

                                await redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO");
                            }
                        } else {
                            if (!await this.isDuplicateGroupName(item.study_group_name)){
                                await this.createPaidGroups(groupId, item.assortment_id, enrolledStudentsArray, item.study_group_name, item.img_url, item.teacher_list, item.batch_id);
                            }
                            groups++;
                            console.log("groupCount", groups);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
        // eslint-disable-next-line max-lines-per-function
        async createPaidGroups(groupId, courseId, enrolledStudents, groupName, groupImage, assistantTeacherList, batchId) {
            try {
                console.log("inside creating group", courseId, enrolledStudents, assistantTeacherList);
                // fetching all the faculties of a course id
                const teachersData = await this.broker.call("$studygroupMysql.getCourseDataFromCourseId", {
                    courseId,
                });

                if (_.isEmpty(teachersData)) {
                    return false;
                }

                let isAdmin = 0;
                const teacherWithStudentId = [];
                for (const item of teachersData) {
                    if (item.student_id && item.student_id !== 98) {
                        teacherWithStudentId.push(item);
                    }
                }
                const rowId = await this.groupCreation(groupId, teacherWithStudentId[0], groupName, groupImage);

                // adding 1st teacher as admin , next 3 as subadmin and rest teachers as members
                let totalSubAdmin = 0;
                const promise = [];
                for (let i = 0; i < teacherWithStudentId.length; i++) {
                    if (i === 0) {
                        isAdmin = 1;
                    } else if (i > 0 && i < 4) {
                        totalSubAdmin++;
                        isAdmin = 2;
                    } else {
                        isAdmin = 0;
                    }
                    const isAlreadyMember = await this.broker.call("$studygroupMysql.checkIfUserIsMember", {
                        groupId: rowId,
                        studentId: teacherWithStudentId[i].student_id,
                    });
                    if (teacherWithStudentId[i].student_id && _.isEmpty(isAlreadyMember)) {
                        promise.push(this.memberAddition(rowId, teacherWithStudentId[i].student_id, isAdmin));
                    }
                }
                // adding group id to course_study_group tables
                promise.push(this.broker.call("$studygroupMysql.addingGroupId", {
                    courseId,
                    batchId,
                    groupId,
                }));

                // for adding assistant teachers in the group as subadmin
                let assistantTeacher = [];
                if (assistantTeacherList !== "") {
                    assistantTeacher = assistantTeacherList.split(",");
                }
                let assistantTeacherToBeAdded = 0;
                if (!_.isEmpty(assistantTeacher)) {
                    const totalAssistantTeacherForSubadmin = TOTAL_SUB_ADMINS_PER_TEACHER_GROUP - totalSubAdmin;
                    if (assistantTeacher.length > totalAssistantTeacherForSubadmin) {
                        for (let i = 0; i < assistantTeacher.length; i++) {
                            if (assistantTeacher[i] == "98") {
                                continue;
                            }
                            if (i < totalAssistantTeacherForSubadmin) {
                                isAdmin = 2;
                            } else {
                                isAdmin = 0;
                            }
                            const isAlreadyMember = await this.broker.call("$studygroupMysql.checkIfUserIsMember", {
                                groupId: rowId,
                                studentId: assistantTeacher[i],
                            });
                            if (_.isEmpty(isAlreadyMember)) {
                                assistantTeacherToBeAdded++;
                                promise.push(this.memberAddition(rowId, assistantTeacher[i], isAdmin));
                            }
                        }
                    } else {
                        for (const item of assistantTeacher) {
                            if (item == "98") {
                                continue;
                            }
                            isAdmin = 2;
                            const isAlreadyMember = await this.broker.call("$studygroupMysql.checkIfUserIsMember", {
                                groupId: rowId,
                                studentId: item,
                            });
                            if (_.isEmpty(isAlreadyMember)) {
                                assistantTeacherToBeAdded++;
                                promise.push(this.memberAddition(rowId, item, isAdmin));
                            }
                        }
                    }
                }

                const numberOfMembersAdded = teacherWithStudentId.length + assistantTeacherToBeAdded;
                if (!_.isEmpty(enrolledStudents)) {
                    await this.insertMultipleMembersAtOnce(enrolledStudents, rowId);
                }

                promise.push(this.broker.call("$studygroupMysql.updatingTeacherGroupCount", {// updating member count
                    total_members: numberOfMembersAdded + enrolledStudents.length,
                    groupId,
                }));
                promise.push(await redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO"));
                await Promise.all(promise);
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async isDuplicateGroupName(groupName) {
            try {
                const isDuplicateGroupNameData = await this.broker.call("$studygroupMysql.isDuplicateGroup", {groupName});
                return isDuplicateGroupNameData[0].exist === 1;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async insertMultipleMembersAtOnce(studentsArray, groupId) {
            let sql = "INSERT INTO study_group_members (student_id, study_group_id, is_admin) VALUES";
            for (let i = 0; i < studentsArray.length; i++) {
                const isAdmin = 0;
                if (i === studentsArray.length - 1) {
                    sql = sql + `(${studentsArray[i]},${groupId}, ${isAdmin});`;
                } else {
                    sql = sql + `(${studentsArray[i]},${groupId}, ${isAdmin}),`;
                }
            }
            await this.broker.call("$studygroupMysql.addingMembers", {sqlQuery: sql});
        },
        async checkingIfMembersExists(enrolledStudentsArray, groupId) {
            const studentsToBeAdded = [];
            for (const student of enrolledStudentsArray) {
                const studentsAreAlreadyMember = await this.broker.call("$studygroupMysql.checkIfStudentsIsMember", {
                    groupId,
                    student_id:student,
                });
                if (_.isEmpty(studentsAreAlreadyMember)) {
                    studentsToBeAdded.push(student);
                }
            }
            return studentsToBeAdded;
        },
        async groupCreation(groupId, teachersData, display_name: any, display_image_rectangle: any) {
            const currentDate = moment().add(5, "hours").add(30, "minutes").format("YYYY-MM-DD HH:mm:ss");
            const data = {
                group_id: groupId,
                group_type: 3, // 3 is for teacher group
                group_name: escape(display_name),
                group_image: display_image_rectangle,
                can_member_post: 1,
                member_post_updated_by: teachersData.student_id,
                member_post_updated_at: currentDate,
                created_by: teachersData.student_id,
                image_updated_by: teachersData.student_id,
                image_updated_at: currentDate,
                name_updated_by: teachersData.student_id,
                name_updated_at: currentDate,
                created_by_class: null,
                is_verified: 1,
            };
            return this.broker.call("$studygroupMysql.createGroup", {data});
        },
        async memberAddition(groupId, studentId, isAdmin) {
            await this.broker.call("$studygroupMysql.addMember", {
                studentId,
                studyGroupId: groupId,
                isAdmin,
            });
            await redisUtility.deleteHashField.call(this, `USER:${studentId}`, "LIST_GROUPS");
        },
    },

    actions: {},
};

export = StudyGroupPaidGroupCronService;
