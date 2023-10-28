import {ObjectId} from "mongodb";
import moment from "moment";
import dbMixin from "../config/db.mixin";

module.exports = {
    name: "chatroom",
    mixins: [dbMixin("chatroom_messages")],
    settings: {
        fields: ["_id", "room_id", "room_type", "attachment", "message", "student_id", "attachment_mime_type", "student_displayname", "student_img_url", "report_by", "created_at", "updated_at", "is_active", "is_deleted", "cdn_url", "is_author", "is_admin", "user_tag", "question_id", "thumbnail_image"],
        populates: {
            async cdn_url(ids, messages, rule, ctx) {
                messages.forEach(message => message.cdn_url = process.env.CDN_URL);
                messages.forEach(message => message.message.widget_data.student_img_url = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6BDD71CB-EAF8-E751-0EBB-24FB01937BAE.webp");
            },
            async is_author(ids, messages, rule, ctx) {
                messages.forEach(message => {
                    message.is_author = false;
                    // eslint-disable-next-line eqeqeq
                    if (ctx.meta.user.id == message.student_id) {
                        message.is_author = true;
                    }
                });
            },
        },
    },
    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {
        listMessages: {
            rest: {
                method: "GET",
                path: "/messages/:room_id/:room_type",
            },
            params: {},
            // eslint-disable-next-line max-lines-per-function
            async handler(ctx: any) {
                const room_id = ctx.params.room_id;
                let offsetCursor = ctx.params.offset_cursor;
                //  const last_message_id = ctx.params.last_message_id;
                const page = ctx.params.page ? ctx.params.page : 1;
                const pageSize = 30;

                if (!offsetCursor) {
                    offsetCursor = Math.floor(new Date().getTime() / 1000).toString(16) + "0000000000000000";
                }
                const posts = await ctx.call("chatroom.list", {
                    page,
                    pageSize,
                    sort: {_id: -1},
                    query: {room_id, _id: {$lt: new ObjectId(offsetCursor)}, is_deleted: false},
                    populate: ["cdn_url", "is_author"],
                });
                posts.offsetCursor = offsetCursor;
                // eslint-disable-next-line eqeqeq
                if (page == 1) {
                    const checkAdmin = await ctx.call("chatroom_admin.list", {query: {student_id: ctx.meta.user.id}});
                    if (checkAdmin.total) {
                        posts.is_admin = true;
                        posts.user_tag = checkAdmin.rows[0].tag;
                    } else {
                        posts.is_admin = false;
                        const checkBanned = await ctx.call("chatroom_bans.banStatus");
                        posts.is_banned = checkBanned.status === "BANNED";
                    }

                }
                return {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                    data: posts,
                };
            },
        },
        // Create Post
        createPost: {
            rest: {
                method: "POST",
                path: "/post",
            },
            params: {},
            async handler(ctx: any) {
                const postData = ctx.params;
                postData.student_id = parseInt(postData.student_id, 10);
                const currentDate = moment().add(5, "hours").add(30, "minutes").toISOString();
                postData.created_at = currentDate;
                postData.updated_at = currentDate;
                postData.is_active = true;
                postData.is_deleted = false;
                postData.is_admin = false;
                delete postData.active_students;
                delete postData.is_profane;
                await ctx.call("chatroom.create", postData);
                return {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                };
            },
        },
        // Create Multiple Post
        createMultiplePost: {
            rest: {
                method: "POST",
                path: "/multiple-post",
            },
            params: {},
            async handler(ctx: any) {
                const postData = ctx.params;
                for (const roomId of postData.room_list) {
                    const data = JSON.parse(postData.message);
                    data.room_id = roomId;
                    data.student_id = parseInt(data.student_id, 10);
                    const currentDate = moment().add(5, "hours").add(30, "minutes").toISOString();
                    data.created_at = currentDate;
                    data.updated_at = currentDate;
                    data.is_active = true;
                    data.is_deleted = false;
                    /* const checkAdmin = await ctx.call("chatroom_admin.list", {query: {student_id: data.student_id}});
                    if (checkAdmin.total) {
                      data.is_admin = true;
                      data.user_tag = checkAdmin.rows[0].tag;
                    } else {
                      data.is_admin = false;
                      const checkBanned = await ctx.call("chatroom_bans.banStatus");
                      if (checkBanned.status === "BANNED") {
                        data.is_delete = true;
                      }
                    }
                    console.log("data ", data);*/
                    ctx.call("chatroom.create", data);
                }
                return {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                };
            },
        },
    },
    /**
     * Methods
     */
    methods: {},

    /**
     * Service created lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    created() {

    },

    /**
     * Service started lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async started() {

    },

    /**
     * Service stopped lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async stopped() {

    },
};
