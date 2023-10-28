import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema } from "moleculer";
import { adapter } from "../config/adapter";

const WhatsappStudentService: ServiceSchema = {
    name: "$sync-whatsappStudent",
    mixins: [DbService],
    adapter,
    model: {
        name: "whatsapp_students",
        define: {
            id: {
                type: Sequelize.INTEGER({ length: 11 }),
                primaryKey: true,
                autoIncrement: true,
            },
            student_id: Sequelize.INTEGER({ length: 11 }),
            mobile: Sequelize.STRING(50),
            fingerprints: Sequelize.STRING(20),
            timestamp: Sequelize.DATE,
            student_class: Sequelize.INTEGER({ length: 11 }),
        },
        options: {
            timestamps: false,
        },
    },
    settings: {
    },
    dependencies: [],
    actions: {
        count: {
            cache: false,
        },
        find: {
            cache: {
                enabled: true,
                ttl: 604800, // 7 days
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

export = WhatsappStudentService;
