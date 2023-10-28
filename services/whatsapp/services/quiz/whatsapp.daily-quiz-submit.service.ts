import { ServiceSchema, Context } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const WhatsAppSchema = new mongoose.Schema({
    source: { type: mongoose.Schema.Types.String, index: true, required: true },
    studentId: { type: mongoose.Schema.Types.Number, index: true, required: true },
    phone: { type: mongoose.Schema.Types.String, index: true, required: true },
    sessionId: { type: mongoose.Schema.Types.String, required: true },
    quizId: { type: mongoose.Schema.Types.String, index: true, required: true },
    questionId: { type: mongoose.Schema.Types.Number, index: true, required: true },
    questionNumber: { type: mongoose.Schema.Types.Number, index: true, required: true },
    selectedOption: { type: mongoose.Schema.Types.String, enum: ["A", "B", "C", "D", "SKIP"] },
    marks: { type: mongoose.Schema.Types.Number, required: true },
    locale: { type: mongoose.Schema.Types.String, required: true, default: "en", enum: ["en", "hi"] },
}, {
    timestamps: true,
});

WhatsAppSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 86400 }); // 90 days

const WhatsappEventService: ServiceSchema = {
    name: "$whatsapp-daily-quiz-submit",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("whatsapp_daily_quiz_submit", WhatsAppSchema),
    settings: {
        collection: "whatsapp_daily_quiz_submits",
    },
    actions: {
        getFinalScore: {
            async handler(ctx: Context<{ quizId: string }, { user: { id: number } }>) {
                return this.adapter.db.collection(this.settings.collection).aggregate([{
                    $match: {
                        quizId: ctx.params.quizId,
                        studentId: +ctx.meta.user.id,
                    },
                }, {
                    $group: {
                        _id: "$questionNumber",
                        marks: { $first: "$marks" },
                    },
                }, {
                    $group: {
                        _id: null,
                        totalScore: { $sum: "$marks" },
                        incorrectCount: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$marks", -1] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        correctCount: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$marks", 4] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        skipCount: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$marks", 0] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                }]).toArray()
                    .then(x => x[0]);
            },
        },
    },
};

export = WhatsappEventService;
