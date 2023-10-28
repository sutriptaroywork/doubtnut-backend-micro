import { Context, ServiceSchema } from "moleculer";
import DialogueIntentService from "./dialogue.intent.service";

const DialogueIncomingTextService: ServiceSchema = {
    name: "$dialogue-incoming-text",
    dependencies: [DialogueIntentService],
    settings: {
        data: {
            "home": 4,
            "reset": 4,
            "1": 1,
            "2": 1,
            "3": 1,
            "4": 1,
            "5": 1,
            "6": 1,
            "7": 1,
            "8": 1,
            "9": 1,
            "10": 1,
            "a": 1,
            "b": 1,
            "c": 1,
            "d": 1,
            "skip": 1,
            "yes": 2,
            "no": 2,
            "maybe": 2,
            "mujhe course id #val ki jaankari chahiye": 3,
            "hi": 4,
            "hey": 4,
            "hello": 4,
            "english mein": 4,
            "play quiz": 5,
            "quiz": 5,
            // "register now 7pmquiz": 6,
            "muje daily quiz contest ke liye register karna hai": 8,
            "play quiz contest": 8,
            "start quiz contest": 7,
            "ask a question": 9,
            "new image try karein": 9,
            "ask question and earn upto 5000 rs": 9,
            "sawaal puchho aur ₹5000 tak kamaao": 9,
            "होम": 4,
            "रिसेट ": 4,
            "हिन्दी में": 4,
            "स्किप": 1,
            "हां": 2,
            "नहीं": 2,
            "शायद": 2,
            "मुझे कोर्स #val की जानकारी चाहिए": 3,
            "हैलो": 4,
            "क्विज खेलें": 5,
            "क्विज": 5,
            // "शाम 7 बजे की क्विज में अभी रजिस्टर करें": 6,
            "मुझे रोज़ होने वाले क्विज कांटेस्ट के लिए रजिस्टर करना है": 8,
            "खेलें क्विज प्रतियोगिता": 8,
            "शुरू करें क्विज प्रतियोगिता": 7,
            "सवाल पूछें": 9,
            "एक सवाल पूछें": 9,
            "नई फ़ोटो भेजें": 9,
            "सवाल पूछो और ₹5000 तक कमाओ": 9,
            "watch free classes": 10,
            "फ़्री कक्षाएं देखें": 10,
            "change class": 10,
            "kya hai ceo reward?": 11,
            "get ceo coupon": 12,
            "doubt pe charcha #val": 13,
        },
    },
    actions: {
        find: {
            async handler(ctx: Context<{ query: { msg: string; intentId?: number } }>): Promise<{ intentId: number }[]> {
                const res: number = this.settings.data[ctx.params.query.msg];
                if (!res) {
                    return [];
                }
                if (!ctx.params.query.intentId) {
                    return [{ intentId: res }];
                }
                return (+res === +ctx.params.query.intentId) ? [{ intentId: ctx.params.query.intentId }] : [];
            },
        },
    },
    methods: {},
};

export = DialogueIncomingTextService;
