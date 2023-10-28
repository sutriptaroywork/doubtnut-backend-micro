import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "liveclass-health",
    settings: {
        rest: "/liveclass",
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
