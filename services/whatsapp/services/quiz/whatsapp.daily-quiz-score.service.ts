import { ServiceSchema, Context } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const WhatsAppSchema = new mongoose.Schema({
    source: { type: mongoose.Schema.Types.String, index: true, required: true },
    studentId: { type: mongoose.Schema.Types.Number, index: true, required: true },
    phone: { type: mongoose.Schema.Types.String, index: true, required: true },
    quizId: { type: mongoose.Schema.Types.String, index: true, required: true },
    totalScore: { type: mongoose.Schema.Types.Number, required: true },
    incorrectCount: { type: mongoose.Schema.Types.Number, required: true },
    correctCount: { type: mongoose.Schema.Types.Number, required: true },
    skipCount: { type: mongoose.Schema.Types.Number, required: true },
    locale: { type: mongoose.Schema.Types.String, required: true, default: "en", enum: ["en", "hi"] },
}, {
    timestamps: true,
});

WhatsAppSchema.index({ quizId: 1, totalScore: -1, incorrectCount: 1, createdAt: 1 });
WhatsAppSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

const WhatsappEventService: ServiceSchema = {
    name: "$whatsapp-daily-quiz-score",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("whatsapp_daily_quiz_score", WhatsAppSchema),
};

export = WhatsappEventService;
