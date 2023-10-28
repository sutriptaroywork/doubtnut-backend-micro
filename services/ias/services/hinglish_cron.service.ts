import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import Cron from "moleculer-cron";
import Sequelize from "sequelize";
import { adapter } from "../config";
import {redisUtility} from "../../../common";

const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.SMALLINT, primaryKey: true, autoIncrement:true },
    searchKey: { type: Sequelize.STRING(512) },
    isHinglish: { type: Sequelize.BOOLEAN, defaultValue: true  },
};

const Synonyms: ServiceSchema = {
    name: "$ias_hinglish",   // Microservice name
    mixins: [Cron, DbService],
    adapter,
    model: {
        name: "ias_hinglish",
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
        cacheTTL: 86400, // 1 day
        lockTTL: 65,
        lockedKey: null,
    },
    // Dependencies goes here
    dependencies: [],

    // CRON SERVICE GOES HERE
    crons: [{
        name: "ias hinglish",
        cronTime: "0 */12 * * *",
        async onTick() {
            this.logger.info("Starting ias hinglish cron");
            const serviceName = "$ias_hinglish";
            const localService = this.getLocalService(serviceName);
            if (localService.settings.lockedKey) {
                this.logger.info("hinglis cron already running");
                return;
            }
            const data = await localService.actions.find({fields:["searchKey", "isHinglish"]});
            await redisUtility.deleteKey.bind(localService, "IAS_HINGLISH")();
            await data.map(x => {
                redisUtility.addHashField.bind(localService, "IAS_HINGLISH", x.searchKey, x)();
            });
            this.logger.info("Cron ias hinglis completed");
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
