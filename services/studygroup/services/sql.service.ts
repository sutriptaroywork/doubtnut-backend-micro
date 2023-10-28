/* eslint-disable max-len */
import DbService from "dn-moleculer-db";
import {ServiceSchema} from "dn-moleculer";
import {adapter} from "../config";
import StudyGroupGeneralMySQLSchema from "../sql/general";
import StudyGroupReportMySQLSchema from "../sql/report";
import StudyChatMySQLSchema from "../sql/study_chat";

const Chatroom: ServiceSchema = {
    name: "$studygroupMysql",
    mixins: [DbService, StudyGroupGeneralMySQLSchema, StudyGroupReportMySQLSchema, StudyChatMySQLSchema],
    adapter,
    model: {
        name: "study_group",
    },
    actions: {},
    events: {},
    methods: {},
};

export = Chatroom;
