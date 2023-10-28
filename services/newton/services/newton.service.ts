"use strict";

import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";
import moment from "moment";
import mongodb from "mongodb";
import * as _ from "lodash";
import { Context } from "moleculer";
import {staticCDN, publishRawBackend} from "../../../common";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "newton",

	mixins: [DbService],
	// adapter: new MongoDBAdapter(process.env.NEWTON_MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }),
	collection: "notification",
	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {

		syncAndGet: {
			rest: {
				method: "POST",
				path: "/sync/:page",
			},
			params: {
			},
			// eslint-disable-next-line max-lines-per-function
			async handler(ctx) {

				const responseData = {
					meta: {
						code: 200,
						success: true,
						message: "SUCCESS",
					},
					data: [],
				};
				return responseData;
				/**
				 * Old Code, switched off Due to Mongo Consumer
					const studentId: number = ctx.meta.user.id;
					const perPage = 10;
					// eslint-disable-next-line radix
					const page = parseInt(ctx.params.page);
					console.log("ctx.params", ctx.params);
					const toSyncData = ctx.params.data || [];
					if (ctx.params.data && ctx.params.data.length) {// save moengge notifications on mongodb
						const toSyncDataFinal = [];
						// eslint-disable-next-line @typescript-eslint/prefer-for-of
						for (let i = 0; i < toSyncData.length; i++) {
							const datum = {event: null, title: null, message: null, seen: null, image: null, deeplink: null, data: null};
							datum.event = toSyncData[i].gcm_webUrl;
							datum.title = toSyncData[i].gcm_title;
							datum.message = toSyncData[i].gcm_subtext;
							datum.seen = toSyncData[i].is_clicked ? toSyncData[i].is_clicked : 1;
							// eslint-disable-next-line id-blacklist
							if (toSyncData[i].is_clicked !== undefined && toSyncData[i].is_clicked) {
								toSyncData[i].seen = [studentId];
							}
							datum.image = toSyncData[i].gcm_image_url;
							datum.deeplink = toSyncData[i].gcm_webUrl;
							datum.data = {};
							const data = {data: datum};
							toSyncData[i].createdAt = new Date(toSyncData[i].MOE_MSG_RECEIVED_TIME);
							toSyncData[i].studentId = [studentId];
							const merged = {...data, ...toSyncData[i]};
							toSyncDataFinal.push(merged);
						}
						if (toSyncDataFinal) { await new Promise((resolve, reject) => { resolve(this.adapter.db.collection("notification").insertMany(toSyncDataFinal)); }); }
					}
					const userNotifications: [any] = await new Promise((resolve, reject) => {
						resolve(this.adapter.db.collection("notification")
							.find({ studentId }, { data: 1, createdAt: 1, seen: 1, event: { $ne: "khelo_jeeto" } })
							.sort({ createdAt: -1 })
							.skip((page - 1) * perPage)
							.limit(perPage)
							.toArray());
					});
					const finalData = [];
					// ADD PINNED NOTIF
					const pinned_notif: [any] = await new Promise((resolve, reject) => {
						resolve(this.adapter.db.collection("pinned_notifs")
							.find({
								studentId,
								expireAt: { $gt: new Date() },
							},
								{ data: 1, createdAt: 1, seen: 1 }
							)
							.sort({ createdAt: -1 })
							.skip((page - 1) * perPage)
							.limit(1)
							.toArray()
						);
					});
					// console.log(page, pinned_notif);
					// eslint-disable-next-line no-unused-expressions
					pinned_notif.length && userNotifications.unshift(pinned_notif[0]);
					// @ts-ignoree
					// eslint-disable-next-line @typescript-eslint/prefer-for-of
					for (let i = 0; i < userNotifications.length; i++) {

						// eslint-disable-next-line id-blacklist,eqeqeq
						if (userNotifications[i].data != undefined && userNotifications[i].data.notification_type != undefined) {
							if (userNotifications[i].data.notification_type === "SILENT_GAMIFICATION") {
								userNotifications[i].data.title = userNotifications[i].data.message;
								userNotifications[i].data.message = userNotifications[i].data.description;
							}

							else if (userNotifications[i].data.notification_type === "SILENT_QUIZ_NOTIFICATION") {
								userNotifications[i].splice(i, 1);
								i--;
							}
						}
						userNotifications[i].data.sentAt = moment(userNotifications[i].createdAt).fromNow();
						// eslint-disable-next-line no-underscore-dangle
						userNotifications[i].data.id = userNotifications[i]._id;
						if ((!_.isEmpty(userNotifications[i].seen) && userNotifications[i].seen.includes(studentId)) ||
							moment(userNotifications[i].createdAt).isBefore("2020-08-24")) { userNotifications[i].data.seen = 1; }
						else { userNotifications[i].data.seen = 0; }

						try { userNotifications[i].data.data = JSON.parse(userNotifications[i].data.data); }
						catch (e) {
							console.log("dont parse");
						}

						if (_.isEmpty(userNotifications[i].data.image)) { userNotifications[i].data.image = `${staticCDN}Logo%403x.png`; }

						// userNotifications[i].data.createdAt = moment(userNotifications[i].createdAt).add(5, 'hours').add(30, 'minutes');
						finalData.push(userNotifications[i].data);
					}

					// reset counter on notification
					// @ts-ignore
					if (page === 1) {
						if (pinned_notif.length) {
							if (userNotifications.length >= 2) {
								this.adapter.db.collection("notification_last_seen")
									// @ts-ignore
									// eslint-disable-next-line no-underscore-dangle,max-len
									.updateOne({ studentId }, { $set: { lastViewedId: userNotifications[1]._id, timestamp: userNotifications[1].createdAt } }, { upsert: true });
							}
						} else {
							if (userNotifications.length) {
								this.adapter.db.collection("notification_last_seen")
									// eslint-disable-next-line no-underscore-dangle,max-len
									.updateOne({ studentId }, { $set: { lastViewedId: userNotifications[0]._id, timestamp: userNotifications[0].createdAt } }, { upsert: true });
							}
						}
					}

					const responseData = {
						meta: {
							code: 200,
							success: true,
							message: "SUCCESS",
						},
						data: finalData,
					};
					return responseData;
				 */
			},
		},

		markAsRead: {
			rest: {
				method: "POST",
				path: "/markAsRead",
			},
			params: {
			},
			async handler(ctx) {

				/**
				 * Old Code, switched off Due to Mongo Consumer
					const ObjectID = mongodb.ObjectID;

					// eslint-disable-next-line @typescript-eslint/prefer-for-of
					for (let i = 0; i < ctx.params.list.length; i++) {
						const singleId = ctx.params.list[i];
						// eslint-disable-next-line no-underscore-dangle
						const _id: mongodb.ObjectID = new ObjectID(singleId);

						const studentId: number = ctx.meta.user.id;
						this.adapter.db.collection("notification").updateOne({
							_id,
						}, { $addToSet: { seen: studentId } });

					}
				 */

				const responseData = {
					meta: {
						code: 200,
						success: true,
						message: "SUCCESS",
					},
					data: {
						status: "SUCCESS",
					},
				};
				return responseData;
			},
		},

		countNewNotifications: {
			rest: {
				method: "GET",
				path: "/count/new",
			},
			params: {
			},
			async handler(ctx) {

				const responseData = {
					meta: {
						code: 200,
						success: true,
						message: "SUCCESS",
					},
					data: {
						count: 0,
					},
				};
				return responseData;
				/**
				 * Old Code, switched off Due to Mongo Consumer
					if (ctx.meta.versionCode > 765) {


						const ObjectID = mongodb.ObjectID;
						// eslint-disable-next-line no-underscore-dangle
						const _id: mongodb.ObjectID = new ObjectID(ctx.params.id);

						const studentId: number = ctx.meta.user.id;


						const lastVisitedId = await new Promise((resolve, reject) => {

							resolve(this.adapter.db.collection("notification_last_seen")
								.find({ studentId })
								.toArray());
						});

						let count = 0;
						if (!_.isEmpty(lastVisitedId)) {
							count = await new Promise((resolve, reject) => {

								resolve(this.adapter.db.collection("notification")
									.find({ studentId, createdAt: { $gt: lastVisitedId[0].timestamp } }).count());
							});

							console.log("count", count);
						}
						let countToShow;
						if (count > 9) { countToShow = "9+"; }
						else { countToShow = count.toString(); }
						const responseData = {
							meta: {
								code: 200,
								success: true,
								message: "SUCCESS",
							},
							data: {
								count: countToShow,
							},
						};
						return responseData;
					}

					else {
						const responseData = {
							meta: {
								code: 200,
								success: true,
								message: "SUCCESS",
							},
							data: {
								count: 0,
							},
						};
						return responseData;
					}
				 */

			},
		},

		sendNewtonNotification: {
			rest: {
				method: "POST",
				path: "/notification/send",
			},
			internal: true,
			params: {},
			async handler(ctx) {
				try {
					const user = ctx.params.user;

					const notificationInfo = ctx.params.notificationInfo;

					if (user.length === 0) {
						return;
					}

					while (user.length > 0) {
						// 1000 is the batch size
						const batch = user.splice(0, 1000);

						const gcmIdList = [];
						const userIdList = [];
						// eslint-disable-next-line @typescript-eslint/prefer-for-of
						for (let i = 0; i < batch.length; i++) {
							const userId = batch[i].id;
							const gcmId = batch[i].gcmId;
							if (userId && gcmId) {
								gcmIdList.push(gcmId);
								userIdList.push(userId);
							}
						}
						if (gcmIdList.length > 0){
							try {
								this.logger.info("Sending", userIdList, gcmIdList);
								this.broker.emit("sendNotification", {
									studentId: userIdList,
									gcmRegistrationId: gcmIdList,
									notificationInfo,
									topic: "newton.push.notification",
								}, "newton");
							} catch (e) {
								this.logger.error(e);
							}
						}
					}
					const responseData = {
						meta: {
							code: 200,
							success: true,
							message: "SUCCESS",
						},
						data: {
							status: "SUCCESS",
						},
					};
					return responseData;

				} catch (e) {
					const responseData = {
						meta: {
							code: 200,
							success: true,
							message: "SUCCESS",
						},
						data: {
							status: "FAILURE",
						},
					};
					return responseData;
				}
			},
		},

		sendNewtonNotificationQuery: {
			rest: {
				method: "POST",
				path: "/notification/send/query",
			},
			internal: true,
			params: {},
			async handler(ctx) {
				return await this.broker.call("newtonsql.newtonNotifQuery", ctx.params);
			},
		},

		aggregate: {
			async handler(ctx: Context<{ pipeline: any[] }>) {
				return [];
				this.logger.debug(ctx.params.pipeline);
				return this.adapter.db.collection("notification").aggregate(ctx.params.pipeline).toArray();
			},
		},
	},
	/**
	 * Methods
	 */
	methods: {

	},

	events: {
		sendNotification: {
			// studentIds and gcmRegistrationIds should be passed as an array
			async handler(ctx: Context<{studentId: any; gcmRegistrationId: any; notificationInfo: any; topic: any}>) {
				function isValidNotificationInfo() {
					return "title" in ctx.params.notificationInfo && "message" in ctx.params.notificationInfo && "event" in ctx.params.notificationInfo;
				}

				if (!("data" in ctx.params.notificationInfo)) {ctx.params.notificationInfo.data = {};}
				if (!("firebase_eventtag" in ctx.params.notificationInfo) || ctx.params.notificationInfo.firebase_eventtag === "") {ctx.params.notificationInfo.firebase_eventtag = "user_journey";}

				if (!isValidNotificationInfo()) {return;}

				const consumerTopic = ctx.params.topic ? ctx.params.topic : "micro.push.notification";

				const chunk = 1000;
				for (let i = 0, j = ctx.params.studentId.length; i < j; i += chunk){
					const kafkaMsgData = {
						data: ctx.params.notificationInfo,
						meta: {
							gcmId: ctx.params.gcmRegistrationId.slice(i, i + chunk),
							studentId: ctx.params.studentId.slice(i, i + chunk),
							ts: Date.now(),
						},
					};
					await publishRawBackend(consumerTopic, kafkaMsgData);
				}
			},
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
