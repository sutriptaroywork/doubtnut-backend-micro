import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";

import { adapter } from "../config";

const CategoryService: ServiceSchema = {
    name: "$feed-categories",
    mixins: [DbService],
    adapter,
    model: {
        name: "feed_categories",
        define: {
            name: Sequelize.STRING,
            category: Sequelize.STRING,
        },
        options: {
            // Options from http://docs.sequelizejs.com/manual/tutorial/models-definition.html
            underscored: true,
            timestamps: false,
            freezeTableName: true,
        },
    },
    actions: {
        getCategories: {
            async handler(ctx) {
                const categoriesList: { id: number; name: string; category: string; is_selected: boolean }[] = await ctx.call("$feed-categories.find");

                return categoriesList;
            },
        },
    },
};

export = CategoryService;
