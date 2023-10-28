import { KafkaBase } from "./kafka-base";

const kafka = new KafkaBase(process.env.KAFKA_HOSTS_DE ? process.env.KAFKA_HOSTS_DE.split(",") : []);

async function publishRawDE(topic, data) {
    return kafka.publishRaw(topic, { created_at: new Date(), updated_at: new Date(), ...data });
}

export {
    publishRawDE,
};
