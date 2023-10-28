"use strict";

import execSync from "child_process";
import * as fs from "fs";
import { ServiceBroker } from "moleculer";
import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";
import moment, { length } from "moment";
import {ObjectId} from "mongodb";
import * as _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { S3 } from "aws-sdk";
import axios from "axios";
import {liveClassUtil} from "../helper/liveclass.util";


const s3 = new S3({
  signatureVersion: "v4",
  region: "ap-south-1",
});

const workingDir = process.env.WORKING_DIR;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */


/*
socketLiveClass.on("widget_push", function(msg){

    const msgInfo = JSON.parse(msg);
    console.log(msgInfo);

});
*/


async function execShellCommand(cmd) {
  const exec = require("child_process").exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

module.exports = {
  name: "liveclasscomment",
  mixins: [DbService],
  adapter: new MongoDBAdapter(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }),
  collection: "liveclass_comments",
  /**
   * Dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    panelInsert: {
      rest: {
        method: "POST",
        path: "/insert",
      },
      params: {},
      // eslint-disable-next-line max-lines-per-function
      async handler(ctx: any) {
        let isHighLight = false;

        try {
          const body = ctx.params;
          const imageId = ctx.params.entity_id + "_" + uuidv4() + ".jpg";
          // check if a duplicate within a 2 min window

          if (await liveClassUtil.checkIfDuplicateComment(ctx.params, this.adapter.db))
          {return {};}

          const cmd = `ffmpeg -i "${ctx.params.streamUrl}" -f image2 -vframes 1 ${imageId}`;

          const commentInfo = await this.broker.call("liveclass.getFromDNProperty", { bucket: "live_class", name : "pre_comment_list" });

          const commentList = commentInfo[0].value.split("###");

            if (commentList.some(comment=>body.message.includes(comment)))
            {
              isHighLight = true;
              body.is_predefined = true;
            }

            if (body.message.includes("#DN"))
            {
              body.is_predefined = false;
            }
            // if (!isHighLight) {
            //   try {
            //     const isAQuestion = await axios.get(`${process.env.IS_QUESTION_SERVICE}/query=${encodeURI(body.message)}`);
            //
            //     if (isAQuestion.data) {
            //       isHighLight = true;
            //       body.is_predefined = false;
            //     }
            //   } catch (e) {
            //     console.log(e);
            //   }
            // }

            // if (isHighLight) {
               await execShellCommand(cmd);

                const fileToUpload = await fs.readFileSync(workingDir + imageId);
                await s3.putObject({
                  Bucket: "dn-liveclass",
                  Key: imageId,
                  ContentType: "image/jpg",
                  Body: fileToUpload,
                  ACL: "public-read",
                }).promise();

                await fs.unlinkSync(workingDir + imageId);
                body.imageUrl = `https://dn-liveclass.s3.ap-south-1.amazonaws.com/${imageId}`;
                this.adapter.db.collection("liveclass_comments").insertOne(body);

            // }

        } catch (e) {
          isHighLight = false;
          console.log(e);
        }

        return { inserted: isHighLight};
      },

    },

    getInfoForPanel: {
      rest: {
        method: "POST",
        path: "/thread",
      },
      params: {},
      async handler(ctx: any) {

        try {
          const result = await new Promise((resolve, reject) => {
            resolve(this.adapter.db.collection("liveclass_comments")
            .find({
              entity_id: ctx.params.question_id,
              },
             {imageUrl:1, student_username:1, message:1, _id:1, image:1,
             })
            .sort({
              _id:-1,
            })
            .toArray());
          });

          console.log(result);
          const commentInfo = await this.broker.call("liveclass.getFromDNProperty", { bucket: "live_class", name : "pre_comment_list" });

          const commentList = commentInfo[0].value.split("###");

          // @ts-ignore
          for (const item of result) {


            for (const comment of commentList)
            {
              if (item.message.includes(comment))
              {
                item.filter_type = comment;
                item.is_predefined = true;
              }

              if (item.message.includes("#DN"))
              {
                item.is_predefined = false;
              }

            }
            // eslint-disable-next-line no-underscore-dangle
            item.timeStamp = moment.duration(moment(new ObjectId(item._id).getTimestamp()).add(5, "h").add(30, "m").diff(moment(ctx.params.start_time).subtract(5, "h").subtract(30, "m"))).asMinutes().toFixed(2);
            item.startDate = moment(ctx.params.start_time).format();
            // eslint-disable-next-line no-underscore-dangle
            item.mongoDbDate = moment(new ObjectId(item._id).getTimestamp());
          }

          return {result, filter:commentList};
        }
        catch (e)
        {console.log(e);
        return e.toString();}
      },
    },
    getAdminCommentsConfig: {
      rest: {
        method: "GET",
        path: "/config",
      },
      params: {},
      async handler(ctx: any) {

        try {
          const promises = [];
          promises.push(this.broker.call("liveclass.getFromDNProperty", { bucket: "live_class", name : "comment_roles" }));
          promises.push(this.broker.call("liveclass.getFromDNProperty", { bucket: "live_class", name : "comment_defaults" }));
          const [roles, defaults] = await Promise.all(promises);
          return {
            roles:  roles[0].value.split("#!#"),
            defaults: defaults[0].value.split("#!#"),
          };
        }
        catch (e)
        {
          console.log(e);
          return e.toString();
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
