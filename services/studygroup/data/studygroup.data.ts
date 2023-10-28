/*
    Different stages of group -
      block stage/ group deactivate stage:
        is_group_enabled: false
        is_member: false
        is_faq: false
      group leave:
        is_group_enabled: true
        is_member: false
        is_faq: false
      faq group:
        is_faq: true
        is_group_enabled: false
        is_member: false
    -----------------------------------
      bottom_sheet: null
 */

export default {

    createGroupEn: {
        data: [{
            description: "Now Create your own study group",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/72B5D400-BA31-1166-A991-2F69AEEBED61.webp",
        },
            {
                description: "Learn together 24*7 by helping each other",
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/DB5601A3-2807-0F2E-B2D9-5F6AC17DE756.webp",
            },
            {
                description: "Add Friends and prepare better",
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/AE991231-3D37-EC4D-9BBD-56B727F2ED54.webp",
            }],
    },

    groupCreateHeadingHi: "डाउटनट स्टडी ग्रुप में आपका स्वागत है",
    groupCreateHeadingEn: "Welcome to Doubtnut Study Group",

    createGroupHi: {
        data: [{
            description: "अब अपना खुद का स्टडी ग्रुप बनाएं",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/72B5D400-BA31-1166-A991-2F69AEEBED61.webp",
        },
            {
                description: "एक दूसरे की मदद करके 24*7 मिलकर पढ़े",
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/DB5601A3-2807-0F2E-B2D9-5F6AC17DE756.webp",
            },
            {
                description: "दोस्तों  को  ग्रुप में जोड़ें और बेहतर तैयारी करें",
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/AE991231-3D37-EC4D-9BBD-56B727F2ED54.webp",
            }],
    },

    groupGuideLineEn: "1. The group admin will be responsible for managing the group. Doubtnut does not have any responsibility in this regard. \n"
        + "2. The admin has to ensure that all members of the group maintain discipline and no abuses,no hate speech, no violence and no vulgarity is shared on the group chat. \n"
        + "3. The admin can block and remove such users who violate the guidelines after warning.\n"
        + "4. Any violation of group guidelines will result in closure of the group and banning of the doubtnut account of all group members.\n",

    groupGuideLineHi: "1. ग्रुप के संचालन की जिम्मेदारी ग्रुप एडमिन की होगी। इस संबंध में डाउटनट की कोई जिम्मेदारी नहीं है। \n"
        + "2. ग्रुप एडमिन को यह सुनिश्चित करना होगा कि ग्रुप के सभी\n"
        + "सदस्य अनुशासन बनाए रखते हैं और ग्रुप चैट पर कोई गाली-गलौज, कोई अभद्र भाषा, कोई हिंसा और कोई अश्लीलता साझा नहीं की जाती है।\n"
        + "3. चेतावनी के बाद दिशा-निर्देशों का उल्लंघन करने वाले ऐसे यूजर्स को एडमिन ब्लॉक कर सकता है और हटा सकता है।\n"
        + "4. ग्रुप के दिशानिर्देशों के किसी भी उल्लंघन के परिणामस्वरूप ग्रुप को बंद कर दिया जाएगा और इसके साथ ही ग्रुप के सभी सदस्यों के डाउटनट अकाउंट भी बैन कर दिए जाएंगे|",

    groupMsgGuidLine: "Welcome to Doubtnut Study Group! Please group guidelines ko follow kare-\n"
        + "1. Group ko manage karne ke liye group admin responsible honge.Ismein Doubtnut ki koi responsibility nai hai.\n"
        + "2. Group admin ko yeh make sure karna hai ki group ke sabhi members discipline maintain kare and no abuses,no hate speech, no violence and no vulgarity is shared on the group chat. \n"
        + "3. Jo users group guidelines ko follow nai karte, unko warning dene ke baad, group admin group se block kar sakta hai.\n"
        + "4. Group guidelines ko follow na karne se group close kar diya jayega and doubtnut accounts of all group members will be banned.",

    firstInviteMessageEn: "Invite your friends to start studying together.",

    groupBlockedMemberMessageHi: "आपको इस ग्रुप से ब्लॉक कर दिया गया है",
    groupBlockedMemberMessageEn: "You have been blocked from this group",

    inviteCtaTextEn: "Invite",
    copyInviteCtaTextEn: "Copy Invite link",

    knowMoreTextEn: "Know More >",
    knowMoreTextHi: "अधिक जानने के लिए >",
    knowMoreDeeplink: "doubtnutapp://community_guidelines?source=study_group",

    groupMinimumUserWarningMessageEn: "You have only <>person in the group\nInvite []more friend to activate this group",
    groupMinimumUserWarningMessageHi: "इस ग्रुप में आपके पास केवल <> व्यक्ति है। ग्रुप को सक्रिय करने के लिए [] और मित्र को आमंत्रित करें",

    faqDeeplink: "doubtnutapp://study_group_chat?group_id=study_group_faq&is_admin=false&is_faq=true",

    userBlockedFromGroupEn: "You have been removed from this group",
    userBlockedFromGroupHi: "आपको इस ग्रुप से हटा दिया गया है",

    userLefFromGroupEn: "You left this group",
    userLefFromGroupHi: "आपने यह ग्रुप छोड़ दिया",

    groupLeftSubtitle: {
        en: "You left",
        hi: "आपने ग्रुप लेफ्ट कर दिया",
    },

    groupRemovedSubtitle: {
        en: "You were removed from this group",
        hi: "आपको ग्रुप से हटा दिया गया है",
    },

    ctaTextEn: "Okay",
    ctaTextHi: "ठीक है",

    inviteText: "<> Invited you to their study group {}. Accept the invite to study together.\n[]",

    inviteNotificationTitleEn: "<> invited you to their study group {} .",
    inviteNotificationTitleHi: "<> ने आपको अध्ययन समूह {} के लिए आमंत्रित किया है।",

    inviteNotificationMessageEn: "Accept the invite to study together.",
    inviteNotificationMessageHi: "एक साथ अध्ययन के लिए निमंत्रण स्वीकार करें।",

    accptanceNotificationTitle: "<> ne {} group join karne ka invite accept kar liya.",
    accptanceNotificationMessage: "Message now",

    groupNotExistEn: "Sorry this group no longer exists.",
    groupNotExistHi: "क्षमा करें, यह ग्रुप अब मौजूद नहीं है।",

    publicGroupJoiningErrorEn: "Unable to join group, You have to update the Doubtnut App to join this group.",
    publicGroupJoiningErrorHi: "ग्रुप में शामिल होने में असमर्थ, इस ग्रुप में शामिल होने के लिए आपको डाउटनट ऐप को अपडेट करना होगा",

    groupJoiningErrorEn: "Unable to join group, please try again.",
    groupJoiningErrorHi: "ग्रुप में शामिल होने में असमर्थ, कृपया पुनः प्रयास करें।",

    groupJoiningBlockEn: "Unable to join group, You were blocked from this Group.",
    groupJoiningBlockHi: "आपको इस ग्रुप से ब्लॉक कर दिया गया है",

    featureNotAvailable: "Study Group is not available for you\nPlease request for study group feature",
    featureNotAvailableHi: "वर्तमान में आपके लिए स्टडी ग्रुप उपलब्ध नहीं है। कृपया स्टडी ग्रुप सुविधा के लिए अनुरोध करें।",
    featureNotAvailableCTA: "Request For Study Group",
    featureNotAvailableCTAHi: "स्टडी ग्रुप के लिए अनुरोध करें",

    createGroupNotifTopic: "Bana Liya Hai Study Group par Nahi Hue Friends Add?",
    createGroupNotifDescription: "Jaldi seekho kaise kar sakte friends to Invite and Karo Padhai Shuru!",
    createGroupSMS: "Bana Liya Hai Study Group par Nahi Hue Friends Add?\nJaldi seekho kaise kar sakte friends to Invite and Karo Padhai Shuru!\nhttps://doubtnut.app.link/8udEcAxDMgb",

    groupFullEn: "Invited Group is already full",
    groupFullHi: "आमंत्रित ग्रुप पहले ही भर चुका है",

    ctaHomeEn: "Go to Home",
    ctaHomeHi: "होम पर जाये",

    socketBlockedMsg: "[] have been blocked by <> from {}",
    socketLeftMsg: "<> has left the group",
    socketJoinedAgainMsg: "<> joined back",

    faqGroupInfoHi: {
        group_data: {
            group_info: {
                group_id: "study_group_faq",
                group_name: "डाउटनट टिप्स",
                group_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BB493695-5BE4-AA8E-A588-031296559E2F.webp",
                group_created_at: "2021-05-29T04:10:19.000Z",
                subtitle: "FAQ",
            },
            members: [],
        },
        is_group_enabled: false,
        is_member: true,
        is_group_active: true,
        is_faq: true,
        message: null,
        group_guideline: null,
        know_more_text: null,
        know_more_deeplink: null,
        group_minimum_member_warning_message: null,
        faq_deeplink: "doubtnutapp://study_group_chat?group_id=study_group_faq&is_admin=false&is_faq=true",
        invite_text: null,

    },

    faqGroupInfoEn: {
        group_data: {
            group_info: {
                group_id: "study_group_faq",
                group_name: "Doubtnut Tips",
                group_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BB493695-5BE4-AA8E-A588-031296559E2F.webp",
                group_created_at: "2021-05-29T04:10:19.000Z",
                subtitle: "FAQ",
            },
            members: [],
        },
        is_group_enabled: false,
        is_member: true,
        is_group_active: true,
        is_faq: true,
        message: null,
        group_guideline: null,
        know_more_text: null,
        know_more_deeplink: null,
        group_minimum_member_warning_message: null,
        faq_deeplink: "doubtnutapp://study_group_chat?group_id=study_group_faq&is_admin=false&is_faq=true",
        invite_text: null,
    },

    faqGroupDataHi: {
        pk: null,
        group_id: "study_group_faq",
        group_name: "डाउटनट टिप्स",
        group_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BB493695-5BE4-AA8E-A588-031296559E2F.webp",
        image_updated_by: null,
        image_updated_at: null,
        group_created_at: null,
        is_admin: 0,
        last_message_sent_at: null,
        is_left: 0,
        left_at: null,
        is_blocked: 0,
        blocked_by: null,
        blocked_at: null,
        is_active: 1,
        is_faq: true,
        subtitle: "FAQ",
    },

    faqGroupDataEn: {
        pk: null,
        group_id: "study_group_faq",
        group_name: "Doubtnut Tips",
        group_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BB493695-5BE4-AA8E-A588-031296559E2F.webp",
        image_updated_by: null,
        image_updated_at: null,
        group_created_at: null,
        is_admin: 0,
        last_message_sent_at: null,
        is_left: 0,
        left_at: null,
        is_blocked: 0,
        blocked_by: null,
        blocked_at: null,
        is_active: 1,
        is_faq: true,
        subtitle: "FAQ",
    },

    faqGroupDataHiV2: {
        widget_type: "widget_sg_group_chat",
        widget_data: {
            pk: null,
            group_id: "study_group_faq",
            group_name: "डाउटनट टिप्स",
            group_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BB493695-5BE4-AA8E-A588-031296559E2F.webp",
            deeplink: "doubtnutapp://study_group/chat?group_id=study_group_faq&is_faq=true",
            image_updated_by: null,
            image_updated_at: null,
            group_created_at: null,
            is_admin: 0,
            last_message_sent_at: null,
            is_left: 0,
            left_at: null,
            is_blocked: 0,
            blocked_by: null,
            blocked_at: null,
            is_active: 1,
            is_faq: true,
            subtitle: "FAQ",
        },
    },

    faqGroupDataEnV2: {
        widget_type: "widget_sg_group_chat",
        widget_data: {
            pk: null,
            group_id: "study_group_faq",
            group_name: "Doubtnut Tips",
            group_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BB493695-5BE4-AA8E-A588-031296559E2F.webp",
            deeplink: "doubtnutapp://study_group/chat?group_id=study_group_faq&is_faq=true",
            image_updated_by: null,
            image_updated_at: null,
            group_created_at: null,
            is_admin: 0,
            last_message_sent_at: null,
            is_left: 0,
            left_at: null,
            is_blocked: 0,
            blocked_by: null,
            blocked_at: null,
            is_active: 1,
            is_faq: true,
            subtitle: "FAQ",
        },
    },

    profaneGroupNameEn: "This group name is violating Doubtnut Guidelines.",
    profaneGroupNameHi: "यह समूह नाम डाउटनट दिशानिर्देशों का उल्लंघन कर रहा है।",

    defaultGroupImage: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6BDD71CB-EAF8-E751-0EBB-24FB01937BAE.webp",
    // defaultGroupImage: null,
    reportReasons: {
        hi: {
            title: "रिपोर्ट करने का कारण चुनें-:",
            reasons: ["सेक्शुअल कॉन्टेंट एवं नग्नता",
                "हिंसात्मक एवं अप्रिय",
                "अनुचित एवं अपमानजनक",
                "हानिकारक एवं असुरक्षित",
                "स्पैम एवं भ्रामक"],
            other_reason: "अन्य",
            primary_cta: "रिपोर्ट करें",
            secondary_cta: "कैंसिल करें",
            others_container: {
                primary_cta: "दर्ज करें",
                secondary_cta: "कैंसिल",
                placeholder: "रिपोर्ट करने का कारण लिखें",
                heading: "रिपोर्ट भेजें",
            },
        },
        en: {
            title: "Select reason for reporting-",
            reasons: ["Sexual Content or Nudity",
                "Violent or repulsive content",
                "Hateful or abusive content",
                "Harmful or dangerous act",
                "Spam or misleading content"],
            primary_cta: "Report",
            secondary_cta: "Cancel",
            other_reason: "Other",
            others_container: {
                primary_cta: "Submit",
                secondary_cta: "Cancel",
                placeholder: "Write reasons for reporting",
                heading: "Send Report",
            },
        },
    },
    reportPopup: {
        image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/A7B6457E-A8D8-D90B-D0D2-3DE18627E32A.webp",
        // if type  = 0 - group
        //    type = 1 - member
        // warning level
        message: {
            en: {
                heading: "You got reported for posting inappropriate content on the group",
                description: "This is a warning that your posts are being reviewed and you might get blocked from the group.Ensure that you follow all group guidelines in future",
                cta_text: "I will follow all guidelins",
                event: "sg_user_reported",
                can_skip: true,
                can_access_chat: true,
                can_request_for_review: false,
                type: 1,
            },
            hi: {
                heading: "ग्रुप में अनुपयुक्त कॉन्टेंट पोस्ट करने के लिए आपको रिपोर्ट किया गया है",
                description: "यह एक चेतावनी है! आपके सभी पोस्ट का परीक्षण किया जा रहा है, इसके बाद आपको ग्रुप से ब्लॉक भी किया जा सकता है। सुनिश्चित करें कि आप भविष्य में ग्रुप के सभी दिशानिर्देशों का पालन करेंगे।",
                cta_text: "मैं सभी दिशानिर्देशों का पालन करूँगा/करूंगी",
                event: "sg_user_reported",
                can_skip: true,
                can_access_chat: true,
                can_request_for_review: false,
                type: 1,
            },
        },
        member: {
            en: {
                heading: "You got reported for posting inappropriate content on the group",
                description: "This is a warning that your posts are being reviewed and you might get blocked from the group.Ensure that you follow all group guidelines in future",
                cta_text: "I will follow all guidelins",
                event: "sg_user_reported",
                can_skip: true,
                can_access_chat: true,
                can_request_for_review: false,
                type: 1,
            },
            hi: {
                heading: "ग्रुप में अनुपयुक्त कॉन्टेंट पोस्ट करने के लिए आपको रिपोर्ट किया गया है",
                description: "यह एक चेतावनी है! आपके सभी पोस्ट का परीक्षण किया जा रहा है, इसके बाद आपको ग्रुप से ब्लॉक भी किया जा सकता है। सुनिश्चित करें कि आप भविष्य में ग्रुप के सभी दिशानिर्देशों का पालन करेंगे।",
                cta_text: "मैं सभी दिशानिर्देशों का पालन करूँगा/करूंगी",
                event: "sg_user_reported",
                can_skip: true,
                can_access_chat: true,
                can_request_for_review: false,
                type: 1,
            },
        },
        group: {
            en: {
                heading: "Your group got reported for posting inappropriate content",
                description: "This is a warning that the posts are being reviewed and the group might be disabled.Group Admin is responsible for ensuring that all members follow group guidelines.",
                cta_text: "Okay",
                event: "sg_user_reported",
                can_skip: true,
                can_access_chat: true,
                can_request_for_review: false,
                type: 0,
            },
            hi: {
                heading: "अनुपयुक्त कॉन्टेंट पोस्ट करने के लिए आपके ग्रुप को रिपोर्ट किया गया है",
                description: "यह एक चेतावनी है! सभी पोस्ट का परीक्षण किया जा रहा है, इसके बाद ग्रुप को बंद भी किया जा सकता है। ग्रुप एडमिन की ज़िम्मेदारी है कि वह सुनिश्चित करें कि ग्रुप के सभी सदस्य दिशानिर्देशों का पालन करें",
                cta_text: "ठीक है",
                event: "sg_user_reported",
                can_skip: true,
                can_access_chat: true,
                can_request_for_review: false,
                type: 0,
            },
        },
        // banned state
        groupBanned: {
            // status = 0
            en: {
                heading: "This group has been disabled for violating guidelines of Doubtnut",
                description: null,
                cta_text: "Request for review",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: true,
                type: 0,
            },
            hi: {
                heading: "दिशानिर्देशों का उल्लंघन करने हेतु इस ग्रुप को बंद कर दिया गया है",
                description: null,
                cta_text: "समीक्षा के लिए अनुरोध करें",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: true,
                type: 0,
            },
        },
        groupRequested: {
            // status = 1
            en: {
                heading: "This group has been disabled for violating guidelines of Doubtnut",
                description: "Review request is under process.",
                cta_text: "Okay",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: false,
                type: 0,
            },
            hi: {
                heading: "दिशानिर्देशों का उल्लंघन करने हेतु इस ग्रुप को बंद कर दिया गया है",
                description: "समीक्षा अनुरोध प्रक्रियाधीन है।",
                cta_text: "ठीक है",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: false,
                type: 0,
            },
        },
        groupRejected: {
            // status = 3
            en: {
                heading: "This group has been disabled for violating guidelines of Doubtnut",
                description: "Review request is rejected.",
                cta_text: "Okay",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: false,
                type: 0,
            },
            hi: {
                heading: "दिशानिर्देशों का उल्लंघन करने हेतु इस ग्रुप को बंद कर दिया गया है",
                description: "समीक्षा अनुरोध अस्वीकार कर दिया गया है।",
                cta_text: "ठीक है",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: false,
                type: 0,
            },
        },
        // member banned stage
        memberBanned: {
            en: {
                heading: "Study groups are not available for you as you have been reported by multiple users.",
                description: null,
                cta_text: "Request for review",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: true,
                type: 1,
            },
            hi: {
                heading: "आपके लिए स्टडी ग्रुप उपलब्ध नहीं हैं क्योंकि आपको कई उपयोगकर्ताओं द्वारा रिपोर्ट किया गया है",
                description: null,
                cta_text: "समीक्षा के लिए अनुरोध करें",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: true,
                type: 1,
            },
        },
        memberRequested: {
            en: {
                heading: "Study groups are not available for you as you have been reported by multiple users.",
                description: "Review request is under process.",
                cta_text: "Okay",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: false,
                type: 1,
            },
            hi: {
                heading: "आपके लिए स्टडी ग्रुप उपलब्ध नहीं हैं क्योंकि आपको कई उपयोगकर्ताओं द्वारा रिपोर्ट किया गया है",
                description: "समीक्षा अनुरोध प्रक्रियाधीन है।",
                cta_text: "ठीक है",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: false,
                type: 1,
            },
        },
        memberRejected: {
            en: {
                heading: "Study groups are not available for you as you have been reported by multiple users.",
                description: "Review request is rejected.",
                cta_text: "Okay",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: false,
                type: 1,
            },
            hi: {
                heading: "आपके लिए स्टडी  ग्रुप  उपलब्ध नहीं हैं क्योंकि आपको कई उपयोगकर्ताओं द्वारा रिपोर्ट किया गया है",
                description: "समीक्षा अनुरोध अस्वीकार कर दिया गया है।",
                cta_text: "ठीक है",
                event: "sg_user_reported",
                can_skip: false,
                can_access_chat: false,
                can_request_for_review: false,
                type: 1,
            },
        },
    },
    mute: {
        groupLevelMute: {
            en: "Group has been muted successfully",
            hi: "समूह को म्यूट कर दिया गया है|",
        },
        groupLevelUnmute: {
            en: "Group has been un-muted successfully",
            hi: "समूह को अन-म्यूट कर दिया गया है|",
        },
        featureLevelMute: {
            en: "Feature has been muted successfully",
            hi: "फ़ीचर को म्यूट कर दिया गया है",
        },
        featureLevelUnMute: {
            en: "Feature has been un-muted successfully",
            hi: "फ़ीचर को अन-म्यूट कर दिया गया है|",
        },
    },
    createGroupError: {
        profane: {
            en: "Inappropriate words not allowed in group name",
            hi: "ग्रुप के नाम में अनुपयुक्त शब्दों की अनुमति नहीं है",
        },
        maxReached: {
            en: "You are not eligible to create group",
            hi: "आप ग्रुप बनाने के योग्य नहीं हैं",
        },
        exception: {
            en: "Oops! Group can not be created now, Please try after sometime.",
            hi: "अभी ग्रुप नहीं बनाया गया। कृपया पुनः प्रयास करें।",
        },
        invalidGroupName: {
            en: "Special Characters are not allowed in group names, Please type only letters & numbers.",
            hi: "Special Characters are not allowed in group names, Please type only letters & numbers.",
        },
        duplicateGroupName: {
            en: "A group with this name already exists. Try Another?",
            hi: "ईस नाम से ग्रुप बना हुआ है, कृपया कोई और नाम से ग्रुप बनाएं !",
        },
    },

    deactivatedGroup: {
        pk: 0,
        group_id: null,
        group_name: "Group Deactivated",
        group_image: null,
        group_created_at: null,
        subtitle: null,
    },
    deactivatedGroupMessage: {
        en: "Sorry, this group is not available.",
        hi: "क्षमा करें, यह ग्रुप उपलब्ध नहीं है।",
    },

    groupInfo: {
        onlySubAdminCanPostMessage: {
            en: "Only Admin/Sub-Admin can post.",
            hi: "एडमिन/सब-एडमिन ही पोस्ट कर सकेंगे",
        },

        OnlySubAdminCanPostContainer: {
            en: {
                title: "Allow only admin/Sub Admin to post ",
                more_info: "Admin is the owner of this group and he can make sub admin to people in groups who has power to block and remove people from group",
                toggle: false,
            },
            hi: {
                title: "पोस्ट करने के लिए केवल एडमिन/सब-एडमिन को अनुमति दें ",
                more_info: "एडमिन अपने ग्रुप में से किसी को भी सब-एडमिन बना सकता है, जो ग्रुप से किसी को भी निकाल और ब्लॉक कर सकता है",
                toggle: false,
            },
        },

        memberTitle: {
            enSingle: "Member({members})",
            en: "Members({members})",
            hi: "सदस्य({members})",
        },

        title: {
            en: "Group Info",
            hi: "ग्रुप की जानकारी",
        },
    },

    messageRestrictions: {
        on: {
            en: "Only Admin/Sub-Admins can post.",
            hi: "केवल एडमिन/सब-एडमिन ही पोस्ट कर सकते हैं।",
        },
        off: {
            en: "All the members can post.",
            hi: "सभी सदस्य पोस्ट कर सकते हैं।",
        },
    },

    subAdmin: {
        make: {
            en: "New Sub admin added",
            hi: "नया सब-एडमिन बन गया",
        },

        remove: {
            en: "Sub admin removed",
            hi: "सब-एडमिन हट गया",
        },
    },

    createGroupTypeWise: {
        group_create_heading: {
            en: "Create your Group",
            hi: "अपना ग्रुप बनाएं",
        },
        cta: {
            en: "Create Group",
            hi: "ग्रुप बनाएं",
        },
    },

    listGroups: {
        pendingGroup: {
            title: {
                en: "Study Group Invites ",
                hi: "स्टडी ग्रुप इन्वाइट ",
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
                    deeplink: "doubtnutapp://study_group?screen=group_invites",
                },
            },
        },

        cta: {
            en: "Create New Group",
            hi: "नया ग्रुप बनाएं",
        },
        shareCta: {
            en: "Share",
            hi: "शेयर",
        },
        title: {
            en: "Study Group",
            hi: "स्टडी ग्रुप",
        },
        joinGroupTitle: {
            en: "Join Groups",
            hi: "ग्रुप जॉइन करें",
        },
        createGroupDeeplink: "doubtnutapp://study_group/create_group",
        deeplink: "doubtnutapp://study_group/chat?group_id={groupId}&is_faq=false",
        new_group_container: {
            en: {
                title: "Join New Groups",
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/60BD5E59-7DE4-F282-8818-BB83F5E0905F.webp",
                deeplink: "doubtnutapp://study_group?screen=public_groups",
            },
            hi: {
                title: "नया ग्रुप जॉइन करें",
                image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/60BD5E59-7DE4-F282-8818-BB83F5E0905F.webp",
                deeplink: "doubtnutapp://study_group?screen=public_groups",
            },
        },
    },

    pendingGroupInvitePage: {
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
                secondary_cta_deeplink: "",
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
            primary_cta_deeplink: "doubtnutapp://study_group/join_group?group_id={groupId}&inviter={inviter}",
            secondary_cta_deeplink: "doubtnutapp://study_group/reject?group_id={groupId}&inviter={inviter}",
            deeplink: "doubtnutapp://study_group/chat?group_id={groupId}&is_faq=false",
            secondary_cta: {
                en: "Ignore",
                hi: "अनदेखा करें",
            },
            invited_by: {
                en: "Invited by: ",
                hi: "आमंत्रणकर्ता: ",
            },
        },
        title: {
            en: "Group Invites",
            hi: "ग्रुप इन्वाइट",
        },
    },

    no_group_container: {
        en: {
            title: "Hey, Welcome to Doubtnut Study Group",
            subtitle: "Now Create your own study group or join any public group to chat!!",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/93E85408-4200-C418-26CE-99A8DEB83BB8.webp", // Study group logo
        },
        hi: {
            title: "हे! डाउटनट स्टडी ग्रुप में आपका स्वागत है|",
            subtitle: "अब चैट करने के लिए अपना स्वयं का स्टडी ग्रुप बनाएं या कोई भी पब्लिक ग्रुप जॉइन करें!!",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/93E85408-4200-C418-26CE-99A8DEB83BB8.webp",
        },
    },

    no_group_found_container: {
        en: {
            title: "No Results Found",
            subtitle: "No any group with this name, try looking for groups with another name",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B4A0AD62-F496-1B81-19BD-903B04C4CAB5.webp",
        },
        hi: {
            title: "कोई रिजल्ट नहीं मिला",
            subtitle: "इस नाम का कोई ग्रुप नहीं मिला, अन्य नाम से ग्रुप ढूंढने की कोशिश करें",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B4A0AD62-F496-1B81-19BD-903B04C4CAB5.webp",
        },
    },

    no_invites_container: {
        en: {
            title: "No Invites Found",
            subtitle: "You don't have any new invites",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B4A0AD62-F496-1B81-19BD-903B04C4CAB5.webp",
        },
        hi: {
            title: "कोई आमंत्रण नहीं मिला",
            subtitle: "आपके पास कोई नया आमंत्रण नहीं है",
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B4A0AD62-F496-1B81-19BD-903B04C4CAB5.webp",
        },
    },
    search: {
        group: {
            en: "Search Groups",
            hi: "ग्रुप खोजें",
        },
        people: {
            en: "Search People",
            hi: "लोगों को खोजें",
        },
    },

    no_group_to_invite: {
        en: {
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/93E85408-4200-C418-26CE-99A8DEB83BB8.webp",
            title: "You are not added to any study group.",
            subtitle: "Please join some study groups, then invite friends to those groups",
            cta_text: "Join study groups",
            deeplink: "doubtnutapp://study_group/list?tab_position=1",
        },
        hi: {
            image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/93E85408-4200-C418-26CE-99A8DEB83BB8.webp",
            title: "आप किसी स्टडी ग्रुप में शामिल नहीं है",
            subtitle: "कुछ स्टडी ग्रुप्स को ज्वाइन करके के बाद दोस्त को उन ग्रुप्स में शामिल कीजिए",
            cta_text: "ज्वाइन स्टडी ग्रुप्स",
            deeplink: "doubtnutapp://study_group/list?tab_position=1",
        },
    },
    popularGroupTitle: {
        en: "POPULAR GROUPS",
        hi: "लोकप्रिय ग्रुप",
    },
    recommendedGroupTitle: {
        en: "RECOMMENDED GROUPS",
        hi: "सुझावित ग्रुप",
    },
    suggestedGroupTitle: {
        en: "OTHER SUGGESTED GROUPS",
        hi: "अन्य सुझावित ग्रुप",
    },
    todaySpecialGroupTitle: {
        en: "POPULAR GROUPS TO JOIN",
        hi: "शामिल होने के लिए लोकप्रिय ग्रुप",
    },
    myGroups: {
        en: "My Groups",
        hi: "मेरे ग्रुप",
    },
    viewAll: {
        en: "View all",
        hi: "सभी देखें",
    },
    allGroups: {
        en: "All Groups",
        hi: "सभी ग्रुप",
    },
    joinNewGroups: {
        en: "New Groups to Join",
        hi: "नए ग्रुप में शामिल हों",
    },
    joinNewGroupContainer: {
        type: "widget_join_new_studygroup",
        data: {
            title: "Join New Groups",
            deeplink: "doubtnutapp://study_group?screen=public_groups",
            type: "widget_join_new_studygroup",
        },
    },
    profanityImageStructure: {
        widget_data: {
            title: "This image has been deleted for violating Doubtnut Guidelines.",
        },
        widget_type: "text_widget",
    },
    gifDisable: {
        is_gif_enabled: false,
        message: "Sending GIF is not allowed. Try Again.",
    },
    groupNamePrefixes: {
        1: "sg",
        2: "pg",
        5: "spt",
    },
    dnSupportIcon: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/415D241B-E971-E504-4213-07EAE0A7EA5B.webp",
    dnSupportFirstMessage: "Hello there! Need help?\nReach out to us right here, and we'll get back to you as soon as we can!",
    dnSupportFirstMessageStructure:
        {
            is_message: false,
            message: {
                widget_data: {
                    group_guideline: "Nameste student,\n\nYahan aap Doubtnut admissions team se baat kar sakte ho.\n\nAap kaunsa course khareedna chahte hain?",
                    title: "Admissions Team",
                    _id: "0",
                    student_img_url: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6BDD71CB-EAF8-E751-0EBB-24FB01937BAE.webp",
                },
                widget_type: "widget_study_group_guideline",
            },
            room_id: "pg-23c2cfbb-6048-4c9e-9f14-17aa333b44d2",
            room_type: "public_groups",
            student_id: 98,
            cdn_url: "https://d10lpgp6xz60nq.cloudfront.net/",
            is_profane: false,
            is_active: true,
            is_deleted: false,
            is_admin: false,
            created_at: null,
            updated_at: null,
        },
    promotedGroupDetails: {
        11: [{
            11101: ["pg-f3124de9-6d50-4d5f-8740-0f301acd6422"],
            11103: ["pg-2172668b-10fb-419d-937f-eb874c94a3be"],
        },
        {
            11101: ["pg-6764f687-e6ed-48e5-9614-5ffb682c3f99"],
        },
        {
            11111: ["pg-6764f687-e6ed-48e5-9614-5ffb682c3f99"],
            11480: ["pg-6764f687-e6ed-48e5-9614-5ffb682c3f99"],
        }],
        12: [{
            11201: ["pg-f3124de9-6d50-4d5f-8740-0f301acd6422"],
            11203: ["pg-2172668b-10fb-419d-937f-eb874c94a3be"],
        }],
        13: [{
            11301: ["pg-f3124de9-6d50-4d5f-8740-0f301acd6422"],
            11303: ["pg-2172668b-10fb-419d-937f-eb874c94a3be"],
        }],
        10: ["pg-a2537a04-d791-4028-99b3-7021403cba59", "pg-c2a9c8e8-a0ec-4e4f-b979-10868ceb50fe", "pg-104e8e2f-ad35-47c8-a926-5515969b1b47"],
        9: ["pg-a2537a04-d791-4028-99b3-7021403cba59", "pg-c2a9c8e8-a0ec-4e4f-b979-10868ceb50fe"],
        8: ["pg-0d651f4d-e248-498a-9cb1-a6422f5d208d"],
        7: ["pg-0d651f4d-e248-498a-9cb1-a6422f5d208d"],
        6: ["pg-0d651f4d-e248-498a-9cb1-a6422f5d208d"],
    },
    promotedGroupDetailsTest: {
        11: [{
            11101: ["pg-3a4c9dc6-9fff-4584-b16b-d9a3a74d61de"],
            11103: ["pg-550da18a-9a88-4cd6-a0e1-85d67d620328"],
        },
        {
            11101: ["pg-b5674fae-8e11-4103-aa13-95ff0d390efa"],
        },
        {
            11111: ["pg-b5674fae-8e11-4103-aa13-95ff0d390efa"],
            11480: ["pg-b5674fae-8e11-4103-aa13-95ff0d390efa"],
        }],
        12: [{
            11201: ["pg-3a4c9dc6-9fff-4584-b16b-d9a3a74d61de"],
            11203: ["pg-550da18a-9a88-4cd6-a0e1-85d67d620328"],
        }],
        13: [{
            11301: ["pg-3a4c9dc6-9fff-4584-b16b-d9a3a74d61de"],
            11303: ["pg-550da18a-9a88-4cd6-a0e1-85d67d620328"],
        }],
        10: ["pg-83695537-8934-445b-86fa-ba39f12d5642", "pg-03fc0baa-8ba4-4d3c-9002-0765cf62dfd4", "pg-b5de2dcc-ca2f-4ce0-90d9-652934c96b8e"],
        9: ["pg-83695537-8934-445b-86fa-ba39f12d5642", "pg-03fc0baa-8ba4-4d3c-9002-0765cf62dfd4"],
        8: ["pg-39ed887d-1f08-4dac-a878-35994e69f235"],
        7: ["pg-39ed887d-1f08-4dac-a878-35994e69f235"],
        6: ["pg-39ed887d-1f08-4dac-a878-35994e69f235"],
    },
    nonExamClasses: [6, 7, 8, 9, 10],
    examClasses: [11, 12, 13],
    dnSupportAdminIds: [27904726],
    dnSupportExecutiveIds: [52701280, 28752649],
    dnSupportQAId: 222022933,
    // dnSupportExecutiveIds: [60385821, 24593286, 72487696, 23261940, 81692214, 212673673],
    lastSentMessageForSupport: "DN Support Requested",
};
