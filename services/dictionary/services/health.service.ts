import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$dictionary-health",
    settings: {
        rest: "/dictionary",
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
