import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "chatroom-health",
    settings: {
        rest: "/chatroom",
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
