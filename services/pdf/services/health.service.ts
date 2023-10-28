import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$pdf-health",
    settings: {
        rest: "/pdf",
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
