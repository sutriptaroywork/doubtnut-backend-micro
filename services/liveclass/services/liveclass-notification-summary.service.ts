import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import _ from "lodash";
import { ServiceSchema, Context } from "moleculer";
import { adapter } from "../config";

const LCNotificationSummaryService: ServiceSchema = {
    name: "liveclass-notification-summary",
    settings: {
        rest: "/liveclass-notification-summary",
    },
    mixins: [DbService],
    adapter,
    model: {
        name: "test",
    },
    dependencies: [],
    actions: {
        getSummary: {
            rest: "GET /",
            internal: true,
            params: {
                startDate: "string",
                endDate: "string",
            },
            async handler(ctx: Context<{ startDate: string; endDate: string }>) {
                const snids = await this.actions.getSNIds({ startDate: new Date(parseInt(ctx.params.startDate)), endDate: new Date(parseInt(ctx.params.endDate)) });

                const promises = [];
                for (const qid in snids) {
                    const assIds = snids[qid];
                    promises.push(this.getStatus(qid, assIds));
                }
                return Promise.all(promises);
            },
        },
        getSNIds: {
            params: {
                startDate: "date",
                endDate: "date",
            },
            async handler(ctx: Context<{ startDate: Date; endDate: Date }>) {
                const sql = `SELECT e.assortment_id as course_ass_id,d.assortment_id as subject_ass_id, c.assortment_id as chapter_ass_id,a.assortment_id as last_ass_id, a.live_at,b.resource_reference
                from 
                (SELECT * from course_resource_mapping where live_at between '${ctx.params.startDate.toISOString().substr(0, 10)}' and '${ctx.params.endDate.toISOString().substr(0, 10)}' and schedule_type = 'scheduled' and resource_type = 'resource') as a
                left join course_resources as b on a.course_resource_id = b.id
                left join course_resource_mapping as c on a.assortment_id = c.course_resource_id and c.resource_type = 'assortment'
                left join course_resource_mapping as d on c.assortment_id = d.course_resource_id and d.resource_type = 'assortment'
                left join course_resource_mapping as e on d.assortment_id = e.course_resource_id and e.resource_type = 'assortment'
                left join (SELECT liveclass_course_id,assortment_id,vendor_id,is_free,case when board like 'STATE ENGLISH' then 'CBSE' else board end as board,exam,locale,course_type 
                from course_details_liveclass_course_mapping) as f on e.assortment_id=f.assortment_id
                where b.resource_type in (1,4) and a.live_at between '${ctx.params.startDate.toISOString().substr(0, 10)}' and '${ctx.params.endDate.toISOString().substr(0, 10)}' 
                and a.is_replay = 0 and f.vendor_id in (1,2) and f.is_free = 0
                group by 1,2,3,4,5,6`;
                const rows: any[] = await this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
                const snids = {};
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    if (!snids[row.resource_reference]) {
                        snids[row.resource_reference] = [];
                    }
                    snids[row.resource_reference].push(row.course_ass_id);
                    snids[row.resource_reference].push(row.subject_ass_id);
                    snids[row.resource_reference].push(row.chapter_ass_id);
                    snids[row.resource_reference].push(row.last_ass_id);
                    snids[row.resource_reference] = _.uniq(snids[row.resource_reference]);
                }
                return snids;
            },
        },
    },
    events: {},
    methods: {
        async getStatus(questionId, assIds) {
            const res: any[] = await this.broker.mcall(assIds.map(x => ({
                action: "newton.aggregate", params: {
                    pipeline: [
                        { $match: { "data.s_n_id": `LC_PAID_${questionId}_${x}` } },
                        { $project: { success: "$response.success", seen: { $size: { "$ifNull": ["$seen", []] } }, to: { $size: { "$ifNull": ["$to", []] } } } },
                    ],
                },
            }))).then((x: any[]) => _.flatten(x));
            this.logger.debug(res);
            const success = _.sumBy(res, "success");
            const seen = _.sumBy(res, "seen");
            const to = _.sumBy(res, "to");
            this.logger.info(questionId, success, to, seen);
            return { questionId, success, seen, to };
        },
    },
};

export = LCNotificationSummaryService;
