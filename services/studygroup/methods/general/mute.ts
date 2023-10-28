import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import moment from "moment";
import {redisUtility} from "../../../../common";
import SettingsService from "../settings";
import studGroupData from "../../data/studygroup.data";

const StudyGroupMuteService: ServiceSchema = {
    name: "$studygroup-mute",
    mixins: [SettingsService],
    methods: {

        async isFeatureNotificationEnabled(studentId) {
            try {
                // To check if notification is enabled on feature level
                let isMute = false;
                const redisKey = `USER:${studentId}`;
                const data = await redisUtility.getHashField.call(this, redisKey, "SG_FEATURE_MUTE");

                if (!_.isNull(data)) {
                    isMute = data;
                } else {
                    const studyGroupFeature = await this.broker.call("$studygroupMysql.isFeatureMute", {studentId});
                    if (studyGroupFeature.length) {
                        isMute = Boolean(studyGroupFeature[0].is_mute);
                    }
                    await redisUtility.addHashField.call(this, redisKey, "SG_FEATURE_MUTE", isMute, this.settings.monthlyRedisTTL);
                }
                return isMute;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async isGroupMute(groupId, ctx) {
            try {
                // group level mute
                let isMute = false;
                const field = `MUTE:${ctx.user.id}`;
                let muteTime = await redisUtility.getHashField.call(this, groupId, field);
                if (!_.isNull(muteTime)) {
                    isMute = muteTime;
                } else {
                    muteTime = await this.broker.call("$studygroupMysql.getMuteTime", {
                        studentId: ctx.user.id,
                        groupId,
                    });
                    if (muteTime.length && muteTime[0].muted_till) {
                        isMute = moment().add(5, "hours").add(30, "minutes").isBefore(moment(muteTime[0].muted_till));
                    }
                    await redisUtility.addHashField.call(this, groupId, field, isMute, this.settings.monthlyRedisTTL);
                }
                return isMute;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async mute(groupId, type, ctx) {
            try {
                if (groupId) {
                    // group level mute
                    // type 0 - mute and 1 - unmute
                    let muteTill = null;
                    this.settings.message = ctx.user.locale === "hi" ? studGroupData.mute.groupLevelUnmute.hi : studGroupData.mute.groupLevelUnmute.en;
                    if (type === 0) {
                        muteTill = moment().add(5, "hours").add(30, "minutes").add(this.settings.MUTED_TILL_DAYS, "days")
                            .format("YYYY-MM-DD HH:MM:SS");
                        this.settings.message = ctx.user.locale === "hi" ? studGroupData.mute.groupLevelMute.hi : studGroupData.mute.groupLevelMute.en;
                    }
                    await this.broker.call("$studygroupMysql.muteGroup", {
                        groupId,
                        studentId: ctx.user.id,
                        muteTill,
                    });
                    await redisUtility.deleteHashField.call(this, groupId, `MUTE:${ctx.user.id}`);
                } else {
                    // feature level mute
                    // type 0 - mute and 1 - unmute
                    const muteFeature = await this.broker.call("$studygroupMysql.isMuteFeatureExist", {studentId: ctx.user.id});
                    // processing insert or update
                    if (muteFeature && muteFeature[0].EXIST) {
                        await this.broker.call("$studygroupMysql.updateFeatureMute", {
                            isMute: Boolean(!type),
                            studentId: ctx.user.id,
                        });
                    } else {
                        await this.broker.call("$studygroupMysql.insertFeatureMute", {
                            isMute: Boolean(!type),
                            studentId: ctx.user.id,
                        });
                    }
                    await redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "SG_FEATURE_MUTE");
                    if (type === 1) {
                        this.settings.message = ctx.user.locale === "hi" ? studGroupData.mute.featureLevelUnMute.hi : studGroupData.mute.featureLevelUnMute.en;
                    } else {
                        this.settings.message = ctx.user.locale === "hi" ? studGroupData.mute.featureLevelMute.hi : studGroupData.mute.featureLevelMute.en;
                    }
                }
                return {message: this.settings.message};
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyGroupMuteService;
