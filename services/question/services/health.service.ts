import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$question-health",
    settings: {
        rest: "/question",
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
