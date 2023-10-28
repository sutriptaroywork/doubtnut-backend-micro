"use strict";

import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import * as _ from "lodash";
import {adapter} from "../config";

const modelAttributes: Sequelize.ModelAttributes = {
    id: {type: Sequelize.INTEGER, primaryKey: true},
    title: {type: Sequelize.TEXT({length: "long"})},
    options: {type: Sequelize.TEXT({length: "long"})},
    tags: {type: Sequelize.STRING(255)},
};

module.exports = {
    name: "newtonsql",
    mixins: [DbService],
    adapter,
    model: {
        name: "newton",
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
        newtonNotifQuery: {
			// eslint-disable-next-line max-lines-per-function
			async handler(ctx) {
				try {
					let responseData = {};
					const mysqlQ = ctx.params.query;
					const notificationInfo = ctx.params.notificationInfo;

					if (!mysqlQ) {
						responseData = {
							meta: {
								code: 200,
								success: true,
								message: "SUCCESS",
							},
							data: {
								status: "FAILURE",
								message: "Invalid SQL Query",
							},
						};
						return responseData;
					}

					const mysqlQRes = await this.runMysqlQuery(this.adapter.db, mysqlQ);

					if (!mysqlQRes) {
						responseData = {
							meta: {
								code: 200,
								success: true,
								message: "SUCCESS",
							},
							data: {
								status: "FAILURE",
								message: "Error in MySQL Query",
							},
						};
						return responseData;
					} else if (!mysqlQRes.length) {
						responseData = {
							meta: {
								code: 200,
								success: true,
								message: "SUCCESS",
							},
							data: {
								status: "FAILURE",
								message: "No Student Found",
							},
						};
						return responseData;
					}

					while (mysqlQRes.length) {
						// 1000 is the batch size
						const batch = mysqlQRes.splice(0, 1000);

						const gcmIdList = [];
						const userIdList = [];

						// eslint-disable-next-line @typescript-eslint/prefer-for-of
						for (let i = 0; i < batch.length; i++) {
							const userId = batch[i].student_id;
                            const gcmId = batch[i].gcm_reg_id;
							if (userId && gcmId) {
                                gcmIdList.push(gcmId);
                                userIdList.push(userId);
							}
						}

						if (gcmIdList.length > 0) {
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

						responseData = {
							meta: {
								code: 200,
								success: true,
								message: "SUCCESS",
							},
							data: {
								status: "SUCCESS",
								message: "sending in process",
							},
						};
						return responseData;
					}
				} catch (e) {
					console.log("/notification/send/query", e);
					const responseData = {
						meta: {
							code: 200,
							success: true,
							message: "SUCCESS",
						},
						data: {
							status: "FAILURE",
							message: "something wrong in sending notification",
						},
					};
					return responseData;
				}
			},
		},
    },

    methods: {
        async runMysqlQuery(database, sql) {
            return database.query(sql, { type: Sequelize.QueryTypes.SELECT });
        },
    },
};
