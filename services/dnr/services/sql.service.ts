/* eslint-disable max-len */
import DbService from "dn-moleculer-db";
import {ServiceSchema} from "dn-moleculer";
import {adapter} from "../config";
import CouponMySQLSchema from "../sql/coupon";

const DnrSQL: ServiceSchema = {
    name: "$dnrMysql",
    mixins: [DbService, CouponMySQLSchema],
    adapter,
    model: {
        name: "dnr",
    },
    actions: {},
    events: {},
    methods: {},
};

export = DnrSQL;
