"use strict";

import { ServiceBroker } from "moleculer";
import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";
import moment, { length } from "moment";
import mongodb from "mongodb";
import * as _ from "lodash";
import io from "socket.io-client";
import Sequelize from "sequelize";
import { forEach } from "lodash";
import { adapter } from "../config";
import {liveClassMysql} from "../helper/liveclass.mysql";
import {liveClassUtil} from "../helper/liveclass.util";
const hash_expiry = 60 * 60 * 24; // 1 days

const socketTeacher = io(`${process.env.SOCKET_SERVER}/teacher`);
const socketLiveClass = io(`${process.env.SOCKET_SERVER}/teacher`);
const optMap = ["A", "B", "C", "D", "E", "F"];

const modelAttributes: Sequelize.ModelAttributes = {
  id: { type: Sequelize.INTEGER, primaryKey: true },
  title: { type: Sequelize.TEXT({ length: "long" }) },
  options: { type: Sequelize.TEXT({ length: "long" }) },
  tags: { type: Sequelize.STRING(255) },
};

module.exports = {
  name: "liveclass",
  mixins: [DbService],
  adapter,
  model: {
    name: "liveclass_polls",
    define: modelAttributes,
    options: {
      paranoid: true,
      underscored: true,
      freezeTableName: true,
    },
  },
  /**
   * Dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    quizPush: {
      rest: {
        method: "POST",
        path: "/quiz/push",
      },
      params: {},
      // eslint-disable-next-line max-lines-per-function
      async handler(ctx: { params: { liveclass_resource_id: any; quiz_resource_id: any } }) {
        let responseData: any = {};
        let detailID = "";
        try {

          // liveclassResourceID, quizResourceID
          // /const { resource_detail_id: resourceDetailID, resource_id: resourceID } = ctx.params;
          const { liveclass_resource_id: liveclassResourceID, quiz_resource_id: quizResourceID } = ctx.params;

          const liveclassResourceDetails = await liveClassMysql.getCourseResource(this.adapter.db, liveclassResourceID);
          const quizResourceDetails = await liveClassMysql.getCourseResource(this.adapter.db, quizResourceID);
          // eslint-disable-next-line max-len
          const oldQuizResource = await liveClassMysql.getLiveClassCourseResourceByDetailIdAndReferenceAndType(this.adapter.db, liveclassResourceDetails[0].old_detail_id, quizResourceDetails[0].resource_reference, 7);

          const masterObj: any = {};
          const dataArr = [];
          const { topic } = quizResourceDetails[0].topic;
          masterObj.quiz_resource_id = quizResourceID;
          masterObj.liveclass_resource_id = liveclassResourceID;
          masterObj.detail_id = liveclassResourceDetails[0].old_detail_id;
          masterObj.resource_detail_id = (oldQuizResource.length > 0) ? oldQuizResource[0].id : "";
          masterObj.resource_reference = liveclassResourceDetails[0].resource_reference;
          const quizQuestionIDArr = quizResourceDetails[0].resource_reference.split("|").map(function(item) {
            return item.trim();
          });
          const expiryTimeArr = quizResourceDetails[0].meta_info.split("|").map(function(item) {
            return item.trim();
          });

          if (quizResourceDetails.length > 0) {
            const widget = [];
            detailID = liveclassResourceID;
            for (let i = 0; i < quizQuestionIDArr.length; i++) {

              let result = await liveClassMysql.getQuizQuestions(this.adapter.db, quizQuestionIDArr[i]);
              result =  liveClassUtil.modifyObj(result);

              const obj: any = {};
              obj.type = "live_class_qna";
              obj.resource_detail_id = masterObj.resource_detail_id;
              obj.detail_id = masterObj.detail_id;
              obj.liveclass_resource_id = liveclassResourceID;
              obj.quiz_resource_id = quizResourceID;
              obj.data = {};
              obj.data.question = liveClassUtil.quotesEscape(result[0].ocr_text);
              obj.data.quiz_question_id = quizQuestionIDArr[i];
              // eslint-disable-next-line id-blacklist
              obj.data.expiry = (expiryTimeArr[i] === undefined) ? liveClassUtil.defaultExpiry : expiryTimeArr[i];
              obj.data.response_expiry = "5";
              obj.data.items = [];
              obj.data.items.push(result[0].opt_1);
              obj.data.items.push(result[0].opt_2);
              obj.data.items.push(result[0].opt_3);
              obj.data.items.push(result[0].opt_4);
              widget.push(obj);
            }

            responseData.type = "live_class_quiz";

            responseData.response = {
              resource_detail_id: masterObj.resource_detail_id,
              detail_id: masterObj.detail_id,
              liveclass_resource_id : liveclassResourceID,
              quiz_resource_id : quizResourceID,
              widgets: widget,
            };

            const [liveclass_quiz_logs] = await liveClassMysql.setLiveClassQuizLog(this.adapter.db, masterObj);
            let message = "Not pushed";
            if (liveclass_quiz_logs.affectedRows === 1) {
              message = "Pushed";
              const data = { room_id: detailID, data: responseData };
              socketLiveClass.emit("widget_push", JSON.stringify(data));

              // push to old detail id as well
              data.room_id = masterObj.detail_id;
              socketLiveClass.emit("widget_push", JSON.stringify(data));
            }
            responseData = {
              meta: {
                code: 200,
                success: true,
                message: "SUCCESS",
              },
              responseData,
              message,
            };

          }
          return responseData;

        } catch (e) {
          console.log(e);
          return e;
        }

      },

    },

    pollsList: {
      rest: {
        method: "GET",
        path: "/poll/list",
      },
      params: {},
      async handler(ctx: any) {

        const allPolls = await liveClassMysql.getAllPolls(this.adapter.db);

        if (allPolls && allPolls.length) {
          for (const poll of allPolls) {
            const arrOptions = [];
            const pollInfo = poll;
            const options = pollInfo.options.split("#!#");

            for (const option of options) {
              arrOptions.push({ key: option, value: option });
            }

            poll.options = arrOptions;
          }

        }

        return allPolls;

      },
    },
    pollPush: {
      rest: {
        method: "POST",
        path: "/poll/push",
      },
      params: {},
      async handler(ctx: { params: { detail_id: any; poll_id: any } }) {
        const { detail_id, poll_id } = ctx.params;
        let pollFormat = {};
        const polls_data = await liveClassMysql.getPollById(this.adapter.db, poll_id);
        const insertPublish = await liveClassMysql.setPublishInfo(this.adapter.db, detail_id, poll_id, "POLL");
        if (polls_data && polls_data.length) {
          console.log(polls_data[0]);
          pollFormat = {
            type: "live_class_polls",
            response: {
              detail_id,
              publish_id: insertPublish,
              widgets: [
                {
                  publish_id: insertPublish,
                  type: "live_class_polls", data: {
                    publish_id: insertPublish,
                    question: polls_data[0].title,
                    quiz_question_id: polls_data[0].id,
                    show_close_btn: false,
                    question_text_color: "#FFFFFF",
                    expiry_text_color: "#FFFFFF",
                    question_text_size: 14,
                    expiry_text_size: 14,
                    bg_color: "#54138a",
                    expiry: 15,
                    response_expiry: 5,
                    items: _.map(_.split(polls_data[0].options, "#!#"), (option, index) => ({
                      key: optMap[index],
                      value: option,
                    })),

                  },
                },
              ],
            },
          };
          socketLiveClass.emit("widget_push", JSON.stringify({ room_id: detail_id, data: pollFormat }));
        }
        const pushTimestamp = new Date().getTime();
        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: { publish_id: insertPublish, poll_id, pollFormat, pushTimestamp },
        };
        return responseData;
      },
    },
    pollSubmit: {
      rest: {
        method: "POST",
        path: "/poll/submit",
      },
      params: {},
      async handler(ctx: any) {
        const studentId: number = ctx.meta.user.id;
        const { poll_id, submit_option, liveclass_publish_id } = ctx.params;
        // eslint-disable-next-line max-len
        const insertResult = await liveClassMysql.setPollResponse(this.adapter.db, liveclass_publish_id, poll_id, studentId, submit_option);
        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: { insertResult, message: "Your opinion has been submitted. Thank you!" },
        };
        return responseData;
      },
    },
    pollResult: {
      rest: {
        method: "GET",
        path: "/poll/result/:publish_id/:pollId",
      },
      params: {},
      async handler(ctx: { params: { pollId: any; publish_id: any } }) {
        const { pollId, publish_id } = ctx.params;

        const pollInfo = await liveClassMysql.getPollById(this.adapter.db, pollId);

        const optionsCount = pollInfo[0].options.split("#!#").length;

        const showResult = pollInfo[0].show_result;
        // eslint-disable-next-line max-len
        const pollResult = await liveClassMysql.getPollResponse(this.adapter.db, publish_id, pollId);

        const result = [];

        if (!showResult)
        {
          for (let i = 0 ; i < optionsCount; i++) {
            result.push({ color: "#DAF8DB", key: optMap[i], display: "", value: 0 });
          }
        }
        else if (pollResult.length === 0) {
          for (let i = 0; i < optionsCount; i++) {
            const v = 0;
            result.push({ color: "#DAF8DB", key: optMap[i], display: v.toString() + "%", value: v });
          }
        }
        else {
          const groupdResponse = _.groupBy(pollResult, "submit_option");

          const totalResponses = pollResult.length;
          console.log("Object.keys(groupdResponse)", Object.keys(groupdResponse));

          for (let i = 0; i < optionsCount; i++) {
            // eslint-disable-next-line id-blacklist
            const v = parseFloat((((groupdResponse[optMap[i]] !== undefined) ? groupdResponse[optMap[i]].length : 0) * 100 / totalResponses).toFixed(2));
            result.push({ color: "#DAF8DB", key: optMap[i], display: v.toString() + "%", value: v });
          }
        }
        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: result,
        };
        return responseData;
      },
    },
    quizResult: {
      rest: {
        method: "GET",
        path: "/quiz/result/:detail_id/:resource_detail_id",
      },
      params: {},
      async handler(ctx: { params: { detail_id: any; resource_detail_id: any } }) {
        const { detail_id, resource_detail_id } = ctx.params;

        // eslint-disable-next-line max-len
        const resourceInfo = await liveClassMysql.getCourseResourceInfo(this.adapter.db, resource_detail_id, 7);
        const quizPushed = resourceInfo[0].resource_reference.split("|").map(function(item) {
          return item.trim();
        });

        // the table is hardcoded for only 4 options. sad. anyways.

        const finalResult = {};
        for (const questionId of quizPushed) {
          const quizResult = await liveClassMysql.getQuizResponseByDetailIdAndQuestionId(this.adapter.db, detail_id, questionId);
          const quizInfo = await liveClassMysql.getQuizQuestions(this.adapter.db, questionId);
          const groupdResponse = _.groupBy(quizResult, "option_id");
          const totalResponses = quizResult.length;
          console.log("Object.keys(groupdResponse)", Object.keys(groupdResponse));
          const result = [];
          for (const i of [0, 1, 2, 3]) {
            // eslint-disable-next-line id-blacklist
            const v = parseFloat((((groupdResponse[optMap[i]] !== undefined) ? groupdResponse[optMap[i]].length : 0) * 100 / totalResponses).toFixed(2));
            result.push({ color: "#DAF8DB", key: optMap[i], display: v.toString() + "%", value: v });
          }

          finalResult[questionId] = {};
          finalResult[questionId].result = result;
          finalResult[questionId].question_info = quizInfo[0].ocr_text;
          finalResult[questionId].correct_answer = quizInfo[0].answer;
        }


        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: finalResult,
        };
        return responseData;
      },
    },
    broadcastList: {
      rest: {
        method: "GET",
        path: "/broadcast/list",
      },
      params: {},
      async handler(ctx: any) {
        return await liveClassMysql.getBroadcastList(this.adapter.db);
      },
    },
    broadcastPush: {
      rest: {
        method: "POST",
        path: "/broadcast/push",
      },
      params: {},
      async handler(ctx: { params: { broadcast_message: any; detail_id: any } }) {
        const { broadcast_message, detail_id } = ctx.params;
        const message = broadcast_message.trim();
        if (message.length === 0) { return {}; }
        const insertPublish = await liveClassMysql.setPublishInfo(this.adapter.db, detail_id, message, "BROADCAST");
        const facultyData = await liveClassMysql.getFacultyInfo(this.adapter.db, detail_id);
        let title = "";
        let image_url = "";
        if (facultyData && facultyData.length) {
          title = facultyData[0].name;
          image_url = facultyData[0].image_url;
        }

        socketLiveClass.emit("widget_push", JSON.stringify({
          room_id: detail_id, data: {
            type: "live_class_communication",
            response: {
              title,
              description: message,
              image_url,
              expiry: 10,
              response_expiry: 5,
            },
          },
        }));

        const pushTimestamp = new Date().getTime();
        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: { publish_id: insertPublish, broadcast_message, pushTimestamp },
        };
        return responseData;
      },
    },
    getFeedback: {
      rest: {
        method: "GET",
        path: "/feedback/:detail_id/list",
      },
      params: {},
      async handler(ctx: any) {
        const feedbackData = await liveClassMysql.getFeedbackList(this.adapter.db);
        const pinnedPost = await liveClassMysql.getFromDNProperty(this.adapter.db, "live_class", "pinned_post");
        const commentInfo = await liveClassMysql.getFromDNProperty(this.adapter.db, "live_class", "pre_comment_list");

        feedbackData.forEach(feedback => {
          feedback.options = _.split(feedback.options, "#!#");
          feedback.options_show_textbox = _.split(feedback.options_show_textbox, "#!#");
          feedback.optionsMeta = _.map(feedback.options, function(option, index) {
            return { option, show_textbox: feedback.options_show_textbox[index] };
          });
          return feedback;
        });

        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: { pinned_post: pinnedPost[0].value, pre_comments: commentInfo[0].value.split("###"), rating_data: feedbackData },
        };
        return responseData;
      },
    },
    submitFeedback: {
      rest: {
        method: "POST",
        path: "/feedback/submit",
      },
      params: {},
      async handler(ctx: any) {
        const studentId: number = ctx.meta.user.id;
        const { detail_id, options, review, star_rating, engage_time } = ctx.params;
        const whitespaceTrimmedReview = review.replace(/\s\s+/g, " ");
        const [insertReview] = await this.adapter.db.query(`INSERT IGNORE INTO liveclass_feedback_response (student_id, detail_id,star_rating,options,review,engage_time) VALUES (${studentId}, ${detail_id},${star_rating},${options ? "'" + options + "'" : null},${whitespaceTrimmedReview ? "'" + whitespaceTrimmedReview + "'" : null},${engage_time ? "'" + engage_time + "'" : null})`);
        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: { feedbackId: insertReview.insertId, msg: "Thank you for your feedback" },
        };
        return responseData;
      },
    },
    FeedbackViewed: {
      rest: {
        method: "POST",
        path: "/feedback/viewed",
      },
      params: {},
      async handler(ctx: any) {
        const studentId: number = ctx.meta.user.id;
        const { detail_id } = ctx.params;

        const updateViewCount = await this.broker.cacher.client.pipeline()
          .incrby(`feedback_view1_${studentId}_${detail_id}`, 1)
          .expire(`feedback_view1_${studentId}_${detail_id}`, 86400)
          .exec();
        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: { updateViewCount },
        };
        return responseData;
      },
    },
    statusFeedback: {
      rest: {
        method: "GET",
        path: "/feedback/:detail_id/status",
      },
      params: {},
      async handler(ctx: any) {
        const studentId: number = ctx.meta.user.id;
        const { detail_id } = ctx.params;
        let show_feedback = false;
        // eslint-disable-next-line max-len
        const isViewed = await this.adapter.db.query(`select count(*) as cnt from liveclass_feedback_response where student_id =${studentId} and detail_id = ${detail_id}`, { type: Sequelize.QueryTypes.SELECT });
        if (isViewed[0].cnt < 1) {
          const getFeedbackViewCount = await this.broker.cacher.client.get(`feedback_view1_${studentId}_${detail_id}`);
          if (getFeedbackViewCount < 2) {
            show_feedback = true;
          }
        }

        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: { show_feedback },
        };
        return responseData;
      },
    },
    infoByDetailId: {
      rest: {
        method: "GET",
        path: "/info/:detail_id",
      },
      params: {},
      async handler(ctx: any) {
        const result = await liveClassMysql.getCourseResourceInfo(this.adapter.db, ctx.params.detail_id, 4);
        result[0].start_time = moment(result[0].stream_start_time).add(5, "hours").add(30, "minutes");
        return result;
      },
    },

    getFromDNProperty: {
      async handler(ctx: any) {
        return await liveClassMysql.getFromDNProperty(this.adapter.db, ctx.params.bucket, ctx.params.name);
      },
    },
    // Replicated Functions For Panel with totalResponses
    quizResultWithResponses: {
      rest: {
        method: "GET",
        path: "/quiz/resultWithResponses/:detail_id/:resource_detail_id",
      },
      params: {},
      async handler(ctx: { params: { detail_id: any; resource_detail_id: any } }) {
        const { detail_id, resource_detail_id } = ctx.params;

        // eslint-disable-next-line max-len
        const resourceInfoR = await liveClassMysql.getCourseResourceInfo(this.adapter.db, resource_detail_id, 7);
        const quizPushedR = resourceInfoR[0].resource_reference.split("|").map(function(item) {
          return item.trim();
        });

        // the table is hardcoded for only 4 options. sad. anyways.

        const finalResultR = {};
        let totalResponsesR = -1; // -1 implies it was never updated
        for (const questionId of quizPushedR) {
          const quizResultR = await liveClassMysql.getQuizResponseByDetailIdAndQuestionId(this.adapter.db, detail_id, questionId);
          const quizInfoR = await liveClassMysql.getQuizQuestions(this.adapter.db, questionId);
          const groupdResponseR = _.groupBy(quizResultR, "option_id");
          totalResponsesR = quizResultR.length;
          console.log("Object.keys(groupdResponse)", Object.keys(groupdResponseR));
          const result = [];
          for (const i of [0, 1, 2, 3]) {
            // eslint-disable-next-line id-blacklist
            const v = parseFloat((((groupdResponseR[optMap[i]] !== undefined) ? groupdResponseR[optMap[i]].length : 0) * 100 / totalResponsesR).toFixed(2));
            result.push({ color: "#DAF8DB", key: optMap[i], display: v.toString() + "%", value: v });
          }

          finalResultR[questionId] = {};
          finalResultR[questionId].result = result;
          finalResultR[questionId].question_info = quizInfoR[0].ocr_text;
          finalResultR[questionId].correct_answer = quizInfoR[0].answer;
          finalResultR[questionId].totalResponses = totalResponsesR;
        }


        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: {
            result: finalResultR,
          },
        };
        return responseData;
      },
    },
    pollResultWithResponses: {
      rest: {
        method: "GET",
        path: "/poll/resultWithResponses/:publish_id/:pollId",
      },
      params: {},
      async handler(ctx: { params: { pollId: any; publish_id: any } }) {
        const { pollId, publish_id } = ctx.params;

        const pollInfoR = await liveClassMysql.getPollById(this.adapter.db, pollId);

        const optionsCountR = pollInfoR[0].options.split("#!#").length;

        const showResultR = pollInfoR[0].show_result;
        // eslint-disable-next-line max-len
        const pollResultR = await liveClassMysql.getPollResponse(this.adapter.db, publish_id, pollId);

        const result = [];
        let totalResponsesR = -1; // -1 implies it was never updated or else path was not taken

        if (!showResultR)
        {
          for (let i = 0 ; i < optionsCountR; i++) {
            result.push({ color: "#DAF8DB", key: optMap[i], display: "", value: 0 });
          }
        }
        else if (pollResultR.length === 0) {
          for (let i = 0; i < optionsCountR; i++) {
            const v = 0;
            result.push({ color: "#DAF8DB", key: optMap[i], display: v.toString() + "%", value: v });
          }
        }
        else {
          const groupdResponse = _.groupBy(pollResultR, "submit_option");

          totalResponsesR = pollResultR.length;
          console.log("Object.keys(groupdResponse)", Object.keys(groupdResponse));

          for (let i = 0; i < optionsCountR; i++) {
            // eslint-disable-next-line id-blacklist
            const v = parseFloat((((groupdResponse[optMap[i]] !== undefined) ? groupdResponse[optMap[i]].length : 0) * 100 / totalResponsesR).toFixed(2));
            result.push({ color: "#DAF8DB", key: optMap[i], display: v.toString() + "%", value: v });
          }
        }
        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: {
            result,
            totalResponses: totalResponsesR,
          },
        };
        return responseData;
      },
    },
    pollsByDetailID: {
      rest: {
        method: "GET",
        path: "/polls/:detailID",
      },
      params: {},
      async handler(ctx: any) {
        const detailID = parseInt(ctx.params.detailID, 10);
        const polls = await liveClassMysql.getAllPollByDetailID(this.adapter.db, detailID);
        const responseData = {
          meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
          },
          data: polls,
        };
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
