import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import moment from "moment";
import {redisUtility} from "../../../../common";
import SettingsService from "../settings";
import studyChatData from "../../data/studychat.data";

const StudyChatMuteService: ServiceSchema = {
    name: "$studychat-mute",
    mixins: [SettingsService],
    methods: {

        async isChatMute(chatId, mutedTill, ctx) {
            try {
                // chat level mute
                const field = `MUTE:${ctx.user.id}`;
                let isMute = await redisUtility.getHashField.call(this, chatId, field);
                console.log(isMute, " isMute", typeof isMute);
                if (_.isNull(isMute)) {
                    isMute = false;
                    if (mutedTill) {
                        isMute = moment().add(5, "hours").add(30, "minutes").isBefore(moment(mutedTill));
                    }
                    await redisUtility.addHashField.call(this, chatId, field, isMute, this.settings.monthlyRedisTTL);
                }
                return isMute;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async muteChat(chatId, type, ctx) {
            try {
                // chat level mute
                // type 0 - mute and 1 - unmute
                let muteTill = null;
                this.settings.message = ctx.user.locale === "hi" ? studyChatData.mute.chatLevelUnmute.hi : studyChatData.mute.chatLevelUnmute.en;
                if (type === 0) {
                    muteTill = moment().add(5, "hours").add(30, "minutes").add(this.settings.MUTED_TILL_DAYS, "days")
                        .format("YYYY-MM-DD HH:MM:SS");
                    this.settings.message = ctx.user.locale === "hi" ? studyChatData.mute.chatLevelMute.hi : studyChatData.mute.chatLevelMute.en;
                }
                await this.broker.call("$studygroupMysql.muteChat", {
                    chatId,
                    studentId: ctx.user.id,
                    muteTill,
                });
                await redisUtility.deleteHashField.call(this, chatId, `MUTE:${ctx.user.id}`);

                return {message: this.settings.message};
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyChatMuteService;
