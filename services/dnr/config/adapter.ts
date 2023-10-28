import SqlAdapter from "moleculer-db-adapter-sequelize";
import {mysqlAdapterConfig} from "../../../config";

export const adapter = new SqlAdapter({
    database: "classzoo1",
    ...mysqlAdapterConfig,
});
