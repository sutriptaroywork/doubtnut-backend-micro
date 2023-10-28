import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import {ObjectId} from "mongodb";
import {redisUtility} from "../../../../common";
import SettingsService from "../settings";

const StudyGroupDeleteService: ServiceSchema = {
    name: "$studygroup-delete",
    mixins: [SettingsService],
    methods: {

        async deleteSingleMessage(roomId: string, messageId: any, messageTimestamp?: any, senderId?: any) {
            try {
                const currTime = moment().add(5, "hours").add(30, "minutes").toISOString();
                const messageCollection = roomId.split("-")[0] === "sg" ? this.settings.messageCollection : this.settings.publicMessageCollection;

                if (_.isNull(messageId)) {
                    // update in chatroom_messages to delete it
                    // if not message id available, means user has just sent and requested to delete.
                    const message = await this.adapter.db.collection(messageCollection).findOneAndUpdate({
                        millis: messageTimestamp,
                        student_id: parseInt(senderId, 10),
                        room_id: roomId,
                    }, {$set: {is_active: false, is_deleted: true, updated_at: currTime}});
                    if (message && message.value) {
                        // eslint-disable-next-line no-underscore-dangle
                        messageId = new ObjectId(message.value._id);
                    }
                } else {
                    // we have message id, means user has requested to delete previous messages fetched from list message api.
                    messageId = new ObjectId(messageId);
                    this.adapter.db.collection(messageCollection).updateOne({
                        _id: messageId,
                    }, {$set: {is_active: false, is_deleted: true, updated_at: currTime}});
                }

                // update in chatroom_message_report to update is_removed and is_action_taken
                // updating action taken if reported
                this.adapter.db.collection(this.settings.reportedMessageCollection).updateMany({
                    message_id: messageId,
                }, {$set: {is_removed: true, is_action_taken: true, action: "DELETE", updated_at: currTime}});

                // to delete previous admin dashboard cache
                await redisUtility.deleteHashField.call(this, roomId, "DASHBOARD");

                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async deleteReportedMessages(reportedStudentId: any, roomId: string) {
            try {
                const currTime = moment().add(5, "hours").add(30, "minutes").toISOString();
                const messageCollection = roomId.split("-")[0] === "sg" ? this.settings.messageCollection : this.settings.publicMessageCollection;

                const reportedMessages = await this.adapter.db.collection(this.settings.reportedMessageCollection).find({
                    sender_id: parseInt(reportedStudentId, 10),
                    room_id: roomId,
                    is_action_taken: false,
                }).toArray();

                if (reportedMessages.length) {
                    const messageIds = reportedMessages.map(message => new ObjectId(message.message_id));

                    // update in chatroom_message_report to update is_removed and is_action_taken
                    this.adapter.db.collection(this.settings.reportedMessageCollection).updateMany({
                        message_id: {$in: messageIds},
                    }, {$set: {is_removed: true, is_action_taken: true, action: "DELETE", updated_at: currTime}});

                    // update in chatroom_messages to delete it
                    await this.adapter.db.collection(messageCollection).updateMany({
                        _id: {$in: messageIds},
                    }, {$set: {is_active: false, is_deleted: true, updated_at: currTime}});
                }

                // to delete previous admin dashboard cache
                await redisUtility.deleteHashField.call(this, roomId, "DASHBOARD");

                return true;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

    },
};

export = StudyGroupDeleteService;
