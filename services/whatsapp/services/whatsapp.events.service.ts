import { ServiceSchema, Context } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const WhatsAppSchema = new mongoose.Schema({
    source: { type: mongoose.Schema.Types.String, index: true, required: true },
    phone: { type: mongoose.Schema.Types.String, index: true, required: true },
    studentId: { type: mongoose.Schema.Types.Number, index: true },
    event: { type: mongoose.Schema.Types.Mixed },
    reply: { type: mongoose.Schema.Types.Mixed },
    context: { type: mongoose.Schema.Types.Mixed },
    prevContext: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date },
    updatedAt: { type: Date },
}, {
    timestamps: true,
});

const WhatsappEventService: ServiceSchema = {
    name: "$whatsapp-event",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("whatsapp_micro", WhatsAppSchema),
    settings: {
    },
    dependencies: ["$gupshup", "$netcore"],
    actions: {
    },
    events: {
        log: {
            async handler(ctx: Context<{ source: number; phone: string; studentId: string; event; reply; context; prevContext }>) {
                console.time("$whatsapp-event-create");
                await this.actions.create({
                    source: ctx.params.source.toString(),
                    phone: ctx.params.phone,
                    studentId: ctx.params.studentId,
                    event: ctx.params.event,
                    reply: ctx.params.reply,
                    context: ctx.params.context,
                    prevContext: ctx.params.prevContext,
                });
                console.timeEnd("$whatsapp-event-create");
            },
        },
    },
};

export = WhatsappEventService;
