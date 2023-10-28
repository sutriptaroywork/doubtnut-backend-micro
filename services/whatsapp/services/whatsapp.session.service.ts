import { ServiceSchema, Context } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const WhatsAppSchema = new mongoose.Schema({
    source: { type: mongoose.Schema.Types.String, required: true },
    phone: { type: mongoose.Schema.Types.String, index: true, required: true },
    name: { type: mongoose.Schema.Types.String },
    createdAt: { type: Date },
    updatedAt: { type: Date, index: { expires: "15d" } },
}, {
    timestamps: true,
});

WhatsAppSchema.index({ source: 1, phone: 1 });

const WhatsappSessionService: ServiceSchema = {
    name: "$whatsapp-session",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("whatsapp_session", WhatsAppSchema),
    settings: {
    },
    dependencies: ["$gupshup", "$netcore"],
    actions: {
    },
    events: {
        log: {
            handler(ctx: Context<{ source: number; phone: string; name: string }>) {
                this.logger.debug("Logging session", ctx.params.source, ctx.params.phone, ctx.params.name);
                return this.adapter.model.updateOne({ source: ctx.params.source.toString(), phone: ctx.params.phone }, { name: ctx.params.name }, { upsert: true });
            },
        },
    },
    methods: {
    },
};

export = WhatsappSessionService;
