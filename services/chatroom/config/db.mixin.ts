import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";

export default function(collection: string) {
  return {
    mixins: [DbService],
    adapter: new MongoDBAdapter(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }),
    collection,
  };
}
