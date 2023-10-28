
import { ObjectId } from "mongodb";
import moment, { length } from "moment";
import dbMixin from "../config/db.mixin";
const { MoleculerError } = require("moleculer").Errors;

module.exports = {
  name: "chatroom_bans",
  mixins: [dbMixin("chatroom_bans")],
  settings: {
    fields: ["_id", "student_id", "banned_till", "banned_by", "banned_for", "is_deleted", "post_id", "room_id"],
  },
  /**
   * Dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
      banUser: {
      rest: {
        method: "POST",
        path: "/ban",
      },
      params: {},
      async handler(ctx: any) {
        const banData = ctx.params;
        const banTime = process.env.BAN_TIME ? parseInt(process.env.BAN_TIME, 10) : 12;
        const checkAdmin = await ctx.call("chatroom_admin.list", {query:{ student_id:ctx.meta.user.id}});
        if (!checkAdmin.total) {
          throw new MoleculerError("not admin", 422, "ERROR", banData);
        }
        banData.student_id = parseInt(banData.student_id, 10);
        banData.room_id = parseInt(banData.room_id, 10);
        banData.post_id = new ObjectId(banData.post_id);
        banData.banned_till = moment().add(5 * banTime, "hours").add(30, "minutes").valueOf();
        banData.is_deleted = false;
        banData.banned_by = ctx.meta.user.id;
        banData.banned_for = "liveclass";
        ctx.call("chatroom.update", { id: banData.post_id, is_deleted: true });
        return await ctx.call("chatroom_bans.create", banData);
     },
    },
    banStatus: {
      rest: {
        method: "GET",
        path: "/status",
      },
      params: {},
      async handler(ctx: any) {
        const banData = await ctx.call("chatroom_bans.list", {
          query: {
            student_id: ctx.meta.user.id, banned_till: {
              $gt:  moment().add(5, "hours").add(30, "minutes").valueOf(),
            },
          },
        });
        return { status: banData.total ? "BANNED" : "NOT_BANNED" };

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
