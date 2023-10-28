import { ServiceSchema } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$student-health",
    settings: {
        rest: "/student/health",
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
