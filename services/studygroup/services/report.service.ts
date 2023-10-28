import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";
import {ServiceSchema} from "dn-moleculer";
import StudyGroupReportService from "../methods/reporting/report";
import StudyGroupReportDashboardService from "../methods/reporting/dashboard";

const ReportService: ServiceSchema = {
    name: "studygroupReport",
    mixins: [DbService, StudyGroupReportService, StudyGroupReportDashboardService],
    adapter: new MongoDBAdapter(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}),
    collection: "chatroom_messages",
    hooks: {
        before: {
            // The hook will call the `resolveLoggedUser` method.
            "*": "resolveLoggedUser",
        },
    },

    /**
     * Actions
     */
    actions: {

        // reporting Message
        reportMessage: {
            rest: {
                method: "POST",
                path: "/report-message",
            },
            params: {
                /** Input data : [room_id, message_id, reported_by, reported_at, updated_at, reason, is_removed, is_action_taken, action, room_type, millis] */
            },
            async handler(request: any) {
                this.reportMessage(request.params, request.meta);
                return {
                    meta: this.settings.successResponse,
                };
            },
        },

        // reporting Member
        reportMember: {
            rest: {
                method: "POST",
                path: "/report-member",
            },
            params: {
                /** Input data : [room_id, reported_by, reported_student_id, reported_at, updated_at, reason, is_removed, is_action_taken, action, room_type, reported_student_name] */
            },
            async handler(request: any) {
                this.reportMember(request.params, request.meta);
                return {
                    meta: this.settings.successResponse,
                };
            },
        },

        // reporting Group
        reportGroup: {
            rest: {
                method: "POST",
                path: "/report-group",
            },
            params: {
                /** Input data : [room_id, admin_id, reported_by, reported_at, updated_at, reason, is_removed, is_action_taken, action, room_type] */
            },
            async handler(request: any) {
                this.reportGroup(request.params, request.meta);
                return {
                    meta: this.settings.successResponse,
                };
            },
        },

        // Dashboard
        reportDashboard: {
            rest: {
                method: "POST",
                path: "/admin-dashboard",
            },
            params: {
                /* Values in params = room_id, page */
            },
            async handler(request: any) {
                const page = request.params.page || 0;
                const reportedContainers = await this.getAdminDashboard(page, request.params.room_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data: {
                        rows: reportedContainers,
                        page: page + 1,
                        page_size: reportedContainers.length,
                    },
                };
            },
        },

        // Reported Messages
        allReportedMessages: {
            rest: {
                method: "POST",
                path: "/student-reported-messages",
            },
            params: {
                /* Values in params = room_id, reported_student_id, page */
            },
            async handler(request: any) {
                const reportedStudentId = parseInt(request.params.reported_student_id, 10);
                const page = request.params.page || 0;
                const {
                    messageContainer,
                    primary_cta,
                    secondary_cta,
                } = await this.getStudentReportedMessages(reportedStudentId, request.params.room_id, page, request.meta);

                return {
                    meta: this.settings.successResponse,
                    data: {
                        rows: messageContainer,
                        primary_cta,
                        secondary_cta,
                        page: page + 1,
                        page_size: messageContainer.length,
                    },
                };
            },
        },

        // Remove Reported Container
        removeContainer: {
            rest: {
                method: "POST",
                path: "/remove-reported-container",
            },
            params: {
                /* Values in params = room_id, container_type, container_id */
            },
            async handler(request: any) {
                await this.removeReportedContainer(request.params.container_type, request.params.container_id, request.params.room_id);
                return {
                    meta: this.settings.successResponse,
                };
            },
        },

        // Sticky Bar
        stickyBar: {
            rest: {
                method: "POST",
                path: "/get-sticky-bar",
            },
            params: {},
            async handler(request: any) {
                /* Values in params = room_id, admin_id */
                const adminId = parseInt(request.params.admin_id, 10);
                const data = await this.getStickyBar(adminId, request.params.room_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data: {
                        is_report_available: data.isReportAvailable,
                        is_sticky_available: data.isStickyAvailable,
                        title: data.title,
                        deeplink: data.deeplink,
                    },
                };
            },
        },
    },
    /**
     * Methods
     */
    methods: {},

    /**
     * Service created lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    created() {},

    /**
     * Service started lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async started() {},

    /**
     * Service stopped lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async stopped() {},
};

export = ReportService;
