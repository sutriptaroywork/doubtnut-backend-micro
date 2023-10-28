import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";

import { adapter } from "../config";
import { Feedback } from "./feedback.interface";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "feedback",
    version: 1,
    mixins: [DbService],
    adapter,
    model: {
        name: "us_feedback",
    },
    settings: {
        bucketMap: {
            trialEnd : "us_trial_end_feedback",
            cancelMembership: "us_membership_end_feedback",
            extend : "us_trial_extend",
            end: "us_membership_end",
        },
        DEFAULT_COUNTRY: "IN",
        FEEDBACK_TABLE: "subscription_feedback",
    },
    /**
     * Dependencies
     */
    dependencies: [],
    /**
     * Actions
     */
    actions: {
        getFeedback: {
            rest: {
                method: "GET",
                path: "/screen",
            },
            params: {
            },
            async handler(ctx: any) {
                let responseData = {};
                const config = {
                    type: ctx.params.type || "cancelMembership",
                    region: ctx.meta.country || this.settings.DEFAULT_COUNTRY,
                    studentId: ctx.meta.user.student_id,
                };
                try {
                    if (Object.keys(this.settings.bucketMap).includes(config.type)) {
                        const options = await this.getNameAndValueByBucket(this.adapter.db, this.settings.bucketMap[config.type]);
                        let finalData = {};
                        // eslint-disable-next-line @typescript-eslint/prefer-for-of
                        for (let j = 0; j < options.length; j++) {
                            finalData = await this.formatOptions(options[j], finalData, config);
                        }
                        responseData = {
                            meta: {
                                code: 200,
                                success: true,
                                message: "Success",
                            },
                            data: finalData,
                        };
                    } else {
                        responseData = {
                            meta: {
                                code: 218,
                                success: false,
                                message: "Incorrect Type Paramater",
                            },
                            data: {message : `Type Must Be in ${Object.keys(this.settings.bucketMap).join(", ")}`},
                        };
                    }
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
        createFeedback: {
            rest: {
                method: "POST",
                path: "/screen",
            },
            params: {
            },
            async handler(ctx) {
                let responseData: any = {};
                const config = {
                    type: ctx.params.type ? ctx.params.type : "end",
                    region: ctx.meta.country ? ctx.meta.country : "US",
                    studentId: ctx.meta.user.student_id,
                };
                try {
                    const promises = [];
                    const feedback: Feedback = {
                        reason : ctx.params.reason,
                        type: config.type,
                        student_id: ctx.meta.user.student_id,
                        class: ctx.meta.user.student_class,
                        mobile: ctx.meta.user.mobile,
                        country_code : ctx.meta.user.country_code,
                        email: ctx.meta.user.student_email,
                        username: this.generateUsername(ctx.meta.user.student_fname, ctx.meta.user.student_lname, ctx.meta.user.student_username),
                        country: ctx.meta.country || "US",
                    };
                    // eslint-disable-next-line max-len
                    const sql = `INSERT INTO \`${this.settings.FEEDBACK_TABLE}\` (\`reason\`,\`type\`,\`student_id\`,\`mobile\`,\`country_code\`,\`email\`,\`class\`,\`username\`,\`country\`) VALUES ( "${feedback.reason}", "${feedback.type}", ${feedback.student_id}, ${feedback.mobile}, "${feedback.country_code}", ${feedback.email}, "${feedback.class}", "${feedback.username}", "${feedback.country}")`;
                    promises.push(this.getNameAndValueByBucket(this.adapter.db, this.settings.bucketMap[config.type]));
                    promises.push(this.adapter.db.query(sql));
                    let finalData = {};
                    const [options] = await Promise.all(promises);
                    // eslint-disable-next-line @typescript-eslint/prefer-for-of
                    for (let j = 0; j < options.length; j++) {
                        finalData = await this.formatOptions(options[j], finalData, config);
                    }
                    responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: "Success",
                        },
                        data : finalData,
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
        generateUsername(firstname: string, lastname: string, username: string){
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
        async getNameAndValueByBucket(database, bucket) {
            const sql = `select name,value from dn_property where bucket = "${bucket}" and is_active = 1 order by priority`;
            return database.query(sql, { type: Sequelize.QueryTypes.SELECT });
        },
        async formatOptions(option, finalData, config){
            try {
                let key = option.name;
                const data = option.value.split("#!!#");
                const page = data[0];
                let value = data[1];
                // console.log("\n\n\n", page, key, value);
                if (!finalData[page]) {
                    finalData[page] = {};
                }
                switch (key) {
                    case "options_image":
                        const options = value.split("#!#");
                        value = [];
                        key = "options";
                        for (let j = 0; j < options.length ; j = j + 2) {
                            value.push({
                                image: options[j],
                                text: options[j + 1],
                            });
                        }
                        break;
                    case "options":
                        value = value.split("#!#");
                        break;
                    case "subtitle":
                        if (config.type === "cancelMembership" && value.includes("{{data}}") ) {
                        // eslint-disable-next-line max-len
                        const sql = `select MAX(sps.end_date) as endDate from student_package_subscription sps join package p on p.id = sps.new_package_id where sps.student_id = ${config.studentId} and p.reference_type = "doubt" and p.country = "${config.region}" and sps.is_active = 1`;
                        const packageData = await this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
                        const endDate = new Date(packageData[0].endDate);
                        value = value.replace("{{data}}", endDate.toDateString());
                        }
                        break;
                    default:
                        break;
                }
                finalData[page][key] = value;
                // console.log(page, key, value, "\n\n\n");
                return finalData;
            } catch (e) {
                console.log("ERROR IN FORMAT OPTIONS", e);
            }
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
