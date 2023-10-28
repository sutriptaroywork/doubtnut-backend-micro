import {ServiceSchema} from "moleculer";
import Sequelize from "sequelize";
import moment from "moment";
import {redshift} from "../../../config";


const StudyGroupCronMySQLSchema: ServiceSchema = {
    name: "$cronMysql",
    dependencies: [],
    actions: {
        getActiveMessages: {
            cache: {
                enabled: false,
            },
            async handler() {
                const sql = "SELECT * FROM study_group_promotional_messages WHERE start_date <= now() AND end_date >= now() AND is_active = 1";
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getAllActiveGroups: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `SELECT group_id FROM study_group WHERE is_active = 1 AND group_type IN (${ctx.params.group_types}) AND is_verified IN (${ctx.params.group_verification_status}) ORDER BY id desc LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getActiveGroupsByMembers: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `SELECT group_id FROM study_group WHERE is_active = 1 AND group_type IN (${ctx.params.group_types}) AND is_verified IN (${ctx.params.group_verification_status}) AND total_members ${ctx.params.operator} ${ctx.params.memberCount} ORDER BY id desc LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getActiveGroupsByCreatedAt: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `SELECT group_id FROM study_group WHERE is_active = 1 AND DATE(created_at) ${ctx.params.operator} '${ctx.params.timestamp}' AND group_type IN (${ctx.params.group_types}) AND is_verified IN (${ctx.params.group_verification_status}) ORDER BY id desc LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        // q-ask cron
        getQuestionAskedStudents: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // this query is getting a list of all the students who have asked question in past 30 minutes but have not viewed
                // any answer video(i.e student_id for that question_id wouldn't be available in vvs)
                const sql = `SELECT q.student_id, q.question_id, q.question_image, q.ocr_text, q.timestamp FROM questions_new q WHERE NOT EXISTS (SELECT v.question_id FROM video_view_stats v WHERE v.student_id = q.student_id AND v.created_at BETWEEN '${ctx.params.startTime}' AND '${ctx.params.presentTime}' AND view_from = 'SRP') AND q.timestamp BETWEEN '${ctx.params.startTime}' AND '${ctx.params.presentTime}' LIMIT 200 OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getStudyGroupUsersOnly: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // This query will get student_name, group_id, student_id which are active in any study group
                const sql = `SELECT IFNULL(s.student_fname, 'Doubtnut User') AS name, sg.group_id AS room_id, g.student_id FROM study_group_members g JOIN study_group sg on sg.id = g.study_group_id AND sg.is_active = 1 JOIN students s ON s.student_id = g.student_id LEFT JOIN study_group_reporting sgr ON sgr.student_id = g.student_id AND sgr.study_group_id = sg.group_id WHERE g.student_id IN (${ctx.params.studentIds}) AND g.is_active = 1 AND (sgr.id IS NULL OR sgr.status = 2)`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        setMessageInactive: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `UPDATE study_group_promotional_messages SET is_active = 0 WHERE id = ${ctx.params.id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        setStudyChatMessageInactive: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `UPDATE study_chat_promotional_messages SET is_active = 0 WHERE id = ${ctx.params.id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        getActiveGroupsCron: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // This query will get student_name, group_id, student_id which are active in any study group
                const sql = `SELECT DISTINCT a.group_id FROM (SELECT sg.group_id, COUNT(DISTINCT sgm.student_id) AS members FROM study_group sg JOIN study_group_members sgm ON sgm.study_group_id = sg.id AND sgm.is_active = 1  WHERE sg.group_id IN (${ctx.params.roomIds})  GROUP BY sg.group_id) as a LEFT JOIN study_group_reporting sgr ON sgr.student_id IS NULL AND sgr.study_group_id = a.group_id WHERE (sgr.id IS NULL OR sgr.status = 2) AND a.members >= ${ctx.params.TOTAL_MEMBERS_TO_ENABLE_GROUP}`;
                const result = await this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
                return result.map(item => item.group_id);
            },
        },

        // delete-report-cache
        getUpdatedReports: {
            cache: {
                enabled: false,
            },
            async handler() {
                const currDate = moment().add(5, "hours").add(30, "minutes").format("YYYY-MM-DD");
                const sql = `SELECT * FROM study_group_reporting WHERE updated_at BETWEEN '${currDate} 00:00:00' AND '${currDate} 23:59::59' `;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        getStudyGroupsOnMembersAndClassBasis: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `SELECT sg.*, sgr.status FROM (SELECT group_id, group_name, total_members from study_group where is_active=1 AND created_by_class =${ctx.params.studentClass} and total_members <=700 and group_type=2) as sg left join study_group_reporting sgr on sg.group_id= sgr.study_group_id where sgr.status=2 or sgr.status is null order by sg.total_members desc limit 1000`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getFreeTeachersGroups: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // query time : 147 ms
                const sql = `select distinct s.group_id, s.group_name, s.total_members from study_group s join study_group_members sgm on s.id = sgm.study_group_id where s.is_active=1 and s.group_id like 'pgtf-%' order by created_by_class=${ctx.params.studentClass} desc , total_members desc`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getTopTeachersStudyGroups: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "SELECT group_id, group_name, total_members from study_group where is_active=1 and group_type=3 order by total_members desc limit 500";
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        getAllAssortmentBatchIdCombination: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "SELECT assortment_id,batch_id,study_group_name,teacher_list,img_url FROM course_study_groups";
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        getAllMembersOfCourse: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // 166 ms
                const sql = `select distinct a.student_id,cd.assortment_id from (select *, id as subscription_id from student_package_subscription where start_date < now() and end_date > now() and is_active=1) as a inner join (select * from package where reference_type in ('v3', 'onlyPanel', 'default') and batch_id =${ctx.params.batchId}) as b on a.new_package_id=b.id left join (select class,assortment_id, assortment_type,display_name, year_exam,display_description from course_details) as cd on cd.assortment_id=b.assortment_id where cd.assortment_id=${ctx.params.assortmentId} order by a.id DESC`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getAllMembersOfGroupExceptAdminSubadmin:{
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // 80 ms
                const sql = `SELECT student_id FROM study_group_members WHERE study_group_id = ${ctx.params.study_group_id} and is_active =1 and is_admin=0`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        updatingAdminSubAdminIsActiveStatus:{
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `UPDATE study_group_members SET is_active=1 WHERE study_group_id = ${ctx.params.study_group_id} AND is_admin != 0 AND is_active = 0 AND is_left =0 AND is_blocked=0`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        getAllMembersOfGroup:{
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // 80 ms
                const sql = `SELECT student_id FROM study_group_members WHERE study_group_id = ${ctx.params.study_group_id} and is_active =1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getAllActiveAdminSubAdmin:{
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // 80 ms
                const sql = `SELECT student_id FROM study_group_members WHERE study_group_id = ${ctx.params.study_group_id} and is_active =1 AND is_admin != 0`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        checkingDuplicateStudentId:{
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // 80 ms
                const sql = `SELECT student_id FROM study_group_members WHERE study_group_id = ${ctx.params.study_group_id} and is_active =1 and student_id = ${ctx.params.student_id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },


        memberInactive:{
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // 80 ms
                let sql = "";
                if (!ctx.params.limit){
                    sql = `UPDATE study_group_members SET is_active = 0 WHERE study_group_id = ${ctx.params.study_group_id} AND student_id =${ctx.params.student_id}`;
                } else {
                    sql = `UPDATE study_group_members SET is_active = 0 WHERE study_group_id = ${ctx.params.study_group_id} AND student_id =${ctx.params.student_id} LIMIT ${ctx.params.limit}`;
                }
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        getAllGroups: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `SELECT group_id, group_image, group_name FROM study_group WHERE is_active = 1 AND group_type IN (1,2) AND is_verified = 0 LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getReportedGroups: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "SELECT study_group_id, status FROM study_group_reporting WHERE student_id IS NULL AND study_group_id IN ('" + ctx.params.group_ids.join("','") + "')";
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        banGroup: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "INSERT INTO study_group_reporting (study_group_id, status) VALUES (" + ctx.params.group_ids.map(x => `'${x}', 3`).join("), (") + ")";
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.INSERT });
            },
        },

        updateGroupBan: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "UPDATE study_group_reporting SET status = 3 WHERE study_group_id IN ('" + ctx.params.group_ids.join("','") + "') AND student_id IS NULL";
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.UPDATE });
            },
        },

        makeGroupAsInactive: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "UPDATE study_group SET is_active = 0, deactivated_at = NOW() WHERE group_id IN ('" + ctx.params.group_ids.join("','") + "')";
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.UPDATE });
            },
        },

        getBannedGroups: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `SELECT study_group_id FROM study_group_reporting WHERE status = 3 AND updated_at >= '2022-03-12 06:22:56' LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        unbanGroup: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "UPDATE study_group_reporting SET status = 2 WHERE study_group_id IN ('" + ctx.params.group_ids.join("','") + "') AND student_id IS NULL";
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.UPDATE });
            },
        },

        makeGroupAsActive: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "UPDATE study_group SET is_active = 1 WHERE group_id IN ('" + ctx.params.group_ids.join("','") + "')";
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.UPDATE });
            },
        },

        getFreeTeachersCourses: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "SELECT distinct CONCAT(lcr.expert_name, ' (', lc.course_exam, '-', lc.locale, ')') as group_name, lc.class, du.student_id FROM `liveclass_course_details` lcd left join liveclass_course_resources lcr on lcr.liveclass_course_detail_id = lcd.id left join liveclass_course lc on lc.id = lcr.liveclass_course_id left join dashboard_users du on du.id=lcd.faculty_id WHERE date(live_at) BETWEEN '2022-02-01' and '2022-02-21' and lcr.resource_type in (1,4,8) and lcr.subject not in ('ALL','ANNOUNCEMENT','GUIDANCE') and lc.is_free = 1 and master_chapter not like '%test%'";
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getActiveGroups: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `select id, group_id, group_name, group_image, group_type, created_by, name_updated_by, image_updated_by from study_group where is_active = 1 LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getAllMembersByGroupPk: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "select student_id from study_group_members where study_group_id in (" + ctx.params.study_group_ids.join(",") + ")";
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        makeMembersAsInactive: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = "UPDATE study_group_members SET is_active = 0, blocked_at = NOW(), blocked_by=98, is_blocked=1 WHERE study_group_id IN (" + ctx.params.study_group_ids.join(",") + ")";
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.UPDATE });
            },
        },

        getActiveStudents: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `select student_id, concat(student_fname, ' ', student_lname) as student_name, img_url from students where students.img_url is not null order by student_id DESC LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        banStudent: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `INSERT INTO banned_users (student_id, app_module, ban_type, ban_till, is_active, ban_mode) VALUES (${ctx.params.studentId}, 'ALL', 'Perma', '${ctx.params.banTill}', 1, 'AUTO')`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.INSERT });
            },
        },

        getActiveCronStudyChatMessages: {
            cache: {
                enabled: false,
            },
            async handler() {
                const sql = "SELECT * FROM study_chat_promotional_messages WHERE start_date <= now() AND end_date >= now() AND is_active = 1";
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getStudentsWhoLoginAfterSpecificTimestamp: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // let sql = `SELECT student_id FROM students WHERE timestamp ${ctx.params.filter_operator} '${ctx.params.filter_timestamp}'`;
                let sql = `select student_id from classzoo1.students where curtimestamp ${ctx.params.filter_operator} '${ctx.params.filter_timestamp}'`;
                if (ctx.params.student_ids){
                    sql = sql.concat(`AND student_id IN (${ctx.params.student_ids})`);
                }
                if (ctx.params.limit){
                    sql = sql.concat(` LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`);
                }
                return redshift.query(sql).then(res=>res.rows);
            },
        },

        getStudentsByCcmId:{
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                let sql = `SELECT DISTINCT student_id FROM classzoo1.student_course_mapping WHERE ccm_id IN (${ctx.params.ccm_id})`;
                if (ctx.params.student_ids){
                    sql = sql.concat(` AND student_id IN (${ctx.params.student_ids})`);
                }
                if (ctx.params.limit){
                    sql = sql.concat(` LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`);
                }
                return redshift.query(sql).then(res=>res.rows);
            },
        },

        getCampaignStudents: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // 10 ms
                let sql = `SELECT student_id FROM campaign_sid_mapping WHERE campaign = '${ctx.params.campaign}'`;
                if (ctx.params.student_ids){
                    sql = sql.concat(` AND student_id IN (${ctx.params.student_ids})`);
                }
                if (ctx.params.limit){
                    sql = sql.concat(` LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`);
                }
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getQueryByTargetGroupId: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                // 10 ms
                const sql = `SELECT * FROM target_group WHERE id = ${ctx.params.target_group_id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getStudentsByQuery:{
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `${ctx.params.query}`;
                if (ctx.params.db_to_use === "redshift"){
                    return redshift.query(sql).then(res=>res.rows);
                }
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },


        getStudentByClass: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                let sql = `SELECT student_id FROM classzoo1.students WHERE student_class = ${ctx.params.student_class}`;
                if (ctx.params.student_ids){
                    sql = sql.concat(` AND student_id IN (${ctx.params.student_ids})`);
                }
                if (ctx.params.limit){
                    sql = sql.concat(` LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`);
                }
                return redshift.query(sql).then(res=>res.rows);
            },
        },

        getStudentByLocale: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                let sql = `SELECT student_id FROM classzoo1.students WHERE locale = '${ctx.params.locale}'`;
                if (ctx.params.student_ids){
                    sql = sql.concat(` AND student_id IN (${ctx.params.student_ids})`);
                }
                if (ctx.params.limit){
                    sql = sql.concat(` LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`);
                }
                return redshift.query(sql).then(res=>res.rows);
            },
        },

        checkIfChatAlreadyExists:{
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `SELECT chat_id FROM study_chat WHERE inviter = ${ctx.params.inviter} and invitee = ${ctx.params.invitee}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        creatingChatWithDoubtnut:{
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const currentDate = moment().add(5, "hours").add(30, "minutes").format("YYYY-MM-DD HH:MM:SS");
                const sql = `INSERT INTO study_chat (chat_id,is_active,inviter,invitee,invitation_status,invitation_updated_at) VALUES ('${ctx.params.chat_id}',1,${ctx.params.inviter},${ctx.params.invitee},1,'${currentDate}')`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.INSERT});
            },
        },


        addingStudyChatMember: {
            // studentId, studyChatId
            async handler(ctx) {
                const sql = `INSERT INTO study_chat_members (student_id, study_chat_id) VALUES (${ctx.params.studentId}, ${ctx.params.studyChatId})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.INSERT});
            },
        },

        setStudyChatMessageCronInactive: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `UPDATE study_chat_promotional_messages SET is_active = 0 WHERE id = ${ctx.params.id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

    },
    events: {},
    methods: {},
};

export = StudyGroupCronMySQLSchema;
