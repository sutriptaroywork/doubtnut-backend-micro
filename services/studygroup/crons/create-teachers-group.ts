import {ServiceSchema} from "dn-moleculer";
import {v4 as uuid} from "uuid";
import moment from "moment";
import Settings from "../methods/settings";

const StudyGroupBanScriptService: ServiceSchema = {
    name: "$studygroup-create-free-teachers-group",
    mixins: [Settings],
    methods: {

        async createFreeTeachersGroup() {
            // const freeTeacherGroups = await this.broker.call("$studygroupCronMysql.getFreeTeachersCourses");
            // this.logger.info("freeTeacherGroups groups ", freeTeacherGroups.length, freeTeacherGroups);
            // for (const group of freeTeacherGroups) {
            //     const groupId = `pgtf-${uuid()}`;
            //     const currentDate = moment().add(5, "hours").add(30, "minutes").format("YYYY-MM-DD HH:mm:ss");
            //     const data = {
            //         group_id: groupId,
            //         group_type: 2,
            //         group_name: escape(group.group_name),
            //         group_image: null,
            //         can_member_post: 1,
            //         member_post_updated_by: group.student_id,
            //         member_post_updated_at: currentDate,
            //         created_by: group.student_id,
            //         image_updated_by: group.student_id,
            //         image_updated_at: currentDate,
            //         name_updated_by: group.student_id,
            //         name_updated_at: currentDate,
            //         created_by_class: group.class || 10,
            //         is_verified: 1,
            //     };
            //     console.log(data);
            //     console.log(groupId, typeof groupId, " typeof");
            //     const studyGroupCreate = await this.broker.call("$studygroupMysql.createGroup", {data});
            //     console.log("created group", studyGroupCreate);
            //     await this.broker.call("$studygroupMysql.addMember", {
            //         studentId: group.student_id,
            //         studyGroupId: studyGroupCreate,
            //         isAdmin: 1,
            //     });
            //     console.log("MEMBER ADDED");
            // }
        },
    },

    actions: {},
};

export = StudyGroupBanScriptService;
