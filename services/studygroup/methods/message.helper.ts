import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";

const MessageHelperService: ServiceSchema = {
    name: "$message-helper",
    mixins: [],
    methods: {

        createMessageTitle(message: any) {
            try {
                let messageContent = null;
                let messageImage = null;
                switch (message.widget_data.child_widget.widget_type) {
                    case "text_widget":
                        messageContent = "New Message";
                        if (_.has(message, "widget_data.child_widget.widget_data.title")) {
                            messageContent = message.widget_data.child_widget.widget_data.title;
                        }
                        break;

                    case "sg_video_card":
                    case "widget_study_group_live_class":
                        messageContent = "🎥 Video";
                        break;

                    case "widget_audio_player":
                        messageContent = "🎤 Audio";
                        if (_.has(message, "widget_data.child_widget.widget_data.audio_duration")) {
                            const time = this.msToTime(message.widget_data.child_widget.widget_data.audio_duration);
                            messageContent = `${messageContent} (${time})`;
                        }
                        break;

                    case "widget_asked_question":
                    case "image_card":
                        messageContent = "📷 Photo";
                        if (_.has(message, "widget_data.child_widget.widget_data.question_image")) {
                            messageImage = message.widget_data.child_widget.widget_data.question_image;
                        } else if (_.has(message, "widget_data.child_widget.widget_data.image_url")) {
                            messageImage = message.widget_data.child_widget.widget_data.image_url;
                        }
                        break;
                }
                return {
                    message: messageContent,
                    image: messageImage,
                };
            } catch (e) {
                this.logger.error(e);
                return {
                    message: null,
                    image: null,
                };
            }
        },

        async processNewMessage(postData: any, currentDate: any, ctx: any) {
            try {
                postData.student_id = parseInt(postData.student_id, 10);
                postData.created_at = currentDate.toDate();
                postData.updated_at = currentDate.toDate();
                postData.is_active = true;
                postData.is_deleted = false;
                postData.is_admin = false;

                let message = null;
                let notificationContent = null;
                if (typeof (postData.message) === "object") {
                    if (parseInt(ctx.versionCode, 10) >= 946 && postData.is_message) {
                        notificationContent = this.createMessageTitle(postData.message);
                        message = notificationContent.message;
                    }
                    if (parseInt(ctx.versionCode, 10) < 946 && postData.message.widget_data && postData.message.widget_data.child_widget) {
                        notificationContent = this.createMessageTitle(postData.message);
                        message = notificationContent.message;
                    }
                }
                if (!_.isNull(message)) {
                    await this.updateLastSentTimeAndMessage(message, postData.room_id, ctx);
                }
                return { postData, notificationContent };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },

    events: {},
};

export = MessageHelperService;
