import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";

const CategoryService: ServiceSchema = {
    name: "$feed-post",
    mixins: [DbService],
    adapter: new MongoDBAdapter(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }),
    collection: "tesla",
    actions: {
    },
};

export = CategoryService;
