import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$homepage-health",
    settings: {
        rest: "/homepage",
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
    methods: {},
};

export = HealthService;
