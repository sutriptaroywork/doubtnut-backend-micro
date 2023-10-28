import { ServiceSchema } from "moleculer";
import _ from "lodash";
import moment from "moment";
import messageFormat from "../data/message.format";
import { publishRawBackend } from "../../../common";

const StudyGroupPromotionalCronService: ServiceSchema = {
    name: "$studygroup-promotional-cron",
    methods: {

        async sendPromotionalMessage() {
            try {
                const activeMessages = await this.broker.call("$studygroupCronMysql.getActiveMessages", {});
                this.logger.info("activeMessages ", activeMessages.length);
                for (const message of activeMessages) {
                    await this.broker.call("$studygroupCronMysql.setMessageInactive", {id: message.id});
                    this.pushMessageToKafka(message);
                }
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async pushMessageToKafka(message: any) {
            try {
                const consumerTopic = "micro.study.group";
                const applicableGroups = await this.getApplicableGroups(message);
                const messageStructure = await this.getMessageStructure(message);
                this.logger.info(`${message.id} messageStructure => ${JSON.stringify(messageStructure)}`);
                this.logger.info(`message is being pushed in ${applicableGroups.length} groups`);
                if (!_.isNull(messageStructure)) {
                    for (const group of applicableGroups) {
                        const kafkaMsgData = {
                            data: {
                                ...messageStructure,
                                room_id: group.group_id,
                                produced_at: Date.now(),
                            },
                        };
                        await publishRawBackend(consumerTopic, kafkaMsgData);
                    }
                }
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getGroupVerificationStatus(verificationInput) {
            let groupVerificationStatus = [];
            switch (verificationInput) {
                case "0":
                    groupVerificationStatus = [0];
                    break;
                case "1":
                    groupVerificationStatus = [1];
                    break;
                case "all":
                    groupVerificationStatus = [0, 1];
                    break;
            }
            return groupVerificationStatus;
        },

        async getApplicableGroups(messageData: any) {
            try {
                let targetGroups = messageData.group_type.split(",");
                if (_.isEmpty(targetGroups)) {
                    this.logger.info("group_type is empty");
                    return [];
                }
                if (targetGroups[0] === "all") {
                    targetGroups = [1, 2, 3];
                }

                const groupVerificationStatus = this.getGroupVerificationStatus(messageData.is_verified);
                let applicableGroups = [];
                const chunk = 5000;
                const maxSQLSet = 5000000;
                if (messageData.filter_operator === "all") {
                    // to send the message in all groups.
                    for (let i = 0; i < maxSQLSet; i += chunk) {
                        const groupsIds = await this.broker.call("$studygroupCronMysql.getAllActiveGroups", {
                            group_types: targetGroups,
                            group_verification_status: groupVerificationStatus,
                            offset: i,
                            limit: chunk,
                        });
                        applicableGroups = applicableGroups.concat(JSON.parse(JSON.stringify(groupsIds)));
                        if (_.isEmpty(groupsIds)) {
                            break;
                        }
                    }
                } else if (!_.isNull(messageData.member_count)) {
                    // to send the message in groups where members are based on the condition of member_count and filter_operator
                    for (let i = 0; i < maxSQLSet; i += chunk) {
                        const groupsIds = await this.broker.call("$studygroupCronMysql.getActiveGroupsByMembers", {
                            group_types: targetGroups,
                            group_verification_status: groupVerificationStatus,
                            operator: messageData.filter_operator,
                            memberCount: messageData.member_count,
                            offset: i,
                            limit: chunk,
                        });
                        applicableGroups = applicableGroups.concat(JSON.parse(JSON.stringify(groupsIds)));
                        if (_.isEmpty(groupsIds)) {
                            break;
                        }
                    }
                } else if (!_.isNull(messageData.group_created_at)) {
                    // to send the message in groups which are created_at based on the condition of group_created_at and filter_operator
                    for (let i = 0; i < maxSQLSet; i += chunk) {
                        const groupsIds = await this.broker.call("$studygroupCronMysql.getActiveGroupsByCreatedAt", {
                            group_types: targetGroups,
                            group_verification_status: groupVerificationStatus,
                            operator: messageData.filter_operator,
                            timestamp: moment(messageData.group_created_at).format("YYYY-MM-DD"),
                            offset: i,
                            limit: chunk,
                        });
                        applicableGroups = applicableGroups.concat(JSON.parse(JSON.stringify(groupsIds)));
                        if (_.isEmpty(groupsIds)) {
                            break;
                        }
                    }
                }
                return applicableGroups;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getMessageStructure(messageData: any) {
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

export = StudyGroupPromotionalCronService;
