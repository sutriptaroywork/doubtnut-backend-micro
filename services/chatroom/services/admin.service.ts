
import { ObjectId } from "mongodb";
import moment, { length } from "moment";
import { cache } from "sharp";
import dbMixin from "../config/db.mixin";

module.exports = {
  name: "chatroom_admin",
  mixins: [dbMixin("chatroom_admins")],
  settings: {
    fields: ["_id", "student_id", "tag"],
  },
  /**
   * Dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    cacheClean: {
          rest: {
        method: "GET",
        path: "/cacheClean",
      },
      params: {},
      async handler(ctx: any) {
            this.broker.cacher.clean("chatroom_admin.*");
      },
      },
  },
  /**
   * Methods
   */
  methods: {

  },

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
