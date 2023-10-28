"use strict";

import DbService from "dn-moleculer-db";
import * as _ from "lodash";
import Sequelize from "sequelize";
import {adapter} from "../config";
import {walletMysql} from "../helper/wallet.mysql";
import {walletUtil} from "../helper/wallet.util";

const modelAttributes: Sequelize.ModelAttributes = {
    id: {type: Sequelize.INTEGER, primaryKey: true},
    title: {type: Sequelize.TEXT({length: "long"})},
    options: {type: Sequelize.TEXT({length: "long"})},
    tags: {type: Sequelize.STRING(255)},
};

// @ts-ignore
module.exports = {
    name: "wallet",
    version: 1,
    mixins: [DbService],
    adapter,
    model: {
        name: "wallet_summary",
        define: modelAttributes,
        options: {
            paranoid: true,
            underscored: true,
            freezeTableName: true,
        },
    },
    settings: {
        wallet_hi: {
            total_amount: {
                name: "कुल उपलब्ध राशि",
                value: "₹",
            },
            cash_amount: {
                name: "नकद राशि",
                value: "₹",
                tooltip_text: "कैश बैलेंस वो कैश है जो आप अपने Doubtnut वॉलेट में खुद से ऐड करा है! ये आपको Doubtnut पे किसी भी प्रोग्राम से नहीं मिला है! ",

            },
            reward_amount: {
                name: "इनाम राशि",
                value: "₹",
                tooltip_text: "DN रिवॉर्ड कैश वो पैसा है जो आपको खेलो एंड जीतो, डेली अटेंडेंस रिवॉर्ड या बाकी रिवॉर्ड प्रोग्राम से ऍप पे मिला है! आप हमेश इसका कुछ भाग ऍप पे ख़रीददारी के लिए उसे कर सकते हैं!",
            },
        },

        wallet_hi_expiry: {
            total_amount: {
                name: "कुल उपलब्ध राशि",
                value: "₹",
            },
            list: [{
                name: "नकद राशि",
                type: "cash_wallet",
                value: "₹",
                tooltip_text: "Cash Balance in DN Wallet vo cash amount hai jo aapne khudse DN wallet mein add kiya hai and aapko kisi bhi DN program/initiative se nhi mila hai",
            }, {
                name: "इनाम राशि",
                value: "₹",
                type: "reward_wallet",
                tooltip_text: "DN Reward Cash vo amount he jo aapne Khelo & Jeeto, Daily Attendance Reward System and other Reward system se jeeta hai app pe. Aap iska kucch part app pe kucch bhi purchase karne ke liye use kar sakte hein",
                list: [],

            }],
        },
        wallet_en: {
            total_amount: {
                name: "Total Available Balance",
                value: "₹",
            },
            cash_amount: {
                name: "Cash Balance",
                value: "₹",
                tooltip_text: "Cash Balance in DN Wallet vo cash amount hai jo aapne khudse DN wallet mein add kiya hai and aapko kisi bhi DN program/initiative se nhi mila hai",
            },
            reward_amount: {
                name: "DN Reward Cash",
                value: "₹",
                tooltip_text: "DN Reward Cash vo amount he jo aapne Khelo & Jeeto, Daily Attendance Reward System and other Reward system se jeeta hai app pe. Aap iska kucch part app pe kucch bhi purchase karne ke liye use kar sakte hein",
            },
        },

        wallet_en_expiry: {
            total_amount: {
                name: "Total Available Balance",
                value: "₹",
            },
            list: [{
                name: "Cash Balance",
                type: "cash_wallet",
                value: "₹",
                tooltip_text: "Cash Balance in DN Wallet vo cash amount hai jo aapne khudse DN wallet mein add kiya hai and aapko kisi bhi DN program/initiative se nhi mila hai",
            }, {
                name: "DN Reward Cash",
                value: "₹",
                type: "reward_wallet",
                tooltip_text: "DN Reward Cash vo amount he jo aapne Khelo & Jeeto, Daily Attendance Reward System and other Reward system se jeeta hai app pe. Aap iska kucch part app pe kucch bhi purchase karne ke liye use kar sakte hein",
                list: [],

            }],
        },
        wallet_reward_expiry_tomorrow_en: {
            name: "Reward cash expiring today",
            value: "₹",
            value_hex: "#eb2c2c",
            type: "reward_expiry",
            tooltip_text: "Yeh woh reward cash hai jo kal expire ho raha hai. Daily Attendance, Khelo Jeeto and Daily goal se jeeta reward cash limited time ke liye valid hota hai and uske baad expire ho jaata hai. Har reward cash ki expiry details aap View Payment History me check kar sakte hain.",
        },
        wallet_reward_expiry_15_en: {
            name: "Reward Cash expiring in next 15 Days",
            value: "₹",
            value_hex: "#eb2c2c",
            type: "reward_expiry",
            tooltip_text: "Yeh woh total reward cash hai jo 15 days baad expire ho raha hai. Daily Attendance, Khelo Jeeto and Daily goal se jeeta reward cash limited time ke liye valid hota hai and uske baad expire ho jaata hai. Har reward cash ki expiry details aap View Payment History me check kar sakte hain.",
        },
        wallet_reward_expiry_tomorrow_hi: {
            name: "आज खत्म हो रहा रिवॉर्ड कैश",
            value: "₹",
            value_hex: "#eb2c2c",
            type: "reward_expiry",
            tooltip_text: "ये वो रिवॉर्ड कैश है जो कल एक्सपायर हो रहा है। डेली अटेंडेंस, खेलो जीतो और डेली गोल से जीता रिवॉर्ड कैश लिमिटेड टाइम के लिए वैध होता है और उसके बाद एक्सपायर हो जाता है। हर रिवॉर्ड कैश की एक्सपायरी डिटेल्स आप पेमेंट हिस्ट्री देखें मैं चेक कर सकता हैं।",
        },
        wallet_reward_expiry_15_hi: {
            name: "अगले 15 दिनों में खत्म हो रहा रिवॉर्ड कैश",
            value: "₹",
            value_hex: "#eb2c2c",
            type: "reward_expiry",
            tooltip_text: "ये वो टोटल रिवॉर्ड कैश है जो 15 दिन बाद एक्सपायर हो रहा है। डेली अटेंडेंस, खेलो जीतो और डेली गोल से जीता रिवॉर्ड कैश लिमिटेड टाइम के लिए वैध होता है और उसके बाद एक्सपायर हो जाता है। हर रिवॉर्ड कैश की एक्सपायरी डिटेल्स आप पेमेंट हिस्ट्री देखें मैं चेक कर सकता हैं।",
        },
        vpa_hi: {
            title: "NEFT, RTGS और IMPS अब उपलब्ध",
            image_url: "https://d10lpgp6xz60nq.cloudfront.net/images/payment/vba_icon.webp",
            hyper_text: "NEW",
            image_ratio: "1:1",
            is_collapsed: true,
            account: {
                description: "किसी भी बैंक अकाउंट से पैसे ट्रांसफर करें अपने DN Wallet में।\nआपकी अकाउंट डीटेल्स हैं:",
                details: [
                    {name: "A/c No", value: ""},
                    {name: "IFSC", value: ""},
                    {name: "Name", value: "Doubtnut"},
                ],
                btn_image_url: "https://d10lpgp6xz60nq.cloudfront.net/images/payment/wa_icon.webp",
                btn_text: "डिटेल भेजें",
                wa_details: "",
            },
        },
        vpa_en: {
            title: "NEFT, RTGS aur IMPS now available",
            image_url: "https://d10lpgp6xz60nq.cloudfront.net/images/payment/vba_icon.webp",
            hyper_text: "NEW",
            image_ratio: "1:1",
            is_collapsed: true,
            account: {
                description: "Kisi bhi bank account se paise transfer karein apne DN Wallet mein.\nAapki account details hain:",
                details: [
                    {name: "A/c No", value: ""},
                    {name: "IFSC", value: ""},
                    {name: "Name", value: "Doubtnut"},
                ],
                btn_image_url: "https://d10lpgp6xz60nq.cloudfront.net/images/payment/wa_icon.webp",
                btn_text: "Share Details",
                wa_details: "",
            },
        },
        faq_en: [
            // To add video + text type FAQ for video only send empty answer field
            // {
            //     id: 4,
            //     bucket: "payment_help_wallet",
            //     question: "What is Khelo Aur Jeeto?",
            //     type: "video",
            //     answer: "Khelo Aur Jeeto is a quiz based game where you can play with a friend or other random users. You can also select the topic you want to play the game on.",
            //     question_id: 643414790,
            //     thumbnail: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/F714F8D4-D3A4-7EC6-4E0D-00BAEE5F7592.webp",
            //     video_orientation: "portrait",
            //     priority: 4,
            //     video_resources: [
            //         {
            //             resource: "https://d3cvwyf9ksu0h5.cloudfront.net/answer-1617517039.mp4",
            //             timeout: 4,
            //             drm_scheme: "widevine",
            //             media_type: "BLOB",
            //             drop_down_list: [],
            //             drm_license_url: "",
            //             offset: null,
            //         },
            //     ],
            //     page: "WALLET_FAQ",
            //     video_icon_url: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/38F31752-0875-3174-AF05-D9559D4F4ECB.webp",
            //     is_expand: false,
            // },

            {
                id: 1,
                bucket: "payment_help_wallet",
                question: "DN Wallet kya he?",
                type: "text",
                answer: "DN Wallet paytm ki tarah hi ek wallet he. Isme aap money daalke Doubtnut pe apne favourite courses quickly buy kar sakte he.",
                question_id: null,
                thumbnail: null,
                video_orientation: "portrait",
                priority: 1,
                video_resources: [],
                page: "WALLET_FAQ",
                video_icon_url: null,
                is_expand: false,
            },
            {
                id: 2,
                bucket: "payment_help_wallet",
                question: "Kya ye amount apne bank account me transfer kar sakta hun?",
                type: "text",
                answer: "Nahi. Ye amount aap apne bank account me withdraw/transfer nahi kar sakte.",
                question_id: null,
                thumbnail: null,
                video_orientation: "portrait",
                priority: 2,
                video_resources: [],
                page: "WALLET_FAQ",
                video_icon_url: null,
                is_expand: false,
            },
            {
                id: 3,
                bucket: "payment_help_wallet",
                question: "Kya meri payment refundable hai?",
                type: "text",
                answer: "Nahi.",
                question_id: null,
                thumbnail: null,
                video_orientation: "portrait",
                priority: 3,
                video_resources: [],
                page: "WALLET_FAQ",
                video_icon_url: null,
                is_expand: false,
            },
            {
                id: 4,
                bucket: "payment_help_wallet",
                question: "Agar mai payment karta huh toh kya hoga?",
                type: "text",
                answer: "Payment karne ke baad aapke DN Wallet me money add hoajega.",
                question_id: null,
                thumbnail: null,
                video_orientation: "portrait",
                priority: 4,
                video_resources: [],
                page: "WALLET_FAQ",
                video_icon_url: null,
                is_expand: false,
            },
            {
                id: 5,
                bucket: "payment_help_wallet",
                question: "Mai kis kis payment mode se payment kar sakta huh?",
                type: "text",
                answer: "Hum sabhi major payment mode accept karte hai jaise Google Pay, PayTm, PhonePe, Internet. Banking, Credit Card, UPI, etc",
                question_id: null,
                thumbnail: null,
                video_orientation: "portrait",
                priority: 5,
                video_resources: [],
                page: "WALLET_FAQ",
                video_icon_url: null,
                is_expand: false,
            },
            {
                id: 6,
                bucket: "payment_help_wallet",
                question: "Payment Help Mail ID",
                type: "text",
                answer: "payments@doubtnut.com",
                question_id: null,
                thumbnail: null,
                video_orientation: "portrait",
                priority: 6,
                video_resources: [],
                page: "WALLET_FAQ",
                video_icon_url: null,
                is_expand: false,
            },
            {
                id: 7,
                bucket: "payment_help_wallet",
                question: "Meri payment kat gayi hai. Mere paise kitne dino mai refund honge?",
                type: "text",
                answer: "Payment refund hone mai normally 5-7 business days lagte hai. But aapki payment 1 din mai bhi refund ho sakti hai.",
                question_id: null,
                thumbnail: null,
                video_orientation: "portrait",
                priority: 7,
                video_resources: [],
                page: "WALLET_FAQ",
                video_icon_url: null,
                is_expand: false,
            },
        ],
    },
    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {

        walletPageInfo: {
            rest: {
                method: "GET",
                path: "/info",
            },
            params: {},
            // eslint-disable-next-line max-lines-per-function
            async handler(ctx: any) {

                const locale = ctx.meta.user.locale;
                const versionCode = ctx.meta.versionCode;
                const response = walletUtil.responseTemplate();

                // eslint-disable-next-line id-blacklist
                const studentId: any = ctx.meta !== undefined && ctx.meta.user !== undefined ? ctx.meta.user.id : ctx.params.student_id;

                const [walletSummary, help] = await Promise.all([
                    this.getWalletInfo(ctx),
                    walletMysql.getNameAndValueByBucket(this.adapter.db, "payment_help_wallet"),
                ]);

                const payment_help: any = {};
                payment_help.title = "FAQs";
                if (versionCode > 943) {
                    payment_help.faq_list = JSON.parse(JSON.stringify(this.settings.faq_en));
                } else {
                    payment_help.list = help;
                }

                let walletObj: any = {};
                let vpaObj: any = {};

                if (versionCode < 939) {
                    if (locale === "hi") {
                        walletObj = JSON.parse(JSON.stringify(this.settings.wallet_hi));
                    } else {
                        walletObj = JSON.parse(JSON.stringify(this.settings.wallet_en));
                    }

                    walletObj.cash_amount.value += walletSummary.cash_amount;
                    walletObj.reward_amount.value += walletSummary.reward_amount;
                } else {
                    if (locale === "hi") {
                        walletObj = JSON.parse(JSON.stringify(this.settings.wallet_hi_expiry));
                    } else {
                        walletObj = JSON.parse(JSON.stringify(this.settings.wallet_en_expiry));
                    }

                    // cash balance
                    walletObj.list[0].value += walletSummary.cash_amount;
                    // reward balance
                    walletObj.list[1].value += walletSummary.reward_amount;

                    // expiring reward balances
                    const [rewardExpiringTomorrow, rewardExpiringIn15days] = await Promise.all([await walletMysql.getRewardsExpiringByDate(this.adapter.db, {
                        student_id: studentId,
                        expiry: walletUtil.toIST().format("YYYY-MM-DD"),
                    }), await walletMysql.getRewardsExpiringWithinDate(this.adapter.db, {
                        student_id: studentId,
                        expiry: walletUtil.toIST().add(15, "days").format("YYYY-MM-DD"),
                        start: walletUtil.toIST().add(1, "days").format("YYYY-MM-DD"),
                    })]);

                    if (rewardExpiringTomorrow.length && rewardExpiringTomorrow[0].amount > 0) {
                        let expObj;
                        if (locale === "hi") {
                            expObj = JSON.parse(JSON.stringify(this.settings.wallet_reward_expiry_tomorrow_hi));
                        } else {
                            expObj = JSON.parse(JSON.stringify(this.settings.wallet_reward_expiry_tomorrow_en));
                        }

                        expObj.value += rewardExpiringTomorrow[0].amount;
                        walletObj.list[1].list.push(expObj);
                    }

                    if (rewardExpiringIn15days.length && rewardExpiringIn15days[0].amount > 0) {
                        let expObj;
                        if (locale === "hi") {
                            expObj = JSON.parse(JSON.stringify(this.settings.wallet_reward_expiry_15_hi));
                        } else {
                            expObj = JSON.parse(JSON.stringify(this.settings.wallet_reward_expiry_15_en));
                        }

                        expObj.value += rewardExpiringIn15days[0].amount;
                        walletObj.list[1].list.push(expObj);
                    }

                }

                walletObj.total_amount.value += walletSummary.amount;

                if (locale === "hi") {
                    vpaObj = JSON.parse(JSON.stringify(this.settings.vpa_hi));
                } else {
                    vpaObj = JSON.parse(JSON.stringify(this.settings.vpa_en));
                }

                if (versionCode >= 935 && versionCode < 939) {
                    const vpaSummary = await this.getVpaDetails(ctx);

                    if (!_.isEmpty(vpaSummary)) {
                        vpaObj.account.details[0].value = vpaSummary.account_number;
                        vpaObj.account.details[1].value = vpaSummary.ifsc;
                        vpaObj.account.details[2].value = vpaSummary.name;
                        vpaObj.account.wa_details = `A/c No: ${vpaSummary.account_number}\nIFSC: ${vpaSummary.ifsc}\nName: ${vpaSummary.name}`;
                    }
                }
                if (versionCode >= 939) {
                    delete vpaObj.account;
                }
                const responseData: any = {
                    wallet: walletObj,
                    payment_help,
                    walletSummary,
                    vpa_obj: vpaObj,
                    /* banners : [
                      {
                        type: "APB",
                        deeplink: "",
                        banner_image_url: "https://d10lpgp6xz60nq.cloudfront.net/apb/apb_pay_in_cash_rectangle.webp",
                      },
                    ],*/
                };


                response.data = responseData;
                return response;

            },

        },
    },
    /**
     * Methods
     */
    methods: {
        async getWalletInfo(ctx: any) {
            // eslint-disable-next-line id-blacklist
            const studentId: any = ctx.meta !== undefined && ctx.meta.user !== undefined ? ctx.meta.user.id : ctx.params.student_id;
            await walletUtil.adjustWallet(this.adapter.db, studentId);

            const walletSummary: any = await walletMysql.getWalletSummary(this.adapter.db, studentId);

            if (_.isEmpty(walletSummary) || walletSummary.length === 0) {
                await walletMysql.createWalletSummary(this.adapter.db, studentId);
                return {amount: "0.00", cash_amount: "0.00", reward_amount: "0.00", is_active: 1};
            }
            walletSummary[0].amount = (parseFloat(walletSummary[0].cash_amount) + parseFloat(walletSummary[0].reward_amount)).toFixed(2);
            return walletSummary[0];
        },

        async getVpaDetails(ctx: any) {
            // eslint-disable-next-line id-blacklist
            const studentId: any = ctx.meta !== undefined && ctx.meta.user !== undefined ? ctx.meta.user.id : ctx.params.student_id;
            const [studentDetails, activeVPA] = await Promise.all([
                walletMysql.getStudentById(this.adapter.db, studentId),
                walletMysql.getActiveVPAByStudentId(this.adapter.db, studentId),
            ]);

            const rzpVbaObj = {
                description: `Payment for ${studentDetails[0].mobile} | DN Wallet`,
                mobile: `${studentDetails[0].mobile}`,
            };
            let vba_obj;
            let razorpayResponse;

            if (activeVPA.length) {
                vba_obj = {
                    id: activeVPA[0].id,
                    account_number: activeVPA[0].account_number,
                    ifsc: activeVPA[0].ifsc_code,
                    // upi: activeVPA[0].upi_id,
                    bank_name: activeVPA[0].bank_name,
                    name: "Doubtnut",
                };
            } else {
                razorpayResponse = await walletUtil.createVPA(rzpVbaObj);
                razorpayResponse = JSON.parse(razorpayResponse);
                if (razorpayResponse.receivers) {
                    vba_obj = {
                        account_number: razorpayResponse.receivers[0].account_number,
                        ifsc: razorpayResponse.receivers[0].ifsc,
                        bank_name: razorpayResponse.receivers[0].bank_name,
                        name: razorpayResponse.receivers[0].name,
                        // upi: razorpayResponse.receivers[1].address,
                    };
                    const smartCollectResponse = await walletMysql.setPaymentInfoSmartCollect(this.adapter.db, {
                        student_id: studentId,
                        virtual_account_id: razorpayResponse.id,
                        account_number: razorpayResponse.receivers[0].account_number,
                        ifsc_code: razorpayResponse.receivers[0].ifsc,
                        // upi_id: razorpayResponse.receivers[1].address,
                        bank_name: razorpayResponse.receivers[0].bank_name,
                        is_active: 1,
                        created_by: "system",
                    });
                    vba_obj.id = smartCollectResponse.insertId;
                } else {
                    vba_obj = {};
                }
            }
            return vba_obj;
        },
    },
};
