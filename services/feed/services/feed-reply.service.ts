import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";

const CategoryService: ServiceSchema = {
    name: "$feed-reply",
    mixins: [DbService],
    adapter: new MongoDBAdapter(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }),
    collection: "tesla_reply",
    actions: {
        getRepliesByPollId: {
            async handler(ctx) {
                return this.adapter.db.collection("tesla_reply").aggregate(
                    [
                        {
                            $match: {
                                post_id: ctx.params.post_id,
                            },
                        },
                        {
                            $group: {
                                _id: "$answer",
                                count: { $sum: 1 },
                            },
                        },
                    ]
                ).toArray();
            },
        },
    },
};

export = CategoryService;
