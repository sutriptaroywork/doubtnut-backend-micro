
import { ObjectId } from "mongodb";
import moment, { length } from "moment";
import dbMixin from "../config/db.mixin";

module.exports = {
  name: "chatroom_report",
  mixins: [dbMixin("chatroom_report")],
  settings: {
    fields: ["_id", "student_id", "post_id", "reported_by", "is_admin"],
  },
  /**
   * Dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
      report: {
      rest: {
        method: "POST",
        path: "/report",
      },
      params: {},
      async handler(ctx: any) {
        const reportData = ctx.params;
        reportData.reported_by = parseInt(ctx.meta.user.id, 10);
        reportData.student_id = parseInt(reportData.student_id, 10);
        reportData.post_id = new ObjectId(reportData.post_id);
        const checkAdmin = await ctx.call("chatroom_admin.list", { query: { student_id: ctx.meta.user.id } });
       reportData.is_admin = false;
        if (checkAdmin.total) {
          reportData.is_admin = true;
           ctx.call("chatroom.update", { id: reportData.post_id, is_deleted: true });
        }
        return await ctx.call("chatroom_report.create", reportData);
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
