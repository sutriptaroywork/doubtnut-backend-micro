import { ServiceSchema, Context } from "moleculer";
import DbService from "dn-moleculer-db";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const otpServiceSchema = new mongoose.Schema({
    service: { type: mongoose.Schema.Types.String, required: true },
    success: { type: mongoose.Schema.Types.Boolean },
    createdAt: { type: mongoose.Schema.Types.Date, default: () => new Date() },
    manualTrigger: { type: mongoose.Schema.Types.Boolean, default: false },
    requestId: { type: mongoose.Schema.Types.String },
    dlr: { type: mongoose.Schema.Types.String, enum: ["PENDING", "DELIVERED", "FAILED"], default: "PENDING" },
    dlrCode: { type: mongoose.Schema.Types.String },
    dlrAt: { type: mongoose.Schema.Types.Date },
}, { _id: false });

const otpEventsSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.String, required: true, unique: true },
    services: { type: [otpServiceSchema] },
    verifiedAt: { type: mongoose.Schema.Types.Date },
    verificationStatus: { type: mongoose.Schema.Types.String, enum: ["VERIFIED", "INVALID", "EXPIRED"] },
}, { timestamps: true });

otpEventsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const OtpEvent: ServiceSchema = {
    name: "$otp-event",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("otp_events", otpEventsSchema),
    dependencies: ["$otp"],
    events: {
        generate: {
            handler(ctx: Context<{ sessionId: string; service: string; success: boolean; requestId?: string; manualTrigger?: boolean }>) {
                return this.adapter.model.updateOne({
                    sessionId: ctx.params.sessionId,
                }, {
                    $push: {
                        services: {
                            service: ctx.params.service,
                            success: ctx.params.success,
                            manualTrigger: ctx.params.manualTrigger,
                            requestId: ctx.params.requestId,
                        },
                    },
                    $inc: { __v: 1 },
                    $setOnInsert: {
                        sessionId: ctx.params.sessionId,
                    },
                }, { upsert: true });
            },
        },
        verify: {
            handler(ctx: Context<{ sessionId: string; verificationStatus: string }>) {
                if (ctx.params.verificationStatus === "VERIFIED") {
                    return this.adapter.model.updateOne({
                        sessionId: ctx.params.sessionId,
                    }, {
                        $inc: { __v: 1 },
                        $set: {
                            verifiedAt: new Date(),
                            verificationStatus: ctx.params.verificationStatus,
                        },
                    });
                }
                return this.adapter.model.updateOne({
                    sessionId: ctx.params.sessionId,
                }, {
                    $inc: { __v: 1 },
                    $set: {
                        verificationStatus: ctx.params.verificationStatus,
                    },
                });
            },
        },
        dlr: {
            handler(ctx: Context<{ sessionId: string; requestId: string; deliveryStatus: string; statusCode?: string }>) {
                this.logger.debug(ctx.params);
                return this.adapter.model.updateOne({
                    "sessionId": ctx.params.sessionId,
                    "services.requestId": ctx.params.requestId,
                }, {
                    $set: {
                        "services.$.dlrAt": new Date(),
                        "services.$.dlrCode": ctx.params.statusCode,
                        "services.$.dlr": ctx.params.deliveryStatus,
                    },
                });
            },
        },
    },
};

export = OtpEvent;
