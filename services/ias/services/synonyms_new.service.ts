import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import Cron from "moleculer-cron";
import Sequelize from "sequelize";
import { adapter } from "../config";
import {redisUtility} from "../../../common";

const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.SMALLINT, primaryKey: true, autoIncrement:true },
    searchKey: { type: Sequelize.STRING(512) },
    correctKey: { type: Sequelize.STRING(512) },
    isObject: { type: Sequelize.BOOLEAN, defaultValue: false  },
    isVoiceSearch: { type: Sequelize.BOOLEAN, defaultValue: false  },
};

const Synonyms: ServiceSchema = {
    name: "$synonyms",   // Microservice name
    mixins: [Cron, DbService],
    adapter,
    model: {
        name: "ias_synonyms",
        define: modelAttributes,
        options: {
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            indexes: [
                { fields: ["search_key"] },
            ],
        },
    },

    // Static data and setting
    settings: {
        synonymsHashKey: "iasSnonyms",
        cacheTTL: 86400, // 1 day
        lockTTL: 65,
        lockedKey: null,
    },
    // Dependencies goes here
    dependencies: [],

    // CRON SERVICE GOES HERE
    crons: [{
        name: "ias synonyms",
        cronTime: "0 */12 * * *",
        async onTick() {
            this.logger.info("Starting ias synonyms cron");
            const serviceName = "$synonyms";
            const localService = this.getLocalService(serviceName);
            if (localService.settings.lockedKey) {
                this.logger.info("synonyms cron already running");
                return;
            }
            const data = await localService.actions.find({fields:["searchKey", "correctKey", "isObject", "isVoiceSearch"]});
            await redisUtility.deleteKey.bind(localService, "IAS_VOICE_SYNONYMS")();
            await redisUtility.deleteKey.bind(localService, "IAS_NORMAL_SYNONYMS")();
            await data.map(x => {
                if (x.isVoiceSearch){
                    redisUtility.addHashField.bind(localService, "IAS_VOICE_SYNONYMS", x.searchKey, x)();
                } else {
                    redisUtility.addHashField.bind(localService, "IAS_NORMAL_SYNONYMS", x.searchKey, x)();
                }
            });
            this.logger.info("Cron ias synonyms completed");
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

export = Synonyms;
