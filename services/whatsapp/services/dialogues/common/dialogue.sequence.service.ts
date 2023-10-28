import { Context, ServiceSchema } from "moleculer";
import _ from "lodash";
import DialogueReplyService from "./dialogue.reply.service";

const DialogueSequenceService: ServiceSchema = {
    name: "$dialogue-intent-sequence",
    dependencies: [DialogueReplyService],
    settings: {
        data: {
            "courseMenu": [1, 2, 4],
            "courseMenu-optionSelect_1": [5],
            "courseMenu-optionSelect_1-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_1-optionSelect_2": [13],
            "courseMenu-optionSelect_1-optionSelect_2-optionSelect": [14],
            "courseMenu-optionSelect_1-optionSelect_2-optionSelect-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_1-optionSelect_2-optionSelect-optionSelect_2": [4],
            "courseMenu-optionSelect_1-optionSelect_3": [4],
            "courseMenu-optionSelect_2": [6],
            "courseMenu-optionSelect_2-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_2-optionSelect_2": [13],
            "courseMenu-optionSelect_2-optionSelect_2-optionSelect": [14],
            "courseMenu-optionSelect_2-optionSelect_2-optionSelect-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_2-optionSelect_2-optionSelect-optionSelect_2": [4],
            "courseMenu-optionSelect_2-optionSelect_3": [4],
            "courseMenu-optionSelect_3": [7, 8],
            "courseMenu-optionSelect_3-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_3-optionSelect_2": [13],
            "courseMenu-optionSelect_3-optionSelect_2-optionSelect": [14],
            "courseMenu-optionSelect_3-optionSelect_2-optionSelect-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_3-optionSelect_2-optionSelect-optionSelect_2": [4],
            "courseMenu-optionSelect_3-optionSelect_3": [4],
            "courseMenu-optionSelect_4": [9],
            "courseMenu-optionSelect_4-optionSelect": [10],
            "courseMenu-optionSelect_4-optionSelect-optionSelect_1": [12],
            "courseMenu-optionSelect_4-optionSelect-optionSelect_2": [13],
            "courseMenu-optionSelect_4-optionSelect-optionSelect_2-optionSelect": [14],
            "courseMenu-optionSelect_4-optionSelect-optionSelect_2-optionSelect-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_4-optionSelect-optionSelect_2-optionSelect-optionSelect_2": [4],
            "courseMenu-optionSelect_4-optionSelect-optionSelect_3": [4],
            // "courseMenu-optionSelect_4-optionSelect_3": [4],
            "courseMenu-optionSelect_5": [11],
            "courseMenu-optionSelect_5-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_5-optionSelect_2": [13],
            "courseMenu-optionSelect_5-optionSelect_2-optionSelect": [14],
            "courseMenu-optionSelect_5-optionSelect_2-optionSelect-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_5-optionSelect_2-optionSelect-optionSelect_2": [4],
            "courseMenu-optionSelect_5-optionSelect_3": [4],
            "courseMenu-optionSelect_6": [15],
            "courseMenu-optionSelect_6-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_6-optionSelect_2": [13],
            "courseMenu-optionSelect_6-optionSelect_2-optionSelect": [14],
            "courseMenu-optionSelect_6-optionSelect_2-optionSelect-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_6-optionSelect_2-optionSelect-optionSelect_2": [4],
            "courseMenu-optionSelect_6-optionSelect_3": [4],
            "courseMenu-optionSelect_7": [16],
            "courseMenu-optionSelect_7-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_7-optionSelect_2": [13],
            "courseMenu-optionSelect_7-optionSelect_2-optionSelect": [14],
            "courseMenu-optionSelect_7-optionSelect_2-optionSelect-optionSelect_1": [12, 4],
            "courseMenu-optionSelect_7-optionSelect_2-optionSelect-optionSelect_2": [4],
            "courseMenu-optionSelect_7-optionSelect_3": [4],
            "salutation": [17, 18],
            "salutation-optionSelect_1": [19, 20, 21], // Ask A Question
            // // 24x7 QUIZ after salutation
            // "salutation-optionSelect_2": [22], // Initiate 24x7 quiz
            // "salutation-optionSelect_2-optionSelect": [23], // Class selected for 24x7 quiz
            // "salutation-optionSelect_2-optionSelect-optionSelect": [24], // Locale selected for 24x7 quiz
            // "salutation-optionSelect_2-optionSelect-optionSelect-optionSelect": [25], // Subject selected for 24x7 quiz
            // ..._.mapValues(_.keyBy(_.times(11, i => {
            //     const seq = `salutation-optionSelect_2-optionSelect-optionSelect-optionSelect-optionSelect${_.repeat("-optionSelect", i)}`;
            //     return {
            //         seq,
            //         reply: i < 10 ? [26 + i * 2, 26 + i * 2 + 1] : [47, ..._.times(10, j => 48 + j), 59],
            //     };
            // }), "seq"), "reply"),

            // // 24x7 QUIZ hotkey
            // "playQuiz": [22], // Initiate 24x7 quiz
            // "playQuiz-optionSelect": [23], // Class selected for 24x7 quiz
            // "playQuiz-optionSelect-optionSelect": [24], // Locale selected for 24x7 quiz
            // "playQuiz-optionSelect-optionSelect-optionSelect": [25], // Subject selected for 24x7 quiz
            // ..._.mapValues(_.keyBy(_.times(11, i => {
            //     const seq = `playQuiz-optionSelect-optionSelect-optionSelect-optionSelect${_.repeat("-optionSelect", i)}`;
            //     return {
            //         seq,
            //         reply: i < 10 ? [26 + i * 2, 26 + i * 2 + 1] : [47, ..._.times(10, j => 48 + j), 59],
            //     };
            // }), "seq"), "reply"),
            // freeClass
            "salutation-optionSelect_2": [128],  // Class select for freeClass
            "salutation-optionSelect_2-optionSelect": [129], // Locale select for freeClass 
            "salutation-optionSelect_2-optionSelect-optionSelect": [130], //subject select for freeClass
            "salutation-optionSelect_2-optionSelect-optionSelect-optionSelect": [131], // select chapter for freeClass  
            "salutation-optionSelect_2-optionSelect-optionSelect-optionSelect-optionSelect": [132], // FreeClass feedback
            "salutation-optionSelect_2-optionSelect-optionSelect-optionSelect-optionSelect-optionSelect_3": [128], // FreeClass feedback
            // freeClass HotKey
            "watchFreeClass": [128],  // Class select for freeClass
            "watchFreeClass-optionSelect": [129], // Locale select for freeClass 
            "watchFreeClass-optionSelect-optionSelect": [130], //subject select for freeClass
            "watchFreeClass-optionSelect-optionSelect-optionSelect": [131], // select chapter for freeClass  
            "watchFreeClass-optionSelect-optionSelect-optionSelect-optionSelect": [132], // FreeClass feedback
            "watchFreeClass-optionSelect-optionSelect-optionSelect-optionSelect-optionSelect_3": [128],
            // CEO REFERRAL
            "ceoRewards": [133],
            "ceoRewards-optionSelect_2": [136, 137],
            "ceoCoupons": [134],
            "ceoCoupons-optionSelect": [135],
            // 7PM QUIZ registration after salutation
            // "salutation-optionSelect_3": [60, 61, 62, 63], // 7pm quiz
            // "salutation-optionSelect_3-optionSelect_1": [64, 65, 66], // Register for 7pm quiz english
            // "salutation-optionSelect_3-optionSelect_2": [64, 65, 66], // Register for 7pm quiz hindi

            // // 7PM QUIZ registration hotkey
            // // "dailyQuizRegistration": [64, 65, 66],
            // "dailyQuizRegistrationStart": [60, 61, 62, 63],
            // "dailyQuizRegistrationStart-optionSelect_1": [64, 65, 66], // Register for 7pm quiz english
            // "dailyQuizRegistrationStart-optionSelect_2": [64, 65, 66], // Register for 7pm quiz hindi

            // // 7PM quiz flow
            // ..._.mapValues(_.keyBy(_.times(31, i => {
            //     const seq = `startDailyQuiz${_.repeat("-optionSelect", i)}`;
            //     const reply = i < 30 ? [67 + i * 2] : [127];
            //     return { seq, reply };
            // }), "seq"), "reply"),

            // Ask A Question Hotkey
            "askQuestion": [19, 20, 21],
            "doubtPeCharcha": [138],
        },
    },
    actions: {
        find: {
            async handler(ctx: Context<{ query: { intentSeq: string[] } }>): Promise<{ replyId: number; failureReplyId?: number }[]> {
                const res: { replyId: number; failureReplyId?: number }[] = [];
                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let i = 0; i < ctx.params.query.intentSeq.length; i++) {
                    const intentSeq = ctx.params.query.intentSeq[i];
                    if (this.settings.data[intentSeq]) {
                        res.push(...this.settings.data[intentSeq].map((x: number) => ({ replyId: x })));
                    }
                }
                return _(res).uniq().value();
            },
        },
    },
    async started() {
        this.logger.debug(this.settings.data);
    },
};

export = DialogueSequenceService;
