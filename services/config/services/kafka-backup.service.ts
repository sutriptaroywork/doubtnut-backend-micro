import mongoose from "mongoose";
import {Context, ServiceSchema} from "moleculer";
import DbService from "dn-moleculer-db";
import MongooseAdapter from "moleculer-db-adapter-mongoose";

const kafkaBkpMsgSchema = new mongoose.Schema({
    topic: { type: mongoose.Schema.Types.String, required: true },
    msg: { type: mongoose.Schema.Types.Mixed, required: true },
}, {
    timestamps: false,
});

const KafkaBackupEventService: ServiceSchema = {
    name: "$kafka-backup",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("kafka_bkp_msg", kafkaBkpMsgSchema),
    settings: {
    },
    dependencies: [],
    actions: {
    },
    events: {
        backupCreate: {
            async handler(ctx: Context<{ topic: string; msg: any }>) {
                new this.adapter.model({ topic: `micro.${ctx.params.topic}`, msg: ctx.params.msg }).save();
            },
        },
    },
};

export = KafkaBackupEventService;
