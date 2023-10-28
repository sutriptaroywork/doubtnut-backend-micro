export default {

    // defaultUserImage: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6BDD71CB-EAF8-E751-0EBB-24FB01937BAE.webp",
    defaultUserImage: null,

    faqDeeplink: "doubtnutapp://study_group/chat?group_id=study_group_faq&is_admin=false&is_faq=true",

    inviteText: "Start conversation with {inviter}.\n[]",

    inviteNotificationTitle: "New Chat Request Received",
    inviteNotificationMessage: "<> ne aapko Study Groups par chat request send ki hai. Accept the request to start chatting",

    accptanceNotificationTitle: "Chat Request Accepted",
    accptanceNotificationMessage: "<> ne aapki Chat Request accept karli hai. Start Chatting on Study Groups Now!",


    inviteBottomSheet: {
        en: {
            heading: "{name} has sent a Message",
            description: "Agar aap inse chat karna chahte ho toh is  chat request ko accept karo",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/13095E27-4352-40A7-A295-C6AF9AB53FE0.webp",
            primary_cta: "Accept Chat",
            primary_cta_event: "sc_invite_accepted",
            secondary_cta: "Reject & Block Request",
            secondary_cta_event: "sc_invite_rejected",
            can_access_chat: false,
        },
        hi: {
            heading: "{name} ने मैसेज भेजा है",
            description: "अगर आप इनसे चैट करना चाहते हैं तो चैट रिक्वेस्ट को एक्सेप्ट करें",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/13095E27-4352-40A7-A295-C6AF9AB53FE0.webp",
            primary_cta: "चैट एक्सेप्ट करें",
            primary_cta_event: "sc_invite_accepted",
            secondary_cta: "रिक्वेस्ट को रिजेक्ट कर, ब्लॉक करें",
            secondary_cta_event: "sc_invite_rejected",
            can_access_chat: false,
        },
    },

    blockerOtherContainer: {
        en: {
            title: "Unblock {name} to resume conversation",
            primary_cta: "Unblock",
            secondary_cta: "Cancel",
        },
        hi: {
            title: "बातचीत फिर से शुरू करने के लिए {name} को अनब्लॉक करें",
            primary_cta: "अनब्लॉक",
            secondary_cta: "कैंसिल",
        },
    },

    unBlockCta: {
        en: "Unblock",
        hi: "अनब्लॉक",
    },

    block_pop_up: {
        en: {
            title: "Are You Sure want to Block {memberName}? ",
            subtitle: "{memberName} will not be able to send you messages anymore and to start talking again you will have to unblock",
            primary_cta: "Block",
            secondary_cta: "Cancel",
        },
        hi: {
            title: "क्या आप {memberName} को ब्लॉक करना चाहते हैं? ",
            subtitle: "इसके बाद {memberName} आपको मैसेज नहीं भेज पाएंगे| फिर से बात करना शुरू करने के लिए आपको {memberName} को अनब्लॉक करना होगा|",
            primary_cta: "ब्लॉक",
            secondary_cta: "कैंसिल",
        },
    },

    unblock_pop_up: {
        en: {
            title: "Are You Sure want to Unblock {memberName}? ",
            subtitle: "{memberName} will be able to send you messages, to start talking again you will have to unblock",
            primary_cta: "Unblock",
            secondary_cta: "Cancel",
        },
        hi: {
            title: "क्या आप {memberName} को अनब्लॉक करना चाहते हैं? ",
            subtitle: "क्या आप {memberName} को अनब्लॉक करना चाहते हैं? अनब्लॉक करने के बाद, {memberName} आपको मैसेज कर पाएंगे।",
            primary_cta: "अनब्लॉक",
            secondary_cta: "कैंसिल",
        },
    },

    listMyChats: {
        title: {
            en: "Study Group",
            hi: "स्टडी ग्रुप",
        },
        createChatDeeplink: "doubtnutapp://study_group/select_friend",
        pendingInvites: {
            title: {
                en: "New Chat Requests ",
                hi: "नई चैट रिक्वेस्ट ",
            },
            subtitle: {
                en: "Click to see pending request",
                hi: "क्लिक करके पेंडिंग रिक्वेस्ट देखे",
            },
            widget: {
                widget_type: "widget_sg_request",
                widget_data: {
                    group_id: null,
                    title: null,
                    title_color: "#2c87ea",
                    subtitle: null,
                    subtitle_color: "#000000",
                    image: null,
                    pending_request_count: null,
                    inviter: null,
                    primary_cta: null,
                    primary_cta_deeplink: null,
                    secondary_cta: null,
                    primary_cta_bg_color: "#54b726",
                    primary_cta_text_color: "#ffffff",
                    secondary_cta_text_color: "#ff0000",
                    secondary_cta_bg_color: "#ff0000",
                    timestamp: null,
                    deeplink: "doubtnutapp://study_group?screen=chat_requests",
                },
            },
        },

        no_chats_container: {
            en: {
                title: "Apne dosto se  bat kre",
                subtitle: "Start new chat par click karke apne doston se baat karna shuru kare",
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/13095E27-4352-40A7-A295-C6AF9AB53FE0.webp",
            },
            hi: {
                title: "अपने दोस्तों से बात करें",
                subtitle: "नई चैट शुरू करें पर क्लिक कर, अपने दोस्तों से चैट करना शुरू करें",
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/13095E27-4352-40A7-A295-C6AF9AB53FE0.webp",
            },
        },
        cta: {
            en: "Create New Chat",
            hi: "नई चैट बनाएं",
        },
        deeplink: "doubtnutapp://study_group/personal_chat?chat_id={groupId}&other_student_id={otherStudentId}",
    },

    pendingChatInvitePage: {
        widget: {
            widget_type: "widget_sg_request",
            widget_data: {
                group_id: null,
                title: null,
                title_color: "#000000",
                subtitle: null,
                subtitle_color: "#969696",
                image: null,
                pending_request_count: null,
                inviter: null,
                primary_cta: null,
                primary_cta_deeplink: "",
                secondary_cta: null,
                primary_cta_bg_color: "#54b726",
                primary_cta_text_color: "#ffffff",
                secondary_cta_text_color: "#ff0000",
                secondary_cta_bg_color: "#ff0000",
                timestamp: null,
                deeplink: null,
            },
        },
        invite: {
            primary_cta: {
                en: "Accept",
                hi: "स्वीकार करें",
            },
            secondary_cta: {
                en: "Ignore",
                hi: "अनदेखा करें",
            },
            invited_by: {
                en: "Invited by: ",
                hi: "आमंत्रणकर्ता: ",
            },
        },
    },

    mute: {
        chatLevelMute: {
            en: "Chat has been muted successfully",
            hi: "चैट को म्यूट कर दिया गया है|",
        },
        chatLevelUnmute: {
            en: "Chat has been un-muted successfully",
            hi: "चैट को अन-म्यूट कर दिया गया है|",
        },
    },

    no_block_container: {
        en: {
            title: "You have not blocked anyone",
            subtitle: "",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/13095E27-4352-40A7-A295-C6AF9AB53FE0.webp",
        },
        hi: {
            title: "आपने किसी को ब्लॉक नहीं किया है",
            subtitle: "",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/13095E27-4352-40A7-A295-C6AF9AB53FE0.webp",
        },
    },

    blockTitle: {
        en: "Blocked Users",
        hi: "ब्लॉक यूज़र्स",
    },

    friendList: {
        tabs: {
            en: [{title: "Following", id: 1, is_active: false}, {title: "Followers", id: 2, is_active: false}],
            hi: [{title: "फॉलोइंग", id: 1, is_active: false}, {title: "फॉलोअर्स", id: 2, is_active: false}],
        },
        title: {
            en: "",
            hi: "",
        },
        subTitle: {
            en: "Invite friends to chat on Doubtnut",
            hi: "डाउटनट पर चैट करने के लिए दोस्तों को इन्वाइट करें",
        },
        sendCta: {
            hi: "संदेश",
            en: "Send",
        },
        cta: {
            en: "Invite to Chat",
            hi: "चैट करने के लिए आमंत्रित करें",
        },
        whatsappButton: {
            en: "Invite via Whatsapp",
            hi: "व्हाट्सऐप के माध्यम से आमंत्रित करें",
        },
        numberInvite: {
            en: "Add number of friend",
            hi: "दोस्त का नंबर ऐड करें",
        },
        searchPlaceholder: {
            en: "Search for a friend",
            hi: "दोस्त ढूंढें",
        },
        noFollowersTitle: {
            en: "You do not have any followers.",
            hi: "आपके कोई फॉलोअर्स नहीं है।",
        },
        noFollowersSubtitle: {
            en: "Invite other friends to chat with them.",
            hi: "अन्य मित्रों को उनके साथ चैट करने के लिए आमंत्रित करें।",
        },
        noFollowingTitle: {
            en: "You are not following anyone.",
            hi: "आप किसी को फॉलो नहीं कर रहे।",
        },
        noFollowingSubtitle: {
            en: "Start following people to send invite and chat with them.",
            hi: "आमंत्रण भेजने के लिए लोगों को फॉलो करना शुरू करें और उनके साथ चैट करे।",
        },

    },
    whatsappShareText: {
        en: "{name} has invited you to chat on Doubtnut study groups. Accept the invite to start chatting.\n{link}",
        hi: "{name} ने आपको डाउटनट स्टडी ग्रुप पर चैट करने के लिए आमंत्रित किया है। चैटिंग शुरू करने के लिए आमंत्रण स्वीकार करें।\n{link}",
    },

    smsShareText: {
        en: "{name} has invited you to chat on Doubtnut study groups. Accept the invite to start chatting.\n{link}",
        hi: "{name} ने आपको डाउटनट स्टडी ग्रुप पर चैट करने के लिए आमंत्रित किया है। चैटिंग शुरू करने के लिए आमंत्रण स्वीकार करें।\n{link}",
    },

    userNotExist: {
        title: {
            en: "The number you have entered does not have doubtnut app on their phone. They may take some time to install the app and join the chat.",
            hi: "आपने जो नंबर डाला है, उनके फोन में डाउटनट ऐप नहीं है। उन्हें ऐप इंस्टॉल करने और चैट में शामिल होने में कुछ समय लग सकता है।",
        },
        cta_change: {
            en: "Change Number",
            hi: "नंबर बदलेंं",
        },
        cta_invite: {
            en: "Okay",
            hi: "ठीक है",
        },
    },

    featureSettings: {
        title: {
            en: "Settings",
            hi: "सेटिंग",
        },
        notification: {
            title: {
                en: "Notifications ",
                hi: "नोटिफिकेशन ",
            },
        },
        blockList: {
            title: {
                en: "Blocked List ",
                hi: "ब्लॉक लिस्ट ",
            },
            count: {
                singlular: {
                    en: "Person",
                    hi: "लोग",
                },
                plural: {
                    en: "People",
                    hi: "लोग",
                },
            },
            deeplink: "doubtnutapp://study_group?screen=blocked_users",
        },
    },
    search: {
        chat: {
            en: "Search Chats",
            hi: "चैट खोजें",
        },

        people: {
            en: "Search People",
            hi: "लोगों को खोजें",
        },

        friend: {
            en: "Search Friends",
            hi: "मित्र खोजें",
        },
    },

    pendingRequests: {
        title: {
            en: "Chat Requests",
            hi: "चैट रिक्वेस्ट",
        },
    },
};
