"use strict";

import DbService from "dn-moleculer-db";
import * as _ from "lodash";
import moment from "moment";
import MongoDBAdapter from "moleculer-db-adapter-mongo";


module.exports = {
    name: "walletmongo",
    mixins: [DbService],
    adapter: new MongoDBAdapter(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }),
	collection: "notification",
    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {
        saveToWalletTransactions: {
            async handler(ctx: any) {
              return await this.adapter.db.collection("wallet_transactions").save({
                    student_id: ctx.params.student_id,
                    type: ctx.params.type,
                    amount: ctx.params.amount,
                    cash_amount: ctx.params.cash_amount,
                    reward_amount: ctx.params.reward_amount,
                    payment_info_id: ctx.params.payment_info_id,
                    reason: ctx.params.reason,
                    expiry: ctx.params.expiry,
                    reason_ref_id: ctx.params.reason_ref_id,
                    webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate()
                });

            },
        },
    },
    events: {
        saveFlagrResponse: {
            async handler(ctx: any) {
                return await this.adapter.db.collection("doubt_paywall_flagr_logging").save({
                    student_id: ctx.params.student_id,
                    flagr_response: ctx.params.flagr_response,
                    time_stamp: ctx.params.time_stamp,
                });
            },
        },
    },
};
