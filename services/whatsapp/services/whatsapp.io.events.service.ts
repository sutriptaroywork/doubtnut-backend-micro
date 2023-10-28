import { ServiceSchema, Context } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const ApiResponseSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.String, index: true, required: true },
    status: { type: mongoose.Schema.Types.String },
    latency: { type: mongoose.Schema.Types.Number },
}, { _id: false });

const DlrResponseSchema = new mongoose.Schema({
    status: { type: mongoose.Schema.Types.String },
    code: { type: mongoose.Schema.Types.String },
    updatedAt: { type: mongoose.Schema.Types.Date },
}, { _id: false });

const WhatsAppSchema = new mongoose.Schema({
    source: { type: mongoose.Schema.Types.String, index: true, required: true },
    phone: { type: mongoose.Schema.Types.String, index: true, required: true },
    eventType: { type: mongoose.Schema.Types.String, required: true, enum: ["MO", "MT"] },
    payload: { type: mongoose.Schema.Types.Mixed },
    apiResponse: ApiResponseSchema,
    dlrResponse: [ DlrResponseSchema ],
}, {
    timestamps: true,
});

WhatsAppSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const WhatsappEventService: ServiceSchema = {
    name: "$whatsapp-io-event",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("whatsapp_events", WhatsAppSchema),
    events: {
        log: {
            async handler(ctx: Context<{ source: number; phone: string; eventType: "MO" | "MT"; payload: any; apiResponse?: any }>) {
                if (ctx.params.eventType === "MT" && !ctx.params.apiResponse) {
                    throw new Error("Api response required for MT messages");
                }
                return this.actions.create({
                    source: ctx.params.source.toString(),
                    phone: ctx.params.phone,
                    eventType: ctx.params.eventType,
                    payload: ctx.params.payload,
                    apiResponse: ctx.params.apiResponse,
                });
            },
        },
        dlrLog: {
            params: {
                id: "string",
                status: "string",
            },
            async handler(ctx: Context<{ id: string; status: string; code: string }>) {
                return this.adapter.model.updateOne({
                    "apiResponse.id": ctx.params.id,
                }, {
                    $push:{
                        dlrResponse: {
                            status: ctx.params.status,
                            code: ctx.params.code,
                            updatedAt: new Date(),
                        },
                    },
                });
            },
        },
    },
};

export = WhatsappEventService;
