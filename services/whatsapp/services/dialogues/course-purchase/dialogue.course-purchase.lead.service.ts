import { ServiceSchema, Context } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const WhatsAppSchema = new mongoose.Schema({
    source: { type: mongoose.Schema.Types.String, index: true, required: true },
    phone: { type: mongoose.Schema.Types.String, index: true, required: true },
    studentId: { type: mongoose.Schema.Types.Number, index: true, required: true },
    courseId: { type: mongoose.Schema.Types.Number, required: true },
    assortmentId: { type: mongoose.Schema.Types.Number },
}, {
    timestamps: true,
});

const WhatsappEventService: ServiceSchema = {
    name: "$course-purchase-lead",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("course_purchase_lead", WhatsAppSchema),
    events: {
        log: {
            async handler(ctx: Context<{ source: number; phone: string; studentId: number; courseId: number; assortmentId: number }>) {
                return this.actions.create({
                    source: ctx.params.source.toString(),
                    phone: ctx.params.phone,
                    studentId: ctx.params.studentId,
                    courseId: ctx.params.courseId,
                    assortmentId: ctx.params.assortmentId,
                });
            },
        },
    },
};

export = WhatsappEventService;
