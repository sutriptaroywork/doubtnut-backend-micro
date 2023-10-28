import { Context, ServiceSchema } from "moleculer";

const DialogueIntentService: ServiceSchema = {
    name: "$dialogue-intent",
    settings: {
        data: {
            1: { intent: "optionSelect", entity: "option" },
            2: { intent: "yesNoMaybe", entity: "consent" },
            3: { intent: "courseMenu", entity: "course_id" },
            4: { intent: "salutation" },
            5: { intent: "playQuiz" },
            6: { intent: "dailyQuizRegistration" },
            7: { intent: "startDailyQuiz" },
            8: { intent: "dailyQuizRegistrationStart" },
            9: { intent: "askQuestion" },
            10: { intent: "watchFreeClass" },
            11: { intent: "ceoRewards" },
            12: { intent: "ceoCoupons" },
            13: { intent: "doubtPeCharcha", entity: "doubt_id" },
        },
    },
    actions: {
        get: {
            async handler(ctx: Context<{ id: number }>): Promise<{ id: number; intent: string; entity: string }> {
                if (!this.settings.data[ctx.params.id]) {
                    throw new Error(`Intent Id ${ctx.params.id} not found`);
                }
                return { id: ctx.params.id, ...this.settings.data[ctx.params.id] };
            },
        },
    },
};

export = DialogueIntentService;
