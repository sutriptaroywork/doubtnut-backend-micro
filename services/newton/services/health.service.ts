import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$newton-health",
    settings: {
        rest: "/newton",
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
