import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import moment from "moment";
import SettingsService from "../settings";
import {redisUtility} from "../../../../common";
import StudyGroupCreateService from "./create";

const StudyGroupTeacherGroups: ServiceSchema = {
    name: "$studygroup-teacher-groups",
    mixins: [SettingsService, StudyGroupCreateService],
    methods: {
        async joinTeacherGroups(courseId, assortmentType, batchId, ctx) {
            let idToBeUsed = courseId; // if assortment type is course then we will use courseId for making group
            if (assortmentType === "subject") {
                // fetching parent course id for making the group
                const courseData = await this.broker.call("$studygroupMysql.getCourseIdForSubjectAssorment", {
                    courseId,
                });
                if (!_.isEmpty(courseData)) {
                    idToBeUsed = courseData[0].assortment_id;
                } else {
                    return {
                        message: "invalid courseId",
                    };
                }
            }

            const groupId = `tg-${idToBeUsed}-${batchId}`; // group id made using course assormtent id and batch id
            const studentId = ctx.user.id;

            let groupExists = false;
            // check if group already exists with the courseId or not
            let data = await redisUtility.getHashField.call(this, groupId, "GROUP_EXISTS");
            if (!_.isNull(data)) {
                groupExists = true;
            } else {
                // checking if group already exists
                data = await this.broker.call("$studygroupMysql.checkStudyGroupExists", {
                    groupId,
                });
                if (!_.isEmpty(data)) {
                    groupExists = true;
                    await redisUtility.addHashField.call(this, groupId, "GROUP_EXISTS", data, 60);
                }
            }

            if (groupExists) {
                // checking if user is already a member
                const isAlreadyMember = await this.broker.call("$studygroupMysql.checkIfUserIsMember", {
                    groupId: data[0].id,
                    studentId,
                });
                if (!_.isEmpty(isAlreadyMember)) {
                    return {
                        message: "User Is Already A Member",
                    };
                }
                // if user is not a member then adding user to the group
                const isAdmin = 0;
                await Promise.all([
                    this.memberAddition(data[0].id, studentId, isAdmin),
                    this.updateMemberCount(groupId, "INCR"),
                    redisUtility.deleteHashField.call(this, groupId, "GROUP_INFO"),
                    redisUtility.deleteHashField.call(this, studentId, "LIST_GROUPS"),
                    redisUtility.deleteHashField.call(this, studentId, "GROUP_INVITE_COUNT"),
                ]);
                return {
                    message: "Member Added Successfully",
                };
            } else {
                // since group doesn't exist we need to create one
                const groupCreation = await this.doInitialProcessForTeacherGroup(groupId, idToBeUsed, studentId, batchId);
                if (!groupCreation) {
                    return {
                        message: "Data Not Found",
                    };
                }
                return {
                    message: "Group Created Successfully",
                };
            }
        },
        // eslint-disable-next-line max-lines-per-function
        async doInitialProcessForTeacherGroup(groupId, courseId, studentId, batchId) {
            // fetching all the faculties of a course id
            const teachersData = await this.broker.call("$studygroupMysql.getCourseDataFromCourseId", {
                courseId,
            });
            if (_.isEmpty(teachersData)) {
                // if teacher of the course doesnt exist we cannot make the group
                return false;
            }

            let isAdmin = 0;
            const assortmentId = courseId;
            // fetching course details from the assortment Id and batch id respectively
            const courseDetails = await this.broker.call("$studygroupMysql.getCourseDetailsByAssortmentId", {
                assortmentId,
                batchId,
            });
            if (_.isEmpty(courseDetails)) {
                // if course doesnt exist we cannot make the group
                return false;
            }
            const teacherWithStudentId = [];
            for (const item of teachersData) {
                if (item && item.student_id && item.student_id !== 98) {
                    teacherWithStudentId.push(item);
                }
            }
            const group_name = courseDetails[0] ? courseDetails[0].study_group_name : "Default Name";
            const group_image = courseDetails[0] ? courseDetails[0].study_group_image : "Default Image";
            // creating a teacher public group where first teacher is admin (groupId: string, groupName: string, groupImage: any, canMemberPost: number, groupType: number)
            const rowId = await this.teacherGroupCreation(groupId, teacherWithStudentId[0], group_name, group_image);

            // adding 1st teacher as admin , next 3 as subadmin and rest teachers as members
            const promise = [];
            let totalSubAdmin = 0;
            for (let i = 0; i < teacherWithStudentId.length; i++) {
                if (i === 0) {
                    isAdmin = 1;
                } else if (i > 0 && i < 4) {
                    isAdmin = 2;
                    totalSubAdmin++;
                } else {
                    isAdmin = 0;
                }
                // checking if teacher is already a member
                const isAlreadyMember = await this.broker.call("$studygroupMysql.checkIfUserIsMember", {
                    groupId: rowId,
                    studentId: teacherWithStudentId[i].student_id,
                });
                if (_.isEmpty(isAlreadyMember)) {
                    promise.push(this.memberAddition(rowId, teacherWithStudentId[i].student_id, isAdmin));
                }
            }

            // adding group id to the respective row in course_study_groups table
            promise.push(this.broker.call("$studygroupMysql.addingGroupId", {
                courseId,
                batchId,
                groupId,
            }));
            // for adding assistant teachers in the group as subadmin
            let assistantTeacher = courseDetails[0].teacher_list;
            if (assistantTeacher === "") {
                assistantTeacher = [];
            }
            const teachersArray = _.map(teacherWithStudentId, item => item.student_id);
            let assistantTeacherToBeAdded = 0;
            if (!_.isEmpty(assistantTeacher)) {
                assistantTeacher = assistantTeacher.split(",");
                const totalAssistantTeacherForSubadmin = this.settings.TOTAL_SUB_ADMINS_PER_TEACHER_GROUP - totalSubAdmin;
                if (assistantTeacher.length > totalAssistantTeacherForSubadmin) {
                    for (let i = 0; i < assistantTeacher.length; i++) {
                        if (assistantTeacher[i] == "98") {// check whether assistant teacher list contains 98 as student id
                            continue;
                        }
                        if (i < totalAssistantTeacherForSubadmin) {
                            isAdmin = 2;
                        } else {
                            isAdmin = 0;
                        }
                        if (!teachersArray.includes(parseInt(assistantTeacher[i], 10))) {
                            assistantTeacherToBeAdded++;
                            promise.push(this.memberAddition(rowId, assistantTeacher[i], isAdmin));
                        }
                    }
                } else {
                    for (const item of assistantTeacher) {
                        if (item === "98" || item === 98) {
                            continue;
                        }
                        isAdmin = 2;
                        if (!teachersArray.includes(parseInt(item, 10))) {
                            assistantTeacherToBeAdded++;
                            promise.push(this.memberAddition(rowId, item, isAdmin));
                        }
                    }
                }
            }
            // adding the student as member
            const numberOfMembersAdded = teacherWithStudentId.length + assistantTeacherToBeAdded + 1;
            isAdmin = 0;
            promise.push(this.memberAddition(rowId, studentId, isAdmin));
            // updating group count
            promise.push(this.broker.call("$studygroupMysql.updatingTeacherGroupCount", {// updating member count
                total_members: numberOfMembersAdded,
                groupId,
            }));

            await Promise.all(promise);
            return true;
        },

        async memberAddition(groupId, studentId, isAdmin) {
            await this.broker.call("$studygroupMysql.addMember", {
                studentId,
                studyGroupId: groupId,
                isAdmin,
            });
        },

        async teacherGroupCreation(groupId, teachersData, display_name: any, display_image_rectangle: any) {
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
        }
        ,
    },
};

export = StudyGroupTeacherGroups;
