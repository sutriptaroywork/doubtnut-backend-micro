import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema } from "moleculer";
import { adapter } from "../config";

const QuestionUrl: ServiceSchema = {
    name: "$sync-question-url",
    mixins: [DbService],
    adapter,
    model: {
        name: "web_question_url",
        define: {
            question_id: {
                type: Sequelize.INTEGER({ length: 11 }),
                primaryKey: true,
            },
            url_text: Sequelize.STRING(255),
            matched_question_id: Sequelize.INTEGER({ length: 11 }),
            canonical_url: Sequelize.STRING(200),
        },
        options: {
            timestamps: false,
            freezeTableName: true,
        },
    },
    settings: {
        idField: "question_id",
    },
    dependencies: [],
    actions: {
        count: {
            cache: false,
        },
        find: {
            cache: false,
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

export = QuestionUrl;
