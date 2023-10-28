import { ServiceSchema, Context } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const QuizQuestionSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.Number, index: true, required: true },
    ocr: { type: mongoose.Schema.Types.String },
    subject: { type: mongoose.Schema.Types.String },
    correctOptions: [mongoose.Schema.Types.String],
    resourceType: { type: mongoose.Schema.Types.String, enum: ["video", "text"], required: true },
    deeplink: { type: mongoose.Schema.Types.String, required: true },
}, { _id: false });

const QuizQuestionDataSchema = new mongoose.Schema({
    questions: [QuizQuestionSchema],
    pdfUrl: { type: mongoose.Schema.Types.String },
    locale: { type: mongoose.Schema.Types.String, required: true, default: "en", enum: ["en", "hi"] },
    aFactor: { type: mongoose.Schema.Types.Number, default: 0 },
    mFactor: { type: mongoose.Schema.Types.Number, default: 1 },
}, { _id: false });

const WhatsAppSchema = new mongoose.Schema({
    source: { type: mongoose.Schema.Types.String, index: true, required: true },
    questionData: [QuizQuestionDataSchema],
    quizId: { type: mongoose.Schema.Types.String, index: true, required: true },
    quizDate: { type: mongoose.Schema.Types.String, required: true },
    batchId: { type: mongoose.Schema.Types.Number, required: true },
}, {
    timestamps: true,
});

const WhatsappEventService: ServiceSchema = {
    name: "$whatsapp-daily-quiz",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("whatsapp_daily_quiz", WhatsAppSchema),
};

export = WhatsappEventService;
