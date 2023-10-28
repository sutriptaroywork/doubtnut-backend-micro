import { ServiceSchema } from "moleculer";

const RecommendationService: ServiceSchema = {
    name: "$homepage-recommendation",
    settings: {
        rest: "/homepage",
    },
    dependencies: [],
    actions: {
        health: {
            rest: "GET /recommendation",
            async handler(ctx: any) {
                try {
                    let recommendedCarousel = await this.broker.cacher.client.get(`u:rec:${ctx.meta.user.id}:carousel`);
                    recommendedCarousel = JSON.parse(recommendedCarousel);
                    return recommendedCarousel;
                } catch (e) {
                    return false;
                }
            },
        },
    },
    events: {},
    methods: {},
};

export = RecommendationService;
