/* eslint-disable @typescript-eslint/prefer-for-of */
import { ServiceSchema, Context } from "moleculer";
import jwt from "jsonwebtoken";
import _ = require("lodash");
import moment from "moment";
import GraphService = require("../../../common/graph.mixins");

const LiveclassCourseService: ServiceSchema = {
    name: "liveclass-course",
    settings: {
        rest: "/liveclass-course",
        graphName: "liveclass",
    },
    mixins: [GraphService],
    //
    dependencies: [],
    actions: {
        getResourcesByAssortmentList: {
            rest: {
                method: "POST",
                path: "/get-resources-by-assortment-list",
            },
            internal: true,
            params: {
                assortment_list: { type: "array", required: true },
                start_date: { type: "number", required: true },
                end_date: { type: "number", required: true },
            },
            async handler(ctx: Context<{ assortment_list: [{ assortment_id: number; batch_id: number }]; start_date: number; end_date: number }>) {
                const { assortment_list: assortmentList, start_date, end_date } = ctx.params;
                const promises = assortmentList.map(assortment => this.getResourceList({ ...assortment, start_date, end_date }));
                const result = await Promise.all(promises);
                let finalResult = _.flatten(result);
                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                finalResult = _.orderBy(finalResult, ["live_at"]);

                for (let i = 0; i < finalResult.length; i++) {
                    const liveAt = moment.unix(finalResult[i].live_at);
                    finalResult[i].live_at = liveAt.format("YYYY-MM-DD HH:mm:ss");
                    finalResult[i].title = `${[1, 4, 8].includes(finalResult[i].resource_type) ? "VIDEO" : [2, 3].includes(finalResult[i].resource_type) ? "PDF" : "TEST"} | ${finalResult[i].subject} | ${finalResult[i].chapter}`;
                    finalResult[i].week = liveAt.day() + 1;
                    finalResult[i].day =  +liveAt.format("DD");
                    finalResult[i].month = liveAt.month() + 1;
                    finalResult[i].year = liveAt.year();

                }
                return finalResult;
            },

        },

        getFutureData: {
            rest: {
                method: "POST",
                path: "/get-future-data",
            },
            internal: true,
            params: {
                assortment_list: { type: "array", required: true },
                end_date: { type: "number", required: true },
            },
            async handler(ctx: Context<{ assortment_list: number[]; end_date: number }>) {
                const { assortment_list: assortmentList, end_date: EndDate } = ctx.params;
                const promises = assortmentList.map(assortment =>  this.getFutureData({assortment_id:assortment, end_date:EndDate}));
                const result = await Promise.all(promises);
                const finalResult = _.flatten(result);
                for (let i = 0; i < finalResult.length; i++) {
                    const liveAt = moment.unix(finalResult[i].live_at);
                    finalResult[i].live_at = liveAt.format("YYYY-MM-DD HH:mm:ss");
                }
                return finalResult;
            },

        },

        getPastData: {
            rest: {
                method: "POST",
                path: "/get-past-data",
            },
            internal: true,
            params: {
                assortment_list: { type: "array", required: true },
                start_date: { type: "number", required: true },
            },
            async handler(ctx: Context<{ assortment_list: number[]; start_date: number }>) {
                const { assortment_list: assortmentList, start_date: startDate } = ctx.params;
                const promises = assortmentList.map(assortment =>  this.getPastData({assortment_id:assortment, start_date:startDate}));
                const result = await Promise.all(promises);
                const finalResult = _.flatten(result);
                for (let i = 0; i < finalResult.length; i++) {
                    const liveAt = moment.unix(finalResult[i].live_at);
                    finalResult[i].live_at = liveAt.format("YYYY-MM-DD HH:mm:ss");
                }
                return finalResult;
            },
        },
        getAssortmentsByResourceReference: {
            rest: {
                method: "POST",
                path: "/get-assortment-by-resource-reference",
            },
            internal: true,
            params: {
                resource_reference: { type: "string", required: true },
            },
            async handler(ctx: Context<{ resource_reference: number }>) {
                const result = await this.getAssortmentsByResourceReference(ctx.params);;
                return result;
            },
        },
    },
    events: {},
    methods: {
        getResourceList({ assortment_id: assortmentId, batch_id: batchId, start_date: startDate, end_date: endDate }) {
            const query = `MATCH (a:Assortment {assortment_id:$assortmentId})-[*]->(videoAssortment:Assortment)-[h:contains{batch_id:$batchId, resource_type:'resource'}]->(b:Resource) where ((h.live_at >$startDate) and (h.live_at<$endDate)) 
            return videoAssortment.assortment_id as assortment_id,
            b.id as course_resource_id,
            videoAssortment.is_free as is_free,
            h.live_at as live_at, 
            h.resource_type as assortment_type,
            b.id as id, 
            b.display as display,
            b.resource_type as resource_type, 
            b.resource_reference as resource_reference,
            b.subject as subject,
            b.player_type as player_type,
            b.description as  description,
            b.stream_status as is_active, 
            b.image_url as image_bg_liveclass,
            b.chapter as chapter`;
            // resource_type in (1,4,8) then \'VIDEO\' when resource_type in (2,3) then \'PDF\' else \'TEST\' end ,\' | \',subject,\' | \',chapter) as title
            return this.query(query, { assortmentId, batchId, startDate, endDate });
        },

        getFutureData({ assortment_id: assortmentId, end_date: endDate }) {
            const query = "MATCH (a:Assortment {assortment_id:$assortmentId})-[*]->()-[h:contains{resource_type:'resource'}]->(b:Resource{resource_type:1}) where h.live_at >=$endDate  return h.live_at as live_at,  b.id as course_resource_id, b.resource_type as assortment_type";
            return this.query(query, { assortmentId, endDate });
        },

        getPastData({ assortment_id: assortmentId, start_date: startDate }) {
            const query = "MATCH (a:Assortment {assortment_id:$assortmentId})-[*]->()-[h:contains{ resource_type:'resource'}]->(b:Resource{resource_type:1}) where h.live_at <=$startDate  return h.live_at as live_at,  b.id as course_resource_id, b.resource_type as assortment_type";
            return this.query(query, { assortmentId, startDate });
        },

        getAssortmentsByResourceReference({ resource_reference: resourceReference }) {
            const query = `MATCH (r:Resource{resource_reference:$resourceReference})<-[h]-(videoAssortment:Assortment)<-[]-(chapter:Assortment)<-[]-(subject:Assortment)
            WHERE r.resource_type IN [1, 4, 8]
            RETURN r.id as id,
            r.subject as subject,
            r.expert_image as expert_image,
            r.expert_name as expert_name,
            r.display as display,
            r.chapter as chapter,
            r.faculty_id as faculty_id,
            r.resource_reference as resource_reference,
            r.stream_status as stream_status,
            h.live_at as live_at,
            subject.assortment_id as subject_assortment,
            chapter.assortment_id as chapter_assortment,
            chapter.class as class,
            chapter.is_free AS is_chapter_free,
            videoAssortment.assortment_id as assortment_id,
            videoAssortment.parent as parent,
            videoAssortment.is_free as is_free,
            r.meta_info as meta_info`;
            return this.query(query, { resourceReference });

        },
    },
};


export = LiveclassCourseService;
