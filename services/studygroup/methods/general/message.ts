import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import {ObjectId} from "mongodb";
import MessageHelperService from "../message.helper";
import ImageProfanity from "../profanity.checker";
import StudyGroupNotificationService from "./notification";

const StudyGroupMessageService: ServiceSchema = {
    name: "$studygroup-message",
    mixins: [StudyGroupNotificationService, MessageHelperService, ImageProfanity],
    methods: {

        async insertNewMessage(postData: any, ctx: any) {
            try {
                const currentDate = moment().add(5, "hours").add(30, "minutes");
                const {
                    postData: finalPostData,
                    notificationContent,
                } = await this.processNewMessage(postData, currentDate, ctx);
                if (!finalPostData.is_profane && !_.isNull(notificationContent) && notificationContent.message) {
                    this.sendMessageNotification(finalPostData.room_id, notificationContent, finalPostData.active_students, this.createChatName(ctx.user.student_fname, ctx.user.student_lname));
                }
                delete finalPostData.active_students;
                let messageObject;
                if (postData.room_id.split("-")[0] === "sg") {
                    messageObject = await this.broker.call("privateChatroom.postPrivateMessages", {postData: finalPostData});
                } else {
                    finalPostData.room_type = "public_groups";
                    messageObject = await this.broker.call("publicChatroom.postPublicMessages", {postData: finalPostData});
                }
                this.pushArchivalData(this.settings.ArchivalConsumerTopic, messageObject);
                await this.isImageDirty(messageObject);
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async insertMultipleMessages(postData: any, roomList: any, ctx: any) {
            try {
                const currentDate = moment().add(5, "hours").add(30, "minutes");
                const privateGroups = [];
                const publicGroups = [];
                for (const roomId of roomList) {
                    postData.room_id = roomId;
                    const {
                        postData: finalPostData,
                        notificationContent,
                    } = await this.processNewMessage(postData, currentDate, ctx);
                    if (!_.isNull(notificationContent) && notificationContent.message) {
                        if (roomId.split("-")[0] === "sg") {
                            privateGroups.push(JSON.parse(JSON.stringify(finalPostData)));
                        } else {
                            publicGroups.push(JSON.parse(JSON.stringify(finalPostData)));
                        }
                    }
                }
                if (privateGroups.length) {
                    await this.adapter.db.collection(this.settings.messageCollection).insertMany(privateGroups, {ordered: false});
                }
                if (publicGroups.length) {
                    await this.adapter.db.collection(this.settings.publicMessageCollection).insertMany(publicGroups, {ordered: false});
                }
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async listMessages(offsetCursor: any, page: number, roomId: string) {
            try {
                const pageSize = 30;

                if (!offsetCursor) {
                    offsetCursor = Math.floor(new Date().getTime() / 1000).toString(16) + "0000000000000000";
                }
                let posts;
                if (roomId.split("-")[0] === "sg") {
                    posts = await this.broker.call("privateChatroom.listPrivateMessages", {
                        roomId,
                        page,
                        pageSize,
                        offsetCursor,
                    });
                } else {
                    posts = await this.broker.call("publicChatroom.listPublicMessages", {
                        roomId,
                        page,
                        pageSize,
                        offsetCursor,
                    });
                }
                posts.offsetCursor = offsetCursor;
                posts.page = page + 1;
                return posts;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async updateMessage(postData: any, ctx: any) {
            try {
                const currentDate = moment().add(5, "hours").add(30, "minutes");
                const {
                    postData: finalPostData,
                    notificationContent,
                } = await this.processNewMessage(postData, currentDate, ctx);
                delete finalPostData.active_students;
                let messageObject;
                const filterQuery = /^\d+$/.test(postData.message_id) ? {room_id: postData.room_id, millis: parseInt(postData.message_id, 10)} : {_id: new ObjectId(postData.message_id)};
                if (postData.room_id.split("-")[0] === "sg") {
                    await this.adapter.db.collection(this.settings.publicMessageCollection).updateOne(filterQuery, {
                        $set: {
                            message: finalPostData.message,
                        },
                    });
                } else if (postData.room_id.startsWith("p2p")) {

                    await this.adapter.db.collection(this.settings.messageCollection).updateOne(filterQuery, {
                        $set: {
                            message: finalPostData.message,
                        },
                    });
                }
                else {
                    finalPostData.room_type = "public_groups";
                    await this.adapter.db.collection(this.settings.publicMessageCollection).updateOne(filterQuery, {
                        $set: {
                            message: finalPostData.message,
                        },
                    });
                }
                this.pushArchivalData(this.settings.ArchivalConsumerTopic, messageObject);
                await this.isImageDirty(messageObject);
                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },

    events: { },
};

export = StudyGroupMessageService;
