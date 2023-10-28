import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const ScheduledPdfSchema = new mongoose.Schema({
    source: { type: mongoose.Schema.Types.String, index: true, required: true },
    phone: { type: mongoose.Schema.Types.String, index: true, required: true },
    studentId: { type: mongoose.Schema.Types.Number, index: true, required: true },
    questionId: { type: mongoose.Schema.Types.Number, index: true, required: true },
    results: { type: [mongoose.Schema.Types.String] },
    createdAt: { type: Date },
}, {
    timestamps: true,
});

const WhatsappPdfService: ServiceSchema = {
    name: "$whatsapp-pdf",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("scheduled_pdf", ScheduledPdfSchema),
    settings: {
    },
    dependencies: ["$gupshup", "$netcore"],
    actions: {
    },
    events: {
    },
    methods: {
    },
};

export = WhatsappPdfService;
