/* eslint-disable max-lines-per-function */
"use strict";
import { ObjectId } from "mongodb";
import dbMixin from "../config/db.mixin";
import { Story } from "./story.interface";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */


/*  FOR EXPLICIT USE OF REPORTING PANEL */
module.exports = {
  name: "storiesPanel",
  version: 1,
  mixins: [dbMixin("stories")],
  settings: {
    PAGE_SIZE: 25,
    COLLECTION_NAME: "stories",
    PROFANITY_SQS: process.env.PROFANITY_SQS,
  },
  /**
   * Dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    getStoriesByStudent: {
      rest: {
        method: "GET",
        path: "/stories/:studentID",
      },
      params: {
      },
      async handler(ctx: any) {
        let responseData = {};
        try {
          let pageNo: number = 0;
          const studentID: number = parseInt(ctx.params.studentID, 10);
          if (ctx.params.page) {
            // eslint-disable-next-line radix
            pageNo = parseInt(ctx.params.page) - 1;
          }
          const stories: [Story] = await this.adapter.db
            .collection(this.settings.COLLECTION_NAME)
            .find({student_id: studentID })
            .sort({ _id: -1})
            .skip(pageNo * this.settings.PAGE_SIZE)
            .limit(this.settings.PAGE_SIZE)
            .toArray();
          const count: number = await this.adapter.db
            .collection(this.settings.COLLECTION_NAME)
            .countDocuments({student_id: studentID});
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: {
              stories,
              count,
              pageSize: this.settings.PAGE_SIZE,
            },
          };
        } catch (error) {
          // this.myLogger("FgCyan", "GET STORY FAILED", error);
          responseData = {
            meta: {
              code: 500,
              success: false,
              message: "Something Went Wrong",
            },
            error,
          };
        }
        return responseData;
      },
    },
    upsertTag: {
      rest: {
        method: "POST",
        path: "/tag",
      },
      params: {
      },
      async handler(ctx) {
        let responseData: any = {};
        try {
          const data = ctx.params;
          // console.log("SAVING FOR", data.post_id);
          const tagData = await this.adapter.db.collection(`${this.settings.COLLECTION_NAME}_tagged`).findOneAndUpdate(
            // eslint-disable-next-line no-underscore-dangle
            { story_id: new ObjectId(data.post_id) },
            {
              $set: {
                ...data,
              },
              // $setOnInsert: {createdAt},
            },
            { upsert: true },
          );
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: tagData,
          };
        } catch (error) {
          // this.myLogger("FgCyan", "ACTION FAILED", error);
          responseData = {
            meta: {
              code: 500,
              success: false,
              message: "Something Went Wrong",
            },
            error,
          };
        }
        return responseData;
      },
    },
    getStory: {
      rest: {
        method: "GET",
        path: "/story/:storyId",
      },
      params: {
      },
      async handler(ctx) {
        let responseData: any = {};
        try {
          const storyID = new ObjectId(ctx.params.storyId);
          const tagData = await this.adapter.db.collection(this.settings.COLLECTION_NAME)
            .findOne({ _id: storyID});
            // .toArray();
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: tagData,
          };
        } catch (error) {
          // this.myLogger("FgCyan", "ACTION FAILED", error);
          console.log(error);
          responseData = {
            meta: {
              code: 500,
              success: false,
              message: "Something Went Wrong",
            },
            error,
          };
        }
        return responseData;
      },
    },
    getTag: {
      rest: {
        method: "GET",
        path: "/tag/:storyId",
      },
      params: {
      },
      async handler(ctx) {
        let responseData: any = {};
        try {
          const storyID = new ObjectId(ctx.params.storyId);
          const tagData = await this.adapter.db.collection(`${this.settings.COLLECTION_NAME}_tagged`)
            .findOne({ story_id: storyID});
            // .toArray();
          // console.log(storyID, tagData);
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: tagData,
          };
        } catch (error) {
          // this.myLogger("FgCyan", "ACTION FAILED", error);
          console.log(error);
          responseData = {
            meta: {
              code: 500,
              success: false,
              message: "Something Went Wrong",
            },
            error,
          };
        }
        return responseData;
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
