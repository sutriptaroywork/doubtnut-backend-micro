import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema } from "moleculer";
import { adapter } from "../config/adapter";

const dnAdvVendorDataService: ServiceSchema = {
    name: "$sync-dnAdvVendorData",
    mixins: [DbService],
    adapter,
    model: {
        name: "dn_adv_vendor_banner_data",
        define: {
            id: {
                type: Sequelize.INTEGER({ length: 11 }),
                primaryKey: true,
                autoIncrement: true,
            },
            feature_id: Sequelize.INTEGER({ length: 11 }),
            ccm_id: Sequelize.INTEGER({ length: 11 }),
            banner_url: Sequelize.STRING(255),
            banner_height: Sequelize.INTEGER({ length: 11 }),
            banner_width: Sequelize.INTEGER({ length: 11 }),
            deeplink: Sequelize.STRING(255),
            start_date: Sequelize.DATE,
            end_date: Sequelize.DATE,
            is_active: Sequelize.TINYINT,
            vendor_id: Sequelize.INTEGER({ length: 11 }),
            extra_params: Sequelize.STRING(255),
            created_at: Sequelize.DATE,
            updated_at: Sequelize.DATE,
        },
        options: {
            timestamps: false,
        },
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
            cache: false,
        },
        list: {
            cache: false,
        },
    },
    events: {},
    methods: {},
};

export = dnAdvVendorDataService;
