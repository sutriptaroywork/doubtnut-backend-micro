import {ServiceSchema} from "dn-moleculer";

const HealthService: ServiceSchema = {
    name: "dnr-health",
    settings: {
        rest: "/dnr",
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
    methods: {},
};

export = HealthService;
