import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "wallet-health",
    settings: {
        rest: "/wallet",
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
