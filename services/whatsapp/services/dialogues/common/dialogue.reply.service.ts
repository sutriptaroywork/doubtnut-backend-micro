import { Context, ServiceSchema } from "moleculer";
import _ from "lodash";
import { staticCDN } from "../../../../../common";
import DialogueIntentService from "./dialogue.intent.service";
import { Reply } from "./dialogue.interface";

const DialogueReplyService: ServiceSchema<{ data: { [id: number]: Reply } }> = {
    name: "$dialogue-reply-text",
    dependencies: [DialogueIntentService],
    settings: {
        data: {
            1: { msg: async (locale: string) => { return "Doubtnut mai aapka swagat hai."; }, delay: 0, awaitedIntentId: null, conditionFn: null, replyType: "TEXT" },
            2: {
                msg: async (locale: string) => { return "Iss link mai course ke baare mai sab kuch bataya gaya hai\n{{course_brochure}}"; },
                delay: 2, awaitedIntentId: null, conditionFn: "getCourseDetails", replyType: "TEXT",
            },
            3: {
                msg: async (locale: string) => { return "Iss video mai course ke baare mai sab kuch bataya gaya hai\n{{course_intro_video}}"; },
                delay: 2, awaitedIntentId: null, conditionFn: "getCourseDetails", replyType: "TEXT",
            },
            4: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "<h6>{{course_name}}</h6>\n\nCourse ki aur jaankari ke liye neeche diye menu se select karein",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            button: "Course ki Jaankari",
                            sections: [{
                                title: "Course ki Jaankari",
                                rows: [
                                    { id: "1", title: "Course ki details", description: "#{{course_id}} Course mai kya kya milega" },
                                    { id: "2", title: "Course ka Timetable", description: "#{{course_id}} Course ka Timetable" },
                                    { id: "3", title: "Subjects and topics", description: "#{{course_id}} Course mai padhai jaane vale subjects and topics" },
                                    { id: "4", title: "Course demo lectures", description: "#{{course_id}} Course ka demo lectures" },
                                    { id: "5", title: "Teacher notes and slides", description: "#{{course_id}} Sample teacher notes and class slides" },
                                    { id: "6", title: "Student reviews", description: "#{{course_id}} Humare students humare baare mai kya kehte hai" },
                                    { id: "7", title: "Course teachers details", description: "#{{course_id}} Course ke Teachers ki details" },
                                    // { id: "8", title: "FAQs", description: "#{{course_id}} Aksar puche jaane vale prashn" },
                                ],
                                // }, {
                                //     title: "Payment",
                                //     rows: [{ id: "9", title: "Payment Tutorials", description: "#{{course_id}} Payment kaise karein" }],
                            }],
                        },
                    });
                },
                delay: 2, awaitedIntentId: 1, conditionFn: "getCourseDetails", replyType: "LIST",
            },
            5: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "<h6>{{course_name}}</h6>\n\nCourse me aapko neeche likhi hui saari cheeze milaegi\n\n-Daily Classes\n-Daily homework\n-Previous year papers\n-Teachers notes/slides\n-NCERT Solution\n-Doubt Solution\n-Weekly Live Chat\n-Video solution for top books\n-Practice PDF\n-Weekly test",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Request a call" } },
                                { type: "reply", reply: { id: "2", title: "Get Admission" } },
                                { type: "reply", reply: { id: "3", title: "Course Menu" } },
                            ],
                        },
                    });
                },
                delay: 2, awaitedIntentId: 1, conditionFn: "getCourseDetails", replyType: "BUTTONS",
            },
            6: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "<h6>{{course_name}}</h6>\n\nYe Iss course ke time table ka pdf hai\n{{course_timetable_pdf}}",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Request a call" } },
                                { type: "reply", reply: { id: "2", title: "Get Admission" } },
                                { type: "reply", reply: { id: "3", title: "Course Menu" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getCourseDetails", replyType: "BUTTONS",
            },
            7: {
                msg: async (locale: string) => { return "Aapko iss course me\n\n{{course_subjects}}\n\npadhae jayenge"; },
                delay: 0, awaitedIntentId: null, conditionFn: "getCourseDetails", replyType: "TEXT",
            },
            8: {
                msg: async (locale: string) => { return JSON.stringify({
                        // text: "Iss pdf mai sabhi padhae jane vale topics ki jaankari hai\n\{{course_topic_pdf}}",
                        text: "<h6>{{course_name}}</h6>\n\nIss link mai sabhi padhae jane vale topics ki jaankari hai\n{{course_topic_details}}",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Request a call" } },
                                { type: "reply", reply: { id: "2", title: "Get Admission" } },
                                { type: "reply", reply: { id: "3", title: "Course Menu" } },
                            ],
                        },
                    });
                },
                delay: 2, awaitedIntentId: 1, conditionFn: "getCourseDetails", replyType: "BUTTONS",
            },
            9: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "<h6>{{course_name}}</h6>\n\nCourse ke demo video dekhne ke liye neeche diye menu se select karein",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            button: "Course ka video",
                            sections: "{{course_subject_video_list}}",
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getCourseDetails", replyType: "LIST",
            },
            10: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "<h6>{{course_name}}</h6>\n\n{{subject}} ki demo video\n{{course_subject_intro}}",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Request a call" } },
                                { type: "reply", reply: { id: "2", title: "Get Admission" } },
                                { type: "reply", reply: { id: "3", title: "Course Menu" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getSubjectDemoVideo", replyType: "BUTTONS",
            },
            11: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "<h6>{{course_name}}</h6>\n\nAapke iss course ke Sample Notes neeche diye hue link se dekh sakte hai\n{{course_subject_notes}}",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Request a call" } },
                                { type: "reply", reply: { id: "2", title: "Get Admission" } },
                                { type: "reply", reply: { id: "3", title: "Course Menu" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getSubjectNotes", replyType: "BUTTONS",
            },
            12: {
                msg: async (locale: string) => { return "Hume aapki call request mil gai hai.\nDoubtnut se aapko jald hi call aajaega"; },
                delay: 0, awaitedIntentId: null, conditionFn: "requestForCall", replyType: "TEXT",
            },
            13: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "<h6>{{course_name}}, {{course_id}}</h6>\n\nApne pasandida pack neeche diye he menu se chune\n\nAll pack info",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            button: "View price list",
                            sections: "{{price_variants_list}}",
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getCourseDetails", replyType: "LIST",
            },
            14: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "Apne <h6>{{course_name}}</h6>, ka <strong>{{variant_duration}}</strong> days ka course select kiya hai.\nIss course mai admission laene ke liye aapko <strong>₹{{variant_price}}</strong> ka payment karna hoga.\n\nNeeche diye hue link se aap iss course ki payment kar sakte hae.\nPayment link -\n{{payment_link}}",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Request a call" } },
                                // { type: "reply", reply: { id: "2", title: "Get Admission" } },
                                { type: "reply", reply: { id: "2", title: "Course Menu" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getPaymentLink", replyType: "BUTTONS",
            },
            15: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "<h6>{{course_name}}</h6>\n\nStudent reviews\n\n{{course_testimonials}}",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Request a call" } },
                                { type: "reply", reply: { id: "2", title: "Get Admission" } },
                                { type: "reply", reply: { id: "3", title: "Course Menu" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getCourseDetails", replyType: "BUTTONS",
            },
            16: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "<h6>{{course_name}}</h6>\n\nIss course ke teachers\n\n{{course_teachers}}",
                        header: "Doubtnut Classes",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Request a call" } },
                                { type: "reply", reply: { id: "2", title: "Get Admission" } },
                                { type: "reply", reply: { id: "3", title: "Course Menu" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getCourseDetails", replyType: "BUTTONS",
            },
            17: {
                msg: async (locale: string) => { return locale == "hi" ? "हैलो {{student_name|Student}}👋 मैं हूं Doubtnut साथी  \nआपका अपना पढ़ाई का साथी।\n\n1. आप मुझसे अपने सारे सवाल पूछ सकते हैं\n 2. आप यहां whatsapp पर Doubtnut के टॉप <strong>शिक्षकों 👨‍🏫 की कक्षाएं फ्री🆓</strong> में देख सकते हैं😃" : "Hello {{student_name|Student}}👋 Main hoon Doubtnut buddy.\nAapka personal study buddy.\n\n1. Aap mujhse apne saare sawaal puchh sakte hain\n2. Aap yahan Whatsapp par Doubtnut ke top <strong>Teachers👨🏻‍🏫 ki classes FREE🆓</strong> mein Dekh sakte hain😃";
                },
                delay: 0, awaitedIntentId: null, conditionFn: null, replyType: "TEXT",
            },
            18: {
                msg: async (locale: string) => { return locale == "hi" ?  JSON.stringify({
                        caption: "आप आज क्या करना चाहेंगे?🤔❓\n\n 1. डाउट हल करें <strong>सवाल पूछें</strong>\n2 कॉन्सेप्ट को समझें <strong>फ्री में कक्षाएं देखें</strong> 📝",
                        media: "https://d3cvwyf9ksu0h5.cloudfront.net/WHATSAPP/INTRO/wa_intro_en_qa.mp4",
                        footer: "नीचे दिए हुए विकल्पों में से ही कुछ चुने",
                        mediaType: "VIDEO",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                                { type: "reply", reply: { id: "2", title: "फ़्री कक्षाएं देखें" } },
                                // { type: "reply", reply: { id: "2", title: "क्विज खेलें" } },
                                // { type: "reply", reply: { id: "2", title: "खेलें क्विज " } },
                            ],
                        },
                    }): JSON.stringify({
                        caption: "Aap aaj kya karna chahenge?🤔❓\n\n1. Doubts Clearing <strong>Ask a Question</strong>\n2. Concept Study <strong>Watch Free Classes</strong>📝",
                        media: "https://d3cvwyf9ksu0h5.cloudfront.net/WHATSAPP/INTRO/wa_intro_en_qa.mp4",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        mediaType: "VIDEO",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                                { type: "reply", reply: { id: "2", title: "Watch Free Classes" } },
                                // { type: "reply", reply: { id: "2", title: "Play Quiz" } },
                                // { type: "reply", reply: { id: "2", title: "Play Quiz Contest" } },
                            ],
                        },
                    });
                },
                delay: 2, awaitedIntentId: 1, conditionFn: null, replyType: "BUTTONS",
            },
            19: {
                msg: async (locale: string) => { return locale == "hi" ? "आप मुझसे <strong>गणित</strong>, <strong>भौतिक विज्ञान</strong>, <strong>रसायन विज्ञान</strong> और <strong>जीव विज्ञान</strong> के सवाल पूछ सकते हैं।" : "Aap mujhse <strong>Maths</strong>, <strong>Physics</strong>, <strong>Chemistry</strong> & <strong>Biology</strong> ke questions pooch sakte hai."; },
                delay: 0, awaitedIntentId: null, conditionFn: null, replyType: "TEXT",
            },
            20: {
                msg: async (locale: string) => { return locale == "hi" ? JSON.stringify({
                        caption: "कैसे?? 🤔 \n\nस्टेप1️⃣ - सवाल की 📷 फोटो खींचे \n\nस्टेप2️⃣ - सिर्फ एक सवाल क्रॉप कर के भेजें ।",
                        media: "https://d3cvwyf9ksu0h5.cloudfront.net/WHATSAPP/QA-FLOW/qa_video.mp4",
                        mediaType: "VIDEO",
                    }): JSON.stringify({
                        caption: "How? 🤔 \n\nStep 1️⃣ - Question ki 📸 photo kheeche \n\nStep 2️⃣ - Sirf one question crop karke send karein",
                        media: "https://d3cvwyf9ksu0h5.cloudfront.net/WHATSAPP/QA-FLOW/qa_video.mp4",
                        mediaType: "VIDEO",
                    });
                },
                delay: 2, awaitedIntentId: null, conditionFn: null, replyType: "VIDEO",
            },
            21: {
                msg: async (locale: string) => { return locale == "hi" ? "सिर्फ 2 स्टेप्स\n\nअभी फोटो खींचे 📷🙂" : "Bas 2 steps!\n\nTake photo now 📷  🙂"; },
                delay: 2, awaitedIntentId: null, conditionFn: null, replyType: "TEXT",
            },
            22: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "Doubtnut 24*7 quiz mai aapka swagat hai.\nQuiz start karne ke liye apni class choose karein",
                        // header: "",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            button: "Select class",
                            sections: [{
                                title: "Classes",
                                rows: "{{class_list}}",
                            }],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getQuizClasses", replyType: "LIST",
            },
            23: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "Aapne {{class}} chuni hai.\n\nApna medium select karein",
                        // header: "",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: "{{language_list}}",
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getQuizLanguages", replyType: "BUTTONS",
            },
            24: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "Aapne {{class}}, {{language}} medium chuna hai.\n\nApni pasand ka koi ek subject chune",
                        // header: "",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            button: "Select subject",
                            sections: [{
                                title: "Subjects",
                                rows: "{{subject_list}}",
                            }],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getQuizSubjects", replyType: "LIST",
            },
            25: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "Aapne 👨‍🎓 class <strong>{{class}}</strong>,<strong>{{language}}</strong> medium mai <strong>{{subject}}</strong> ka quiz chuna hai.👩‍🎓\n\n🪧<strong>Instruction for Quiz</strong>🪧\n\n\n1. Iss quiz mein aapko class {{class}} {{subject}} ke 🔟 questions puche jaenge.📚\n\n2. Har question❓ mein aapko 4️⃣ options diye jaenge.\n\n3. ✅Sahi option choose karne par aapko ➕1️⃣ marks milenge and ❌galat choose karne par 0️⃣.\n\n4. Har question mein aapko ek 📍'SKIP'📍 ka button bhi diya jaega, agar aapko kisi sawaal ka jawab nahi aata hai toh aap 📍'SKIP'📍 ka button press karke agle sawaal par jaa sakte hain.\n\n5. Aap har swaal ka jawaab ek hi baar de sakte hain.\n\n6. Skip kiya hua sawaal dubara 🚫 attempt nahi kar sakte hain.",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Start Quiz" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getRandomChapter", replyType: "BUTTONS",
            },
            ..._.mapValues(_.keyBy(_.times(10, i => ({
                key: 26 + i * 2,
                value: {
                    msg: async (locale: string) => { return JSON.stringify({
                            caption: `Question ${i + 1}`,
                            media: `{{q_${i}_image}}`,
                            mediaType: "image",
                        });
                    },
                    delay: 0, awaitedIntentId: null, conditionFn: "getQuizQuestion", replyType: "IMAGE",
                },
            })), "key"), "value"),
            ..._.mapValues(_.keyBy(_.times(10, i => ({
                key: 26 + i * 2 + 1,
                value: {
                    msg: async (locale: string) => { return JSON.stringify({
                            text: `Question ${i + 1}`,
                            footer: "Select answer par click karke correct option choose karein",
                            action: {
                                button: "Select option",
                                sections: [{
                                    title: "Options",
                                    rows: [
                                        { id: "a", title: "A", description: "" },
                                        { id: "b", title: "B", description: "" },
                                        { id: "c", title: "C", description: "" },
                                        { id: "d", title: "D", description: "" },
                                    ],
                                }, {
                                    title: "Others",
                                    rows: [
                                        { id: "skip", title: "SKIP", description: "" },
                                    ],
                                }],
                            },
                        });
                    },
                    delay: 3, awaitedIntentId: 1, conditionFn: null, replyType: "LIST",
                },
            })), "key"), "value"),
            // TODO 46 is empty
            47: {
                msg: async (locale: string) => { return "{{quiz_result}}"; },
                delay: 0, awaitedIntentId: null, conditionFn: "getQuizResults", replyType: "TEXT",
            },
            ..._.mapValues(_.keyBy(_.times(10, i => ({
                key: 48 + i,
                value: {
                    msg: async (locale: string) => { return JSON.stringify({
                            caption: `❓Question number: ${i + 1}\n✅Correct Answer: {{q_${i}_correct_options}}\n👉Your Answer: {{q_${i}_answered}}\n\n🎙️Video solution: {{q_${i}_deeplink}}`,
                            media: `{{q_${i}_image}}`,
                            mediaType: "image",
                        });
                    },
                    delay: 2, awaitedIntentId: null, conditionFn: null, replyType: "IMAGE",
                },
            })), "key"), "value"),
            58: {
                // NOTE Global failure Reply
                msg: async (locale: string) => { return locale == "hi" ? JSON.stringify({
                        text: "प्रिय छात्र {{student_name|Student}},\nआपने किसी पुराने मैसेज का रिप्लाई किया है जो मुझे अभी समझ नहीं आ रहा।\n\nकृपया नए मैसेज का ही रिप्लाई करें।\nया होम बटन पर क्लिक कर के बातचीत फिर से शुरू करें।",
                        footer: "नीचे होम बटन पर क्लिक करके बातचीत दोबारा शुरू करें।",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "होम" } },
                            ],
                        },
                    }): JSON.stringify({
                        text: "Dear {{student_name|Student}},\nAapne kisi purane message ka reply kiya hai jo muje abhi samjh nahi aaraha.\n\nPlease latest message ka hi reply karein.\nYa home button ko daba ke chat phir se shuru karein.",
                        footer: "Neeche home button par click karke chat restart karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Home" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: null, conditionFn: null, replyType: "BUTTONS",
            },
            59: {
                msg: async (locale: string) => { return locale == "hi" ? JSON.stringify({
                        text: "Neeche home button par click✅ karke aap question❓ puchhna jaari rakh sakte hain ya aap apni knowledge📚 test karne ke liye quiz✏️ khel sakte hain👇",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Home" } },
                            ],
                        },
                    }): JSON.stringify({
                        text: "Neeche home button par click✅ karke aap question❓ puchhna jaari rakh sakte hain ya aap apni knowledge📚 test karne ke liye quiz✏️ khel sakte hain👇",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Home" } },
                            ],
                        },
                    });
                },
                delay: 5, awaitedIntentId: null, conditionFn: null, replyType: "BUTTONS",
            },
            60: {
                msg: async (locale: string) => { return "👋Hello Students\nDoubtnut  <strong>Daily Quiz Contest</strong> mai aapka swagat💃 hai.\nYe hai Doubtnut ka sabse bada🙌 quiz contest jisme <strong>lakho😮 bache lagate hai dimag aur jeette hai inam</strong>💵.\n\nQuiz ke baare mai adhik jaankari ke liye👇\nhttps://app.doubtnut.com/whatsapp-daily-quiz-contest"; },
                delay: 0, awaitedIntentId: null, conditionFn: null, replyType: "TEXT",
            },
            61: {
                msg: async (locale: string) => { return "Daily Quiz Contest ke <strong>inaam</strong>🤩🤩\n<strong>Daily</strong> top 3️⃣ winners ko milega 5️⃣0️⃣0️⃣0️⃣ tak ka <strong>cash prize</strong>\n\nHar hafte yani har Sunday milega <strong>weekly winner</strong> ko ek <strong>chamchmata naya phone</strong>📱\n\nleader board👇\nhttps://app.doubtnut.com/whatsapp-daily-quiz-contest"; },
                delay: 0, awaitedIntentId: null, conditionFn: null, replyType: "TEXT",
            },
            62: {
                msg: async (locale: string) => { return "Daily Quiz Contest ke niyam❗❗\n\n✅Iss contest mein <strong>sabhi classes ke bachhe</strong> bhaag le sakte hain\n✅Aap iss contest ko hindi/English dono bhasaha mai khel sakte hai\n✅Contest ki tarikh- <strong>{{quiz_date}}</strong>\n✅Contest ka time👇\n\nBatch 1️⃣ - 5PM to 5:30PM\nBatch 2️⃣ - 6PM to 6:30PM\nBatch 3️⃣ - 7PM to 7:30PM\nBatch 4️⃣ - 8PM to 8:30PM\nBatch 5️⃣ - 9PM to 9:30PM\n\nAdhik jaankari ke liye Click on the Link👇\nhttps://app.doubtnut.com/whatsapp-daily-quiz-contest"; },
                delay: 0, awaitedIntentId: null, conditionFn: "getDailyQuizRegistrationDate", replyType: "TEXT",
            },
            63: {
                msg: async (locale: string) => { return JSON.stringify({
                        media: `${staticCDN}images/Daily_quiz_promo_Banner_en.png`,
                        caption: "<strong>Abhi Register✅ karein Daily Quiz Contest ke liye.</strong>\n\nEnglish quiz registration ke liye.\nClick👉  <strong>Register Quiz en</strong>\n\nHindi quiz registration ke liye.\nClick👉 <strong>रजिस्टर क्विज hi</strong>",
                        mediaType: "image",
                        footer: "Neeche diye Register button ko click karke Register karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Register Quiz en" } },
                                { type: "reply", reply: { id: "2", title: "रजिस्टर क्विज hi" } },
                                { type: "reply", reply: { id: "3", title: "Home" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: null, replyType: "BUTTONS",
            },
            64: {
                msg: async (locale: string) => { return "📢Aap {{quiz_date}} ko hone wale Daily Quiz Contest ke liye <strong>{{registration_status}}</strong>. 🆗\n\n🔍Batch number: <strong>{{batch_id}} ({{quiz_language}})</strong>\n⏰Quiz Contest time: <strong>{{quiz_time}}</strong>\n\nHum <strong>aapko {{quiz_reminder_time}}</strong> par quiz start hone ka <strong>reminder</strong> 📝 bhej denge\n\nAdhik jaankari ke liye Click on the Link👇\nhttps://app.doubtnut.com/whatsapp-daily-quiz-contest"; },
                delay: 0, awaitedIntentId: null, conditionFn: "registerForDailyQuiz", replyType: "TEXT",
            },
            65: {
                msg: async (locale: string) => { return "<strong>Neeche diye link ko click karein aur apne doston ko bhi Daily Quiz Contest mein invite karein👇</strong>\n{{quiz_share_url}}"; },
                delay: 0, awaitedIntentId: null, conditionFn: "getDailyQuizShareUrl", replyType: "TEXT",
            },
            66: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "Neeche👇 home button par click✅ karke aap\n1️⃣ <strong>Question❓ puchhna</strong> jaari rakh sakte hain\n2️⃣ Apni knowledge📚 test karne ke liye <strong>quiz✏️ khel sakte</strong> hain\n3️⃣ <strong>Daily Quiz Contest</strong> ke liye register kar sakte hain",
                        footer: "Neeche home button par click karke chat restart karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Home" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: null, conditionFn: null, replyType: "BUTTONS",
            },
            ..._.mapValues(_.keyBy(_.times(30, i => ({
                key: 67 + i * 2,
                value: {
                    msg: async (locale: string) => { return JSON.stringify({
                            // caption: `👆Upar di gai image mein <strong>question number ${i + 1}</strong> hai`,
                            caption: `👆Upar di gai image mein <strong>question number ${i + 1}</strong> hai\n\n<h6>Agar aapka answer</h6> ❗ <strong>A</strong> ❗ <h6>toh</h6>👇\n' <strong>A</strong> ' <i>type kar ke send karein</i>\n\n<h6>Agar aapka answer</h6> ❗ <strong>B</strong> ❗ <h6>toh</h6>👇\n' <strong>B</strong> ' <i>type kar ke send karein</i>\n\n<h6>Agar aapka answer</h6> ❗ <strong>C</strong> ❗ <h6>toh</h6> 👇\n' <strong>C</strong> ' <i>type kar ke send karein</i>\n\n<h6>Agar aapka answer</h6> ❗ <strong>D</strong> ❗ <h6>toh</h6> 👇\n' <strong>D</strong> ' <i>type kar ke send karein</i>\n\n<h6>Agar aapko answer nahi aata❌</h6> <h6>toh</h6> 👇\n' <strong>SKIP</strong> ' <i>type kar ke next question par jayein</i>`,
                            media: `{{q_${i}_image}}`,
                            mediaType: "image",
                        });
                    },
                    delay: 0, awaitedIntentId: 1, conditionFn: "getDailyQuizQuestion", replyType: "IMAGE",
                },
            })), "key"), "value"),
            ..._.mapValues(_.keyBy(_.times(30, i => ({
                key: 67 + i * 2 + 1,
                value: {
                    msg: async (locale: string) => { return JSON.stringify({
                            text: `👇Neeche diye gaye <strong>select answer button</strong> par click karke Question number ${i + 1} ka answer choose karein`,
                            // footer: "",
                            action: {
                                button: "Select Answer",
                                sections: [{
                                    title: "Options",
                                    rows: [
                                        { id: "a", title: "A", description: "" },
                                        { id: "b", title: "B", description: "" },
                                        { id: "c", title: "C", description: "" },
                                        { id: "d", title: "D", description: "" },
                                    ],
                                }, {
                                    title: "Others",
                                    rows: [
                                        { id: "skip", title: "SKIP", description: "" },
                                    ],
                                }],
                            },
                        });
                    },
                    delay: 3, awaitedIntentId: 1, conditionFn: null, replyType: "LIST",
                },
            })), "key"), "value"),
            127: {
                msg: async (locale: string) => { return JSON.stringify({
                        text: "Congratulations🤩🤩\nAapne Daily Quiz Contest time se pehle complete karli hai😎\n\nAapko aaj raat 10:00 baje result ka message aa jayega.📚",
                        footer: "Neeche home button par click karke chat restart karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Home" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: null, conditionFn: "getDailyQuizQuestion", replyType: "BUTTONS",
            },
            128: {
                msg: async(locale: string) => { return JSON.stringify({
                        text: "Aap yaha <strong>Maths</strong> , <strong>Physics</strong> , <strong>Chemistry</strong> & <strong>Biology</strong> ke classes📝🏫 <strong>Free</strong> mein dekh sakte hain🔎👀 <strong>ENGLISH</strong> and <strong>HINDI</strong> dono languages mein\n\nPlease Select your class to proceed👍🏻➡️",
                        header: "Classes by Top Doubtnut Teachers",
                        footer: "Neeche Select Class button par click kar apni class chune",
                        action: {
                            button: "Select Class",
                            sections: [{
                                title: "Select Class",
                                rows: "{{class_list}}",
                            }, {
                                title: "Other features",
                                rows: [
                                    { id: "home", title: "Home", description: "" },
                                    { id: "AskQuestion", title: "Ask a Question", description: "" },
                                ],
                            }],
                        },
                        // text: "आप यहां <strong>गणित</strong>,  <strong>भौतिक विज्ञान</strong>, <strong>रसायन विज्ञान</strong> और <strong>जीव विज्ञान</strong>📝🏫  को कक्षाएं <strong>फ्री</strong> में देख सकते हैं <strong>अंग्रेज़ी</strong> और <strong>हिंदी</strong> दोनों भाषाओं में आगे बढ़ने के लिए कृपया अपनी कक्षा चुनें👍🏻➡️",
                        // header: "Doubtnut के टॉप शिक्षकों द्वारा कक्षाएं",
                        // footer: "नीचे कक्षा चुनें बटन पर क्लिक कर अपनी कक्षा चुनें",
                        // action: {
                        //     button: "कक्षा चुनें",
                        //     sections: [{
                        //         title: "कक्षा चुनें",
                        //         rows: "{{class_list}}",
                        //     }, {
                        //         title: "अन्य विशेषताएं",
                        //         rows: [
                        //             { id: "home", title: "होम", description: "" },
                        //             { id: "AskQuestion", title: "सवाल पूछें", description: "" },
                        //         ],
                        //     }],
                        // },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getFreeClasses", replyType: "LIST",
            },
            129: {
                msg: async(locale: string) => { return JSON.stringify({
                        // text: "<h6>चयन की हुई कक्षाएं - {{selected_class}}</h6>\n\n आगे बढ़ने के लिए कृपया अपनी पढ़ाई की भाषा को चुनें🤗➡️.",
                        // header: "Classes by Top Doubtnut Teachers",
                        // footer: "नीचे भाषा चुनें बटन पर क्लिक कर अपनी भाषा चुनें",
                        // action: {
                        //     button: "भाषा चुनें",
                        //     sections: [{
                        //         title: "भाषा चुनें",
                        //         rows: "{{language_list}}",
                        //     }, {
                        //         title: "कक्षा/भाषा बदलें",
                        //         rows: [
                        //             { id: "changeClass", title: "कक्षा बदलें", description: "" },
                        //         ],
                        //     }, {
                        //         title: "अन्य विशेषताएं",
                        //         rows: [
                        //             { id: "home", title: "होम", description: "" },
                        //             { id: "AskQuestion", title: "एक सवाल पूछें", description: "" },
                        //         ],
                        //     } ],
                        // },
                        text: "<h6>Selected Class - {{selected_class}}</h6>\n\nPlease select your study language to proceed🤗➡️.",
                        header: "Classes by Top Doubtnut Teachers",
                        footer: "Neeche Select Language button par click kar apni lang. chune",
                        action: {
                            button: "Select Language",
                            sections: [{
                                title: "Select Language",
                                rows: "{{language_list}}",
                            }, {
                                title: "Change Class/Language",
                                rows: [
                                    { id: "changeClass", title: "Change class", description: "" },
                                ],
                            }, {
                                title: "Other features",
                                rows: [
                                    { id: "home", title: "Home", description: "" },
                                    { id: "AskQuestion", title: "Ask a Question", description: "" },
                                ],
                            } ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getFreeClassLanguages", replyType: "LIST",
            },
            130: {
                msg: async(locale: string) => { return JSON.stringify({
                        // text: "<h6>चयन की हुई कक्षाएं- {{selected_class}}</h6>\n<h6> चयन की हुई भाषा {{selected_language}}</h6>\n\nकृपया आप जिस विषय को पढ़ना चाहते हैं उसे चुनें📚➡️.",
                        // header: "Classes by Top Doubtnut Teachers",
                        // footer: "नीचे विषय चुनें बटन पर क्लिक कर अपना विषय चुनें",
                        // action: {
                        //     button: "विषय चुनें",
                        //     sections: [{
                        //         title: "विषय चुनें",
                        //         rows: "{{subject_list}}",
                        //     }, {
                        //         title: "कक्षा/भाषा बदलें",
                        //         rows: [
                        //             { id: "changeClass", title: "कक्षा बदलें", description: "" },
                        //         ],
                        //     }, {
                        //         title: "अन्य विशेषताएं",
                        //         rows: [
                        //             { id: "home", title: "होम", description: "" },
                        //             { id: "AskQuestion", title: "सवाल पूछें", description: "" },
                        //         ],
                        //     } ],
                        // },
                        text: "<h6>Selected Class - {{selected_class}}</h6>\n<h6>Selected Language - {{selected_language}}</h6>\n\nPlease select the Subject you want to study📚➡️.",
                        header: "Classes by Top Doubtnut Teachers",
                        footer: "Neeche Select Subject button par click karapna Subject chune",
                        action: {
                            button: "Select Subject",
                            sections: [{
                                title: "Select Subject",
                                rows: "{{subject_list}}",
                            }, {
                                title: "Change Class/Language",
                                rows: [
                                    { id: "changeClass", title: "Change class", description: "" },
                                ],
                            }, {
                                title: "Other features",
                                rows: [
                                    { id: "home", title: "Home", description: "" },
                                    { id: "AskQuestion", title: "Ask a Question", description: "" },
                                ],
                            } ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getFreeClassSubjects", replyType: "LIST",
            },
            131: {
                msg: async(locale: string) => { return JSON.stringify({
                        // text: "<h6>चयन की हुई कक्षाएं - {{selected_class}}</h6>\n<h6>चयन की हुई भाषा - {{selected_language}}</h6>\nh6>चयन n<h6>चयन किए हुए विषय- {{selected_subject}}</h6>\n\n कृपया आप जो पाठ्यक्रम पढ़ना चाहते हैं उसे चुनें",
                        // header: "Classes by Top Doubtnut Teachers",
                        // footer: "नीचे पाठ्यक्रम चुनें बटन पर क्लिक कर अपना पाठ्यक्रम चुनें",
                        // action: {
                        //     button: "अध्याय चुनें",
                        //     sections: [{
                        //         title: "अध्याय चुनें",
                        //         rows: "{{chapter_list}}",
                        //     }, {
                        //         title: "कक्षा/भाषा बदलें",
                        //         rows: [
                        //             { id: "changeClass", title: "कक्षा बदलें", description: "" },
                        //         ],
                        //     }, {
                        //         title: "अन्य विशेषताएं",
                        //         rows: [
                        //             { id: "home", title: "होम", description: "" },
                        //             { id: "AskQuestion", title: "सवाल पूछें", description: "" },
                        //         ],
                        //     } ],
                        // },
                        text: "<h6>Selected Class - {{selected_class}}</h6>\n<h6>Selected Language - {{selected_language}}</h6>\n<h6>Selected Subject - {{selected_subject}}</h6>\n\nPlease select the Chapter you want to study📝😍.",
                        header: "Classes by Top Doubtnut Teachers",
                        footer: "Neeche Select Chapter button par click karapna Chapter chune",
                        action: {
                            button: "Select chapter",
                            sections: [{
                                title: "Select chapter",
                                rows: "{{chapter_list}}",
                            }, {
                                title: "Change Class/Language",
                                rows: [
                                    { id: "changeClass", title: "Change class", description: "" },
                                ],
                            }, {
                                title: "Other features",
                                rows: [
                                    { id: "home", title: "Home", description: "" },
                                    { id: "AskQuestion", title: "Ask a Question", description: "" },
                                ],
                            }],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getFreeClassChapters", replyType: "LIST",
            },
            132: {
                msg: async (locale: string) => { return JSON.stringify({
                    //     caption: "आप आज क्या करना चाहेंगे?🤔❓\n\n 1. डाउट हल करें  <strong>सवाल पूछें</strong>\n2 कॉन्सेप्ट को समझें <strong>फ्री में कक्षाएं देखें</strong>📝",
                    //     media: "https://d3cvwyf9ksu0h5.cloudfront.net/WHATSAPP/INTRO/wa_intro_en_qa.mp4",
                    //     mediaType: "VIDEO",
                    //     footer: "नीचे दिए हुए विकल्पों में से ही कुछ चुने",
                    //     action: {
                    //         buttons: [
                    //             { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    //             { type: "reply", reply: { id: "2", title: "फ़्री कक्षाएं देखें" } },
                    //             // { type: "reply", reply: { id: "2", title: "क्विज खेलें" } },
                    //              // { type: "reply", reply: { id: "2", title: "खेलें क्विज " } },
                    //         ],
                    //     },
                        caption: "Aap aaj kya karna chahenge?🤔❓\n\n1. Doubts Clearing <strong>Ask a Question</strong>\n2. Concept Study <strong>Watch Free Classes</strong>📝",
                        media: "https://d3cvwyf9ksu0h5.cloudfront.net/WHATSAPP/INTRO/wa_intro_en_qa.mp4",
                        mediaType: "VIDEO",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                                { type: "reply", reply: { id: "2", title: "Watch Free Classes" } },
                                // { type: "reply", reply: { id: "2", title: "Play Quiz" } },
                                // { type: "reply", reply: { id: "2", title: "Play Quiz Contest" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getFreeClassVideo", replyType: "BUTTONS",
            },
            133: {
                msg: async (locale: string) => { return JSON.stringify({
                        caption: "Doubtnut pe dosti ke points milte hai! 👯‍♂️👯‍♂️\nDoston ko refer karo aur rewards jeeto! 💰🎧📣\n<strong>Kya rewards milenge?</strong>\nEVERY ADMISSION - WIN Rs. 1000 Paytm cashback\n3 admission - WIN Boat Airdopes\n6 admission - WIN Bluetooth Speaker\n10 admission - WIN Redmi 9 Phone",
                        media: "https://doubtnut-static.s.llnwi.net/static/referral_rewards.png",
                        mediaType: "IMAGE",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Get CEO Coupon" } },
                                { type: "reply", reply: { id: "2", title: "Winners ki Videos" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: null, replyType: "BUTTONS",
            },
            134: {
                // TODO add {{student_name|Student}}
                msg: async (locale: string) => { return JSON.stringify({
                        text: "Hi {{student_name|Student}}, neeche diya hue hai aapka SPECIAL CEO Coupon Code 🥳 \n\n<strong>Coupon Code</strong>: {{coupon_code}}\n<strong>Doston ko bhejne ke liye link</strong>: {{branch_link}}\n\nYeh 👆 apne doston ke saath share karo ➡️ ❗",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Admission Kaise Le?" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 1, conditionFn: "getCeoCouponCode", replyType: "BUTTONS",
            },
            135: {
                msg: async (locale: string) => { return JSON.stringify({
                        caption: "Apna Coupon & link share kar diya dost ke saath? 👊\nBas ab iss video ke steps 👣 follow karke dost ka admission final karva lo aur ban jao winner",
                        media: "https://doubtnut.s.llnwi.net/PROMO_VIDEO_2406_VID_3.mp4",
                        mediaType: "VIDEO",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Kya Hai CEO Reward?" } },
                                { type: "reply", reply: { id: "2", title: "Get CEO Coupon" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 0, conditionFn: null, replyType: "BUTTONS",
            },
            136: {
                msg: async (locale: string) => { return "Doubtnut pe 1 lakh se zyada bacche CEO 👨‍💼 👩‍💼 bane hue hai aur 5000 baccho ne jeet liye hai rewards! 👌🏼🤩\n<strong>Suno aise kuch winners se khud ki kahaani</strong>";
                },
                delay: 0, awaitedIntentId: 0, conditionFn: null, replyType: "TEXT",
            },
            137: {
                msg: async (locale: string) => { return JSON.stringify({
                        caption: "Yogesh ki Kahaani ??🤩🥳",
                        media: "https://doubtnut.s.llnwi.net/ceo_winner_yogesh.mp4",
                        mediaType: "VIDEO",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Kya Hai CEO Reward?" } },
                                { type: "reply", reply: { id: "2", title: "Get CEO Coupon" } },
                            ],
                        },
                    });
                },
                delay: 0, awaitedIntentId: 0, conditionFn: null, replyType: "BUTTONS",
            },
            138: {

                msg: async (locale: string) => { return JSON.stringify({
                    //     caption: "आप आज क्या करना चाहेंगे?🤔❓\n\n 1. डाउट हल करें  <strong>सवाल पूछें</strong>\n2 कॉन्सेप्ट को समझें <strong>फ्री में कक्षाएं देखें</strong>📝",
                    //     media: "https://d3cvwyf9ksu0h5.cloudfront.net/WHATSAPP/INTRO/wa_intro_en_qa.mp4",
                    //     mediaType: "VIDEO",
                    //     footer: "नीचे दिए हुए विकल्पों में से ही कुछ चुने",
                    //     action: {
                    //         buttons: [
                    //             { type: "reply", reply: { id: "1", title: "सवाल पूछें" } },
                    //             { type: "reply", reply: { id: "2", title: "फ़्री कक्षाएं देखें" } },
                    //             // { type: "reply", reply: { id: "2", title: "क्विज खेलें" } },
                    //              // { type: "reply", reply: { id: "2", title: "खेलें क्विज " } },
                    //         ],
                    //     },
                        caption: "Aap aaj kya karna chahenge?🤔❓\n\n1. Doubts Clearing <strong>Ask a Question</strong>\n2. Concept Study <strong>Watch Free Classes</strong>📝",
                        media: "https://d3cvwyf9ksu0h5.cloudfront.net/WHATSAPP/INTRO/wa_intro_en_qa.mp4",
                        mediaType: "VIDEO",
                        footer: "Neeche diye hue options mai se hi kuch select karein",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Ask a Question" } },
                                { type: "reply", reply: { id: "2", title: "Watch Free Classes" } },
                                // { type: "reply", reply: { id: "2", title: "Play Quiz" } },
                                // { type: "reply", reply: { id: "2", title: "Play Quiz Contest" } },
                            ],
                        },
                    });
                },
                delay: 1, awaitedIntentId: 1, conditionFn: "getDoubtPeCharchaResponse", replyType: "BUTTONS",
                // msg: async (locale: string) => { return locale === "hi" ? "Thank you hume apki request mil gai hai" : "Thank you hume apki request mil gai hai"; },
                // delay: 0, awaitedIntentId: null, conditionFn: "getDoubtPeCharchaResponse", replyType: "TEXT",
            },
        },
    },
    actions: {
        // find: {
        //     cache: {
        //         enabled: false,
        //     },
        // },
        get: {
            // cache: {
            //     enabled: false,
            // },
            async handler(ctx: Context<{ id: number }>): Promise<Reply> {
                if (!this.settings.data[ctx.params.id]) {
                    throw new Error(`Reply Id ${ctx.params.id} not found`);
                }
                return { id: ctx.params.id, ...this.settings.data[ctx.params.id] };
            },
        },
    },
    async started() {
        this.logger.debug(this.settings.data);
    },
};

export = DialogueReplyService;
