import https from "https";
import http from "http";
import { ServiceSchema } from "moleculer";
import _ from "lodash";
import { S3 } from "aws-sdk";
import axios from "axios";
import { localizer, replies } from "../config/whatsapp.reply";
import { staticCDN, videoCDN  } from "../../../common";

const WhatsappSettingsService: ServiceSchema = {
    name: "$whatsapp-settings",
    settings: {
        oneDayTTL: 86400,
        askApiEndpoint: `${process.env.ASK_URL || process.env.BACKEND_URL}/v10/questions/ask`,
        backendUrl: axios.create({
            httpAgent: new http.Agent({ keepAlive: true, maxSockets: 20 }),
            httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 20 }),
            baseURL: process.env.BACKEND_URL,
            headers: { "Content-Type": "application/json" },
        }),
        searchServiceHost: process.env.SEARCH_SERVICE_HOST,
        pznURL: process.env.PZN_URL,
        s3: new S3({
            signatureVersion: "v4",
            region: "ap-south-1",
        }),
        bucket: "doubtnut-static",
        qpcStaticImage: "2022/03/28/16-07-08-308-PM_e1.jpg",
        accounts: {
            6003008001: {
                service: "$netcore",
                fingerprint: "WHA_NT",
                defaultCampaignFingerprint: "WA_NT",
                factsEntityId: "whatsapp_nt",
                feedbackLink: "https://doubtnut.app/whatsapp_nt",
                displayNumber: "600-300-8001",
                doubt: "WHATSAPP_NT",
                channelType: "WhatsApp",
                whatsappOptinSource: "11",
            },
            8400400400: {
                service: "$gupshup",
                fingerprint: "WHA",
                defaultCampaignFingerprint: "WA",
                factsEntityId: "whatsapp",
                feedbackLink: "https://doubtnut.app/whatsapp",
                displayNumber: "8-400-400-400",
                doubt: "WHATSAPP",
                channelType: "WhatsApp",
                loginAllowed: true,
                whatsappOptinSource: "10",
            },
            6003009004: {
                service: "$gupshup",
                fingerprint: "WHA_REF",
                defaultCampaignFingerprint: "WA_REF",
                factsEntityId: "whatsapp",
                feedbackLink: "https://doubtnut.app/whatsapp",
                displayNumber: "600-300-9004",
                doubt: "WHATSAPP_REF",
                channelType: "WhatsApp",
                loginAllowed: false,
                whatsappOptinSource: "12",
            },
            7428389810: {
                service: "$gupshup",
                fingerprint: "WHA",
                defaultCampaignFingerprint: "WA",
                factsEntityId: "whatsapp",
                feedbackLink: "https://doubtnut.app/whatsapp",
                displayNumber: "742-838-9810",
                doubt: "WHATSAPP",
                channelType: "WhatsApp",
            },
            bot1608037509: {
                service: "$telegram",
                fingerprint: "TL",
                defaultCampaignFingerprint: "TL",
                factsEntityId: "telegram",
                feedbackLink: "https://doubtnut.app/telegram",
                displayNumber: "t.me/uday_test_bot",
                doubt: "TELEGRAM",
                channelType: "Telegram",
            },
            bot622056890: {
                service: "$telegram",
                fingerprint: "TL",
                defaultCampaignFingerprint: "TL",
                factsEntityId: "telegram",
                feedbackLink: "https://doubtnut.app/telegram",
                displayNumber: "t.me/doubtnut_bot",
                doubt: "TELEGRAM",
                channelType: "Telegram",
            },
        },
        ContextType: {
            ASK: 1,
            RANDOM: 2,
            SALUTATION: 3,
            CAMPAIGN: 4,
            FACTS: 5,
            ASK_TEXT: 6,
            DIALOG: 7,
            TALK_TO_AGENT: 8,
        },
        TEXT_QUESTION_MIN_LENGTH: 70,
        ContextExpiry: {
            1: 15,
            6: 15,
            7: 60,
            8: 180,
        },
        replyEvents: {
            unhandledMessage: {
                telemetryEvent: "unhandled-message-type",
                msg: (locale: string) => localizer(locale, replies.unhandledMessage),
            },
            optin: {
                telemetryEvent: "optin",
                msg: `Hello Student,
Welcome to <strong>Doubtnut Family</strong>. 
I am <strong>Doubtnut Buddy</strong>, Your Study Buddy who is going to solve all your questions of <strong>Math</strong>, <strong>Physics</strong>, <strong>Chemistry</strong> and <strong>Biology</strong> in 10 seconds.

To know more watch this short video :
{{0}}`,
                attributes: ["https://www.youtube.com/watch?v=Z8ghI-NgHds"],
            },
            searchingForSoln: {
                telemetryEvent: "searching-for-solution",
                msg: (locale: string) => localizer(locale, replies.searchingForSoln),
            },
            askFailure: {
                telemetryEvent: "ask-failure",
                msg: [
                    (locale: string) => localizer(locale, replies.askFailure[1]),
                    (locale: string) => localizer(locale, replies.askFailure[2]),
                ],
            },
            systemFailure: {
                telemetryEvent: "system-failure",
                msg: [
                    (locale: string) => localizer(locale, replies.askFailure[1]),
                    (locale: string) => localizer(locale, replies.askFailure[2]),
                ],
            },
            // multiMessage: {
            //     telemetryEvent: "multi-message",
            //     msg: async (params: any) => ({
            //         media: params.media,
            //         caption: "Please wait! Mai aapke iss 👆 question ka solution search karr raha hun! 🧐 \n\nMujhe ek baar me ek hi question bheje. Thanks 🤖",
            //     }),
            // },
            solution: {
                telemetryEvent: "solution",
                delay: 1500,
                // msg: (locale: string) => localizer(locale, replies.solution),
                msg: async (locale: string, params: any) => {
                    params.url = params.url || params.webUrl;
                    const caption = params.resourceType === "video" ? localizer(locale, replies.solution.video, params) : localizer(locale, replies.solution.text, params);
                    if (params.imageUrl) {
                        return {
                            media: params.imageUrl,
                            caption,
                            mediaType: "image",
                        };
                    }
                    return caption;
                },
                preview: true,
            },
            solnFeedback: {
                telemetryEvent: "solution-feedback",
                msg: (locale: string) => localizer(locale, replies.solnFeedback),
                delay: 20000,
                retries: [{
                    telemetryEvent: "solution-feedback-retry",
                    msg: (locale: string) => localizer(locale, replies.solnfeedbackRetry),
                }],
            },
            solnNotView: {
                telemetryEvent: "solution-not-view",
                delay: 300000,
                msg: async (locale: string, params: any) => {
                    if (!params.context ||
                        (params.dailyCountData[module.exports.ContextType.ASK] && params.dailyCountData[module.exports.ContextType.ASK] > 1) ||
                        (params.dailyCountData[module.exports.ContextType.ASK_TEXT] && params.dailyCountData[module.exports.ContextType.ASK_TEXT] > 1)
                    ) {
                        return null;
                    }
                    const resp = await params.condition(params.db.redis.read, params.studentId);
                    if (!resp || parseInt(resp, 10) !== params.context.questionId) {
                        return {
                            media: "6fbe9b0c-03d9-4bad-a591-eb700a109cde",
                            caption: localizer(locale, replies.solnNotViewCaption),
                        };
                    }
                },
            },
            solnFeedbackYesNo: {
                yes: [{
                    telemetryEvent: "solution-feedback-yes",
                    msg: (locale: string) => localizer(locale, replies.solnFeedbackYes.feed1),
                }, {
                    telemetryEvent: "solution-feedback-yes",
                    msg: [
                        (locale: string) => localizer(locale, replies.solnFeedbackYes.feed2),
                        (locale: string, params?: any) => localizer(locale, replies.solnFeedbackYes.feed3, params),
                    ],
                }, {
                    telemetryEvent: "solution-feedback-yes",
                    msg: [
                        (locale: string) => localizer(locale, replies.solnFeedbackYes.feed2),
                    ],
                }, {
                    telemetryEvent: "solution-feedback-yes",
                    msg: (locale: string) => localizer(locale, replies.solnFeedbackYes.feed2),
                }],
                no: [{
                    telemetryEvent: "solution-feedback-no",
                    msg: (locale: string, params?: any) => localizer(locale, replies.solnFeedbackNo.feed1, params),
                }, {
                    telemetryEvent: "solution-feedback-no",
                    msg: [
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[1]),
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[2]),
                    ],
                }, {
                    telemetryEvent: "solution-feedback-no",
                    msg: [
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[1]),
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[2]),
                    ],
                }, {
                    telemetryEvent: "solution-feedback-no",
                    msg: [
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[1]),
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[2]),
                    ],
                }],
                हां: [{
                    telemetryEvent: "solution-feedback-yes",
                    msg: (locale: string) => localizer(locale, replies.solnFeedbackYes.feed1),
                }, {
                    telemetryEvent: "solution-feedback-yes",
                    msg: [
                        (locale: string) => localizer(locale, replies.solnFeedbackYes.feed2),
                        (locale: string, params?: any) => localizer(locale, replies.solnFeedbackYes.feed3, params),
                    ],
                }, {
                    telemetryEvent: "solution-feedback-yes",
                    msg: [
                        (locale: string) => localizer(locale, replies.solnFeedbackYes.feed2),
                    ],
                }, {
                    telemetryEvent: "solution-feedback-yes",
                    msg: (locale: string) => localizer(locale, replies.solnFeedbackYes.feed2),
                }],
                नहीं: [{
                    telemetryEvent: "solution-feedback-no",
                    msg: (locale: string, params?: any) => localizer(locale, replies.solnFeedbackNo.feed1, params),
                }, {
                    telemetryEvent: "solution-feedback-no",
                    msg: [
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[1]),
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[2]),
                    ],
                }, {
                    telemetryEvent: "solution-feedback-no",
                    msg: [
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[1]),
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[2]),
                    ],
                }, {
                    telemetryEvent: "solution-feedback-no",
                    msg: [
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[1]),
                        (locale: string) => localizer(locale, replies.solnFeedbackNo.feed2[2]),
                    ],
                }],
            },
            salutation: [
                ..._.times(5, () => ({
                    telemetryEvent: "salutation",
                    msg: [
                        async (locale: string, params: any) => `${(params.salutation && !params.salutation.startsWith("/")) ? params.salutation : "Hi"}! ${localizer(locale, replies.salutation.sal1[1])}`,
                        (locale: string) => localizer(locale, replies.salutation.sal1[2]),
                        (locale: string) => localizer(locale, replies.salutation.sal1[3]),
                    ],
                })),
                ..._.times(5, () => ({
                    telemetryEvent: "salutation",
                    msg: [
                        (locale: string) => localizer(locale, replies.salutation.sal2),
                    ],
                })), {
                    telemetryEvent: "salutation",
                    msg: (locale: string) => localizer(locale, replies.salutation.sal3),
                },
            ],
            randomMessageReply: [
                ..._.times(8, () => ({
                    telemetryEvent: "random",
                    msg: (locale: string) => localizer(locale, replies.randomMessageReply.r1),
                })),
                ..._.times(5, () => ({
                    telemetryEvent: "random",
                    msg: [
                        (locale: string) => localizer(locale, replies.randomMessageReply.r2),
                    ],
                })), {
                    telemetryEvent: "random",
                    msg: (locale: string) => localizer(locale, replies.randomMessageReply.r3),
                },
            ],
            facts: [
                ..._.times(5, () => ({
                    telemetryEvent: "facts",
                    msg: async (params: any) => {
                        const fact = await params.condition(params.factsEntityId, params.studentId);
                        if (!fact) {
                            return;
                        }
                        return {
                            media: fact,
                            caption: "#fact",
                        };
                    },
                })), {
                    telemetryEvent: "facts",
                    msg: (locale: string) => localizer(locale, replies.facts),
                },
            ],
            longText: {
                telemetryEvent: "long-text",
                msg: (locale: string) => localizer(locale, replies.longText),
                retries: [{
                    telemetryEvent: "long-text-retry",
                    msg: (locale: string) => localizer(locale, replies.longTextRetry),
                }],
            },
            longTextTrue: {
                yes: {
                    telemetryEvent: "long-text-true",
                },
                हां: {
                    telemetryEvent: "long-text-true",
                },
            },
            longTextFalse: {
                no: {
                    telemetryEvent: "long-text-false",
                    msg: (locale: string) => localizer(locale, replies.longTextFalse),
                },
                नहीं: {
                    telemetryEvent: "long-text-false",
                    msg: (locale: string) => localizer(locale, replies.longTextFalse),
                },
            },
            contextImage: {
                telemetryEvent: "context-image",
                msg: (locale: string) => localizer(locale, replies.contextImage),
                retries: [{
                    telemetryEvent: "context-image-retry",
                    msg: (locale: string) => localizer(locale, replies.contextImageRetry),
                }],
            },
            contextImageCourse: {
                course: {
                    telemetryEvent: "context-image-course",
                },
                कोर्स: {
                    telemetryEvent: "context-image-course",
                },
            },
            contextImageQuestion: {
                question: {
                    telemetryEvent: "context-image-question",
                },
                सवाल: {
                    telemetryEvent: "context-image-question",
                },
            },
            solnPdf: {
                telemetryEvent: "pdf-message",
                type: "document",
            },
            pdfSuccess: {
                telemetryEvent: "pdf-success",
                msg: [
                    (locale: string) => localizer(locale, replies.pdfSuccess[1]),
                    (locale: string) => localizer(locale, replies.pdfSuccess[2]),
                ],
            },
            pdfFailure: {
                telemetryEvent: "pdf-failure",
                msg: [
                    (locale: string) => localizer(locale, replies.pdfFailure[1]),
                    (locale: string) => localizer(locale, replies.pdfFailure[2]),
                    (locale: string) => localizer(locale, replies.pdfFailure[3]),
                ],
            },
            talkToAgent: {
                telemetryEvent: "talk-to-agent",
                msg: async (locale: string, params: any) => {
                    params.condition(params.source, params.phone, params.studentId, params.text);
                    return localizer(locale, replies.talkToAgent);
                },
            },
            questionPuchoContest: {
                telemetryEvent: "question-pucho-contest",
                msg: async (locale: string, params: any) => {
                    const c1 = params.dailyCountData[module.exports.settings.ContextType.ASK] || 0;
                    const c2 = params.dailyCountData[module.exports.settings.ContextType.ASK_TEXT] || 0;
                    if (c1 + c2 > 2) {
                        return;
                    }
                    return {
                        caption: localizer(locale, replies.questionPuchoContest.caption),
                        media: localizer(locale, replies.questionPuchoContest.media),
                        mediaType: "image",
                    };
                },
                delay: 21000,
            },
            vendorAdvertisementPostAnswer: {
                telemetryEvent: "dn-vendor-advertisement",
                msg: async (locale: string, params: any) => ({
                    caption: localizer(locale, replies.vendorAdvertisementPostAnswer.caption, { caption: params.caption }),
                    media: localizer(locale, replies.vendorAdvertisementPostAnswer.media, { bannerUrl: params.bannerUrl, studentId: params.studentId }),
                    mediaType: "image",
                }),
                delay: 21000,
            },
            home: {
                telemetryEvent: "home",
                delay: 22000,
                msg: (locale: string) => localizer(locale, replies.home),
            },
            dailyQuizTimeUp: {
                telemetryEvent: "daily-quiz-time-up",
                msg: "<strong>❗❗TIMES UP❗❗</strong>\n<strong>STOP!!!!! STOP!!!!!! STOP!!!!!!!!!🛑</strong>\nDaily Quiz Contest ke batch-{{batch_id}} ka time⏱️ ab khatam ho gaya hai.\nIsske baad diye gaye koi bhi jawab maanye❌ nahi honge.\nAapko aaj raat 10:00 baje result ka message aa jayega.📚",
            },
            homeDailyQuiz: {
                telemetryEvent: "home-daily-quiz",
                delay: 2000,
                msg: {
                    text: "Neeche👇 home button par click✅ karke aap\n1️⃣ <strong>Question❓ puchhna</strong> jaari rakh sakte hain\n2️⃣ Apni knowledge📚 test karne ke liye <strong>quiz✏️ khel sakte</strong> hain\n3️⃣ <strong>Daily Quiz Contest</strong> ke liye register kar sakte hain",
                    footer: "Neeche home button par click karke chat restart karein",
                    replyType: "BUTTONS",
                    action: {
                        buttons: [
                            { type: "reply", reply: { id: "1", title: "Home" } },
                        ],
                    },
                },
            },
            beforeTimeDailyQuiz: {
                loop: {
                    telemetryEvent: "before-time-daily-quiz-loop",
                    msg: {
                        text: "👋Hello Student\n\nAbhi Daily Quiz Contest start hone mein time hai.\n\nNeeche Start Quiz Contest button ko click karke aap quiz start kar sakte hain👇",
                        footer: "Neeche diye Start Quiz button ko click kar quiz start karein",
                        replyType: "BUTTONS",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Start Quiz Contest" } },
                                { type: "reply", reply: { id: "2", title: "Home" } },
                            ],
                        },
                    },
                },
                alreadyRegistered: {
                    telemetryEvent: "before-time-daily-quiz-already-registered",
                    msg: {
                        text: "👋Hello Student\nAbhi Daily Quiz Contest(batch {{batch_id}}) start hone mein time hai.\n\nHum <strong>aapko {{quiz_reminder_time}}</strong> par quiz start hone ka <strong>reminder</strong> 📝 bhej denge\n\nAdhik jaankari ke liye Click on the Link👇\nhttps://app.doubtnut.com/whatsapp-daily-quiz-contest",
                        footer: "Neeche home button par click karke chat restart karein",
                        replyType: "BUTTONS",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Home" } },
                            ],
                        },
                    },
                },
                notRegistered: {
                    telemetryEvent: "before-time-daily-quiz-not-registered",
                    msg: {
                        text: "👋Hello Student\n\nAbhi Daily Quiz Contest start hone mein time hai.\nAgar aapne {{quiz_date}} ko hone wale Daily Quiz Contest ke liye abhi tak Register nahi kiya hai toh jaldi register✅ kar lijiye.",
                        footer: "Neeche Play quiz contest button par clickkar register karein",
                        replyType: "BUTTONS",
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "1", title: "Play Quiz Contest" } },
                                { type: "reply", reply: { id: "2", title: "Home" } },
                            ],
                        },
                    },
                },
            },
            alreadySubmittedDailyQuiz: {
                telemetryEvent: "already-submitted-daily-quiz",
                msg: {
                    text: "👋Hello Student\n{{quiz_date}} ko hone wala Daily Quiz Contest aap <strong>successfully</strong> ✅ <strong>complete</strong> kar chuke hain.\nAaj ke Daily Quiz Contest ke results 10:00PM par Whatsapp par announce kiye jayenge.\n\n{{quiz_date_registration}} ko hone wali Daily Quiz Contest ke liye abhi <strong>Register karein</strong>✅",
                    footer: "Neeche Play quiz contest button par clickkar register karein",
                    replyType: "BUTTONS",
                    action: {
                        buttons: [
                            { type: "reply", reply: { id: "1", title: "Play Quiz Contest" } },
                            { type: "reply", reply: { id: "2", title: "Home" } },
                        ],
                    },
                },
            },
            qaLengthShort: {
                telemetryEvent: "qa-length-short",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaLengthShort),
            },
            qaHandwritten: {
                telemetryEvent: "qa-handwritten",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaHandwritten),
            },
            qaHandwrittenLengthShort: {
                telemetryEvent: "qa-handwritten-length-short",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaHandwrittenLengthShort),
            },
            qaBlur: {
                telemetryEvent: "qa-blur",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaBlur),
            },
            qaBlurLengthShort: {
                telemetryEvent: "qa-blur-length-short",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaBlurLengthShort),
            },
            qaHandwrittenBlur: {
                telemetryEvent: "qa-handwritten-blur",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaHandwrittenBlur),
            },
            qaHandwrittenBlurLengthShort: {
                telemetryEvent: "qa-handwritten-blur-length-short",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaHandwrittenBlurLengthShort),
            },
            qaHandwrittenNoSolution: {
                telemetryEvent: "qa-handwritten-no-solution",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaHandwrittenNoSolution),
            },
            qaBlurNoSolution: {
                telemetryEvent: "qa-blur-no-solution",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaBlurNoSolution),
            },
            qaHandwrittenBlurNoSolution: {
                telemetryEvent: "qa-handwritten-blur",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaHandwrittenBlurNoSolution),
            },
            qaCrop: {
                telemetryEvent: "qa-crop",
                delay: 2000,
                msg: (locale: string) => localizer(locale, replies.qaCrop),
            },
            noSolution: {
                telemetryEvent: "no-solution",
                delay: 1000,
                msg: (locale: string) => localizer(locale, replies.noSolution),
            },
            exactSolution: {
                telemetryEvent: "exact-solution",
                delay: 1500,
                msg: async (locale: string, params: any) => {
                    const url = params.url || params.webUrl;
                    const caption = params.resourceType === "video" ? localizer(locale, replies.exactSolution.video, {url}) : localizer(locale, replies.exactSolution.text, {url});
                    if (params.imageUrl) {
                        return {
                            media: params.imageUrl,
                            caption,
                            footer: localizer(locale, replies.exactSolution.video),
                            mediaType: "image",
                        };
                    }
                    return caption;
                },
                preview: true,
            },
            searchingForFreeClassVideo: {
                telemetryEvent: "free-class-video",
                delay: 0,
                msg: (locale: string, params: any) => localizer(locale, replies.searchingForFreeClassVideo, { selected_class: params.selected_class, selected_language: params.selected_language, selected_subject: params.selected_subject, selected_chapter: params.selected_chapter }),
            },
            freeClassVideo: {
                telemetryEvent: "searching-for-free-video",
                delay: 0,
                msg: (locale: string, params: any) => ({
                        caption: localizer(locale, replies.freeClassVideo.caption, {video_title: params.video_title, video_link: params.video_link}),
                        media: localizer(locale, replies.freeClassVideo.media, {question_id: params.question_id}),
                        payload: localizer(locale, replies.freeClassVideo.payload),
                    }),
            },
            doubtCharchaResponse: {
                telemetryEvent: "doubt-charcha-response",
                delay: 0,
                msg: (locale: string, params: any) => localizer(locale, replies.doubtCharchaResponse, {response: params.response}),
            },
        },
    },
};

export = WhatsappSettingsService;
