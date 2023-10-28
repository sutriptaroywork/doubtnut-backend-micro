import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import Cron from "moleculer-cron";
import Sequelize from "sequelize";
import { adapter } from "../config";
import {redisUtility} from "../../../common";

const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.SMALLINT, primaryKey: true, autoIncrement:true },
    searchKey: { type: Sequelize.STRING(512) },
    type: { type: Sequelize.STRING(512)  },
    isObject: { type: Sequelize.BOOLEAN, defaultValue: false  },
};

const iasFacets: ServiceSchema = {
    name: "$ias_facet",   // Microservice name
    mixins: [Cron, DbService],
    adapter,
    model: {
        name: "ias_facet",
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
        name: "ias facet",
        cronTime: "0 */12 * * *",
        async onTick() {
            this.logger.info("Starting ias facet cron");
            const serviceName = "$ias_facet";
            const localService = this.getLocalService(serviceName);
            if (localService.settings.lockedKey) {
                this.logger.info("facet cron already running");
                return;
            }
            const data = await localService.actions.find({fields:["searchKey", "type", "isObject"]});
            await redisUtility.deleteKey.bind(localService, "IAS_FACET")();
            await data.map(x => {
                redisUtility.addHashField.bind(localService, "IAS_FACET", x.searchKey, x)();
            });
            this.logger.info("Cron ias Facet completed");
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

export = iasFacets;
