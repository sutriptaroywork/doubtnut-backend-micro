export default {
    dnrLogo: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",

    earned_title: {
        en: "Earned",
        hi: "कमाए",
    },
    layout_config: {
        margin_top: 20,
        margin_bottom: 0,
        margin_left: 16,
        margin_right: 16,
    },
    viewAll: {
        en: "View All",
        hi: "सभी को देखें",
    },
    viewHistory: {
        en: "View History",
        hi: "सभी को देखें",
    },
    earnHistory: {
        deeplink: "doubtnutapp://dnr/widgets?screen=earned_history",
        noActivityWidget: {
            widget_type: "widget_dnr_no_earned_history",
            widget_data: {
                title: null,
                title_color: "#2f2f2f",
                subtitle: "",
                subtitle_color: "#2f2f2f",
                description: "",
                description_color: "#54138a",
                earned_title: "",
                dnr: 0,
                created_at: null,
                is_new_week: false,
                dnr_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",
            },
        },
        appNotOpenTransaction: {
            subtitle: {
                en: "App not opened - streak broken",
                hi: "ऐप नहीं खोली गई - स्ट्रीक टूट गई",
            },
            description: {
                en: "You just missed on 100 DNR to earn and also many gift vouchers, coupons and other rewards",
                hi: "आपने अभी-अभी 100 DNR, कई गिफ्ट वाउचर, कूपन और अन्य पुरस्कार कमाने का मौका गंवा दिया है",
            },
        },
        appNotOpenMultipleTransaction: {
            subtitle: {
                en: "You did not open the app for {days} days",
                hi: "आपने ऐप को {days} दिनों तक नहीं खोला",
            },
            description: {
                en: "You just missed on Doubtnut Rupya rewards. To earn and gift vouchers, coupons and other rewards start coming to Doubtnut app daily",
                hi: "आप अभी-अभी डाउटनट रूपया पुरस्कारों से चूक गए हैं। कमाने और उपहार देने के लिए वाउचर, कूपन और अन्य पुरस्कार प्रतिदिन Doubtnut ऐप पर आने लगते हैं",
            },
        },

        appOpenTransaction: {
            subtitle: {
                en: "App opened but no activity",
                hi: "ऐप खोली गई, लेकिन कोई गतिविधि नहीं",
            },
        },

        transactionWidget: {
            widget_type: "widget_dnr_earned_history_item",
            widget_data: {
                title: null,
                title_size: 14,
                title_color: "#808080",
                dnr: 0,
                dnr_color: "#541488",
                dnr_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",
                is_new_week: false,
            },
        },

        totalContainer: {
            title: {
                en: "Total Rupya Earned",
                hi: "कुल रुपया कमाया",
            },
            widget: {
                title: "Total Rupya Earned",
                title_size: 16,
                dnr: 0,
                dnr_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",
            },
        },

        no_widget_container: {
            en: {
                title: "You don't have any earned history",
                subtitle: "",
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/13095E27-4352-40A7-A295-C6AF9AB53FE0.webp",
            },
            hi: {
                title: "आपका कोई अर्जित इतिहास नहीं है",
                subtitle: "",
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/13095E27-4352-40A7-A295-C6AF9AB53FE0.webp",
            },
        },
    },

    milestoneScreen: {
        title: {
            en: "Earn Doubtnut Rupya",
            hi: "डाउटनट रूपया कमाएं",
        },
        deeplink: "doubtnutapp://dnr/widgets?screen=earn_summary",
        earnHistory: {
            title: {
                en: "Earned Rupya History",
                hi: "कमाए गए DNR की हिस्ट्री",
            },
            subtitle: {
                en: "Week: ",
                hi: "सप्ताह: ",
            },
        },
        milestoneWidget: {
            widget_type: "widget_dnr_reward_detail",
            widget_data: {
                title: null,
                title_color: "#808080",
                dnr_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",
                dnr: 0,
                dnr_color: "#541488",
                dnr_unit: "DNR",
                dnr_unit_color: "#541488",
                background_color: "#EDEDED",
                deeplink: null,
                is_conditional_milestone: false,
                milestone_type: "",
                rank: 0,
            },
            layout_config: {
                margin_top: 0,
                margin_bottom: 15,
                margin_left: 15,
                margin_right: 15,
            },
        },
        earnedSummary: {
            today_title: {
                en: "Today’s Earning",
                hi: "आज की कमाई",
            },
            total_title: {
                en: "Total Doubtnut Rupya",
                hi: "कुल डाउटनट रुपया",
            },
            widget: {
                widget_type: "widget_dnr_earned_history_summary",
                widget_data: {
                    today_dnr_data: {
                        title: "",
                        title_color: "#ffffff",
                        dnr: 0,
                    },
                    total_dnr_data: {
                        title: "",
                        title_color: "#ffffff",
                        dnr: 0,
                    },
                    background_color: "#7379f8",
                    dnr_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 15,
                    margin_left: 15,
                    margin_right: 15,
                },
            },
        },
        achievedMilestoneHeading: {
            en: "Today’s Activity Details for DNR",
            hi: "DNR की आज की गतिविधियों का जानकारी",
        },
        earnedRupyaHistoryWidget: {
            widget_type: "widget_dnr_reward_history",
            widget_data: {
                title: null,
                title_color: "#2F2F2F",
                title_text_size: 20,
                subtitle: null,
                subtitle_color: "#2F2F2F",
                dnr: 0,
                dnr_color: "#541488",
                dnr_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",
                background_color: "#EDEDED",
                deeplink: null,
                created_at: null,
                card_width: "2.7x",
            },
            layout_config: {
                margin_top: 0,
                margin_bottom: 0,
                margin_left: 4,
                margin_right: 4,
            },
        },
    },


    popUp: {
        cta: {
            en: {
                title: "Go to DN Rupya",
                deeplink: "doubtnutapp://dnr/home",
            },
            hi: {
                title: "DN रुपया में जाने के लिए यहाँ क्लिक करें",
                deeplink: "doubtnutapp://dnr/home",
            },
        },
        dialog_title: {
            en: "Earned {amount} DNR",
            hi: "कमाए {amount} DNR",
        },
        widget: {
            title: "",
            subtitle: "",
            dialog_title: "",
            duration: 5000,
            type: "",
            pop_up_count: 3,
            max_popup_count: null,
            cta: null,
            image: "",
            pop_up_image: "",
            no_max_limit_for_bottom_sheet: false,
        },
        weekly_streak: {
            title: {
                en: "7 day Streak Successful",
                hi: "7 दिन की सफल स्ट्रीक",
            },
            subtitle: {
                en: "You just earned {amount} DNR for successfully completing a weekly streak",
                hi: "साप्ताहिक स्ट्रीक को सफलतापूर्वक पूरा करने के लिए आपने अभी-अभी {amount} DNR कमाए हैं",
            },
            type: "weekly_streak",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/21C882C5-0858-EB16-6A04-C1D6D760E2E9.webp",
            pop_up_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/95A5AA5D-8457-39CD-B23A-152CCC0EB078.webp",
            max_popup_count: null,
            activity_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/D3CCB579-369A-F68C-1A13-FC213D0CC93F.webp",
        },
        q_ask: {
            title: {
                en: "You just cleared a doubt",
                hi: "आपने अभी-अभी एक डाउट क्लियर किया है",
            },
            subtitle: {
                en: "you just earned {amount} DNR for successfully completing watching solution of your doubt",
                hi: "आपने अपने डाउट का वीडियो सॉल्यूशन सफलतापूर्वक पूरा देखने पर {amount} DNR कमाए हैं",
            },
            type: "video_view",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/3646FC1B-0DF2-8DAB-4215-D81E75695E95.webp",
            pop_up_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/22CD1C3B-7687-6E20-69E4-A36072CDCE53.webp",
            max_popup_count: 5,
            activity_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/D2F1F62D-C30E-9DDB-354B-2083D96D5B8A.webp",
        },
        video_view: {
            title: {
                en: "You just completed watching a video",
                hi: "आपने अभी-अभी एक वीडियो पूरी देख ली है",
            },
            subtitle: {
                en: "You just earned {amount} DNR for successfully completing watching a Video",
                hi: "आपने सफलतापूर्वक एक विषय वीडियो पूरी देखने पर {amount} DNR कमाए हैं",
            },
            type: "video_view",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/82AC8728-E47A-52D0-19EF-C715D4229B91.webp",
            pop_up_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9702A324-CBC6-9B9D-07D9-A39506D48040.webp",
            max_popup_count: 5,
            activity_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/2021DE53-4B4B-3C0F-4A92-F47FF128973A.webp",
        },
        course_greater_500: {
            title: {
                en: "Course purchase successful",
                hi: "कोर्स की सफल खरीद",
            },
            subtitle: {
                en: "You just purchased a course greater than Rs.500 and in reward you get {amount} DNR",
                hi: "आपने अभी-अभी 500 रुपये से अधिक का कोर्स खरीदा है और इनाम में आपको {amount} DNR मिलता है",
            },
            type: "course_purchase",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/A1B6E7F0-EE60-D9F5-C8C2-9A9FBE95D4D3.webp",
            pop_up_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/73D2CA16-8DF9-A301-A84B-3766591C68F2.webp",
            max_popup_count: null,
            activity_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/09A6C7F4-32FE-5E6D-6A6F-D7C2FE40715D.webp",
        },
        course_less_500: {
            title: {
                en: "Course purchase successful",
                hi: "कोर्स की सफल खरीद",
            },
            subtitle: {
                en: "You just purchased a course less than Rs.500 and in reward you get {amount} DNR",
                hi: "आपने अभी-अभी 500 रुपये से कम का कोर्स खरीदा है और इनाम में आपको {amount} DNR मिलता है",
            },
            type: "course_purchase",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/A1B6E7F0-EE60-D9F5-C8C2-9A9FBE95D4D3.webp",
            pop_up_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/73D2CA16-8DF9-A301-A84B-3766591C68F2.webp",
            max_popup_count: null,
            activity_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/09A6C7F4-32FE-5E6D-6A6F-D7C2FE40715D.webp",
        },
        pdf_purchase: {
            title: {
                en: "PDF purchase successful",
                hi: "पीडीएफ खरीद सफल",
            },
            subtitle: {
                en: "You just earned {amount} DNR for purchasing a pdf",
                hi: "पीडीएफ खरीदने पर आपने अभी-अभी {amount} DNR कमाए हैं",
            },
            type: "pdf_purchase",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5062234E-5561-6D10-758A-FB4719B75EA0.webp",
            pop_up_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CF9988ED-AA65-8D34-51CA-22E55697BF51.webp",
            max_popup_count: null,
            activity_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/DA387B9F-55CD-815C-2C59-A81603E97062.webp",
        },
        study_group: {
            title: {
                en: "You sent 100 messages on Study Group",
                hi: "आपने स्टडी ग्रुप पर 100 मैसेज भेजे",
            },
            subtitle: {
                en: "You just earned {amount} DNR for sending 100 messages on study group and talked to friends",
                hi: "आपने स्टडी ग्रुप पर 100 भेजने और दोस्तों से बात करने पर अभी-अभी {amount} DNR कमाए हैं",
            },
            type: "study_group",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/96CD8ECE-63E3-BAAA-E429-8495AD334434.webp",
            pop_up_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/550A3B2F-0C87-1793-2770-2D11592F6642.webp",
            max_popup_count: null,
            activity_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/F731881B-C9B1-62B0-27BB-8CFC3866492B.webp",
        },
        signup: {
            title: {
                en: "Welcome to Doubtnut, You get a bonus",
                hi: "डाउटनट में आपका स्वागत है, आपको बोनस मिलता है",
            },
            subtitle: {
                en: "{amount} DN rupya added to your wallet as a joining bonus, you can use these to redeem gifts.",
                hi: "जोइनिंग बोनस के रूप में {amount} DN रुपया आपके वॉलेट में जोड़ा गया है| आप इनका उपयोग उपहारों को रिडीम करने के लिए कर सकते हैं",
            },
            type: "signup",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/A4D1E956-E1CE-803D-20EA-2D1C2E2B2333.webp",
            pop_up_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/A849E772-FAC6-343C-3D8F-B3E040C6D6FD.webp",
            max_popup_count: null,
        },
        referral_popup: {
            widget: {
                title: "",
                subtitle: "",
                dialog_title: "",
                duration: null,
                type: "",
                pop_up_count: 3,
                max_popup_count: null,
                cta: null,
                image: "",
                pop_up_image: "",
                no_max_limit_for_bottom_sheet: false,
            },
            friends:{
                en:"doston",
                hi:"दोस्तों",
                other:"friends",
            },
            invitee_title:{
                en:"xxnamexx ke maadhyam se aapaka refaral saphal raha",
                hi:"शिनाली के माध्यम से आपका रेफ़रल सफल रहा",
                other:"Your Referral via xxnamexx is Successful",
            },
            title :{
                en:"xxnamexx ke liye referral successful raha",
                hi:"xxnamexx के लिए रेफरल सफल रहा।",
                other: "Referral successful for xxnamexx",
            },
            subtitle :{
                en:"Congratulations, Ab aap xxdnrxx DNR redeem kar ₹xxpaytmxx Paytm cash kamaa sakte hain..",
                hi:"बधाई हो, अब आप xxdnrxx डीएनआर रिडीम कर ₹xxpaytmxx पेटीएम कैश कमा सकते हैं।",
                other: "Congratulations, Now you can redeem xxdnrxx DNR to earn Rs.xxpaytmxx in your Paytm.",
            },
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5D2074EA-0A45-06FF-0D9E-018C891725E9.webp",
            pop_up_image : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5D2074EA-0A45-06FF-0D9E-018C891725E9.webp",
            type:"bottom_sheet",
            cta: {
                en: {
                    title: "Abhi redeem karein",
                    deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=1",
                },
                hi: {
                    title: "अभी रिडीम करें|",
                    deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=1",
                },
                other: {
                    title: "Redeem now.",
                    deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=1",
                },
            },
            dnr_reward_per_5_users : 1500,
            dnr_reward_per_user : 300,
            dnr_paytm_mapping:{
                dnr_reward_per_5_users: 50,
                dnr_reward_per_user :10,
            },
        },
    },

    home: {
        title: {
            en: "Doubtnut Rupya",
            hi: "डाउटनट रुप्या",
        },
        totalEarnedSummary: {
            info_text: {
                en: "What is Doubtnut Rupya(DNR)?",
                hi: "डाउटनट रुपया (DNR) क्या है?",
            },
            widget: {
                widget_type: "widget_dnr_total_reward",
                widget_data: {
                    title: "", // student name
                    title_color: "#ffffff",
                    subtitle: "{amt} DNR", // 10 DNR
                    subtitle_color: "#FFFFFF",
                    divider_color: "#FFFFFF",
                    cta: null, // Redeem
                    cta_color: "#ffffff",
                    cta_background_color: "#ghghgh",
                    cta_deeplink: "",
                    info_text: "",
                    info_text_color: "#ffffff",
                    info_background_color: "#ghghgh",
                    info_deeplink: "doubtnutapp://dnr/widgets?screen=faq",
                    background_color: "#7379F8",
                    dnr_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",
                    tnc_text: "",
                    tnc_dialog_data: null,
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                    margin_left: 16,
                    margin_right: 16,
                },
            },
            tnc_text: {
                en: "View terms and conditions for DNR",
                hi: "डीएनआर के लिए नियम और शर्तें देखें",
            },
            tnc_dialog_data: {
                en: {
                    title: "Terms & Conditions for DNR",
                    content: "• Doubtnut Rupya DNR k roop me bhi jana jata hai aur ye Doubtnut k through jari kiya gaya ek virtual amount hoga jo Doubtnut app par activities karne pe aapko milega\n" +
                        "• Aap DNR homepage pe batae gae activity k according DNR kama sakte hai\n" +
                        "• Activities ki list aur DNR ka amount Doubtnut apne anusar kabhi bhi badal sakta hai\n" +
                        "• Alag alag activity krke jo DNR aap kamaenge usko aap vouchers kharidne k lie krskte hai jo DNR page pe available hai\n" +
                        "• Vouchers ki list aur unko pane k lie required DNR fixed nahi hai, aur Doubtnut unko apne anusar kabhi bhi badal sakta hai\n" +
                        "• Doubtnut apne anusar DNR k niyam aur mulya badal sakta hai",
                },
                hi: {
                    title: "डीएनआर के लिए नियम और शर्तें",
                    content: "• डाउटनट रूपया (DNR के रूप में भी जाना जाता है) डाउटनट द्वारा जारी एक ऑनलाइन करेंसी है।\n" +
                        "• आप DNR होमपेज पर बताए अनुसार ऐप पर कुछ गतिविधियां करके DNR कमा सकते हैं।\n" +
                        "• गतिविधियों की सूची और DNR की राशि जो आप कमा सकते हैं, डाउटनट अपने अनुसार कभी भी उसके नियम और मूल्य बदल सकता है  \n" +
                        "• आप अपने अर्जित DNR का उपयोग रिडीम पेज पर उल्लिखित विभिन्न पुरस्कारों को पाने के लिए कर सकते हैं।\n" +
                        "• पुरस्कारों की सूची और आवश्यक DNR रिडीम करने के लिए निश्चित नहीं है, डाउटनट अपने अनुसार कभी भी उसके नियम और मूल्य बदल सकता है  \n" +
                        "• डाउटनट अपने अनुसार कभी भी DNR के नियम बदल सकता है",
                },
            },
        },
        todayEarning: {
            title: {
                en: "Today's earnings : ",
                hi: "आज की कमाई : ",
            },
        },
        voucher: {
            cta: {
                en: "Get using {amt} DNR",
                hi: "{amt} डीएनआर में पाएं",
            },

        },
        videoWidget: {
            widget_data: {
                title: "",
                full_width_cards: true,
                items: [
                    {
                        type: "video_banner_autoplay_child",
                        data: {
                            id: 0,
                            image_url: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1D95E444-53E8-F72C-443F-45C637D6EB54.webp",
                            deeplink: "",
                            video_resource: {
                                resource: "https://d10lpgp6xz60nq.cloudfront.net/dnr_video.mp4",
                                auto_play_duration: 61000,
                            },
                            default_mute: false,
                            track_engagement_time: true,
                            replay_video: true,
                            view_from: "dnr",
                        },
                    },
                ],
                default_mute: false,
                auto_play: true,
                buffer_duration: 5000,
                auto_play_initiation: 0,
                id: "1111",
            },
            widget_type: "widget_autoplay",
        },
    },

    voucherPage: {
        offer_title: {
            en: "Offer Details",
            hi: "ऑफर की जानकारी",
        },
        unlockCta: {
            en: "Unlock with {dnr} DNR",
            hi: "{dnr} DNR के साथ अनलॉक करें",
        },
        earnCta: {
            en: "Earn more DNR",
            hi: "अधिक डीएनआर Earn कमाएं",
        },
        availTitle: {
            en: "How can I avail this offer",
            hi: "कैसे उठा सकते हैं इस ऑफर का फायदा",
        },
        tncTitle: {
            en: "Terms & Conditions",
            hi: "नियम एवं शर्तें",
        },
        warningMessage: {
            en: "You do not have enough DNR in your wallet, go to earn DNR page and see what all you can do to earn more DNR",
            hi: "आपके वॉलेट में पर्याप्त DNR नहीं है, अर्न DNR पेज पर जाएं और देखें कि आप अधिक DNR कमाने के लिए क्या कर सकते हैं",
        },
        loadingState: {
            deeplink: "doubtnutapp://dnr/voucher_explore?voucher_id=",
            description: {
                en: "Your {brand} coupon will be redeemed within 1 to 3 minutes. You will get a notification too once your coupon is redeemed.",
                hi: "आपका {brand} कूपन 1 से 3 मिनट में रिडीम किया जाएगा। आपका कूपन रिडीम हो जाने पर आपको एक नोटीफिकेशन भी मिलेगी।",
            },
            cta: {
                en: "Go Back",
                hi: "वापस जाओ",
            },
        },
        errorState: {
            en: {
                title: "", // Redeem and Earn 100 Rs Flipkart Gift Voucher
                image_url: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B4A0AD62-F496-1B81-19BD-903B04C4CAB5.webp",
                description: "Looks like we are facing some techincal issues, you can try again or come back later to check with us",
                cta: "Try Again",
                subtitle: "Ohhh, Some error happened",
            },
            hi: {
                title: "", // Redeem and Earn 100 Rs Flipkart Gift Voucher
                image_url: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B4A0AD62-F496-1B81-19BD-903B04C4CAB5.webp",
                description: "ऐसा लगता है कि हम कुछ तकनीकी समस्याओं का सामना कर रहे हैं, आप फिर से कोशिश कर सकते हैं या बाद में हमसे संपर्क करने के लिए वापस आ सकते हैं",
                cta: "पुनः प्रयास करें",
                subtitle: "कुछ एरर आया है",
            },
        },
        betterLuckState: {
            en: {
                title: "Better Luck Next Time",
                image_url: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B4A0AD62-F496-1B81-19BD-903B04C4CAB5.webp",
                description: "Better Luck Next Time",
                cta: "Go Back",
                subtitle: "Ohhh, no reward credited",
            },
            hi: {
                title: "Better Luck Next Time",
                image_url: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B4A0AD62-F496-1B81-19BD-903B04C4CAB5.webp",
                description: "Better Luck Next Time",
                cta: "वापस जाओ",
                subtitle: "Ohhh, no reward credited",
            },
        },
        walletDeeplink: "doubtnutapp://wallet",
        walletCta: {
            en: "Check Wallet",
            hi: "चेक वॉलेट",
        },
        dnCashTitle: {
            en: "Rs {amt} DN Cash added to your wallet",
            hi: "Rs {amt} DN Cash आपके वॉलेट में दाल दिआ गया हैं",
        },
    },

    spinWheel: {
        title: {
            en: "Spin the Wheel",
            hi: "स्पिन द व्हील",
        },
        deeplink: "doubtnutapp://dnr/spin_the_wheel",
        spinCta: {
            hi: "{dnr} DNR के साथ स्पिन करेंं",
            en: "Spin with {dnr} DNR",
        },

        widget: {
            widget_type: "widget_dnr_redeem_voucher",
            widget_data: {
                title: "", // content.widget_title
                title_color: "#1c6b90",
                subtitle: "", // content.offer
                subtitle_color: "#808080",
                background_color: "#ecf9ff",
                cta: "",
                cta_color: "#ffffff",
                cta_background_color: "#1c6b90",
                voucher_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5696E661-8276-8407-6A1D-DC777FAA19D9.webp",
                voucher_background_color: "#ffffff",
                dnr_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",
                deeplink: "doubtnutapp://dnr/spin_the_wheel",
            },
            layout_config: {
                margin_right: 15,
                margin_left: 15,
                margin_bottom: 15,
                margin_top: 0,
            },
        },

        content: {
            hi: {
                widget_title: "व्हील घुमाएं और दिए गए विकल्पों में से रिवॉर्ड जीतें",
                about: "यह एक पिकर व्हील है| घुमाने के बाद आपके इनपुट के आधार शब्द यह शब्द का चुनाव करता है। है ना मजेदार और उपयोगी! मान लीजिए कि आप एक शिक्षक हैं और आपके सभी छात्रों को होल्ड करना है",
                title: "व्हील घुमाएं और दिए गए विकल्पों में से रिवॉर्ड जीतें",
                subtitle: "स्पिन द व्हील के बारे में",
                offer: "रिडीम कर पाएं सरप्राइज रिवॉर्ड वाउचर",
            },
            en: {
                widget_title: "Spin the wheel and earn rewards",
                about: "This is a picker wheel that spins and picks a random word based on your input. Fun and useful! Let's say you're a teacher and all of your students have to hold",
                title: "Spin the wheel and earn rewards from the options given",
                subtitle: "About Spin the Wheel",
                offer: "Redeem and earn surprise rewards",
            },
        },
    },

    mysteryBox: {
        title: {
            en: "Reveal the mystery",
            hi: "मिस्ट्री रिवील करें",
        },
        deeplink: "doubtnutapp://dnr/mystery_box",
        cta: {
            en: "Reveal with {dnr} DNR",
            hi: "{dnr} DNR के साथ रिवील करें",
        },

        widget: {
            widget_type: "widget_dnr_redeem_voucher",
            widget_data: {
                title: "", // content.widget_title
                title_color: "#1a5b55",
                subtitle: "", // content.offer
                subtitle_color: "#808080",
                cta: "",
                cta_color: "#FFFFFF",
                cta_background_color: "#1a5b55",
                dnr_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",
                deeplink: "doubtnutapp://dnr/mystery_box",
                background_color: "#ebffff",
                voucher_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/862090DC-C540-F36E-3BB2-45A227D7D073.webp",
                voucher_background_color: "#ffffff",
            },
            layout_config: {
                margin_top: 0,
                margin_bottom: 15,
                margin_left: 15,
                margin_right: 15,
            },
        },

        content: {
            en: {
                widget_title: "Reveal the mystery box and get a surprise reward",
                title: "Redeem this mystery box and get a surprise reward",
                subtitle: "About The Mystery Box",
                about: "The One-stop Shopping Destination. E-commerce is revolutionizing the way we all shop in India. Why do you want to hop from one store to another in",
                offer: "Redeem and earn surprise rewards",
            },
            hi: {
                widget_title: "रहस्य बॉक्स प्रकट करें और एक आश्चर्यजनक इनाम प्राप्त करें",
                about: "वन-स्टॉप शॉपिंग डेस्टिनेशन। ई-कॉमर्स भारत में हम सभी की खरीदारी के तरीके में क्रांति ला रहा है। आप एक दुकान से दूसरी दुकान पर क्यों जाना चाहते हैं?",
                offer: "रिडीम कर पाएं सरप्राइज रिवॉर्ड वाउचर",
                title: "इस मिस्ट्री बॉक्स को रिडीम करें और एक सरप्राइज रिवॉर्ड जीतें",
                subtitle: "मिस्ट्री बॉक्स के बारे में",
            },
        },
    },

    vouchers: {
        title: {
            en: "Redeem Doubtnut Rupya",
            hi: "रिडीम डाउटनट रुपया",
        },
        deeplink: "doubtnutapp://dnr/voucher_list?activeTabId={tab_id}",
        tabs: {
            en: [{
                title: "Redeem Vouchers",
                id: 1,
                screen_alias: "redeem_voucher",
                is_active: false,
            }, {
                title: "Unlocked Vouchers",
                id: 2,
                screen_alias: "unlock_voucher",
                is_active: false,
            }],
            hi: [{
                title: "रिडीम वाउचर",
                id: 1,
                is_active: false,
                screen_alias: "redeem_voucher",
            }, {
                title: "अनलॉक्ड वाउचर",
                id: 2,
                is_active: false,
                screen_alias: "unlock_voucher",
            }],
        },
    },

    weeklyStreakProgress: {
        title: {
            en: "7 day Streak Progress",
            hi: "7 दिन स्ट्रीक प्रगति",
        },
        subtitle: {
            en: "Complete a streak of 7 days and win 100 DNR on 7th day",
            hi: "7 दिनों की स्ट्रीक पूरी करें और 7वें दिन 100 DNR जीतें",
        },
        widget: {
            widget_type: "widget_dnr_streak",
            widget_data: {
                day_number: "",
                is_marked: false,
                show_gift: false,
                is_current_day: false,
            },
        },
    },

    rewardCouponInfo: {
        couponData: {
            title: "DNR Reward Coupon",
            type: "instant",
            coupon_code: "",
            start_date: "",
            end_date: "",
            value_type: "percent",
            value: 0,
            created_by: "rewards",
            min_version_code: 955,
            max_version_code: 2000,
            limit_per_student: 1,
            claim_limit: 1,
            max_limit: 500,
        },
    },

    redeemedDetails: {
        en: {
            title: "Your code",
            expiry: "Expires on : ",
            copyCode: "Copy code",
            cta: "Redeem Now",

        },
        hi: {
            title: "आपका कोड",
            expiry: "एक्सपायर होता है : ",
            copyCode: "कोड कॉपी करें",
            cta: "अभी रिडीम करें",
        },
    },

    orderStates: {
        widget: {
            description: null,
            description_color: "#FF0000",
            background_color: "#FFEFEF",
        },
        pending: {
            en: "Your redeemed coupon is still under process and its pending. This may take a while, please check again after 30 minutes.",
            hi: "आपका रिडीम किया हुआ कूपन अभी भी प्रक्रिया में है और पेंडिंग है। इसमें कुछ समय लग सकता है, कृपया 30 मिनट के बाद फिर से देखे",
        },
        refund: {
            en: "Your redeemed coupon could not be processed because of some technical issue and your amount has been refunded to your account",
            hi: "आपका रिडीम किया हुआ कूपन किसी तकनीकी समस्या की वजह से असफल रहा, और आपकी राशि आपके खाते में वापस कर दी गई है ",
        },
    },

    tryAgainContainer: {
        en: {
            description: "Please try again later",
            description_color: "#FF0000",
            background_color: "#FFEFEF",
        },
        hi: {
            description: "बाद में पुन: प्रयास करें",
            description_color: "#FF0000",
            background_color: "#FFEFEF",
        },
    },
    signupNotif: {
        title: "200 Doubtnut Rupya Earned!",
        description: "Aapne paaya hai 200 DNR. Abhi check kare aur paaye exciting rewards!",
    },
    coursePageVisitNotif: {
        title: "50 DNR Earned for Checking the course.",
        description: "Proceed to Buy the course to get 500 DNR.",
    },
    reinstallAppNotification: {
        en: {
            title: "Welcome Back to Doubtnut!",
            message: "Aapne jeeta hai exclusive {voucherBrand} Voucher. Voucher details - Voucher Number : {voucherCode} {voucherPin}, {voucherExpiry}",
        },
        hi: {
            title: "डाउटनट में आपका स्वागत है!",
            message: "आपने विशेष {voucherBrand} वाउचर जीता है। वाउचर विवरण - वाउचर नंबर : {voucherCode} {voucherPin}, {voucherExpiry}",
        },
        other: {
            title: "Welcome Back to Doubtnut!",
            message: "You have won exclusive {voucherBrand} Voucher. Voucher details - Voucher Number : {voucherCode} {voucherPin}, {voucherExpiry}",
        },
    },
    reinstallSmsNotification: {
        en: {
            message: "Congratulations on Reinstalling Doubtnut App! Aapne jeeta hai exclusive {voucherBrand} Voucher. Voucher details - Voucher Number : {voucherCode} {voucherPin}, {voucherExpiry}, https://doubtnut.app.link/RoBMmQWlInb . Aise aur exciting rewards jeetne ke liye Doubtnut use karte rahiye.",
        },
        hi: {
            message: "डाउटनट ऐप को फिर से इंस्टॉल करने पर बधाई! आपने जीता है विशेष {voucherBrand} वाउचर। वाउचर विवरण - वाउचर नंबर : {voucherCode} {voucherPin}, {voucherExpiry}, https://doubtnut.app.link/RoBMmQWlInb ऐसे और रोमांचक पुरस्कार जीतने के लिए डाउटनट यूज़ करते रहें।",
        },
        other: {
            message: "Congratulations on Reinstalling Doubtnut App! You have won an exclusive {voucherBrand} Voucher. Voucher details - Voucher Number : {voucherCode} {voucherPin}, {voucherExpiry}, https://doubtnut.app.link/RoBMmQWlInb . To win more such rewards keep on using Doubtnut app.",
        },
    },
    pinTitle: {
        en: "Pin",
        hi: "पिन",
        other: "Pin",
    },

    whatsappDeeplink: {
        hi: "doubtnutapp://whatsapp?external_url=doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?phone=918400400400&text=%E0%A4%8F%E0%A4%95%20%E0%A4%B8%E0%A4%B5%E0%A4%BE%E0%A4%B2%20%E0%A4%AA%E0%A5%82%E0%A4%9B%E0%A5%87%E0%A4%82",
        en: "doubtnutapp://whatsapp?external_url=doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?phone=918400400400&text=Ask%20a%20Question",
    },
    streakReminderNotification: {
        title: {
            en: "Today's DNR reward unlocked",
            hi: "आज का DNR रिवॉर्ड अनलॉक हो गया हैं",
        },
        message: {
            en: "Check Now!",
            hi: "अभी देखो!",
        },
        toastMessage: {
            en: "Reminder Set!",
            hi: "ठीक है, हम आपको याद दिला देंगे!",
        },
    },
    homePageWidgets: {
        tabStructure: {
            key: "", // day1
            title: "", // 1 July
            is_selected: false,
            icon_url: "",
        },
        markedIcon: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B06E5A36-DEC5-CC23-1950-C3DF94B40A06.webp",
        upcomingRewardIcon: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/F76F69B6-A0D7-1866-E5D6-2448F434ADF6.webp",
        rewardIcon: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/12E26CB4-6C76-BC3C-8946-AE87482C742B.webp",
        widgetTitle: {
            en: "DNR Daily Welcome Reward",
            hi: "DNR डेली वेलकम रिवॉर्ड",
        },
        reminderTitle: {
            en: "SET REMINDER",
            hi: "",
        },
        widget: {
            widget_type: "widget_parent_tab",
            widget_data: {
                title: "", // DNR Daily Welcome Reward
                title_text_size: 16,
                scroll_direction: "horizontal",
                subtitle_text_size: 12,
                subtitle_text_color: "#777777",
                bottom_cta: "",
                bottom_cta_deeplink: "",
                link_text: "", // SET REMINDER
                link_text_url: "", // https://micro.doubtnut.com/api/dnr/remind-streak
                link_text_method: "PUT",
                tabs_background_color: "#FFEDD8",
                background_color: "#FFFFFF",
                subtitle_remove_drawable_end: true,
                link_text_show_arrow: false,
                is_link_text_bold: true,
                is_custom_tabs: true,
                is_title_bold: true,
                tab_layout_gravity: "bottom",
                items: {},
                tabs: [],
                layout_padding: {
                    padding_start: 16,
                    padding_end: 0,
                    // padding_bottom: 10,
                },
                layout_config: {
                    items_top_margin: 20,
                    tab_layout_height: 100,
                    margin_left: 0,
                    margin_right: 10,
                    match_parent: true,
                },
            },
            layout_config: {
                margin_top: 0,
                margin_bottom: 0,
                margin_left: 0,
                margin_right: 10,
            },
        },
        dayItems: {
            en: {
                day1: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "Day 1 Ka Reward",
                            subtitle: "You have unlocked the Paytm voucher worth Rs.10 by signing up on Doubtnut, check now",
                            title_text_color: "#2938C1",
                            subtitle_text_color: "#2F2F2F",
                            is_title_bold: true,
                            title_text_size: 20,
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/53E0E383-636B-ACC8-598A-1A3B2FCDD186.webp",
                            image_banner_height: 125,
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            background_color: "#FFEDD8",
                            is_action_button_title_bold: true,
                            product_code: "EGVGBPTM006",
                            is_internal_voucher: false,
                            redeem_deeplink: "doubtnutapp://dnr/voucher_explore?voucher_id=61efd38f229d1a2b3f257569&source=redeem_voucher",
                        },
                    },
                ],
                day2: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "Day 2 Ka Reward",
                            subtitle: "You wallet is recharged with Rs.50 DN CASH, use it to buy Courses, PDFs etc",
                            product_code: "DNCASH50",
                            is_internal_voucher: true,
                            title_text_color: "#2938C1",
                            subtitle_text_color: "#2F2F2F",
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/3F2BE8A8-A2FF-4F09-BD0D-A5D324452F7B.webp",
                            image_banner_height: 125,
                            title_text_size: 20,
                            is_title_bold: true,
                            background_color: "#FFEDD8",
                            is_action_button_title_bold: true,
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            redeem_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                        },
                    },
                ],
                day3: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "Day 3 Ka Reward",
                            title_text_color: "#2938C1",
                            subtitle: "You have unlocked Amazon Pay voucher worth Rs.10 by coming on Doubtnut 3rd day, check now",
                            subtitle_text_color: "#2F2F2F",
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B3855A10-E2C9-F760-772C-9D64FC9235A0.webp",
                            image_banner_height: 125,
                            title_text_size: 20,
                            is_title_bold: true,
                            is_action_button_title_bold: true,
                            background_color: "#FFEDD8",
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            is_internal_voucher: false,
                            product_code: "EGCGBAMZB2BRS001",
                            redeem_deeplink: "doubtnutapp://dnr/voucher_explore?voucher_id=61eff7f8229d1a2b3f25757a&source=redeem_voucher",
                        },
                    },
                ],
                day4: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "Day 4 Ka Reward",
                            title_text_color: "#2938C1",
                            subtitle: "You just won 10% off for course purchase on 4th day of daily streak from DNR. Buy Now",
                            is_internal_voucher: true,
                            product_code: "DN10OFF",
                            subtitle_text_color: "#2F2F2F",
                            image_banner_height: 125,
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/71CDEC4E-33ED-CB8B-9662-E5DCF2E88B12.webp",
                            title_text_size: 20,
                            is_title_bold: true,
                            is_action_button_title_bold: true,
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            redeem_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            background_color: "#FFEDD8",
                        },
                    },
                ],
                day5: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "Day 5 Ka Reward",
                            title_text_color: "#2938C1",
                            subtitle: "You just won 20% off for course purchase on 5th day of daily streak from DNR. Buy Now",
                            subtitle_text_color: "#2F2F2F",
                            image_banner_height: 125,
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5C888700-B26B-730F-AA75-2217C6B9D1D1.webp",
                            title_text_size: 20,
                            is_title_bold: true,
                            background_color: "#FFEDD8",
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            is_internal_voucher: true,
                            product_code: "DN20OFF",
                            redeem_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            is_action_button_title_bold: true,
                        },
                    },
                ],
                day6: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "Day 6 Ka Reward",
                            subtitle: "You have unlocked Gyfter recharge worth Rs.25",
                            title_text_color: "#2938C1",
                            subtitle_text_color: "#2F2F2F",
                            is_title_bold: true,
                            title_text_size: 20,
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            background_color: "#FFEDD8",
                            is_action_button_title_bold: true,
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6CA660D7-F32A-73FE-BF3B-394603107808.webp",
                            product_code: "MR25",
                            is_internal_voucher: false,
                            redeem_deeplink: "doubtnutapp://dnr/voucher_explore?voucher_id=61a276dda1219f6b7ad81a63&source=redeem_voucher",
                            image_banner_height: 125,
                        },
                    },
                ],
            },
            hi: {
                day1: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "पहले दिन का रिवॉर्ड",
                            subtitle: "आपने डाउटनट पर साइन अप कर 10 रुपये का पेटीएम वाउचर अनलॉक कर दिया है, अभी चेक करें|",
                            title_text_color: "#2938C1",
                            subtitle_text_color: "#2F2F2F",
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/53E0E383-636B-ACC8-598A-1A3B2FCDD186.webp",
                            image_banner_height: 125,
                            is_title_bold: true,
                            title_text_size: 20,
                            background_color: "#FFEDD8",
                            is_action_button_title_bold: true,
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            is_internal_voucher: false,
                            product_code: "EGVGBPTM006",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            redeem_deeplink: "doubtnutapp://dnr/voucher_explore?voucher_id=61efd38f229d1a2b3f257569&source=redeem_voucher",
                        },
                    },
                ],
                day2: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "दूसरे दिन का रिवॉर्ड",
                            subtitle: "आपका वॉलेट 50 रूपये के डीएन कैश से रिचार्ज हुआ है, जिससे आप कोर्स और पीडीएफ़ के ख़रीद सकते हैं|",
                            title_text_color: "#2938C1",
                            subtitle_text_color: "#2F2F2F",
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/3F2BE8A8-A2FF-4F09-BD0D-A5D324452F7B.webp",
                            image_banner_height: 125,
                            is_title_bold: true,
                            title_text_size: 20,
                            background_color: "#FFEDD8",
                            is_action_button_title_bold: true,
                            is_internal_voucher: true,
                            redeem_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            product_code: "DNCASH50",
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                        },
                    },
                ],
                day3: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "तीसरे दिन का रिवॉर्ड",
                            subtitle: "आपने डाउटनट पर लगातार 3 दिन तक आकर 10 रुपये का अमेज़न वाउचर अनलॉक किया है, अभी चेक करें|",
                            title_text_color: "#2938C1",
                            subtitle_text_color: "#2F2F2F",
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B3855A10-E2C9-F760-772C-9D64FC9235A0.webp",
                            image_banner_height: 125,
                            is_title_bold: true,
                            title_text_size: 20,
                            background_color: "#FFEDD8",
                            is_action_button_title_bold: true,
                            product_code: "EGCGBAMZB2BRS001",
                            is_internal_voucher: false,
                            redeem_deeplink: "doubtnutapp://dnr/voucher_explore?voucher_id=61eff7f8229d1a2b3f25757a&source=redeem_voucher",
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                        },
                    },
                ],
                day4: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "चौथे दिन का रिवॉर्ड",
                            subtitle: "आपने चौथे दिन की डेली स्ट्रीक पर DNR से अभी-अभी कोर्स की खरीद पर 10% की छूट जीती है| अभी खरीदें|",
                            title_text_color: "#2938C1",
                            subtitle_text_color: "#2F2F2F",
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/71CDEC4E-33ED-CB8B-9662-E5DCF2E88B12.webp",
                            image_banner_height: 125,
                            is_title_bold: true,
                            title_text_size: 20,
                            background_color: "#FFEDD8",
                            is_action_button_title_bold: true,
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            product_code: "DN10OFF",
                            is_internal_voucher: true,
                            redeem_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                        },
                    },
                ],
                day5: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "पांचवे दिन का रिवॉर्ड",
                            subtitle: "आपने पांचवे दिन की डेली स्ट्रीक पर DNR से अभी-अभी कोर्स की खरीद पर 20% की छूट जीती है| अभी खरीदें|",
                            title_text_color: "#2938C1",
                            subtitle_text_color: "#2F2F2F",
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5C888700-B26B-730F-AA75-2217C6B9D1D1.webp",
                            image_banner_height: 125,
                            is_title_bold: true,
                            title_text_size: 20,
                            background_color: "#FFEDD8",
                            is_action_button_title_bold: true,
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            is_internal_voucher: true,
                            product_code: "DN20OFF",
                            redeem_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                        },
                    },
                ],
                day6: [
                    {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: "छठे दिन का रिवॉर्ड",
                            subtitle: "आपने 25 रुपये के Gyftr रिचार्ज को अनलॉक किया है|",
                            title_text_color: "#2938C1",
                            subtitle_text_color: "#2F2F2F",
                            image_banner: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6CA660D7-F32A-73FE-BF3B-394603107808.webp",
                            image_banner_height: 125,
                            is_title_bold: true,
                            title_text_size: 20,
                            is_internal_voucher: false,
                            product_code: "MR25",
                            redeem_deeplink: "doubtnutapp://dnr/voucher_explore?voucher_id=61a276dda1219f6b7ad81a63&source=redeem_voucher",
                            background_color: "#FFEDD8",
                            is_action_button_title_bold: true,
                            deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                            image_deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                        },
                    },
                ],
            },
        },

        lastDayWidget: {
            widget: {
                widget_type: "widget_dnr_home",
                widget_data: {
                    title_line_1: "", // <p>Earn <b>Doubtnut Rupya</b> to redeem gift vouchers, coupons and many more rewards</p>
                    title_color: "#808080",
                    cta: "", // Check Now
                    cta_color: "#eb532c",
                    bg_start_color: "#ffeed8",
                    bg_end_color: "#ffe4dc",
                    coin_image_url: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/50CBE042-BFD6-6E22-24DB-8361DB1C99F8.webp",
                    coin_image_scale_type: "center_crop",
                    deeplink: "doubtnutapp://dnr/voucher_list?activeTabId=2",
                    background_color: "#ffeed8",
                },
                layout_config: {
                    margin_top: 10,
                    margin_bottom: 10,
                    margin_left: 15,
                    margin_right: 15,
                },
            },
            title: {
                en: "<p><b>Doubtnut Rupya</b> earn karke gift vouchers, coupons aur dher sare anya rewards pane ka mauka payein</p>",
                hi: "<p><b>डाउटनट रुपया</b> कमा के गिफ्ट वाउचर्स, कूपन और कई अन्य पुरस्कार रिडीम करें</p>",
            },
            cta: {
                en: "Check Now",
                hi: "अभी देखो!",
            },
        },
    },
    dnrExpStartingSid: 238986347,
};
