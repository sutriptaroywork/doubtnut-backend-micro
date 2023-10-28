/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import SettingsService from "../settings";
import studyGroupData from "../../data/report.data";

const StudyGroupResponseStructureService: ServiceSchema = {
    name: "$studygroup-response-structure",
    mixins: [SettingsService],
    methods: {

        ctaButtonResponse(ctaType, studentName, ctx) {
            return {
                title: ctx.user.locale === "hi" ? studyGroupData[ctaType].title.hi : studyGroupData[ctaType].title.en,
                action: studyGroupData[ctaType].action,
                event: studyGroupData[ctaType].event,
                confirmation_popup: {
                    title: (ctx.user.locale === "hi" ? studyGroupData[ctaType].pop_up.title.hi : studyGroupData[ctaType].pop_up.title.en).replace("{name}", studentName),
                    subtitle: ctx.user.locale === "hi" ? studyGroupData[ctaType].pop_up.subtitle.hi : studyGroupData[ctaType].pop_up.subtitle.en,
                    primary_cta: ctx.user.locale === "hi" ? studyGroupData[ctaType].pop_up.primary_cta.hi : studyGroupData[ctaType].pop_up.primary_cta.en,
                    secondary_cta: ctx.user.locale === "hi" ? studyGroupData[ctaType].pop_up.secondary_cta.hi : studyGroupData[ctaType].pop_up.secondary_cta.en,
                },
            };
        },

        messageResponse(messageData: any, pageType: string, ctx: any) {

            const actualName = this.settings.getCorrectedName(messageData.message.widget_data.title);
            let studentName = actualName;
            let isAdmin = false;
            if (messageData.student_id === ctx.user.id) {
                studentName = ctx.user.locale === "hi" ? "आप" : "you";
                isAdmin = true;
            }

            const title = (ctx.user.locale === "hi" ? studyGroupData.title.message.hi : studyGroupData.title.message.en).replace("{reports}", messageData.reports).replace("{name}", studentName);
            const containerData = {
                container_id: messageData._id,
                container_type: "message",
            };
            messageData.message.widget_data.type = 1;
            const childWidget = messageData.message;
            childWidget.room_id = messageData.room_id;
            childWidget.room_type = messageData.room_type;
            childWidget.student_id = messageData.student_id;
            childWidget.cdn_url = messageData.cdn_url;
            childWidget.created_at = messageData.created_at;
            childWidget.updated_at = messageData.updated_at;
            childWidget.is_active = messageData.is_active;
            childWidget.is_deleted = messageData.is_deleted;
            childWidget.is_admin = messageData.is_admin;

            const primaryCta = this.ctaButtonResponse("delete_cta", studentName, ctx);
            primaryCta.message_id = messageData._id;

            let isViewMoreAvailable = false;
            let viewMoreContainer = null;

            let secondaryCta = null;

            if (pageType === "dashboard") {
                if (messageData.reported_messages > 1) {
                    isViewMoreAvailable = true;
                    viewMoreContainer = {
                        title: (ctx.user.locale === "hi" ? studyGroupData.view_more.title.hi : studyGroupData.view_more.title.en).replace("{number}", messageData.reported_messages).replace("{name}", studentName),
                        deeplink:(parseInt(ctx.versionCode, 10) >= 946 ? studyGroupData.view_more.deeplinkV2 : studyGroupData.view_more.deeplink).replace("{room_id}", messageData.room_id).replace("{student_id}", messageData.student_id).replace("{name}", actualName),
                    };
                }

                if (!isAdmin) {
                    secondaryCta = this.ctaButtonResponse("block_cta", studentName, ctx);
                    secondaryCta.sender_id = messageData.student_id;
                }
            }

            const viewMore = {
                isViewMoreAvailable,
                viewMoreContainer,
            };


            return {
                title,
                containerData,
                childWidget,
                primaryCta,
                secondaryCta,
                viewMore,
                studentName,
            };
        },

        responseStructure(data, ctx) {
            const widgetData = {
                child_widget: data.childWidget,
                title: data.title,
                warning_message: data.warningMessage,
                reason: {
                    title: ctx.user.locale === "hi" ? studyGroupData.reason.title.hi : studyGroupData.reason.title.en,
                    reasons: data.reasons,
                },
                reported_at: data.reportedAt,
                is_view_more_available: data.viewMore.isViewMoreAvailable,
                view_more_container: data.viewMore.viewMoreContainer,
                primary_cta: data.primaryCta,
                secondary_cta: data.secondaryCta,
                container_id: data.containerData.container_id,
                container_type: data.containerData.container_type,
                student_id: data.student_id,
                student_name: data.studentName,
            };
            return {
                widget_data: widgetData,
                widget_type: "widget_study_group_report_parent",
            };
        },
    },
};

export = StudyGroupResponseStructureService;
