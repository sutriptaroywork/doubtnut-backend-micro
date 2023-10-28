/* eslint-disable max-len */
import DbService from "dn-moleculer-db";
import { ServiceSchema, Context } from "moleculer";
import Sequelize from "sequelize";
import { adapter } from "../config";

const Question: ServiceSchema = {
    name: "$sync-raw",
    mixins: [DbService],
    adapter,
    model: {
        name: "test",
    },
    settings: {
    },
    dependencies: [],
    actions: {
        getLanguageByLocale: {
            cache: {
                enabled: true,
                ttl: 86400,
            },
            async handler(ctx: Context<{ locale: string }>) {
                const sql = `SELECT * FROM languages WHERE code = '${ctx.params.locale}' and is_active = 1`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT }).then(res => res[0]);
            },
        },
        getSimilar: {
            async handler(ctx: Context<{ id: number; limit?: number }>) {
                const sql = `SELECT q.question_id, q.ocr_text, case when q.is_answered=0 and q.is_text_answered=1 then 'text' else 'video' end as resource_type FROM book_meta b INNER JOIN questions q on b.question_id = q.question_id WHERE b.doubt > (select doubt from book_meta where question_id = ${ctx.params.id} limit 1) limit ${ctx.params.limit || 10}`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        checkVIPUser: {
            async handler(ctx) {
                const sql = `select *, DATEDIFF(end_date, CURRENT_DATE) as diff  from student_package_subscription where student_id = ${ctx.params.studentId} and start_date <= CURRENT_DATE and end_date >= CURRENT_DATE and is_active=1 order by id DESC LIMIT 1`;
                const res = await this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
                return res.length > 0;
            },
        },
        getLocalisedQuestion: {
            cache: {
                enabled: true,
                ttl: 60 * 60 * 24 * 5,
            },
            async handler(ctx) {
                const sql = `SELECT * from questions_localized where question_id =${ctx.params.questionId}`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getCourseDetails: {
            cache: {
                enabled: true,
                ttl: 60 * 60 * 24,
            },
            async handler(ctx) {
                const sql = `SELECT concat('doubtnutapp://course_detail_info?tab=recent&filter_v2=true&assortment_id=',assortment_id) as deeplink_url, meta_info as medium,class FROM course_details where
                 assortment_type = 'course' and is_active = 1 and year_exam = 2022 and is_free = 1 and class=${ctx.params.stClass} and meta_info='${ctx.params.language}' and category_type='BOARDS/SCHOOL/TUITION'`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getBoardAndExams: {
            cache: {
                enabled: true,
                ttl: 60 * 60 * 24,
            },
            async handler(ctx: Context<{ studentId: number }>) {
                const sql = `SELECT a.ccm_id, b.course, b.category FROM student_course_mapping as a left join class_course_mapping as b on a.ccm_id=b.id WHERE a.student_id = ${ctx.params.studentId}`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getLatestLiveClassData: {
            cache: {
                enabled: true,
                ttl: 60 * 60 * 6,
            },
            async handler(ctx) {
                const sql = `SELECT a.resource_reference as id, a.name as display, a.expert_name, c.class, b.live_at, a.topic as chapter FROM course_resources as a left JOIN course_resource_mapping as b on a.id=b.course_resource_id left join course_details as c on b.assortment_id=c.assortment_id WHERE a.resource_type in (1,8) and a.subject='${ctx.params.subject}' and c.class='${ctx.params.stClass}' and c.meta_info = '${ctx.params.lang}' and b.live_at < now() and b.resource_type='resource' and b.is_replay = 0 GROUP by a.resource_reference order by b.live_at desc limit 10`; // takes approx .3 sec
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },

        getLatestCourseByCCMID: {
            cache: {
                enabled: true,
                ttl: 60 * 60 * 24,
            },
            async handler(ctx) {
                const sql = `SELECT a.ccm_id,c.assortment_id,c.demo_video_thumbnail, concat("doubtnutapp://course_details?id=",c.assortment_id) as deeplink_url, "banner" as type  FROM student_course_mapping as a left join class_course_mapping as b on a.ccm_id=b.id left join course_details as c on b.class=c.class and b.course=c.category WHERE a.student_id = ${ctx.params.studentId} and c.is_active=1 and lower(c.assortment_type) like '%course%' and c.is_free=0 order by a.id, a.updated_at, c.created_at limit ${ctx.params.limit}`; // takes approx .5 sec
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getAnswersDetails: {
            cache: {
                enabled: true,
                ttl: 60 * 60 * 24 * 5,
            },
            async handler(ctx) {
                const sql = `SELECT * from answers where question_id =${ctx.params.questionId}`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getDefaultVariantFromAssortmentIdHome: {
            cache: {
                enabled: true,
                ttl: 60 * 60 * 2,
            },
            async handler(ctx) {
                const sql = `select * from (select id, type, assortment_id, name, description, duration_in_days, flag_key, batch_id from package where assortment_id = ${ctx.params.assortmentId} and reference_type='v3' and type='subscription') as a inner join (select id as variant_id, package_id, base_price, display_price from variants where is_default=1 and is_show=1) as b on a.id=b.package_id order by a.duration_in_days`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getAllVariantFromAssortmentIdHome: {
            cache: {
                enabled: true,
                ttl: 60 * 60 * 12,
            },
            async handler(ctx) {
                const sql = `select * from (select id, type, assortment_id, name, description, duration_in_days from package where flag_key='${ctx.params.flagKey}' and flag_key is not null and reference_type='v3' and type='subscription') as a inner join (select id as variant_id, package_id, base_price, display_price from variants where flagr_variant_id=${ctx.params.variantId}) as b on a.id=b.package_id order by a.duration_in_days`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getUserExpiredPackages: {
            cache: {
                enabled: true,
                ttl: 60 * 5,
            },
            async handler(ctx) {
                const sql = `select * from (select * from student_package_subscription where student_id=${ctx.params.studentId} and amount>-1 and end_date < now()) as a inner join (select * from package where reference_type in ('v3', 'onlyPanel', 'default')) as b on a.new_package_id=b.id left join (select assortment_id, assortment_type from course_details) as cd on cd.assortment_id=b.assortment_id group by cd.assortment_id order by a.id desc`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getUserActivePackages: {
            cache: {
                enabled: true,
                ttl: 60 * 5,
            },
            async handler(ctx) {
                const sql = `select * from (select *, id as subscription_id from student_package_subscription where student_id=${ctx.params.studentId} and start_date < now() and end_date > now() and is_active=1 order by id desc) as a inner join (select * from package where reference_type in ('v3', 'onlyPanel', 'default')) as b on a.new_package_id=b.id left join (select class,assortment_id, assortment_type,display_name, year_exam,display_description,category,meta_info from course_details) as cd on cd.assortment_id=b.assortment_id group by cd.assortment_id order by a.id desc`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getLastestBatchByAssortment: {
            cache: {
                enabled: true,
                ttl: 60 * 30,
            },
            async handler(ctx) {
                const sql = `select batch_id, assortment_id, demo_video_qid from course_assortment_batch_mapping where assortment_id=${ctx.params.assortmentId} and is_active=1 order by batch_start_date desc`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getIasAdvancedFeedback: {
            cache: {
                enabled: false,
                ttl: 60 * 60 * 24,
            },
            async handler(ctx) {
                const sql = `select tab_type, tab_type_value from ias_advanced_filter where class=${ctx.params.studentClass} and language like '%${ctx.params.language}%' and is_active=1 group by tab_type`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getRandomByChapter: {
            params: {
                questionId: { type: "string", required: false },
                entityType: { type: "string" },
                filter: {
                    type: "object",
                    required: false,
                    props: {
                        class: "number",
                        subject: "string",
                        book: "string",
                        chapter: {
                            type: "array",
                            items: "string",
                        },
                    },
                },
                limit: "number",
            },
            async handler(ctx: Context<{ filter: any; limit?: number }>) {
                const sql = `SELECT question_id, ocr_text, case when is_answered=0 and is_text_answered=1 then 'text' else 'video' end as resource_type FROM questions WHERE class= ${ctx.params.filter.class} AND subject = '${ctx.params.filter.subject}' AND book = '${ctx.params.filter.book}' AND chapter in (${ctx.params.filter.chapter.map((x: string) => `'${x}'`).join()}) ORDER BY RAND() limit ${ctx.params.limit || 10} `;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getResourceByPlaylistIdForPdf: {
            params: {
                playlistId: "number",
                limit: { type: "number", default: 20 },
            },
            async handler(ctx: Context<{ playlistId: number; limit: number }, { user: any }>) {
                let sql = `select id, is_last,name, resource_path, view_type,resource_type from new_library where id='${ctx.params.playlistId}' and is_active=1 and is_delete=0 limit 1`;
                const playlist = await this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
                if (!playlist.length || !(playlist[0].is_last === 1 && playlist[0].resource_type === "playlist_api")) {
                    return [];
                }
                const languageObj: any = await ctx.call("$sync-raw.getLanguageByLocale", { locale: ctx.meta.user.locale });
                sql = `${playlist[0].resource_path
                    .replace(/xxlanxx/g, languageObj.language)
                    .replace(/xxclsxx/g, ctx.meta.user.class)
                    .replace(/xxsidxx/g, ctx.meta.user.id)
                    .replace(/xxplaylistxx/g, ctx.params.playlistId)} limit ${ctx.params.limit}`;
                const questionIds = await this.adapter.db.query(sql, { replacements: [ctx.params.playlistId], type: Sequelize.QueryTypes.SELECT }).then(res => res.map(x => x.question_id));
                sql = `SELECT q.question_id, q.ocr_text, case when q.is_answered=0 and q.is_text_answered=1 then 'text' else 'video' end as resource_type FROM questions q where question_id in (${questionIds.join()})`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getActiveSubscriptions: {
            async handler(ctx: Context<null, { user: { id: string } }>) {
                const sql = `select sps.start_date, sps.end_date, sps.amount, p.assortment_id from student_package_subscription sps inner join package p on sps.new_package_id=p.id where student_id=${ctx.meta.user.id} and sps.is_active=1 and end_date >= CURRENT_DATE order by end_date desc`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        getCourseResourcesByResourceReference: {
            cache: {
                enabled: true,
                ttl: 60 * 60 * 24 * 1,
            },
            async handler(ctx: Context<{ ref: string; resourceType: number[]; limit: number }>) {
                const resourceType = (ctx.params.resourceType || [1, 8]).join(",");
                const sql = `select * from course_resources where resource_reference='${ctx.params.ref}' or meta_info='${ctx.params.ref}' and resource_type in (${resourceType}) limit ${ctx.params.limit || 1}`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
        // Bottom-Up
        getAssortmentsByAssortmentId: {
            async handler(ctx: Context<{ assortmentId: number }>) {
                const sql = `SELECT *
                FROM (
                    SELECT
                        @r AS _id,
                        (SELECT @r := assortment_id FROM course_resource_mapping WHERE course_resource_id = _id and 
                            ((resource_type='resource' and course_resource_id=${ctx.params.assortmentId}) 
                        	OR 
                        	(resource_type='assortment' and course_resource_id<>${ctx.params.assortmentId}))  limit 1) AS assortment_id,
                        @l := @l + 1 AS lvl
                    FROM
                        (SELECT @r := ${ctx.params.assortmentId}, @l := 0) vars,
                        course_resource_mapping m
                    WHERE @r <> 0) T1
                JOIN course_resource_mapping T2
                ON T1._id = T2.course_resource_id
                ORDER BY T1.lvl DESC`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT }).then(res => res.filter(x => !(x.course_resource_id === ctx.params.assortmentId && x.resource_type === "assortment") && !(x.course_resource_id !== ctx.params.assortmentId && x.resource_type === "resource")));
            },
        },
        getSubscriptionsByAssortmentId: {
            async handler(ctx: Context<{ assortmentId: number }, { user: { id: string } }>) {
                const sql = `SELECT T2.assortment_id, is_trial, amount, sps.end_date
                FROM (
                    SELECT
                        @r AS _id,
                        (SELECT @r := assortment_id FROM course_resource_mapping WHERE course_resource_id = _id and 
                            ((resource_type='resource' and course_resource_id=${ctx.params.assortmentId}) 
                        	OR 
                        	(resource_type='assortment' and course_resource_id<>${ctx.params.assortmentId})) limit 1) AS assortment_id,
                        @l := @l + 1 AS lvl
                    FROM
                        (SELECT @r := ${ctx.params.assortmentId}, @l := 0) vars,
                        course_resource_mapping m
                    WHERE @r <> 0) T1
                JOIN course_resource_mapping T2 ON T1._id = T2.course_resource_id
                INNER JOIN package p on p.assortment_id=T1.assortment_id
                INNER JOIN student_package_subscription sps on sps.new_package_id=p.id
                WHERE sps.student_id=${ctx.meta.user.id} and sps.is_active=1 and sps.end_date > NOW()
                ORDER BY sps.end_date DESC`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT }).then(res => res.filter(x => !(x.course_resource_id === ctx.params.assortmentId && x.resource_type === "assortment") && !(x.course_resource_id !== ctx.params.assortmentId && x.resource_type === "resource")));
            },
        },
        isResourceInAssortmentId: {
            async handler(ctx: Context<{ assortmentId: number; questionId: number }>): Promise<boolean> {
                const sql = `select cr.id as resource_id, cr.resource_reference from
                (select  course_resource_id, resource_type
                from    course_resource_mapping,
                        (select @pv := ${ctx.params.assortmentId}) initialisation
                where   find_in_set(assortment_id, @pv)
                and     length(@pv := concat(@pv, ',', course_resource_id))
                ) t1
                inner join course_resources cr on t1.course_resource_id=cr.id and t1.resource_type='resource'
                where cr.resource_reference='${ctx.params.questionId}'`;
                const res = await this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
                return !!res.length;
            },
        },
        getAssortmentIdByCourseId: {
            async handler(ctx: Context<{ courseId: number }>) {
                const sql = `select assortment_id from course_details_liveclass_course_mapping where liveclass_course_id=${ctx.params.courseId}`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT }).then(([x]) => x);
            },
        },
        getInternetExpertById: {
            async handler(ctx: Context<{ id: number }>) {
                const sql = `select iexpert_id as id, expert_email, agent_id, sales_role_flag from internet_experts where iexpert_id=${ctx.params.id}`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT }).then(([x]) => x);
            },
        },
        verifyInternetExpertByEmail: {
            async handler(ctx: Context<{ email: string; password: string }>) {
                const sql = `select iexpert_id as id, expert_email, agent_id, sales_role_flag from internet_experts where expert_email='${ctx.params.email}' and hashed_password='${ctx.params.password}'`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT }).then(([x]) => x);
            },
        },
        getRandomInternetExpert: {
            async handler() {
                const sql = "select iexpert_id as id, expert_email, agent_id, sales_role_flag from internet_experts where agent_id is not null and sales_role_flag in (0,1,2) order by rand() limit 1";
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT }).then(([x]) => x);
            },
        },
        getDailyQuizQuestions: {
            params: {
                limit: { type: "number", required: false, default: 10 },
            },
            async handler(ctx: Context<{ limit: number; locale: string }>) {
                const sql = ctx.params.locale !== "hi" ?
                    `select q.question_id as questionId, q.ocr_text as ocr, q.subject, ts.answer as correctOptions,
                case when q.is_answered=0 and q.is_text_answered=1 then 'text' else 'video' end as resourceType
                from questions q
                inner join text_solutions ts on q.question_id=ts.question_id
                LEFT JOIN studentid_package_mapping_new AS d ON q.student_id = d.student_id
                LEFT JOIN chapter_alias_all_lang caal on q.chapter = caal.chapter
                where q.student_id<100 and q.is_text_answered=1
                and ts.opt_1 is not null and ts.opt_1<>''
                and ts.opt_2 is not null and ts.opt_2<>''
                and ts.opt_3 is not null and ts.opt_3<>''
                and ts.opt_4 is not null and ts.opt_4<>''
                and LOWER(answer) IN ('a', 'b', 'c', 'd')
                and d.package_language = 'en'
                and q.subject in ('GENERAL KNOWLEDGE', 'REASONING')
                and rand() < ${ctx.params.limit}/3000
                and q.is_answered=1
                limit ${ctx.params.limit}` :
                    `select q.question_id as questionId, q.ocr_text as ocr, q.subject, ts.answer as correctOptions,
                case when q.is_answered=0 and q.is_text_answered=1 then 'text' else 'video' end as resourceType
                from questions q
                inner join text_solutions ts on q.question_id=ts.question_id
                LEFT JOIN studentid_package_mapping_new AS d ON q.student_id = d.student_id
                LEFT JOIN chapter_alias_all_lang caal on q.chapter = caal.chapter
                where q.student_id<100 and q.is_text_answered=1
                and d.package_language = 'hi'
                and d.target_group ='GOVT'
                and q.subject ='Maths'
                and q.class ='14'
                and d.content_format ='QNA VIDEOS'
                and ts.opt_1 is not null and ts.opt_1<>''
                and ts.opt_2 is not null and ts.opt_2<>''
                and ts.opt_3 is not null and ts.opt_3<>''
                and ts.opt_4 is not null and ts.opt_4<>''
                and LOWER(answer) IN ('a', 'b', 'c', 'd')
                and q.is_answered=1
                and rand() < ${ctx.params.limit}/3000`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT }).then(x => x.map(y => {
                    y.correctOptions = y.correctOptions.toUpperCase().split("::");
                    return y;
                }));
            },
        },
    },
    events: {},
    methods: {},
};

export = Question;
