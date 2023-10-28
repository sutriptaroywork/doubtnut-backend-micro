import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$whatsapp-health",
    settings: {
        rest: "/whatsapp",
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
