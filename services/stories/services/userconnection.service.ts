import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";

import { adapter } from "../config";

module.exports = {
  name: "userconnections",
  mixins: [DbService],
  adapter,
  model: {
    name: "user_connections",
  },
  /**
   * Dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    getFollowing: {
      rest: {
        method: "GET",
        path: "/v1/getFollowing",
      },
      params: {
      },
      async handler(ctx: any) {
        const sql = `SELECT connection_id FROM user_connections where user_id = ${ctx.params.studentID} and is_deleted = 0`;
        const followingData = await this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
        const following = followingData.map(follow => follow.connection_id);
        // console.log(ctx.params, followingData, following);
        return following;
      },
    },
    checkBan: {
      rest: {
        method: "GET",
        path: "/v1/checkBan",
      },
      params: {
      },
      async handler(ctx: any) {
        const sql = `SELECT * from banned_users where student_id = ${ctx.params.studentID} and is_active = 1`;
        return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
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
