import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$inapp-health",
    settings: {
        rest: "/inapp",
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
