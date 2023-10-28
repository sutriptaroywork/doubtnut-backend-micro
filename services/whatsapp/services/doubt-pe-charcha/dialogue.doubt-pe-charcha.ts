import { ServiceSchema, Context } from "moleculer";
import _ from "lodash";
import axios from "axios";
import { AxiosInstance } from "axios";
import WhatsappSettingsService from "../whatsapp.settings";
import DialogueSettingsService from "../dialogues/common/dialogue.settings";

const DoubtCharchaDialogueService: ServiceSchema = {
    name: "$dialogue-pe-charcha",
    mixins: [WhatsappSettingsService, DialogueSettingsService],
    dependencies: [],
    settings: {
    },
    actions: {
        getDoubtPeCharchaResponse: {
            async handler(ctx: Context<{ source: number; phone: string; studentId: number; msgId: number; entities: { [key: string]: string } }>) {
                try {
                    const doubtId = ctx.params.entities.doubt_id;
                    const options = `number=${doubtId}`;
                    const authToken = await this.broker.call("$student.sign", {studentId: ctx.params.studentId});
                    this.logger.debug("getDoubtPeCharchaResponse params: ", options, "\ntoken: ", authToken);
                    const { data } = await (this.settings.backendUrl as AxiosInstance).post("v2/p2p/whatsapp-initiated", options, {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "x-auth-token": authToken,
                        },
                    });
                    const respArr = data.data.message;
                    this.logger.debug("getDoubtPeCharchaApiResponse: ", respArr);
                    for (let i = 0;i<respArr.length;i++){
                        await this.sendMsg(ctx.params.source, ctx.params.phone, { response: respArr[i], ...this.settings.replyEvents.doubtCharchaResponse }, "en");
                    }
                } catch (e) {
                    this.logger.error(e);
                }
                await this.delay(2000);
                return {};
            },
        },
    },
};

export = DoubtCharchaDialogueService;
