import {ServiceSchema} from "dn-moleculer";
import Sequelize from "sequelize";

const CouponMySQLSchema: ServiceSchema = {
    name: "$dnrCouponMysql",
    dependencies: [],
    actions: {
        insertCoupon: {
            async handler(ctx) {
                const sql = `INSERT into coupons_new set title = '${ctx.params.title}', type = '${ctx.params.type}', coupon_code = '${ctx.params.coupon_code}', start_date = '${ctx.params.start_date}', end_date = '${ctx.params.end_date}', value_type = '${ctx.params.value_type}', value = ${ctx.params.value}, created_by = '${ctx.params.created_by}', min_version_code = ${ctx.params.min_version_code}, max_version_code = ${ctx.params.max_version_code}, limit_per_student = ${ctx.params.limit_per_student}, claim_limit = ${ctx.params.claim_limit}, max_limit = ${ctx.params.max_limit}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.INSERT});
            },
        },
        insertCouponStudentIdMappingObj: {
            // coupon_code, type, value
            async handler(ctx) {
                const sql = `INSERT INTO coupon_applicability set coupon_code = '${ctx.params.coupon_code}', type = '${ctx.params.type}', value = '${ctx.params.value}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.INSERT});
            },
        },
        getInfoByStudentReferralCoupons: {
            // couponCode
            async handler(ctx) {
                const sql = `SELECT * FROM student_referral_course_coupons where coupon_code = '${ctx.params.couponCode}' and is_active = 1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getLastPurchasedDetails: {
            // couponCode
            async handler(ctx) {
                const sql = `select order_id, source, variant_id, (payment_info.total_amount - payment_info.discount) as net_payble, created_at from payment_info where student_id = ${ctx.params.studentId} and created_at >= DATE_SUB(NOW(), INTERVAL ${ctx.params.seconds} SECOND)and status = 'SUCCESS' order by id desc limit 1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getSignUpTime: {
            async handler(ctx) {
                const sql = `select timestamp from students where student_id = ${ctx.params.student_id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getFacultyId: {
            async handler(ctx) {
                const sql = `SELECT faculty_id FROM course_resources WHERE resource_reference = '${ctx.params.question_id}' AND resource_type IN (1,4,8)`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getAppInstallTime: {
            async handler(ctx) {
                const sql = `SELECT timestamp FROM students WHERE student_id = ${ctx.params.student_id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getGcmId: {
            async handler(ctx) {
                const sql = `SELECT student_id, locale, gcm_reg_id FROM students WHERE student_id IN (${ctx.params.studentIds})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        checkingReferralDataExistence: {
            async handler(ctx) {
                const sql = `SELECT EXISTS(SELECT inviter_id,invitee_id FROM refer_and_earn WHERE invitee_id = ${ctx.params.invitee_id} AND inviter_id = ${ctx.params.inviter_id} AND question_asked =1) AS EXIST`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        checkingIfUserIsInvitee: {
            async handler(ctx) {
                const sql = `SELECT id,inviter_id,invitee_id,bottom_sheet_viewed_invitee FROM refer_and_earn WHERE invitee_id = ${ctx.params.invitee_id} AND question_asked = 1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        checkingIfUserIsInviter: {
            async handler(ctx) {
                const sql = `SELECT id,inviter_id,invitee_id,bottom_sheet_viewed_inviter FROM refer_and_earn WHERE inviter_id = ${ctx.params.inviter_id} AND question_asked=1 ORDER BY ID DESC LIMIT 1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        getReferralsCount: {
            async handler(ctx) {
                const sql = `SELECT COUNT(*) as count FROM refer_and_earn WHERE inviter_id = ${ctx.params.inviter_id} and question_asked=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        updatingInviteeViewedStatus: {
            async handler(ctx) {
                const sql = `UPDATE refer_and_earn SET bottom_sheet_viewed_invitee = 1 WHERE id = ${ctx.params.id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },
        updatingInviterViewedStatus: {
            async handler(ctx) {
                const sql = `UPDATE refer_and_earn SET bottom_sheet_viewed_inviter = 1 WHERE id = ${ctx.params.id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        getStudentNameAndUsername: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT student_id, student_fname, student_lname, student_username FROM students WHERE student_id=${ctx.params.studentId}`;
                console.log("sql", sql);
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
    },
    events: {},
    methods: {},
};

export = CouponMySQLSchema;
