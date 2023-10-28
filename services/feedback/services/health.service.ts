import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "feedback-health",
    settings: {
        rest: "/feedback",
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
