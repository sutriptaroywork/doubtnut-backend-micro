import { ServiceSchema } from "dn-moleculer";

const HealthService: ServiceSchema = {
    name: "studygroup-health",
    settings: {
        rest: "/studygroup",
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
