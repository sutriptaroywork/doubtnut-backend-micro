import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$config-health",
    settings: {
        rest: "/config/health",
    },
    dependencies: [],
    actions: {
        check: {
            rest: "GET /",
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
