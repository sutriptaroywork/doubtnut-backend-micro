import SqlAdapter from "moleculer-db-adapter-sequelize";
import {analyticsAdapterConfig, mysqlAdapterConfig} from "../../../config";

export const adapter = new SqlAdapter({
    database: "classzoo1",
    ...mysqlAdapterConfig,
});

export const analyticsAdapter = new SqlAdapter({
    database: "classzoo1",
    ...analyticsAdapterConfig,
});
