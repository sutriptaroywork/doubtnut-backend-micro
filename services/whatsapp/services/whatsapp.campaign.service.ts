import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import Cron from "moleculer-cron";
import Sequelize from "sequelize";
import _ from "lodash";
import { adapter } from "../config";

const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.SMALLINT, primaryKey: true, autoIncrement: true },
    source: { type: Sequelize.STRING(16), allowNull: false },
    campaign: { type: Sequelize.STRING(32), allowNull: false },
    fingerprint: { type: Sequelize.STRING(16), allowNull: false },
};

const WhatsappCampaignService: ServiceSchema = {
    name: "$whatsapp-campaign",   // Microservice name
    mixins: [Cron, DbService],
    adapter,
    model: {
        name: "whatsapp_campaign",
        define: modelAttributes,
        options: {
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            indexes: [
                { fields: ["source", "campaign"], unique: true },
            ],
        },
    },
    settings: {
        cacheTTL: 86400, // 1 day
        lockTTL: 65,
        lockedKey: null,
    },
    dependencies: [],
    crons: [{
        name: "whatsapp_campaign",
        cronTime: "0 * * * *",
        async onTick() {
            this.logger.info("Starting whatsapp campaign cron");
            const serviceName = "$whatsapp-campaign";
            const localService = this.getLocalService(serviceName);
            const data = await localService.actions.find({ fields: ["source", "campaign", "fingerprint"] });
            // await data.map(x => {
            //     redisUtility.addHashField.call(localService, `WHATSAPP_CAMPAIGN:${x.source}`, x.campaign, x.fingerprint);
            // });
            if (data.length) {
                this.logger.info("New Optin messages", _.uniq(data.map(x => x.campaign)));
                // const whatsappTextService = this.getLocalService("$whatsapp-text");
                // whatsappTextService.settings.messageForOptin = [];
            }
            this.logger.info("Cron whatsapp campaign completed");
        },
    }],

    // Actions goes here
    actions: {
        find: {
            cache: {
                enabled: false,
            },
        },
    },

    methods: {
    },
};

export = WhatsappCampaignService;
