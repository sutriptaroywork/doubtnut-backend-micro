import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema } from "moleculer";
import { adapter } from "../config/adapter";

const StudentCourseMappingService: ServiceSchema = {
    name: "$sync-studentCourseMapping",
    mixins: [DbService],
    adapter,
    model: {
        name: "student_course_mapping",
        define: {
            id: {
                type: Sequelize.INTEGER({ length: 11 }),
                primaryKey: true,
                autoIncrement: true,
            },
            student_id: Sequelize.INTEGER({ length: 11 }),
            ccm_id: Sequelize.INTEGER({ length: 11 }),
            created_at: Sequelize.DATE,
            updated_at: Sequelize.DATE,
            type: Sequelize.STRING(20),
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
                ttl: 10800, // 3 hrs
            },
        },
        get: {
            cache: {
                enabled: true,
                ttl: 10800, // 3 hrs
            },
        },
        list: {
            cache: false,
        },
    },
    events: {},
    methods: {},
};

export = StudentCourseMappingService;
