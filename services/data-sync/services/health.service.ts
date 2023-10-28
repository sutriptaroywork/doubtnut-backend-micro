import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$data-sync-health",
    settings: {
        rest: "/data-sync/health",
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
