export default {

    text: {
        message: {
            widget_data: {
                child_widget: {
                    widget_data: {
                        title: "", // content
                    },
                    widget_type: "text_widget",
                },
                created_at: null,
                type: 2,
                student_img_url: "https://d10lpgp6xz60nq.cloudfront.net/images/engagement_framework/BAB19F80-76DF-9E93-E436-E45B58A67096.webp",
                sender_detail: "Sent by Doubtnut",
                widget_display_name: "text_widget",
                cta_text: null,
                deeplink: null,
            },
            widget_type: "widget_study_group_parent",
        },
    },

    image: {
        message: {
            widget_data: {
                child_widget: {
                    widget_data: {
                        question_image: "", // https://d10lpgp6xz60nq.cloudfront.net/images/sg_thumbnail_81692214_1629178584.jpeg_study_group_81692214_1629178584.jpeg
                        deeplink: "doubtnutapp://full_screen_image?ask_que_uri={link}&title=",
                        id: "question",
                        card_ratio: "16:9",
                    },
                    widget_type: "widget_asked_question",
                },
                created_at: null,
                student_img_url: "https://d10lpgp6xz60nq.cloudfront.net/images/upload_45917205_1619087619.png",
                title: "", // content
                sender_detail: "Sent by Doubtnut",
                widget_display_name: "Image",
                cta_text: null,
                deeplink: null,
            },
            widget_type: "widget_study_group_parent",
        },
    },

    video: {
        message: {
            widget_data: {
                child_widget: {
                    widget_data: {
                        thumbnail_url: "", // https://d10lpgp6xz60nq.cloudfront.net/images/sg_thumbnail_81692214_1629178584.jpeg_study_group_81692214_1629178584.jpeg
                        video_url: "", // https://d10lpgp6xz60nq.cloudfront.net/images/VID_1629178570867_study_group_81692214_1629178607.mp4
                        deeplink: "doubtnutapp://video_url?url={link}", // doubtnutapp://video_url?url=https://d10lpgp6xz60nq.cloudfront.net/images/VID_1629178570867_study_group_81692214_1629178607.mp4
                        id: "sg_video_card",
                        max_thumbnail_height: 350,
                    },
                    widget_type: "sg_video_card",
                },
                created_at: null,
                type: 2,
                student_img_url: "https://d10lpgp6xz60nq.cloudfront.net/images/engagement_framework/BAB19F80-76DF-9E93-E436-E45B58A67096.webp",
                title: "", // content
                sender_detail: "Sent by Doubtnut",
                widget_display_name: "Video",
                cta_text: null,
                deeplink: null,
            },
            widget_type: "widget_study_group_parent",
        },
    },

    audio: {
        message: {
            widget_data: {
                child_widget: {
                    widget_data: {
                        attachment: "", // https://d10lpgp6xz60nq.cloudfront.net/images/file_example_MP3_700KB_study_group_81692214_1629178692.mp3
                        audio_duration: null, // 27252
                    },
                    widget_type: "widget_audio_player",
                },
                created_at: null,
                type: 2,
                student_img_url: "https://d10lpgp6xz60nq.cloudfront.net/images/engagement_framework/BAB19F80-76DF-9E93-E436-E45B58A67096.webp",
                title: "", // content
                sender_detail: "Sent by Doubtnut",
                widget_display_name: "Audio Player",
                cta_text: null,
                deeplink: null,
            },
            widget_type: "widget_study_group_parent",
        },
    },

    common: {
        room_id: null,
        room_type: "study_group",
        is_active: true,
        is_deleted: false,
        is_admin: false,
    },
};
