import { ServiceSchema, Context } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";
import io from "socket.io-client";
import _ from "lodash";
import axios, { AxiosInstance } from "axios";
import StudentService from "../../../../student/services/student.service";
import WhatsappBaseService from "../../whatsapp.base";

const WhatsAppSchema = new mongoose.Schema({
    sentBy: { type: mongoose.Schema.Types.String, index: true, required: true, enum: ["LEAD", "AGENT"] },
    leadId: { type: mongoose.Schema.Types.String, index: true, required: true },
    agentId: { type: mongoose.Schema.Types.String, index: true, required: true },
    msg: { type: mongoose.Schema.Types.String },
    isSeen: { type: mongoose.Schema.Types.Boolean, default: () => false },
    createdAt: { type: Date },
    updatedAt: { type: Date, index: { expires: "15d" } },
}, {
    timestamps: true,
});

const WhatsappCRMChat: ServiceSchema = {
    name: "$whatsapp-crm-chat",
    dependencies: [StudentService],
    mixins: [DbService, WhatsappBaseService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("whatsapp_crm_lead_agent_chat", WhatsAppSchema),
    settings: {
        rest: "/whatsapp/crm/chat",
        crmApi: axios.create({ baseURL: "https://crm-api.doubtnut.com", headers: { "Content-type": "application/json" } }), // TODO add baseURL
    },
    actions: {
        list: {
            rest: "POST /list",
            visibility: "published",
            cache: false,
        },
        seen: {
            rest: "PUT /seen",
            params: {
                leadId: "string",
            },
            handler(ctx: Context<{ leadId: string }, { user: { agent_id: string; sales_role_flag: number } }>) {
                if (ctx.meta.user.sales_role_flag === 3) {
                    return "SKIPPED";
                }
                this.adapter.model.updateMany({ leadId: ctx.params.leadId }, { isSeen: true }).then(() => null);
                return "OK";
            },
        },
        listByAgent: {
            rest: "POST /list-by-agent",
            params: {
                page: { type: "number", optional: true, positive: true, integer: true, min: 1, default: 1 },
                pageSize: { type: "number", optional: true, positive: true, integer: true, min: 1, max: 50, default: 20 },
                sort: { type: "string", optional: true, default: "_id" },
            },
            async handler(ctx: Context<{ page?: number; pageSize?: number; sort?: any }, { user: { agent_id: string; sales_role_flag: number } }>) {
                return this.adapter.model.collection.aggregate([{
                    $match: ctx.meta.user.sales_role_flag === 3 ? {} : { agentId: ctx.meta.user.agent_id },
                }, {
                    $sort: this.transformSort(ctx.params.sort),
                }, {
                    $group: {
                        _id: "$leadId",
                        msg: { $first: "$msg" },
                        sentBy: { $first: "$sentBy" },
                        createdAt: { $first: "$createdAt" },
                        unseenCount: { $sum: { $cond: [{ $eq: ["$isSeen", true] }, 0, 1] } },
                    },
                }, {
                    $skip: (ctx.params.page - 1) * ctx.params.pageSize,
                }, {
                    $limit: ctx.params.pageSize,
                }, {
                    $project: {
                        _id: 0,
                        leadId: "$_id",
                        msg: 1,
                        sentBy: 1,
                        createdAt: 1,
                        unseenCount: 1,
                        leadName: "FOO",
                    },
                }, {
                    $lookup: {
                        from: "whatsapp_crm_lead_agent_mappings",
                        localField: "leadId",
                        foreignField: "leadId",
                        as: "lead",
                    },
                }, {
                    $unwind: {
                        path: "$lead",
                        preserveNullAndEmptyArrays: false,
                    },
                }, {
                    $project: {
                        _id: 0,
                        leadId: 1,
                        msg: 1,
                        sentBy: 1,
                        createdAt: 1,
                        unseenCount: 1,
                        leadName: "$lead.leadName",
                        leadImage: "$lead.leadImage",
                        studentId: "$lead.studentId",
                    },
                }]).toArray();
            },
        },
        getLeadIdFromPhone: {
            cache: {
                enabled: true,
                ttl: 7 * 24 * 60 * 60,
            },
            async handler(ctx: Context<{ phone: string; studentId: number }>) {
                const { data } = await (this.settings.crmApi as AxiosInstance).post("/dialer/public/index.php/suitecrm/dncrm_get_lead_id", {
                    key: `dnCRMLeadGetLeadID${process.env.CRM_KEY}`,
                    phone_mobile: ctx.params.phone.substr(-10),
                    student_id: ctx.params.studentId,
                });
                return { leadId: data.lead_id, agentId: data.agent_id };
            },
        },
        getPhoneFromLeadId: {
            cache: {
                enabled: true,
                ttl: 7 * 24 * 60 * 60,
            },
            async handler(ctx: Context<{ leadId: string }>) {
                const { data } = await (this.settings.crmApi as AxiosInstance).post("/dialer/public/index.php/suitecrm/dncrm_get_lead_number", {
                    key: `dnCRMLeadGetLeadNumber${process.env.CRM_KEY}`,
                    lead_id: ctx.params.leadId,
                });
                return { phone: data.lead_phone_number };
            },
        },
        byLead: {
            async handler(ctx: Context<{ leadId: string; studentId: number; source: string; msg: string; agentId?: string }>) {
                const row: { agentId: string } = await ctx.call("$whatsapp-crm-lead-agent-mapping.find", { query: { leadId: ctx.params.leadId }, limit: 1 }).then(x => x[0]);
                if (!row) {
                    if (ctx.params.agentId) {
                        this.settings.socket.emit("msg_by_lead_client", JSON.stringify({ leadId: ctx.params.leadId, agentId: ctx.params.agentId, msg: ctx.params.msg }));
                        this.createLeadAgentMapping(ctx.params.agentId, ctx.params.leadId, ctx.params.source, ctx.params.studentId);
                        this.adapter.model.create({ sentBy: "LEAD", leadId: ctx.params.leadId, agentId: ctx.params.agentId, msg: ctx.params.msg });
                        return;
                    }
                    this.settings.socket.emit("get_random_online_agent", JSON.stringify({
                        payload: {
                            leadId: ctx.params.leadId,
                            source: ctx.params.source,
                            studentId: ctx.params.studentId,
                            msg: ctx.params.msg,
                        },
                    }));
                    return;
                }
                this.settings.socket.emit("msg_by_lead_client", JSON.stringify({ leadId: ctx.params.leadId, agentId: row.agentId, msg: ctx.params.msg }));
                this.adapter.model.create({ sentBy: "LEAD", leadId: ctx.params.leadId, agentId: row.agentId, msg: ctx.params.msg });
            },
        },
    },
    methods: {
        transformSort(paramSort) {
            let sort = paramSort;
            if (_.isString(sort)) { sort = sort.replace(/,/, " ").split(" "); }

            if (Array.isArray(sort)) {
                const sortObj = {};
                sort.forEach(s => {
                    if (s.startsWith("-")) { sortObj[s.slice(1)] = -1; }
                    else { sortObj[s] = 1; }
                });
                return sortObj;
            }

            return sort;
        },
        async createConversationContextByForce(source: number, phone: string) {
            const context = this.getConversationContext(source, phone);
            if (context) {
                delete context.interruptedContext;
            }
            return this.startConversation(source, phone, this.settings.ContextType.TALK_TO_AGENT, { active: false, interruptedContext: context });
        },
        async createLeadAgentMapping(agentId: string, leadId: string, source: string, studentId: number) {
            const { phone } = await this.actions.getPhoneFromLeadId({ leadId });
            let student: any;
            try {
                student = await this.broker.call("$sync-student.get", { id: studentId });
            } catch (e) {
                this.logger.error(e);
                student = {};
            }
            this.broker.call("$whatsapp-crm-lead-agent-mapping.create", {
                leadId,
                agentId,
                disposeStatus: "NEW",
                source,
                phone: `91${phone}`,
                studentId: student.student_id,
                leadName: [student.student_fname, student.student_lname].join(" "),
                leadImage: student.img_url,
            });
        },
    },
    async started() {
        const token = await this.broker.call("$student.sign", { studentId: 10002, role: "crm-socket-relay-server" });
        this.logger.debug(token);
        this.settings.socket = io(`${process.env.SOCKET_SERVER}/crm`, {
            transports: ["websocket"],
            query: {
                token,
            },
        });
        this.settings.socket.on("connected", () => {
            this.logger.debug("connected to crm");
        });
        this.settings.socket.on("msg_by_agent_server", async (msg: string) => {
            this.logger.debug(msg);
            const data: { leadId: string; agentId: string; msg: string } = JSON.parse(msg);
            this.adapter.model.create({ sentBy: "AGENT", leadId: data.leadId, agentId: data.agentId, msg: data.msg });
            const row = await this.broker.call("$whatsapp-crm-lead-agent-mapping.find", { query: { leadId: data.leadId }, limit: 1, sort: { _id: -1 } }).then(x => x[0]);
            if (row) {
                const service = this.settings.accounts[row.source].service;
                this.createConversationContextByForce(row.source, row.phone);
                this.broker.emit("sendTxtMsg", { source: row.source, phone: row.phone, payload: { text: data.msg } }, service);
                // TODO log event
            }
        });
        this.settings.socket.on("random_online_agent", async (msg: string) => {
            this.logger.debug("random_online_agent", msg);
            const data: { agentId?: string; payload: { leadId: string; msg: string; source: string; studentId: number } } = JSON.parse(msg);
            let agentId = data.agentId;
            if (agentId) {
                this.settings.socket.emit("msg_by_lead_client", JSON.stringify({ leadId: data.payload.leadId, agentId, msg: data.payload.msg }));
            } else {
                const agent: { agent_id: string } = await this.broker.call("$sync-raw.getRandomInternetExpert");
                agentId = agent.agent_id;
            }
            this.createLeadAgentMapping(agentId, data.payload.leadId, data.payload.source, data.payload.studentId);
            this.adapter.model.create({ sentBy: "LEAD", leadId: data.payload.leadId, agentId, msg: data.payload.msg });
        });
    },
};

export = WhatsappCRMChat;
