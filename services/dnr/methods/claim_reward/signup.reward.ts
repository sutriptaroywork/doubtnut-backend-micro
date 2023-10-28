/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import dnrData from "../../data/dnr.data";
import RewardPopService from "./popup";

const SignUpSchema: ServiceSchema = {
    name: "$signUpReward",
    mixins: [RewardPopService],
    methods: {

        sendSignUpNotification(request: any) {
            return this.broker.emit("sendNotification", {
                studentId: [request.meta.user.student_id],
                gcmRegistrationId: [request.meta.user.gcm_reg_id],
                notificationInfo: {
                    event: "dnr",
                    path: "home",
                    title: dnrData.signupNotif.title,
                    message: dnrData.signupNotif.description,
                    image: null,
                    firebase_eventtag: "dnr_signup_notif",
                },
                topic: "micro.push.notification",
            }, "newton");
        },

        getSignupTimestamp(studentId: number) {
            return this.broker.call("$dnrMysql.getSignUpTime", {
                student_id: studentId,
            });
        },

        async signUpReward(milestones: any, currentTime: object, request: any) {
            try {
                // Reward for first time sign up users
                let popUpContainer = null;

                const milestone = _.filter(milestones, item => item.type === request.params.type);

                if (milestone.length) {
                    const transactionData = {
                        ref: request.params.type,
                    };
                    const signupTime = await this.getSignupTimestamp(request.meta.user.student_id);
                    if (signupTime.length && this.daysDifference(currentTime, signupTime[0].timestamp) === 0) {
                        popUpContainer = await this.getPopupContainer(request.params.type, milestone, request, currentTime, transactionData);
                        if (!_.isNull(popUpContainer)) {
                            this.sendSignUpNotification(request);
                        }
                    }
                }

                return popUpContainer;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = SignUpSchema;
