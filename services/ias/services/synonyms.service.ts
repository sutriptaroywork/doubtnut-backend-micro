import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import _ from "lodash";
import { adapter } from "../config";

const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
    findStr: { type: Sequelize.STRING(512) },
    replaceWord: { type: Sequelize.STRING(512) },
    type: { type: Sequelize.STRING(512) },
};

const SynonymsOld: ServiceSchema = {
    name: "$synonyms_old",   // Microservice name
    mixins: [DbService],
    adapter,
    model: {
        name: "inapp_search_filter",
        define: modelAttributes,
        options: {
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            indexes: [
                { type: "FULLTEXT", fields: ["find_str"] },
                { fields: ["type"] },
            ],
        },
    },

    // Static data and setting
    settings: {
    },
    // Dependencies goes here
    dependencies: [],

    // Actions goes here
    actions: {
        getSynonyms: {
            async handler(ctx) {
                const sql = `select find_str, replace_word from inapp_search_filter where MATCH (find_str) AGAINST ('${ctx.params.text}')`;
                return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
            },
        },
    },

    events: {

    },

    methods: {
    },
};

export = SynonymsOld;
