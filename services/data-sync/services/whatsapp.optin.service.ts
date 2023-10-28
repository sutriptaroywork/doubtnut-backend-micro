import Sequelize from "sequelize";
import DbService from "dn-moleculer-db";
import { ServiceSchema } from "moleculer";
import _ from "lodash";
import { adapter } from "../config/adapter";

const WhatsappOptinService: ServiceSchema = {
    name: "$sync-whatsappOptin",
    mixins: [DbService],
    adapter,
    settings: {},
    model: {
        name: "whatsapp_optins",
        define: {
            phone: Sequelize.STRING(100),
            source: Sequelize.STRING(100),
            created_at: Sequelize.DATE,
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            updated_at: Sequelize.DATE,
        },
        options: {
            timestamps: false,
            freezeTableName: true,
        },
    },
    dependencies: [],
    actions: {
        count: {
            cache: false,
        },
        find: {
            cache: {
                enabled: false,
            },
        },
        get: {
            cache: {
                enabled: false,
            },
        },
        list: {
            cache: false,
        },
        insert: {
            cache: false,
        },
        update: {
            cache: false,
        },
    },
    events: {},
    methods: {},
};

export = WhatsappOptinService;
