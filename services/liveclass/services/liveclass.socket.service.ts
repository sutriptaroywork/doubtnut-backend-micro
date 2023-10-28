"use strict";

import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";


module.exports = {
  name: "liveclass-socket",
  mixins: [DbService],
  adapter: new MongoDBAdapter(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }),
  collection: "liveclass_socket",
  /**
   * Dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    insert: {
      rest: {
        method: "POST",
        path: "/quiz/log",
      },
      params: {},
      async handler(ctx) {

        try {
          const body = ctx.params;
          this.adapter.db.collection("liveclass_socket").insertOne(body);
          return {response: "SUCCESS"};
        } catch (e) {
          return {response: e.toString()};
          }
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
