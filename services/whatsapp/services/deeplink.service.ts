import { ServiceSchema, Context } from "moleculer";
import axios, { AxiosInstance } from "axios";

const DeeplinkService: ServiceSchema = {
    name: "$deeplink",
    settings: {
        branchUrl: axios.create({ baseURL: "https://api.branch.io", headers: { "Content-Type": "application/json" } }),
        tinyUrl: axios.create({ baseURL: "https://api.tinyurl.com", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.TINYURL_TOKEN}` } }),
        rest: "/deeplink",
    },
    actions: {
        createBulk: {
            visibility: "public",
            async handler(ctx: Context<{
                studentId: number;
                campaign: string;
                channel?: string;
                feature?: string;
                data: {
                    questionId?: string;
                    resourceType?: string;
                    title?: string;
                    description?: string;
                    imageUrl?: string;
                    webUrl?: string;
                    groupId?: string;
                    isFaq?: string;
                    inviterId?: string;
                    student_id?: number;
                }[];
                source?: string;
                parentId?: string;
            }>) {
                try {
                    const sid = ctx.params.source ? (ctx.params.parentId ? `${ctx.params.source}:${ctx.params.parentId}:${ctx.params.studentId}` : `${ctx.params.source}::${ctx.params.studentId}`) : ctx.params.studentId.toString();
                    const res = await (this.settings.branchUrl as AxiosInstance).post(`/v1/url/bulk/${process.env.BRANCH_KEY}`, ctx.params.data.map(x => ({
                        channel: ctx.params.channel || "app_viral",
                        feature: ctx.params.feature || "video",
                        campaign: ctx.params.campaign,
                        data: {
                            qid: x.questionId ? x.questionId.toString() : null,
                            sid,
                            student_id: x.student_id,
                            type: "2",
                            page: "DEEPLINK",
                            resource_type: x.resourceType,
                            group_id: x.groupId,
                            is_faq: x.isFaq,
                            inviter: x.inviterId,
                            $og_title: x.title,
                            $og_description: x.description || x.title,
                            $og_image_url: x.imageUrl || x.webUrl,
                            // $ios_url: x.webUrl,
                            $desktop_url: x.webUrl,
                            $fallback_url: x.webUrl,
                        },
                    })));
                    return res.data;
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
        createTinyUrl: {
            rest: {
                method: "POST",
                path: "/tinyurl",
            },
            internal: true,
            async handler(ctx: Context<{ url: string; tags: string[] }>) {
                const res = await (this.settings.tinyUrl as AxiosInstance).post("/create", {
                    url: ctx.params.url,
                    domain: "tiny.doubtnut.com",
                    tags: ctx.params.tags ? ctx.params.tags.join() : null,
                });
                return res.data.data.tiny_url;
            },
        },
    },
};

export = DeeplinkService;
