import Sequelize from "sequelize";
import DbService from "dn-moleculer-db";
import { ServiceSchema } from "moleculer";
import _ from "lodash";
import { adapter } from "../config/adapter";

const WhatsappPropertyService: ServiceSchema = {
    name: "$sync-dn-property",
    mixins: [DbService],
    adapter,
    settings: {},
    model: {
        name: "dn_property",
        define: {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            bucket: Sequelize.STRING(100),
            name: Sequelize.STRING(2000),
            value: Sequelize.TEXT({ length: "medium" }),
            created_at: Sequelize.DATE,
            updated_at: Sequelize.DATE,
            priority: Sequelize.TINYINT({ length: 1 }),
            is_active: Sequelize.TINYINT({ length: 1 }),
            offset_time: Sequelize.INTEGER({ length: 11 }),
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
                enabled: true,
                ttl: 60 * 60, // 1 hour
            },
        },
        get: {
            cache: {
                enabled: true,
                ttl: 604800, // 7 days
            },
        },
        list: {
            cache: false,
        },
    },
    events: {},
    methods: {},
};

export = WhatsappPropertyService;
