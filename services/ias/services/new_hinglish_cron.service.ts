import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import Cron from "moleculer-cron";
import Sequelize from "sequelize";
import { adapter } from "../config";
import {redisUtility} from "../../../common";

// defining model attributes
const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.SMALLINT, primaryKey: true, autoIncrement:true },
    text: { type: Sequelize.STRING(512) },
    replace_text: { type: Sequelize.STRING(512), defaultValue: null  },
};

const IasNewHinglish: ServiceSchema = {
    name: "$ias_new_hinglish",   // Defining Microservice Name
    mixins: [Cron, DbService],
    adapter,
    model: {
        name: "ias_new_hinglish",
        define: modelAttributes,
        options: {
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            indexes: [
                { fields: ["text"] },
            ],
        },
    },
    // Settings and static data
    settings: {
        cacheTTL: 86400,
        lockTTL: 65,
        lockedKey: null,
    },
    // Dependencies goes here, not in use
    dependencies: [],

    crons: [{           // CRON SERVICE GOES HERE
        name: "ias new hinglish",
        cronTime: "0 */12 * * *",
        async onTick() {
            // this.logger.info("Starting ias new hinglish cron");
            const serviceName = "$ias_new_hinglish";
            const localService = this.getLocalService(serviceName);
            if (localService.settings.lockedKey) {
                // this.logger.info("new hinglish cron already running");
                return;
            }
            const data = await localService.actions.find({fields:["text", "replace_text"]});
            await redisUtility.deleteKey.bind(localService, "IAS_HINGLISH_NEW")();
            await data.map(x => {
                redisUtility.addHashField.bind(localService, "IAS_HINGLISH_NEW", x.text, x)();
            });
            // this.logger.info("Cron new ias hinglish completed");
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

export = IasNewHinglish;
