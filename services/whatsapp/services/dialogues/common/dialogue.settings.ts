import { ServiceSchema } from "moleculer";
import axios from "axios";
import WhatsappSettingsService from "../../whatsapp.settings";

const DialogueSettingsService: ServiceSchema = {
    name: "$dialogue-settings",
    mixins:[WhatsappSettingsService],
    settings: {
        dialogueCachePrefix: "DIALOGUE",
        dialogueEntityCachePrefix: "DIALOGUE:ENTITY",
        templatePattern: "{{.[^{}]*}}",
        incomingTemplatePattern: "#[0-9,a-z,-]+",
        adminUrl: axios.create({ baseURL: process.env.PANEL_API_URL, headers: { "Content-Type": "application/json" } }),
        cacheTTL: 86400,
    },
};

export = DialogueSettingsService;
