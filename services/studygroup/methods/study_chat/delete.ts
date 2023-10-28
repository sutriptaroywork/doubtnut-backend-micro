import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import _ from "lodash";
import {ObjectId} from "mongodb";
import SettingsService from "../settings";

const StudyGroupDeleteService: ServiceSchema = {
    name: "$studychat-delete",
    mixins: [SettingsService],
    methods: {

        async deleteChatMessage(roomId: string, messageId: any, messageTimestamp?: any, senderId?: any) {
            try {
                const currTime = moment().add(5, "hours").add(30, "minutes").toISOString();

                if (_.isNull(messageId)) {
                    // update in chatroom_messages to delete it
                    // if not message id available, means user has just sent and requested to delete.
                    const message = await this.adapter.db.collection(this.settings.studyChatMessageCollection).findOneAndUpdate({
                        millis: messageTimestamp,
                        student_id: parseInt(senderId, 10),
                        room_id: roomId,
                    }, {$set: {is_active: false, is_deleted: true, updated_at: currTime}});
                    // eslint-disable-next-line no-underscore-dangle
                    messageId = new ObjectId(message.value._id);
                } else {
                    // we have message id, means user has requested to delete previous messages fetched from list message api.
                    messageId = new ObjectId(messageId);
                    this.adapter.db.collection(this.settings.studyChatMessageCollection).updateOne({
                        _id: messageId,
                    }, {$set: {is_active: false, is_deleted: true, updated_at: currTime}});
                }
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
