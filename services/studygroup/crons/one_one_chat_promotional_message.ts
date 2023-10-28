import { ServiceSchema } from "moleculer";
import _ from "lodash";
import {v4 as uuid} from "uuid";
import moment from "moment";
import messageFormat from "../data/message.format";
import {publishRawBackend, redisUtility} from "../../../common";

const StudyChatPromotionalCronService: ServiceSchema = {
    name: "$studychat-promotional-cron",
    methods: {

        async sendStudyChatPromotionalMessage() {
            try {
                const activeMessages = await this.broker.call("$studygroupCronMysql.getActiveCronStudyChatMessages", {});
                this.logger.info("activeMessages ", activeMessages);
                for (const message of activeMessages) {
                    await this.broker.call("$studygroupCronMysql.setStudyChatMessageInactive", {id: message.id});
                    this.pushStudyChatMessageToKafka(message);
                }
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async pushStudyChatMessageToKafka(message: any) {
            try {
                const consumerTopic = "micro.study.group";
                const applicableStudentIds = await this.getApplicableStudents(message);
                console.log("applicableStudentIds>", applicableStudentIds);
                const applicableChats = await this.getApplicableChats(applicableStudentIds);
                const messageStructure = await this.getStudyChatMessageStructure(message);
                this.logger.info(`${message.id} messageStructure => ${JSON.stringify(messageStructure)}`);
                this.logger.info(`message is being pushed in ${applicableChats.length} groups`);
                if (!_.isNull(messageStructure)) {
                    for (const chat of applicableChats) {
                        const kafkaMsgData = {
                            data: {
                                ...messageStructure,
                                room_id: chat,
                                view_id:0,
                                produced_at: Date.now(),
                            },
                        };
                        const payload = {
                            timestamp: moment().add(5, "hours").add(30, "minutes").format("YYYY-MM-DD HH:mm:ss"),
                            message:null,
                            sender_name: "Doubtnut",
                            sender_id: 98,
                        };

                        console.log("kafkaMsgData>", kafkaMsgData);
                        redisUtility.addHashField.call(this, chat, "LAST_SENT", payload, this.settings.monthlyRedisTTL); // for setting last msg sent timestamp
                        await publishRawBackend(consumerTopic, kafkaMsgData);
                    }
                }
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },


        async fetchingLargerDataInChunks(filter, students, obj ){
            let finalStudentList = [];
            const chunk = 10000;
            const maxSQLSet = 50000000;
            const ids = _.map(students, student=> student.student_id);
            for (let i = 0; i < maxSQLSet; i += chunk) {
                if (!_.isEmpty(students)){
                    obj.student_ids = ids.slice(i, i + chunk);
                    if (_.isEmpty(obj.student_ids)){
                        break;
                    }
                } else {
                    obj.limit = chunk;
                    obj.offset = i;
                }

                let studentIds = [];
                switch (filter) {
                    case "campaign":
                        studentIds = await this.broker.call("$studygroupCronMysql.getCampaignStudents", obj);
                        break;
                    case "signup_datetime":
                        studentIds = await this.broker.call("$studygroupCronMysql.getStudentsWhoLoginAfterSpecificTimestamp", obj);
                        break;
                    case "ccm_id":
                        studentIds = await this.broker.call("$studygroupCronMysql.getStudentsByCcmId", obj);
                        break;
                    case "student_class":
                        studentIds = await this.broker.call("$studygroupCronMysql.getStudentByClass", obj);
                        break;
                    case "student_locale":
                        studentIds = await this.broker.call("$studygroupCronMysql.getStudentByLocale", obj);
                        break;
                }
                finalStudentList = finalStudentList.concat(JSON.parse(JSON.stringify(studentIds)));
                if (_.isEmpty(studentIds) && _.isEmpty(students)){
                    break;
                }
            }
            return finalStudentList;
        },

        async getStudentsBasedOnSignupTime(students, filterTimestamp, filter, filterOperator){
            const timestamp = moment(filterTimestamp).format("YYYY-MM-DD HH:MM:SS");
            const obj = {
                filter_timestamp : timestamp,
                student_ids: null,
                limit: null,
                offset : null,
                filter_operator : filterOperator,
            };

            return await this.fetchingLargerDataInChunks(filter, students, obj);
        },

        async getStudentsBasedOnTargetGroupId(targetGroupId){
            const sqlQuery = await this.broker.call("$studygroupCronMysql.getQueryByTargetGroupId", {target_group_id : targetGroupId});
            let students = [];
            if (!_.isEmpty(sqlQuery) && sqlQuery[0].sql){
                students = await this.broker.call("$studygroupCronMysql.getStudentsByQuery", {query : sqlQuery[0].sql, db_to_use:sqlQuery[0].db_to_use});
            }

            return students;
        },

        makingRightOrderForFilters(filters){
            // adjusting filters in right order  signup campaign ccm_id class locale
            const orderedFilters = [];
            if (filters.includes("target_group_id")) {
                orderedFilters.push("target_group_id");
            }
            if (filters.includes("campaign")){
                orderedFilters.push("campaign");
            }
            if (filters.includes("signup_datetime")){
                orderedFilters.push("signup_datetime");
            }
            if (filters.includes("ccm_id")){
                orderedFilters.push("ccm_id");
            }
            if (filters.includes("student_class")){
                orderedFilters.push("student_class");
            }
            if (filters.includes("student_locale")){
                orderedFilters.push("student_locale");
            }
            return orderedFilters;
        },

        async getStudentsBasedOnCcmId(students, ccmIds, filter){
            let ccmArr = [];
            if (ccmIds.includes(",")){
                ccmArr = ccmIds.split(",");
            } else {
                ccmArr.push(ccmIds);
            }

            const obj = {
                ccm_id: ccmArr,
                student_ids: null,
                limit: null,
                offset : null,
            };

            return await this.fetchingLargerDataInChunks(filter, students, obj);

        },

        async getStudentsBasedOnClass(students, studentClass, filter){
            const obj = {
                student_class: studentClass,
                student_ids: null,
                limit: null,
                offset : null,
            };

            return await this.fetchingLargerDataInChunks(filter, students, obj);
        },

        async getStudentsBasedOnLocale(students, locale, filter){
            const obj = {
                locale,
                student_ids: null,
                limit: null,
                offset : null,
            };

            return await this.fetchingLargerDataInChunks(filter, students, obj);
        },

        async getStudentsBasedOnCampaign(students, campaign, filter){
            const obj = {
                campaign,
                student_ids: null,
                limit: null,
                offset : null,
            };

            return await this.fetchingLargerDataInChunks(filter, students, obj);

        },

        async getApplicableStudents(messageData: any){
            let filters = ["campaign", "signup_datetime", "ccm_id", "student_class", "student_locale", "signup_datetime_operator", "target_group_id"];
            filters = _.filter(Object.keys(messageData), key=>filters.includes(key) && messageData[key] !== null);
            if (_.isEmpty(filters)){
                return [];
            }

            let signupFilterOperator = null;
            if (filters.includes("signup_datetime")){
                // checking which operand we need to perform with signup_datetime filter> < >= <=
                signupFilterOperator = messageData.signup_datetime_operator;
            }

            const orderedFilters = this.makingRightOrderForFilters(filters);

            let students = [];

            for (const filter of orderedFilters){
                switch (filter) {
                    case "target_group_id":
                        students = await this.getStudentsBasedOnTargetGroupId(messageData[filter]);
                        console.log("tg students", students);
                        break;
                    case "campaign":
                        students = await this.getStudentsBasedOnCampaign(students, messageData[filter], filter);
                        console.log("campaign students", students);
                        break;
                    case "signup_datetime":
                        students = await this.getStudentsBasedOnSignupTime(students, messageData[filter], filter, signupFilterOperator);
                        break;
                    case "ccm_id":
                        students = await this.getStudentsBasedOnCcmId(students, messageData[filter], filter);
                        break;
                    case "student_class":
                        students = await this.getStudentsBasedOnClass(students, messageData[filter], filter);
                        break;
                    case "student_locale":
                        students = await this.getStudentsBasedOnLocale(students, messageData[filter], filter);
                        break;
                }
                if (_.isEmpty(students)){
                    // if data returned with any filter is empty then no need to check other filters
                    break;
                }
            }
            return students;
        },

        async getApplicableChats(studentIds: any) {
            try {
                const finalChatIds = [];
                for (const student of studentIds){
                    const studentIdExists = _.get(student, "student_id", null);
                    // checking if chat already exits with doubtnut
                    if (studentIdExists){
                        const chatExistsWithDoubtnut = await this.broker.call("$studygroupCronMysql.checkIfChatAlreadyExists", {inviter: 98, invitee : student.student_id});
                        if (_.isEmpty(chatExistsWithDoubtnut)){
                            // creating chat with doubtnut
                            const chatId = `sc-${uuid()}`;
                            const id = await this.broker.call("$studygroupCronMysql.creatingChatWithDoubtnut", {chat_id : chatId, inviter: 98, invitee : student.student_id});
                            await this.broker.call("$studygroupCronMysql.addingStudyChatMember", {
                                studentId :student.student_id,
                                studyChatId: id[0],
                            });
                            finalChatIds.push(chatId);
                        } else {
                            finalChatIds.push(chatExistsWithDoubtnut[0].chat_id);
                        }
                        redisUtility.deleteHashField.call(this, `USER:${student.student_id}`, "LIST_CHATS");
                    }
                   }
                return finalChatIds;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getStudyChatMessageStructure(messageData: any) {
            let format = null;
            if (messageData.type === "text" && messageData.description) {
                format = {...messageFormat.text, ...messageFormat.common};
                format.message.widget_data.child_widget.widget_data.title = messageData.description;

            } else if (messageData.type === "image" && messageData.property_url) {
                format = {...messageFormat.image, ...messageFormat.common};
                format.message.widget_data.child_widget.widget_data.question_image = messageData.property_url;
                format.message.widget_data.child_widget.widget_data.auto_download_image = true;
                format.message.widget_data.child_widget.widget_data.deeplink = (format.message.widget_data.child_widget.widget_data.deeplink).replace("{link}", messageData.property_url);
                format.message.widget_data.title = messageData.description;

            } else if (messageData.type === "video" && messageData.thumbnail_url && messageData.property_url) {
                format = {...messageFormat.video, ...messageFormat.common};
                format.message.widget_data.child_widget.widget_data.thumbnail_url = messageData.thumbnail_url;
                format.message.widget_data.child_widget.widget_data.video_url = messageData.property_url;
                format.message.widget_data.child_widget.widget_data.deeplink = (format.message.widget_data.child_widget.widget_data.deeplink).replace("{link}", messageData.property_url);
                format.message.widget_data.title = messageData.description;

            } else if (messageData.type === "audio" && messageData.property_url && messageData.audio_duration) {
                format = {...messageFormat.audio, ...messageFormat.common};
                format.message.widget_data.child_widget.widget_data.attachment = messageData.property_url;
                format.message.widget_data.child_widget.widget_data.audio_duration = messageData.audio_duration;
                format.message.widget_data.title = messageData.description;
            }
            if (!_.isNull(format)) {
                format.message.widget_data.created_at = moment().valueOf();
                format.message.widget_data.cta_text = messageData.cta_text;
                format.message.widget_data.deeplink = messageData.cta_deeplink;
            }

            return format;
        },
    },

    actions: {},
};

export = StudyChatPromotionalCronService;
