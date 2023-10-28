import Sequelize from "sequelize";

export const liveClassMysql = {

    async getCourseResource(db, id) {
        const sql = `select * from course_resources where id = ${id}`;
        return db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async getLiveClassCourseResourceByDetailIdAndReferenceAndType(db, detail_id, reference, type) {
        // eslint-disable-next-line max-len
        const sql = `select * from liveclass_course_resources where liveclass_course_detail_id = ${detail_id} and resource_reference = '${reference}' and resource_type = '${type}'`;
        return db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async getQuizQuestions(db, question_id) {
        // eslint-disable-next-line max-len
        const sql = `SELECT 0 as type, a.question_id, a.ocr_text,c.opt_1,c.opt_2,c.opt_3,c.opt_4,c.answer, a.is_answered, a.is_text_answered from (SELECT * from questions where question_id = ${question_id} ) as a left join questions_localized as b on a.question_id = b.question_id left join text_solutions as c on a.question_id = c.question_id order by a.doubt ASC`;
        return db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async setLiveClassQuizLog(db, masterObj) {
        // eslint-disable-next-line max-len
        const sql = `INSERT IGNORE INTO liveclass_quiz_logs set quiz_resource_id = ${masterObj.quiz_resource_id} , resource_id = '${masterObj.resource_reference}',  detail_id = '${masterObj.detail_id}', resource_detail_id = '${masterObj.resource_detail_id}', liveclass_resource_id = '${masterObj.liveclass_resource_id}' `;
        return db.query(sql);
    },

    async getAllPolls(db) {
        return db.query("select * from liveclass_polls where is_active = 1", { type: Sequelize.QueryTypes.SELECT });
    },

    async getPollById(db, id) {
        return db.query(`select * from liveclass_polls where id = ${id}`, { type: Sequelize.QueryTypes.SELECT });
    },

    async setPublishInfo(db, detail_id, info, type) {
        return db.query(`insert into liveclass_publish set detail_id = ${detail_id} , type = '${type}', info = '${info}'`).then(([res]) => res);
    },

    async setPollResponse(db, publish_id, poll_id, student_id, submitted_option) {
        // eslint-disable-next-line max-len
        return db.query(`insert into liveclass_poll_response (liveclass_publish_id,poll_id,student_id,submit_option) values (${publish_id},${poll_id}, ${student_id} , '${submitted_option}') ON DUPLICATE KEY UPDATE submit_option = '${submitted_option}' `).then(([res]) => res);
    },

    async getPollResponse(db, publish_id, poll_id) {
        return db.query(`SELECT * FROM liveclass_poll_response WHERE poll_id = ${poll_id} AND liveclass_publish_id = ${publish_id}`, { type: Sequelize.QueryTypes.SELECT });
    },

    async getFromDNProperty(db, bucket, name) {
        return db.query(`select * from dn_property where bucket = '${bucket}' and name = '${name}' and is_active = 1 `, { type: Sequelize.QueryTypes.SELECT });
    },

    async getFeedbackList(db, ) {
        return db.query("select * from liveclass_feedback", { type: Sequelize.QueryTypes.SELECT });
    },

    async getBroadcastList(db, ) {
        return db.query("select * from liveclass_broadcasts_templates WHERE is_active = 1", { type: Sequelize.QueryTypes.SELECT });
    },

    async getFacultyInfo(db, detail_id) {
        // eslint-disable-next-line max-len
        return db.query(`SELECT * FROM dashboard_users where id = (select faculty_id from liveclass_stream where detail_id = ${detail_id})`, { type: Sequelize.QueryTypes.SELECT });

    },

    async getQuizResponseByDetailIdAndQuestionId(db, detail_id, question_id) {
        // eslint-disable-next-line max-len
        return db.query(`SELECT * from liveclass_quiz_response where detail_id = ${detail_id} and quiz_question_id = '${question_id}'`, { type: Sequelize.QueryTypes.SELECT });

    },

    async getCourseResourceInfo(db, detail_id, resource_type) {
        const sql = `select * from course_resources where id = ${detail_id} and resource_type = ${resource_type} limit 1`;
        return await db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async getAllPollByDetailID(db, detailID) {
        // eslint-disable-next-line max-len
        return db.query(`SELECT *, a.id as publish_id FROM ( SELECT * FROM classzoo1.liveclass_publish where detail_id = ${detailID}) as a inner join ( SELECT * FROM classzoo1.liveclass_polls ) as b on a.info = b.id `, { type: Sequelize.QueryTypes.SELECT });
    },
};


