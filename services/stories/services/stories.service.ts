/* eslint-disable max-lines-per-function */
"use strict";
import axios from "axios";
import { ObjectId } from "mongodb";
import { SQS } from "aws-sdk";
import dbMixin from "../config/db.mixin";
import { Story, Action } from "./story.interface";


const sqs = new SQS({
  signatureVersion: "v4",
  region: "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: "stories",
  version: 1,
  mixins: [dbMixin("stories")],
  settings: {
    CDN_URL: "https://d10lpgp6xz60nq.cloudfront.net/images/",
    PLUS_ICON: "https://iconsetc.com/icons-watermarks/simple-green/bfa/bfa_plus-circle/bfa_plus-circle_simple-green_512x512.png",
    PAGE_SIZE: 25,
    ACTIONS: ["like", "view"],
    EXPIRE_TIME: 5, // seconds,
    COLLECTION_NAME: "stories",
    CIRCLE_COLOR: "#EAF32C",
    ADMINS: [
      7232, // Aditya Shankar
      4414510, // Umang
      4413678, // Parth
      28075529, // Sanjeev
      25787005, // Charmi
      13098982, // Aditya Pathak
    ],
    BAN_CRITERIA: 5, // Ban if reports are >= 5
    API_URL: "https://api.doubtnut.com",
    PROFANITY_SQS: process.env.PROFANITY_SQS,
    OVERFLOW_LIMIT: 50,
    OVERFLOW_MESSAGE: "Status Posting Limit Exceeded.",
  },
  /**
   * Dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    getAddStory: {
      rest: {
        method: "GET",
        path: "/addStory",
      },
      params: {
      },
      async handler(ctx: any) {
        let responseData = {};
        try {
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: {
              plusIcon: this.settings.PLUS_ICON,
              expiryTime: this.settings.EXPIRE_TIME,
              circleColor: this.settings.CIRCLE_COLOR,
              CDN_URL: this.settings.CDN_URL,
              pageSize: this.settings.PAGE_SIZE,
            },
          };
        } catch (error) {
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
    getStories: {
      rest: {
        method: "GET",
        path: "/stories",
      },
      params: {
      },
      async handler(ctx: any) {
        let responseData = {};
        try {
          let pageNo: number = 0;
          const studentID: number = ctx.meta.user.student_id;
          const type: string = ctx.params.type;
          if (ctx.params.page) {
            // eslint-disable-next-line radix
            pageNo = parseInt(ctx.params.page) - 1;
          }
          const queryDate = new Date();
          const offsetCursor = ctx.params.offsetCursor
            ? ctx.params.offsetCursor
            : `${Math.floor(queryDate.getTime() / 1000).toString(16)}0000000000000000`;
          queryDate.setHours(queryDate.getHours() - 24);
          const queryID = `${Math.floor(queryDate.getTime() / 1000).toString(16)}0000000000000000`;
          const promises = [];
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: {
              story:[],
              pageSize: 0,
              offsetCursor,
            },
          };
          return responseData;

          switch (type) {
            // case "MYSTORY":
            //     promises.push(this.getMyStory(studentID, queryID, this.adapter.db));
            //     break;
            case "FOLLOWING":
              promises.push(this.getBulkStories(studentID, queryID, this.adapter.db, true, pageNo, offsetCursor, ctx));
              break;
            case "RANDOM":
              promises.push(this.getBulkStories(studentID, queryID, this.adapter.db, false, pageNo, offsetCursor, ctx));
              break;
            default:
              responseData = {
                meta: {
                  code: 500,
                  success: false,
                  message: "Wrong Type of Stories Requested",
                },
                data: null,
              };
              return responseData;
          }
          if (!pageNo && (type === "FOLLOWING")) {
            promises.push(this.getMyStory(studentID, queryID, this.adapter.db));
          }
          // eslint-disable-next-line prefer-const
          let [story, myStatus = []] = await Promise.all(promises);
          if (myStatus.length) {
            story = myStatus.concat(story);
          }
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: {
              story,
              pageSize: this.settings.PAGE_SIZE + myStatus.length,
              offsetCursor,
            },
          };
        } catch (error) {
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
    getPopularStories: {
      rest: {
        method: "GET",
        path: "/popular/stories",
      },
      params: {
      },
      async handler(ctx: any) {
        let responseData = {};
        try {
          let pageNo: number = 0;
          const studentID: number = ctx.meta.user.student_id;
          if (ctx.params.page) {
            // eslint-disable-next-line radix
            pageNo = parseInt(ctx.params.page) - 1;
          }
          const queryDate = new Date();
          const offsetCursor = ctx.params.offsetCursor
            ? ctx.params.offsetCursor
            : `${Math.floor(queryDate.getTime() / 1000).toString(16)}0000000000000000`;
          queryDate.setHours(queryDate.getHours() - 24);
          const queryID = `${Math.floor(queryDate.getTime() / 1000).toString(16)}0000000000000000`;

          // eslint-disable-next-line prefer-const
          let story = await this.getPopularStories(studentID, queryID, this.adapter.db, pageNo, offsetCursor, ctx);

          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: {
              story,
              pageSize: this.settings.PAGE_SIZE,
              offsetCursor,
            },
          };
        } catch (error) {
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
    createStory: {
      rest: {
        method: "POST",
        path: "/story",
      },
      params: {
      },
      async handler(ctx) {
        let responseData: any = {};
        try {
          if (!ctx.params.attachment) {
            responseData = {
              meta: {
                code: 418,
                success: false,
                message: "Status Attachment missing",
              },
            };
            return responseData;
          }
          const createdAt = new Date();
          createdAt.setTime(createdAt.getTime() + (330 * 60 * 1000));
          const data: Story = {
            caption: ctx.params.caption || "",
            type: ctx.params.type || "image",
            attachment: ctx.params.attachment ? ctx.params.attachment.split(",") : [],
            student_id: ctx.meta.user.student_id,
            class: ctx.meta.user.student_class,
            profile_image: ctx.meta.user.img_url,
            username: this.createUsername(ctx.meta.user.student_fname, ctx.meta.user.student_lname, ctx.meta.user.student_username),
            is_deleted: true,
            is_profane: false,
            is_duplicate: false,
            is_overflow: false,
            view_count: 0,
            like_count: 0,
            cdn_url: this.settings.CDN_URL,
            createdAt,
          };
          const checkbanned = await ctx.call("userconnections.checkBan", { studentID: ctx.meta.user.student_id });
          const currentDate = new Date();
          currentDate.setHours(currentDate.getHours() - 24);
          const queryID = `${Math.floor(currentDate.getTime() / 1000).toString(16)}0000000000000000`;
          const count = await this.adapter.db.collection(this.settings.COLLECTION_NAME).countDocuments({
            _id: { $gt: new ObjectId(queryID) },
            is_overflow: false,
            student_id: data.student_id,
          });
          if (count > this.settings.OVERFLOW_LIMIT) {
            data.is_overflow = true;
          }
          if (data.caption && !data.is_overflow) {
            const lastStory = await this.adapter.db.collection(this.settings.COLLECTION_NAME)
              .findOne(
                { student_id: data.student_id, is_overflow: false },
                { sort: { _id: -1 } },
              );
            if (lastStory && (lastStory.caption === data.caption)) {
              data.is_duplicate = true;
            }
          }

          await this.adapter.db.collection(this.settings.COLLECTION_NAME).insertOne(data);

          if (checkbanned && checkbanned.length === 0 && !data.is_duplicate && !data.is_overflow) {
            this.sqsTrigger(this.settings.PROFANITY_SQS, { entity: data, entity_type: "STORY" });
            // console.log("Sent for Profanity Check");
          }
          responseData = {
            meta: {
              code: 200,
              success: !data.is_overflow,
              message:  data.is_overflow ? this.settings.OVERFLOW_MESSAGE : "Status Added Successfully!",
            },
            data,
          };
        } catch (error) {
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
    action: {
      rest: {
        method: "POST",
        path: "/action",
      },
      params: {
      },
      async handler(ctx) {
        let responseData: any = {};
        try {
          const createdAt = new Date();
          createdAt.setTime(createdAt.getTime() + (330 * 60 * 1000));
          const data: Action = {
            story_id: new ObjectId(ctx.params.id),
            type: ctx.params.type,
            value: ctx.params.value,
            student_id: ctx.meta.user.student_id,
            profile_image: ctx.meta.user.img_url,
            username: this.createUsername(ctx.meta.user.student_fname, ctx.meta.user.student_lname, ctx.meta.user.student_username),
            class: ctx.meta.user.student_class,
          };
          const counter: string = `${data.type}_count`;

          const actionData = await this.adapter.db.collection(`${this.settings.COLLECTION_NAME}_action`).findOneAndUpdate(
            { story_id: data.story_id, type: data.type, student_id: data.student_id },
            {
              $set: {
                ...data,
              },
              $setOnInsert: {createdAt},
            },
            { upsert: true },
          );
          if (!actionData.value || actionData.value.value !== data.value) {
            this.adapter.db.collection(this.settings.COLLECTION_NAME).findOneAndUpdate(
              { _id: data.story_id },
              {
                $inc: {
                  [counter]: data.value ? 1 : -1,
                },
              },
            );
          }
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: {},
          };
        } catch (error) {
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

    getActionStatus: {
      rest: {
        method: "POST",
        path: "/actionStatus",
      },
      params: {
      },
      async handler(ctx: any) {
        let responseData = {};
        try {
          const status: [Action] = await this.adapter.db.collection(`${this.settings.COLLECTION_NAME}_action`).find(
            {
              story_id: new ObjectId(ctx.params.id),
              type: ctx.params.type,
              student_id: ctx.meta.user.student_id,
            },
          ).toArray();
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: {
              status: status.length ? status[0].value : false,
            },
          };
        } catch (error) {
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
    getStoryMeta: {
      rest: {
        method: "GET",
        path: "/storyMeta/:id",
      },
      params: {
      },
      async handler(ctx: any) {
        let responseData = {};
        try {
          const payload: [Action] = await this.adapter.db.collection(`${this.settings.COLLECTION_NAME}_action`)
            .find({
              story_id: new ObjectId(ctx.params.id),
              type: ctx.params.type,
              value: true,
            })
            .sort({ _id: -1 })
            .toArray();
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: {
              [ctx.params.type]: payload,
            },
          };
        } catch (error) {
          // this.myLogger("FgCyan", "STORY META FAILED", error);
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

    getStoryMetaCount: {
      rest: {
        method: "GET",
        path: "/storyMetaCount/:id",
      },
      params: {
      },
      async handler(ctx: any) {
        let responseData = {};
        try {
          const data = [];
          // eslint-disable-next-line @typescript-eslint/prefer-for-of
          for (let k = 0; k < this.settings.ACTIONS.length; k++) {
            const payload: number = await this.adapter.db.collection(`${this.settings.COLLECTION_NAME}_action`).countDocuments({
              story_id: new ObjectId(ctx.params.id),
              type: this.settings.ACTIONS[k],
              value: true,
            });
            data.push({
              type: this.settings.ACTIONS[k],
              count: payload,
            });
          }
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data,
          };
        } catch (error) {
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

    reportStory: {
      rest: {
        method: "POST",
        path: "/report/:id",
      },
      params: {
      },
      async handler(ctx: any) {
        let responseData = {};
        try {
          const studentID: number = ctx.meta.user.student_id;
          await this.adapter.db.collection(`${this.settings.COLLECTION_NAME}_reports`).findOneAndUpdate(
            { story_id: new ObjectId(ctx.params.id), student_id: studentID },
            {
              $set: {
                reason: ctx.params.reason ? ctx.params.reason : "NO REASON",
              },
            },
            { upsert: true },
          );
          const reportCount: number = await this.adapter.db.collection(`${this.settings.COLLECTION_NAME}_reports`).countDocuments({
            story_id: new ObjectId(ctx.params.id),
          });
          if (reportCount >= this.settings.BAN_CRITERIA || this.settings.ADMINS.includes(studentID)) {
            // can remove all Stories as well
            const story = await this.adapter.db.collection(this.settings.COLLECTION_NAME).findOneAndUpdate(
              { _id: new ObjectId(ctx.params.id) },
              {
                $set: {
                  is_deleted: true,
                },
              },
              { returnNewDocument: true },
            );
            // Bannnig User
            if (story.value && story.value.student_id) {
              axios.get(`${this.settings.API_URL}/v1/social/${story.value.student_id}/banUser`, {
                headers: {
                  "x-auth-token": ctx.meta.xAuthToken,
                },
              });
            }
            // console.log("TO BE BANNED", story.value && story.value.student_id);
          }
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: {
              reportCount,
            },
          };
        } catch (error) {
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
    deleteStory: {
      rest: {
        method: "GET",
        path: "/delete/:id",
      },
      params: {
      },
      async handler(ctx: any) {
        let responseData = {};
        try {
          await this.adapter.db.collection(this.settings.COLLECTION_NAME).findOneAndUpdate(
            { _id: new ObjectId(ctx.params.id) },
            {
              $set: {
                is_deleted: true,
              },
            },
            // { returnNewDocument: true },
          );
          responseData = {
            meta: {
              code: 200,
              success: true,
              message: "Success",
            },
            data: {},
          };
        } catch (error) {
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
  methods: {
    async getMyStory(studentID: number, queryID: string, db: any) {

      const pipeline = [
        // Match in the following
        {
          $match: {
            _id: {
              $gt: new ObjectId(queryID),
            },
            student_id: studentID,
            is_deleted: false,
          },
        },
        // Sort to get the lastest first
        // {
        //   $sort: {
        //     _id: -1,
        //   },
        // },
        // Group by student
        {
          $group: {
            _id: "$student_id",
            student_id: { $first: "$student_id" },
            parent: { $first: "$_id" },
            profile_image: { $first: "$profile_image" },
            username: { $first: "$username" },
            class: { $first: "$class" },
            story: { $push: "$$ROOT" },
          },
        },
      ];
      return db
        .collection(this.settings.COLLECTION_NAME)
        .aggregate(pipeline)
        .toArray();
    },
    async getBulkStories(studentID: number, queryID: string, db: any, getFollowing: boolean, pageNumber: number, offsetCursor: string, ctx: any) {
      const following = await ctx.call("userconnections.getFollowing", { studentID });
      // const following: [number] = [4414510];
      const studentFilter = getFollowing ? { $in: following } : { $nin: following.concat(studentID) };
      const pipeline = [
        // Match in the following
        {
          $match: {
            _id: {
              $gt: new ObjectId(queryID),
              $lt: new ObjectId(offsetCursor),
            },
            student_id: studentFilter,
            is_deleted: false,
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $skip: pageNumber * this.settings.PAGE_SIZE,
        },
        {
          $limit: this.settings.PAGE_SIZE,
        },
        {
          $group: {
            _id: "$student_id",
            parent: {
              $first: "$_id",
            },
          },
        },
        {
          $sort: {
            parent: -1,
          },
        },
        {
          $lookup: {
            from: this.settings.COLLECTION_NAME,
            let: {
              student_id: "$_id",
            },
            pipeline: [
              {
                $match: {
                  _id: {
                    $gt: new ObjectId(queryID),
                    $lt: new ObjectId(offsetCursor),
                  },
                  $expr: {
                    $and: [
                      {
                        $eq: [
                          "$student_id", "$$student_id",
                        ],
                      },
                    ],
                  },
                  is_deleted: false,
                },
              },
              // {
              // $sort: { _id: -1 },
              // },
              // {
              // $limit: 10,
              // },
            ],
            as: "stories",
          },
        },
         {
          $addFields: {
            student_id: "$_id",
            class: {
              $arrayElemAt: [
                "$stories.class", 0,
              ],
            },
            username: {
              $arrayElemAt: [
                "$stories.username", 0,
              ],
            },
            profile_image: {
              $arrayElemAt: [
                "$stories.profile_image", 0,
              ],
            },
          },
        },
      ];

      return db
        .collection(this.settings.COLLECTION_NAME)
        .aggregate(pipeline)
        .toArray();
    },
    sqsTrigger(sqs_queue_url: string, data: any) {
      const params = {
        MessageBody: JSON.stringify(data),
        QueueUrl: sqs_queue_url,
      };
      sqs.sendMessage(params, (err, msg) => {
        if (err) {
          console.error("sqstrigger :", err);
        } else {
          console.log("SQS RESULT", msg);
        }
      });
    },
    createUsername(firstname: string, lastname: string, username: string) {
      let name: string = "";
      if (firstname) {
        name = firstname;
        if (lastname) {
          name = `${firstname} ${lastname}`;
        }
      } else {
        name = username;
      }
      return name;
    },
    async getPopularStories(studentID: number, queryID: string, db: any, pageNumber: number, offsetCursor: string, ctx: any) {
      // const following: [number] = [4414510];
      const pipeline = [
        // Match in the following
        {
          $match: {
            _id: {
              $gt: new ObjectId(queryID),
              $lt: new ObjectId(offsetCursor),
            },
            is_deleted: false,
          },
        },
        {
          $sort: {
            like_count: -1,
          },
        },
        {
          $skip: pageNumber * this.settings.PAGE_SIZE,
        },
        {
          $limit: this.settings.PAGE_SIZE,
        },
        {
          $group: {
            _id: "$student_id",
            parent: {
              $first: "$_id",
            },
            count: {
              $first:"$like_count",
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
        {
          $lookup: {
            from: this.settings.COLLECTION_NAME,
            let: {
              student_id: "$_id",
            },
            pipeline: [
              {
                $match: {
                  _id: {
                    $gt: new ObjectId(queryID),
                    $lt: new ObjectId(offsetCursor),
                  },
                  $expr: {
                    $and: [
                      {
                        $eq: [
                          "$student_id", "$$student_id",
                        ],
                      },
                    ],
                  },
                  is_deleted: false,
                },
              },
              // {
              // $sort: { _id: -1 },
              // },
              // {
              // $limit: 10,
              // },
            ],
            as: "stories",
          },
        },
         {
          $addFields: {
            student_id: "$_id",
            class: {
              $arrayElemAt: [
                "$stories.class", 0,
              ],
            },
            username: {
              $arrayElemAt: [
                "$stories.username", 0,
              ],
            },
            profile_image: {
              $arrayElemAt: [
                "$stories.profile_image", 0,
              ],
             },
             type: "widget_stories_horizontal",
          },
        },
      ];

      return db
        .collection(this.settings.COLLECTION_NAME)
        .aggregate(pipeline)
        .toArray();
    },
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
