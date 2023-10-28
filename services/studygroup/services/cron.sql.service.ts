/* eslint-disable max-len */
import DbService from "dn-moleculer-db";
import {ServiceSchema} from "moleculer";
import {analyticsAdapter} from "../config";
import StudyGroupCronMySQLSchema from "../sql/cron";

const Chatroom: ServiceSchema = {
    name: "$studygroupCronMysql",
    mixins: [DbService, StudyGroupCronMySQLSchema],
    adapter: analyticsAdapter,
    model: {
        name: "study_group",
    },
    actions: {},
    events: {},
    methods: {},
};

export = Chatroom;
