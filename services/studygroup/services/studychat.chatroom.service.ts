import {ObjectId} from "mongodb";
import dbMixin from "../config/db.mixin";

module.exports = {
    name: "studyChatChatroom",
    mixins: [dbMixin("study_chat_messages_new")],
    settings: {
        fields: ["_id", "room_id", "room_type", "view_id", "attachment", "message", "student_id", "attachment_mime_type", "student_displayname", "student_img_url", "report_by", "created_at", "updated_at", "is_active", "is_deleted", "cdn_url", "is_admin", "question_id", "thumbnail_image"],
        populates: {
            async cdn_url(ids, messages, rule, ctx) {
                messages.forEach(message => message.cdn_url = process.env.CDN_URL);
                messages.forEach(message => message.message.widget_data.student_img_url = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6BDD71CB-EAF8-E751-0EBB-24FB01937BAE.webp");
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
        listChatMessages: {
            handler(ctx: any) {
                return this.broker.call("studyChatChatroom.list", {
                    page: ctx.params.page,
                    pageSize: ctx.params.pageSize,
                    sort: {_id: -1},
                    query: {
                        room_id: ctx.params.roomId,
                        _id: {$lt: new ObjectId(ctx.params.offsetCursor)},
                        is_deleted: false,
                        view_id: {$in: [0, ctx.params.studentId]},
                    },
                    populate: ["cdn_url"],
                });
            },
        },

        postChatMessages: {
            handler(ctx: any) {
                return this.broker.call("studyChatChatroom.create", ctx.params.postData);
            },
        },
    },
    /**
     * Methods
     */
    methods: {},

    created() {
        // Service created lifecycle event handler
    },

    async started() {
        // Service started lifecycle event handler
    },

    async stopped() {
        //    Service stopped lifecycle event handler
    },
};
