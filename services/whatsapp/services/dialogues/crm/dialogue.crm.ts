import { ServiceSchema, Context } from "moleculer";
import _ from "lodash";
import axios, { AxiosInstance } from "axios";
import WhatsappSettingsService from "../../whatsapp.settings";
import DialogueSettingsService from "../common/dialogue.settings";

const CRMDialogueService: ServiceSchema = {
    name: "$dialogue-crm",
    mixins: [WhatsappSettingsService, DialogueSettingsService],
    dependencies: [],
    settings: {
        dialerUrl: axios.create({ baseURL: process.env.DIALER_URL, headers: { "Content-Type": "application/json" } }),
    },
    actions: {
        getLeadId: {
            cacher: {
                enabled: true,
                ttl: 7 * 24 * 60 * 60,
            },
            async handler(ctx: Context<{ studentId: number }>) {
                try {
                    const { data } = await (this.settings.dialerUrl as AxiosInstance).post("/", { data: { studentid: ctx.params.studentId } }); // TODO add endpoint
                    return data;
                } catch (e) {
                    this.logger.error(e);
                    throw e;
                }
            },
        },
    },
};

export = CRMDialogueService;
