import Redshift from "node-redshift";
import { Op } from "sequelize";

export const redshift = new Redshift({
    user: process.env.REDSHIFT_USER,
    database: process.env.REDSHIFT_DATABASE,
    password: process.env.REDSHIFT_PASSWORD,
    port: process.env.REDSHIFT_PORT,
    host: process.env.REDSHIFT_HOST,
});

export const mysqlAdapterConfig = {
    dialect: "mysql",
    timezone: "+05:30",
    operatorsAliases: {
        $gte: Op.gte,
        $lte: Op.lte,
    },
    replication: {
        read: [
            {
                host: process.env.MYSQL_HOST_READ,
                port: process.env.MYSQL_PORT_READ || 3306,
                username: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASS,
                pool: {
                    maxConnections: process.env.MYSQL_POOL_CONNECTION_COUNT_READ || 10,
                    maxIdleTime: 30000,
                },
            },
        ],
        write: {
            host: process.env.MYSQL_HOST_WRITE,
            port: process.env.MYSQL_PORT_WRITE || 3306,
            username: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASS,
            pool: {
                maxConnections: process.env.MYSQL_POOL_CONNECTION_COUNT_WRITE || 10,
                maxIdleTime: 30000,
            },
        },
    },
};


export const analyticsAdapterConfig = {
    dialect: "mysql",
    timezone: "+05:30",
    operatorsAliases: {
        $gte: Op.gte,
        $lte: Op.lte,
    },
    replication: {
        read: [
            {
                host: process.env.MYSQL_HOST_ANALYTICS,
                port: process.env.MYSQL_PORT_ANALYTICS || 3306,
                username: process.env.MYSQL_USER_ANALYTICS,
                password: process.env.MYSQL_PASS_ANALYTICS,
                pool: {
                    maxConnections: process.env.MYSQL_POOL_CONNECTION_COUNT_ANALYTICS || 10,
                    maxIdleTime: 30000,
                },
            },
        ],
        write: {
            host: process.env.MYSQL_HOST_WRITE,
            port: process.env.MYSQL_PORT_WRITE || 3306,
            username: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASS,
            pool: {
                maxConnections: process.env.MYSQL_POOL_CONNECTION_COUNT_WRITE || 10,
                maxIdleTime: 30000,
            },
        },
    },
};
