import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "games-health",
    settings: {
        rest: "/games",
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
