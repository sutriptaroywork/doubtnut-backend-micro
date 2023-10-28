import { ServiceSchema, Context } from "moleculer";

const HealthService: ServiceSchema = {
    name: "$health",
    settings: {
        rest: "/health",
    },
    dependencies: [],
    actions: {
        check: {
            rest: "GET /:ms?",
            params: {
                ms: { type: "string", requied: false, default: 0 },
            },
            async handler(ctx: Context<{ ms: number }>) {
                await this.delay(Number(ctx.params.ms || 0));
                return "OK";
            },
        },
    },
    events: {},
    methods: {
        async delay(ms) {
            return new Promise((resolve: Function) => {
                setTimeout(() => {
                    resolve();
                }, ms);
            });
        },
    },
};

export = HealthService;
