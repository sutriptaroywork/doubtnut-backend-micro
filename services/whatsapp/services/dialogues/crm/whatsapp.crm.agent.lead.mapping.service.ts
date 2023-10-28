import crypto from "crypto";
import { ServiceSchema, Context } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const WhatsAppSchema = new mongoose.Schema({
    leadId: { type: mongoose.Schema.Types.String, index: true, required: true, unique: true },
    studentId: { type: mongoose.Schema.Types.Number, required: true },
    phone: { type: mongoose.Schema.Types.String, required: true },
    leadName: { type: mongoose.Schema.Types.String },
    leadImage: { type: mongoose.Schema.Types.String },
    disposeStatus: { type: mongoose.Schema.Types.String, index: true },
    agentId: { type: mongoose.Schema.Types.String, required: true },
    source: { type: mongoose.Schema.Types.String },
    createdAt: { type: Date },
    updatedAt: { type: Date, index: { expires: "15d" } },
}, {
    timestamps: true,
});

WhatsAppSchema.index({ leadId: 1, agentId: 1 });

const WhatsappCRMAgentLeadMapping: ServiceSchema = {
    name: "$whatsapp-crm-lead-agent-mapping",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("whatsapp_crm_lead_agent_mapping", WhatsAppSchema),
    settings: {
        rest: "/whatsapp/crm",
    },
    actions: {
        find: {
            cache: false,
        },
        get: {
            cache: false,
        },
        disposeWebhook: {
            // rest: "PUT /dispose",
            async handler(ctx: Context<{ leadId: string; phone: string; status: string; agentId: string }>) {
                let student: any;
                try {
                    student = await ctx.call("$sync-student.find", { query: { mobile: `91${ctx.params.phone}` }, limit: 1 }).then(res => res[0]);
                } catch (e) {
                    this.logger.error(e);
                    student = {};
                }
                const event = await ctx.call("$whatsapp-session.find", { query: { phone: `91${ctx.params.phone}` }, limit: 1, sort: { _id: -1 } }).then(res => res[0]);
                this.adapter.model.updateOne({ leadId: ctx.params.leadId, agentId: ctx.params.agentId }, {
                    $set: {
                        disposeStatus: ctx.params.status,
                        source: event.source || "8400400400",
                    },
                    $setOnInsert: {
                        leadId: ctx.params.leadId,
                        agentId: ctx.params.agentId,
                        studentId: student.student_id,
                    },
                }, { upsert: true }).then(() => {
                    // TODO trigger HSM/SMS
                });
            },
        },
        login: {
            rest: "POST /login",
            params: {
                email: "string",
                password: "string",
            },
            async handler(ctx: Context<{ email: string; password: string }, any>) {
                const password = crypto.createHash("sha1").update(ctx.params.password).digest("hex");
                const expert: { id: number; agent_id: string; sales_role_flag: number } = await ctx.call("$sync-raw.verifyInternetExpertByEmail", { email: ctx.params.email, password });
                if (!expert) {
                    throw new Error("Wrong credentails");
                }
                const token = await ctx.call("$student.sign", { studentId: expert.id, role: "internet-expert", meta: { agentId: expert.agent_id, salesRoleFlag: expert.sales_role_flag } });
                ctx.meta.$responseHeaders = {
                    "dn-x-auth-token": token,
                };
                return token;
            },
        },
    },
};

export = WhatsappCRMAgentLeadMapping;
