import { ServiceSchema, Context } from "moleculer";
import jwt from "jsonwebtoken";
import _ = require("lodash");
import moment from "moment";
import GraphService = require("../../../common/graph.mixins");

const LiveclassCDCService: ServiceSchema = {
    name: "liveclass-cdc",
    settings: {
        rest: "/liveclass-cdc",
        graphName: "liveclass",
    },
    mixins: [GraphService],
    //
    dependencies: [],
    actions: {
        "course-details": {
            settings: {
                rest: "POST /course-details",
            },
            internal: true,
            params: {
                row: { type: "object", required: true },
            },
            async handler(ctx: Context<{
                row: {
                    assortment_id: number;
                    class: number;
                    ccm_id: number;
                    display_name: string;
                    display_description: string;
                    category: string;
                    display_image_rectangle: string;
                    display_image_square: string;
                    deeplink: string;
                    max_retail_price: number;
                    final_price: number;
                    meta_info: string;
                    max_limit: number;
                    is_active: number;
                    check_okay: number;
                    start_date: number;
                    end_date: number;
                    expiry_date: number;
                    updated_at: number;
                    priority: number;
                    dn_spotlight: number;
                    promo_applicable: number;
                    minimum_selling_price: number;
                    parent: number;
                    is_free: number;
                    assortment_type: string;
                    display_icon_image: string;
                    faculty_avatars: string;
                    demo_video_thumbnail: string;
                    demo_video_qid: string;
                    rating: number;
                    subtitle: string;
                    sub_assortment_type: string;
                    year_exam: string;
                    category_type: string;
                    is_active_sales: number;
                    is_show_web: number;
                    is_deleted: string;
                };
            }>) {
                const assortmentId = ctx.params.row.assortment_id;
                const isDelete = ctx.params.row.is_deleted;
                const updatedAt = ctx.params.row.updated_at;
                let data;
                if (isDelete === "true") {
                    data = await this.deleteCourseDetailNode({ assortmentId });
                } else {
                    const nodedata = await this.getCourseDetailsNode({ assortmentId });
                    if (nodedata.length > 0 && moment(updatedAt).unix() > moment(nodedata[0]["a.updated_at"]).unix()) {
                        data = await this.updateCourseDetailNode({ assortmentId, courseDetailsData: _.omit(ctx.params.row, ["is_delete"]) });
                    }
                }
                return data ? data : "No Change";
            },

        },
        "course-resources": {
            rest: "POST /course-resources",
            params: {
                row: { type: "object", required: true },
            },
            internal: true,
            async handler(ctx: Context<{
                row: {
                    id: number;
                    resource_reference: string;
                    resource_type: number;
                    subject: string;
                    topic: string;
                    expert_name: string;
                    expert_image: string;
                    q_order: number;
                    class: number;
                    meta_info: string;
                    tags: string;
                    name: string;
                    display: string;
                    description: string;
                    chapter: string;
                    chapter_order: string;
                    exam: string;
                    board: string;
                    ccm_id: string;
                    book: string;
                    faculty_id: number;
                    stream_start_time: number;
                    image_url: string;
                    locale: string;
                    vendor_id: number;
                    duration: number;
                    rating: number;
                    old_resource_id: number;
                    stream_end_time: number;
                    stream_push_url: string;
                    stream_vod_url: string;
                    stream_status: string;
                    old_detail_id: number;
                    lecture_type: string;
                    is_active: number;
                    updated_at: number;
                    is_deleted: string;
                };
            }>) {
                const row = ctx.params.row;
                const id = row.id;
                const isDelete = row.is_deleted;
                const updatedAt = row.updated_at;
                let data;
                if (isDelete === "true") {
                    data = await this.deleteCourseResourceNode({ id });
                } else {
                    const nodedata = await this.getCourseResourceNode({ id });
                    if (nodedata.length > 0 && moment(updatedAt).unix() > moment(nodedata[0]["a.updated_at"]).unix()) {
                        data = await this.updateCourseResourceNode({ id, courseResourceData: _.omit(row, ["is_delete"]) });
                    }
                }
                return data ? data : "No Change";

            },
        },
        "course-resource-mapping": {
            rest: "POST /course-resource-mapping",
            params: {
                row: { type: "object", required: true },
            },
            internal: true,
            async handler(ctx: Context<{
                row: {
                    id: number;
                    assortment_id: number;
                    course_resource_id: number;
                    resource_type: string;
                    schedule_type: string;
                    live_at: number;
                    is_replay: number;
                    batch_id: number;
                    updated_at: number;
                    is_deleted: string;
                };
            }>) {
                const row = ctx.params.row;
                const id = row.id;
                const isDelete = row.is_deleted;
                const updatedAt = row.updated_at;
                let data;
                if (isDelete === "true") {
                    data = await this.deleteCourseResourceMappingRelation({ id });
                } else {
                    const nodedata = await this.getCRMRelation({ id });
                    if (nodedata.length > 0 && moment(updatedAt).unix() > moment(nodedata[0]["a.updated_at"]).unix()) {
                        data = await this.updateCRMRelation({ id, relData: _.omit(row, ["assortment_id", "course_resource_id", "is_delete"]), childId: row.course_resource_id, parentId: row.assortment_id });
                    }
                }
                return data ? data : "No Change";
            },
        },
    },
    events: {},
    methods: {
        async deleteCourseDetailNode(params: any) {
            const query = "MATCH (a:Assortment {assortment_id: $assortmentId}) delete a";
            return this.query(query, params);
        },

        async deleteCourseResourceNode(params: any) {
            const query = "MATCH (r:Resource {id: $id}) delete r";
            return this.query(query, params);
        },

        async deleteCourseResourceMappingRelation(params: any) {
            const query = "MATCH ()-[r:contains{id:$id}]->() delete r";
            return this.query(query, params);
        },

        async getCRMRelation(params: any) {
            const query = "MATCH ()-[a:contains{id:$id}]->() return a.updated_at";
            return this.query(query, params);
        },

        async getCourseDetailsNode(params: any) {
            const query = "MATCH (a:Assortment {assortment_id: $assortmentId}) return a.updated_at";
            return this.query(query, params);
        },

        async getCourseResourceNode(params: any) {
            const query = "MATCH (r:Resource {id: $id}) return r";
            return this.query(query, params);
        },

        async updateCRMRelation(params: any) {
            let query: string;
            if (params.relData.resource_type === "assortment") {
                query = "Match (a:Assortment{assortment_id:$parentId}) Match (b:Assortment{assortment_id:$childId}) MERGE (a)-[r:contains{$id}]->(b) set r = $relData";
            } else {
                query = "Match (a:Assortment{assortment_id:$parentId}) Match (b:Resource{id:$childId}) MERGE (a)-[r:contains{$id}]->(b) set r = $relData";
            }
            return this.query(query, params);
        },

        async updateCourseDetailNode(params: any) {
            const query = "MERGE (a:Assortment {assortment_id: $assortmentId}) SET a = $courseDetailsData";
            return this.query(query, params);
        },

        async updateCourseResourceNode(params: any) {
            const query = "MERGE (r:Resource {$id}) SET r = $courseResourceData";
            return this.query(query, params);
        },

    },
};


export = LiveclassCDCService;
