import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema } from "moleculer";
import { adapter } from "../config";

const LiveclassCourseResourceService: ServiceSchema = {
    name: "$sync-liveclass-course-resources",
    mixins: [DbService],
    adapter,
    model: {
        name: "liveclass_course_resources",
        define: {
            id: {
                type: Sequelize.INTEGER({ length: 11 }),
                primaryKey: true,
                autoIncrement: true,
            },
            liveclass_course_id: Sequelize.INTEGER({ length: 11 }),
            liveclass_course_detail_id: Sequelize.INTEGER({ length: 11 }),
            subject: Sequelize.STRING(20),
            resource_reference: Sequelize.STRING(200),
            topic: Sequelize.STRING(255),
            expert_name: Sequelize.STRING(50),
            expert_image: Sequelize.STRING(100),
            q_order: Sequelize.INTEGER({ length: 4 }),
            resource_type: Sequelize.TINYINT({ length: 4 }),
            class: Sequelize.INTEGER({ length: 11 }),
            player_type: Sequelize.STRING(255),
            meta_info: Sequelize.STRING(255),
            tags: Sequelize.STRING(2000),
            title: Sequelize.STRING(1000),
        },
        options: {
            timestamps: false,
        },
    },
    settings: {
        idField: "id",
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

export = LiveclassCourseResourceService;
