import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "feed-health",
    settings: {
        rest: "/feed",
    },
    dependencies: [],
    actions: {
        health: {
            rest: "GET /health",
            async handler() {
                return "OK";
            },
        },
    },
    events: {},
    methods: {
    },
};

export = HealthService;
