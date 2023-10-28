import dbMixin from "../config/db.mixin";

module.exports = {
    name: "transactions",
    mixins: [dbMixin("dnr_student_transactions")],
    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {
        insert: {
            async handler(ctx: any) {
                this.broker.call("transactions.create", ctx.params.transactionData);
                return true;
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
