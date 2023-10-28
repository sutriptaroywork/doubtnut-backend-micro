/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { CompressionTypes, Kafka, Producer } from "kafkajs";

export class KafkaBase {
    private connected: boolean;
    private brokers: string[];
    private client: Kafka;
    private producer: Producer;

    constructor(brokers: string[]) {
        this.brokers = brokers;
        this.client = new Kafka({
            clientId: "producer-api-server",
            brokers,
        });
        this.producer = this.client.producer();
        this.producer.connect().then(() => {
            this.connected = true;
        });
        this.producer.on("producer.disconnect", () => {
            this.connected = false;
        });
    }

    public async publishRaw(topic, data) {
        try {
            if (!this.connected) {
                await this.connect();
            }
            await this.producer.send({
                topic,
                compression: CompressionTypes.GZIP,
                messages: [{
                    partition: null,
                    value: JSON.stringify(data),
                }],
            });
        } catch (e) {
            console.error(e);
        }
    }

    private connect() {
        return this.producer.connect().then(() => {
            this.connected = true;
        });
    }
}
