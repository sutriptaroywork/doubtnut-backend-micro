/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import {ObjectId} from "mongodb";
import SettingsService from "../settings";
import {redisUtility} from "../../../../common";

const StudyGroupContainerActionsService: ServiceSchema = {
    name: "$studygroup-container-actions",
    mixins: [SettingsService],
    methods: {

        async removeReportedContainer(containerType: string, containerId: any, roomId: string) {
            try {
                const currTime = moment().add(5, "hours").add(30, "minutes").toISOString();
                switch (containerType) {
                    case "message":
                        await this.adapter.db.collection(this.settings.reportedMessageCollection).updateMany({
                            message_id: new ObjectId(containerId),
                            room_id: roomId,
                        }, {$set: {is_removed: true, updated_at: currTime}});
                        break;
                    case "member":
                        await this.adapter.db.collection(this.settings.reportedMemberCollection).updateMany({
                            reported_student_id: parseInt(containerId, 10),
                            room_id: roomId,
                        }, {$set: {is_removed: true, updated_at: currTime}});
                        break;
                    case "group":
                        await this.adapter.db.collection(this.settings.reportedGroupCollection).updateMany({
                            room_id: roomId,
                        }, {$set: {is_removed: true, updated_at: currTime}});
                        break;
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

        async removeReportedContainersAfterAction(studentId: number, roomId: string, action: string) {

            /** This method will be called only when the user will be blocked or leave the study group */
            try {
                const currTime = moment().add(5, "hours").add(30, "minutes").toISOString();

                // remove all reported message of the user
                this.adapter.db.collection(this.settings.reportedMessageCollection).updateMany({
                    sender_id: studentId,
                    room_id: roomId,
                    is_action_taken: false,
                }, {$set: {is_removed: true, is_action_taken: true, action, updated_at: currTime}});

                // remove all member reports of the user
                this.adapter.db.collection(this.settings.reportedMemberCollection).updateMany({
                    reported_student_id: studentId,
                    room_id: roomId,
                    is_action_taken: false,
                }, {$set: {is_removed: true, is_action_taken: true, action, updated_at: currTime}});

                // delete admin dashboard hash
                await redisUtility.deleteHashField.call(this, roomId, "DASHBOARD");

                return true;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

    },
};

export = StudyGroupContainerActionsService;
