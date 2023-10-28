import { ServiceSchema } from "dn-moleculer";
import Sequelize from "sequelize";

const StudyGroupReportMySQLSchema: ServiceSchema = {
    name: "$reportMysql",
    dependencies: [],
    actions: {
        checkBan: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                let sql = `SELECT status FROM study_group_reporting WHERE study_group_id = "${ctx.params.study_group_id}" AND student_id = ${ctx.params.student_id}`;
                if (!ctx.params.student_id) {
                    sql = `SELECT status FROM study_group_reporting WHERE study_group_id = "${ctx.params.study_group_id}" AND student_id is null`;
                }
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT }).then(res => res[0]);
            },
        },
        ban: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                let sql = `INSERT INTO study_group_reporting SET student_id = ${ctx.params.student_id}, study_group_id = "${ctx.params.study_group_id}"`;
                if (!ctx.params.student_id) {
                    sql = `INSERT INTO study_group_reporting SET study_group_id = "${ctx.params.study_group_id}"`;
                }
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.INSERT });
            },
        },

        // when someone again banned after previously approved
        updateBan: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                let sql = `UPDATE study_group_reporting SET status = 0, updated_at = "${ctx.params.updated_at}" WHERE student_id = ${ctx.params.student_id} AND study_group_id = "${ctx.params.study_group_id}"`;
                if (!ctx.params.student_id) {
                    sql = `UPDATE study_group_reporting SET status = 0, updated_at = "${ctx.params.updated_at}" WHERE student_id is null AND study_group_id = "${ctx.params.study_group_id}"`;
                }
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.UPDATE });
            },
        },
    },
    events: {},
    methods: {},
};

export = StudyGroupReportMySQLSchema;
