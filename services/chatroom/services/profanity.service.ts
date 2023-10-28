import moment from "moment";
import dbMixin from "../config/db.mixin";

module.exports = {
    name: "profanity",
    mixins: [dbMixin("profane_messages")],
    settings: {
        fields: ["_id", "room_id", "room_type", "message", "student_id", "created_at", "is_admin"],
    },
    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {

        // Log abusive post
        abusivePost: {
            rest: {
                method: "POST",
                path: "/profane-post",
            },
            params: {},
            handler(ctx: any) {
                const postData = ctx.params;
                postData.student_id = parseInt(postData.student_id, 10);
                postData.created_at = moment().add(5, "hours").add(30, "minutes").toDate();
                return ctx.call("profanity.create", postData);
            },
        },


        // List Post

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
