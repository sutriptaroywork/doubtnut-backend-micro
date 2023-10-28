import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema } from "moleculer";
import { adapter } from "../config";

const Answer: ServiceSchema = {
    name: "$sync-answer-video-resources",
    mixins: [DbService],
    adapter,
    model: {
        name: "answer_video_resources",
        define: {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            answer_id: Sequelize.INTEGER({ length: 10 }),
            resource: Sequelize.STRING(255),
            resource_type: {
                type: Sequelize.ENUM,
                values: ["BLOB", "DASH", "HLS", "YOUTUBE", "RTMP"],
            },
            resource_order: Sequelize.SMALLINT({ length: 6 }),
            vdo_cipher_id: Sequelize.STRING(32),
            is_active: Sequelize.TINYINT({ length: 1 }),
            created_at: Sequelize.DATE,
            updated_at: Sequelize.DATE,
        },
        options: {
            timestamps: false,
        },
    },
    settings: {},
    dependencies: [],
    actions: {
        count: {
            cache: false,
        },
        find: {
            cache: false,
        },
        get: {
            cache: false,
        },
        list: {
            cache: false,
        },
    },
    events: {},
    methods: {},
};

export = Answer;
