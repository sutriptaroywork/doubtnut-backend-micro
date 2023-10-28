import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema } from "moleculer";
import { adapter } from "../config/adapter";

const StudentService: ServiceSchema = {
    name: "$sync-student",
    mixins: [DbService],
    adapter,
    model: {
        name: "students",
        define: {
            student_id: {
                type: Sequelize.INTEGER({ length: 255 }),
                primaryKey: true,
                autoIncrement: true,
            },
            ip: Sequelize.STRING,
            gcm_reg_id: Sequelize.TEXT({ length: "medium" }),
            clevertap_id: Sequelize.STRING,
            gaid: Sequelize.STRING,
            student_fname: Sequelize.STRING,
            student_lname: Sequelize.STRING,
            gender: Sequelize.TINYINT,
            student_email: Sequelize.STRING,
            img_url: Sequelize.STRING(256),
            school_name: Sequelize.STRING(128),
            ex_board: Sequelize.STRING(128),
            mobile: Sequelize.STRING,
            country_code: Sequelize.STRING(5),
            pincode: Sequelize.STRING,
            device_type: Sequelize.STRING,
            hashed_password: Sequelize.STRING,
            email_verification_code: Sequelize.STRING,
            mobile_verification_code: Sequelize.STRING,
            is_email_verified: Sequelize.STRING,
            is_mobile_verfied: Sequelize.STRING,
            status: Sequelize.STRING,
            reset_code: Sequelize.STRING,
            last_login: Sequelize.STRING,
            timestamp: Sequelize.DATE,
            is_online: Sequelize.INTEGER({ length: 11 }),
            student_class: Sequelize.STRING,
            referral_code: Sequelize.STRING(16),
            udid: Sequelize.STRING(150),
            primary_user: Sequelize.INTEGER({ length: 11 }),
            app_version: Sequelize.STRING(50),
            fingerprints: Sequelize.STRING(1000),
            is_uninstalled: Sequelize.TINYINT({ length: 4 }),
            is_web: Sequelize.TINYINT,
            locale: Sequelize.STRING(10),
            student_username: Sequelize.STRING(25),
            is_new_app: Sequelize.TINYINT,
            coaching: Sequelize.STRING(50),
            dob: Sequelize.DATEONLY,
            updated_at: Sequelize.DATE,
        },
        options: {
            timestamps: false,
        },
    },
    settings: {
        idField: "student_id",
    },
    dependencies: [],
    actions: {
        count: {
            cache: false,
        },
        find: {
            cache: {
                enabled: true,
                ttl: 129600, // 36 hrs
            },
        },
        get: {
            cache: {
                enabled: true,
                ttl: 129600, // 36 hrs
            },
        },
        list: {
            cache: false,
        },
    },
    events: {},
    methods: {},
};

export = StudentService;
