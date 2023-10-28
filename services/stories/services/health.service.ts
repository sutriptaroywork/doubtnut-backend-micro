import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "stories-health",
    settings: {
        rest: "/stories",
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
