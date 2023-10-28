import { ServiceSchema, Context } from "moleculer";
import { Kinesis } from "aws-sdk";
const https = require('https');
const agent = new https.Agent({
    keepAlive: true,
    maxSockets: 250
});

const kinesisClient = new Kinesis({
    region: "ap-south-1",
    httpOptions: {
        agent
    },
});

const KinesisService: ServiceSchema = {
    name: "$kinesis",
    settings: {
        flagrGenericStream: "flagr-generic",
    },
    dependencies: [],
    actions: {
    },
    events: {
        "flagr-eval": {
            handler(ctx: Context<any>) {
                try {
                    return kinesisClient.putRecord({
                        StreamName: this.settings.flagrGenericStream,
                        Data: Buffer.from(JSON.stringify({ ...ctx.params, timestamp: new Date().toISOString() })),
                        PartitionKey: (Math.random() * 100000).toFixed(0),
                    }).promise();
                } catch (e) {
                    this.logger.error(e);
                }
            },
        },
    },
    methods: {
    },
};

export = KinesisService;
