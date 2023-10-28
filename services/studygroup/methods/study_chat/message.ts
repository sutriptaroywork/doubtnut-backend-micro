import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import moment from "moment";
import MessageHelperService from "../message.helper";
import ImageProfanity from "../profanity.checker";
import NotificationService from "./notification";


const StudyGroupMessageService: ServiceSchema = {
    name: "$studychat-message",
    mixins: [MessageHelperService, NotificationService, ImageProfanity],
    methods: {

        async insertNewMessage(postData: any, ctx: any) {
            try {
                const currentDate = moment().add(5, "hours").add(30, "minutes");
                const { postData: finalPostData, notificationContent } = await this.processNewMessage(postData, currentDate, ctx);
                if (!finalPostData.is_profane && finalPostData.active_students.length < 2 && !_.isNull(notificationContent) && notificationContent.message) {
                    this.sendChatMessageNotification(finalPostData.room_id, notificationContent, ctx);
                }
                delete finalPostData.active_students;
                const messageObject = await this.broker.call("studyChatChatroom.postChatMessages", {postData: finalPostData});
                this.pushArchivalData(this.settings.ArchivalConsumerTopic, messageObject);
                await this.isImageDirty(messageObject);
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async listMessages(offsetCursor: any, page: number, roomId: string, ctx: any) {
            try {
                const pageSize = 30;

                if (!offsetCursor) {
                    offsetCursor = Math.floor(new Date().getTime() / 1000).toString(16) + "0000000000000000";
                }
                const posts = await this.broker.call("studyChatChatroom.listChatMessages", {
                    roomId,
                    page,
                    pageSize,
                    offsetCursor,
                    studentId: ctx.user.id,
                });
                posts.offsetCursor = offsetCursor;
                posts.page = page + 1;
                return posts;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

    },

    events: {
        storeStudyChatBulkMessages: {
            async handler(ctx) {
                try {
                    // storing the data in mongo collection in set of 1000 documents
                    const chunk = 1000;
                    for (let i = 0, j = ctx.params.data.length; i < j; i += chunk) {
                        const messages = ctx.params.data.slice(i, i + chunk);
                        await this.adapter.db.collection(this.settings.studyChatMessageCollection).insertMany(messages, {ordered: false});
                    }
                } catch (e) {
                    console.error(e);
                    this.logger.error(e);
                    throw (e);
                }
            },
        },
    },
};

export = StudyGroupMessageService;
