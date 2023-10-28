import { KafkaBase } from "./kafka-base";

const kafka = new KafkaBase(process.env.KAFKA_HOSTS ? process.env.KAFKA_HOSTS.split(",") : []);

async function publishRawBackend(topic, data) {
    return kafka.publishRaw(topic, data);
}

export {
    publishRawBackend,
};
