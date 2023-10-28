export default {
    title: {
        message: {
            en: "This message from {name} got reported by {reports} members.",
            hi: "{name} का यह संदेश {reports} सदस्यों द्वारा रिपोर्ट किया गया|",
        },
        member: {
            en: "{name} got reported by {reports} members.",
            hi: "{name} {reports} सदस्यों द्वारा रिपोर्ट किया गया|",
        },
        group: {
            en: "Your Group has been reported by {reports} members.",
            hi: "आपके ग्रुप को {reports} सदस्यों द्वारा रिपोर्ट किया गया है|",
        },
    },
    warning_message: {
        en: "As an admin it’s your responsibility to follow all the group guideline and take necessary actions.",
        hi: "एक ग्रुप एडमिन के रूप में आपकी ज़िम्मेदारी है कि आप ग्रुप के सभी दिशानिर्देशों का पालन करें और सभी ज़रूरी कदम उठाएं|",
    },
    reason: {
        title: {
            en: "Reasons Mentioned by Members",
            hi: "सदस्यों द्वारा दिए गए कारण",
        },
    },
    view_more: {
        title: {
            en: "View all {number} reported messages from {name}",
            hi: "View all {number} reported messages from {name}",
        },
        deeplink: "doubtnutapp://study_group_v2/student_reported_message?group_id={room_id}&reported_student_id={student_id}&reported_student_name={name}",
        deeplinkV2: "doubtnutapp://study_group/student_reported_message?group_id={room_id}&reported_student_id={student_id}&reported_student_name={name}",
    },
    delete_cta: {
        title: {
            en: "Delete Message",
            hi: "संदेश डिलीट करें",
        },
        action: "DELETE",
        event: "DELETE",
        pop_up: {
            title: {
                en: "Are you sure you want to delete this message of {name}?",
                hi: "क्या आप वाकई {name} के यह संदेश को हटाना चाहते हैं?",
            },
            subtitle: {
                en: "You will not be able to restore deleted messages later.",
                hi: "आप बाद में हटाए गए संदेशों को पुनर्स्थापित नहीं कर पाएंगे|",
            },
            primary_cta: {
                en: "Delete",
                hi: "डिलीट",
            },
            secondary_cta: {
                en: "Cancel",
                hi: "रद्द करें",
            },
        },
    },
    delete_multiple_cta: {
        title: {
            en: "Delete All Messages",
            hi: "सभी संदेश डिलीट करें",
        },
        action: "DELETE_ALL",
        event: "DELETE_ALL",
        pop_up: {
            title: {
                en: "Are you sure you want to delete all messages of {name}?",
                hi: "क्या आप वाकई {name} के सभी संदेशों को हटाना चाहते हैं?",
            },
            subtitle: {
                en: "You will not be able to restore deleted messages later.",
                hi: "आप बाद में हटाए गए संदेशों को पुनर्स्थापित नहीं कर पाएंगे|",
            },
            primary_cta: {
                en: "Delete",
                hi: "डिलीट",
            },
            secondary_cta: {
                en: "Cancel",
                hi: "रद्द करें",
            },
        },
    },
    block_cta: {
        title: {
            en: "Block User",
            hi: "यूज़र को ब्लॉक करें",
        },
        action: "BLOCK",
        event: "BLOCK",
        pop_up: {
            title: {
                en: "Are you sure you want to block {name}?",
                hi: "क्या आप वाकई {name} को ब्लॉक करना चाहते हैं?",
            },
            subtitle: {
                en: "Member will not be able to join the group again and all reported messages of the user will be deleted.",
                hi: "सदस्य फिर से ग्रुप में शामिल नहीं हो पाएगा और उपयोगकर्ता के सभी रिपोर्ट किए गए संदेशों को हटा दिया जाएगा।",
            },
            primary_cta: {
                en: "Block",
                hi: "ब्लॉक",
            },
            secondary_cta: {
                en: "Cancel",
                hi: "रद्द करें",
            },
        },
    },
    block_multiple_cta: {
        title: {
            en: "Block Users",
            hi: "यूज़र को ब्लॉक करें",
        },
        deeplink: "doubtnutapp://study_group_v2/info?group_id={room_id}",
        deeplinkV2: "doubtnutapp://study_group/info?group_id={room_id}",
    },
    dashboardDeeplink: "doubtnutapp://study_group/dashboard?group_id={room_id}",
    stickyBar: {
        message: {
            en: "Message from {name} got reported. Please review.",
            hi: "{name} के संदेश को रिपोर्ट किया गया है। समीक्षा करें।",
        },
        member: {
            en: "{name} got reported by group member. Please review.",
            hi: "{name} को ग्रुप के सदस्य ने रिपोर्ट किया है। समीक्षा करें।",
        },
        group: {
            en: "Your group got reported. Please review.",
            hi: "आपके ग्रुप को रिपोर्ट किया गया है। समीक्षा करें।",
        },
    },
};
