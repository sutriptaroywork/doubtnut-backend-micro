import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";
import {ServiceSchema} from "dn-moleculer";
import StudyGroupCreateService from "../methods/general/create";
import StudyGroupListService from "../methods/general/list";
import StudyGroupInfoService from "../methods/general/group.info";
import StudyGroupInviteService from "../methods/general/invite";
import StudyGroupMessageService from "../methods/general/message";
import StudyGroupDeleteService from "../methods/general/delete";
import StudyGroupPopularGroups from "../methods/general/public.groups";
import StudyGroupTeacherService from "../methods/general/teacher.group";
import smsService from "../methods/sms";

const StudyGroupService: ServiceSchema = {
    name: "studygroup",
    mixins: [DbService, StudyGroupCreateService, StudyGroupListService, StudyGroupInfoService, StudyGroupInviteService, StudyGroupMessageService, StudyGroupDeleteService, StudyGroupPopularGroups, StudyGroupTeacherService, smsService],
    adapter: new MongoDBAdapter(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}),
    collection: "chatroom_messages",
    hooks: {
        before: {
            // The hook will call the `resolveLoggedUser` method.
            "*": "resolveLoggedUser",
        },
    },
    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {

        // create group (to create private groups v1 and v2)
        createGroup: {
            rest: {
                method: "POST",
                path: "/create",
            },
            params: {
                // request.params.group_name, request.params.group_image
            },
            async handler(request: any) {
                const data = await this.create(request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },


        // can create group
        canCreateGroup: {
            rest: {
                method: "GET",
                path: "/create",
            },
            params: {},
            async handler(request: any) {
                const data = await this.canCreateGroup(request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // create public group
        createPublicGroup: {
            rest: {
                method: "POST",
                path: "/create-public-group",
            },
            params: {
                // request.params.group_name, request.params.group_image, request.params.can_member_post
            },
            async handler(request: any) {
                const data = await this.createPublic(request.params.group_name, parseInt(request.params.only_sub_admin_can_post, 10), request, request.params.group_image);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },


        // can create group - V2 (only for private group creation)
        canCreateGroupV2: {
            rest: {
                method: "GET",
                path: "/v2/create",
            },
            params: {},
            async handler(request: any) {
                const data = await this.canCreateGroupV2(request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // list groups
        listGroups: {
            rest: {
                method: "GET",
                path: "/list-groups",
            },
            params: {},
            async handler(request: any) {
                const data = await this.listGroups(request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // list groups - V2
        listGroupsV2: {
            rest: {
                method: "GET",
                path: "v2/list-groups",
            },
            params: {},
            async handler(request: any) {
                const pageType = request.params.page_type ? request.params.page_type : "my_groups";
                const data = await this.listGroupsV2(parseInt(request.params.page, 10), pageType, request.meta, request.params.show_join_group_widget);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // leave group
        leave: {
            rest: {
                method: "POST",
                path: "/leave",
            },
            params: {
                // req.params.group_id
            },
            async handler(request: any) {
                const data = await this.leaveGroup(request.params.group_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // block group
        block: {
            rest: {
                method: "POST",
                path: "/block",
            },
            params: {
                // this.req.params.group_id, this.req.params.student_id
            },
            async handler(request: any) {
                const data = await this.blockFromGroup(request.params.group_id, request.params.student_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // update group info
        updateGroupInfo: {
            rest: {
                method: "POST",
                path: "/update-group-info",
            },
            params: {
                // request.params.group_id, request.params.group_name, request.params.group_image
            },
            async handler(request: any) {
                const data = await this.updateGroupInfo(request.params.group_id, request.params.group_name, request.params.group_image, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // group info
        groupInfo: {
            rest: {
                method: "POST",
                path: "/group-info",
            },
            params: {
                // request.params.group_id
            },
            async handler(request: any) {
                const data = await this.groupInfo(request.params.group_id, request);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // group members
        groupMembers: {
            rest: {
                method: "POST",
                path: "/group-members",
            },
            params: {
                // request.params.group_id
            },
            async handler(request: any) {
                const data = await this.groupMembers(parseInt(request.params.page, 10), request.params.group_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // invite
        invite: {
            rest: {
                method: "POST",
                path: "/invite",
            },
            params: {
                // this.req.params.group_id, this.req.params.invitee
            },
            async handler(request: any) {
                const data = await this.invite(request.params.group_id, request.params.invitee, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // accept
        accept: {
            rest: {
                method: "POST",
                path: "/accept",
            },
            params: {
                // this.req.params.group_id, this.req.params.inviter
            },
            async handler(request: any) {
                const data = await this.accept(request.params.group_id, request.meta, request.params.inviter);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // reject
        reject: {
            rest: {
                method: "POST",
                path: "/reject",
            },
            params: {
                // this.req.params.group_id, request.params.inviter
            },
            async handler(request: any) {
                const data = await this.reject(request.params.group_id, request.params.inviter, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // invitation-status
        invitationStatus: {
            rest: {
                method: "POST",
                path: "/invitation-status",
            },
            params: {
                // request.params.invitee
            },
            async handler(request: any) {
                const data = await this.invitationStatus(request.params.invitee, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        pendingGroupInvites: {
            rest: {
                method: "POST",
                path: "/pending-group-invites",
            },
            params: {
                // request.params.page
            },
            async handler(request: any) {
                const data = await this.pendingGroupInvites(parseInt(request.params.page, 10), request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },


        // mute group
        mute: {
            rest: {
                method: "POST",
                path: "/mute",
            },
            params: {
                // request.params.group_id, request.params.type
            },
            async handler(request: any) {
                const data = await this.mute(request.params.group_id, request.params.type, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        messageRestriction: {
            rest: {
                method: "POST",
                path: "/update-message-restriction",
            },
            params: {
                // request.params.group_id, request.params.type
            },
            async handler(request: any) {
                // type = 1: Only Admin/Sub-Admin can post, 0: Everyone can post
                const data = await this.updateMessageRestriction(request.params.group_id, request.params.only_sub_admin_can_post, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // makeSubAdmin
        makeSubAdmin: {
            rest: {
                method: "POST",
                path: "/make-sub-admin",
            },
            params: {
                // request.params.group_id, request.params.student_id
            },
            async handler(request: any) {
                const data = await this.updateSubAmin(request.params.group_id, request.params.student_id, 2, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // removeSubAdmin
        removeSubAdmin: {
            rest: {
                method: "POST",
                path: "/remove-sub-admin",
            },
            params: {
                // request.params.group_id, request.params.student_id
            },
            async handler(request: any) {
                const data = await this.updateSubAmin(request.params.group_id, request.params.student_id, 0, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // request unban
        requestUnban: {
            rest: {
                method: "POST",
                path: "/request-unban",
            },
            params: {
                // request.params.group_id, request.params.type
            },
            async handler(request: any) {
                const data = await this.requestUnban(request.params.group_id, request.params.type, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // temp built
        redisCacheDel: {
            rest: {
                method: "POST",
                path: "/update-group-details",
            },
            params: {
                // request.params.group_id, request.params.field
            },
            async handler(request: any) {
                const data = await this.updateGroupDetails(request.params.group_id, request.params.field);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // Create Post
        createPost: {
            rest: {
                method: "POST",
                path: "/post",
            },
            params: {},
            async handler(request: any) {
                await this.insertNewMessage(request.params, request.meta);
                return {
                    meta: this.settings.successResponse,
                };
            },
        },

        postMultipleGroups: {
            rest: {
                method: "POST",
                path: "/post-multiple-groups",
            },
            params: {},
            async handler(ctx: any) {
                /* Input: message, room_list */
                // This api will be used when we have to send same post in multiple groups.
                const postData = ctx.params;
                await this.insertMultipleMessages(JSON.parse(postData.message), postData.room_list, ctx.meta);

                return {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                };
            },
        },

        // list messages
        listMessage: {
            rest: {
                method: "GET",
                path: "/messages/:room_id/:room_type",
            },
            params: {},
            async handler(request: any) {
                const page = parseInt(request.params.page, 10) || 1;
                const data = await this.listMessages(request.params.offset_cursor, page, request.params.room_id);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // Delete Single Message
        deletePost: {
            rest: {
                method: "POST",
                path: "/delete-message",
            },
            params: {
                // request.params.room_id, request.params.message_id, request.params.millis, request.params.sender_id
            },
            async handler(request: any) {
                await this.deleteSingleMessage(request.params.room_id, request.params.message_id, request.params.millis, request.params.sender_id);
                return {
                    meta: this.settings.successResponse,
                };
            },
        },

        /* this action will delete all the reported messages of the user.
        expected params are student id and group id */
        deleteReportedPost: {
            rest: {
                method: "POST",
                path: "/delete-reported-messages",
            },
            params: {
                // request.params.reported_student_id, request.params.group_id
            },
            async handler(request: any) {
                await this.deleteReportedMessages(request.params.reported_student_id, request.params.group_id);
                return {
                    meta: this.settings.successResponse,
                };
            },
        },

        // listing popular,recommended and suggested groups
        listPublicGroups: {
            rest: {
                method: "POST",
                path: "/list-public-groups",
            },
            params: {
                // request.params.page, request.params.source
            },
            async handler(request: any) {
                const data = await this.listPublicGroups(parseInt(request.params.page, 10), request.params.source, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        searchPublicGroups: {
            rest: {
                method: "POST",
                path: "/search-public-groups",
            },
            params: {
                // request.params.page, request.params.source,request.params.keyword
            },
            async handler(request: any) {
                const data = await this.searchPublicGroups(parseInt(request.params.page, 10), request.params.source, request.params.keyword, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        todaySpecialGroups: {
            rest: {
                method: "GET",
                path: "/today-special-groups",
            },
            params: {},
            async handler(request: any) {
                const data = await this.todaySpecialGroups(request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },
        // creating teacher groups
        joinTeacherGroups: {
            rest: {
                method: "POST",
                path: "/join-teachers-group",
            },
            params: {},
            async handler(request: any) {
                const data = await this.joinTeacherGroups(request.params.course_id, request.params.assortment_type, request.params.batch_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },
        userBannedStatus: {
            rest: {
                method: "GET",
                path: "/user-banned-status",
            },
            params: {},
            async handler(request: any) {
                const data = await this.userBannedStatus(request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // Create Post
        updateMessagePost: {
            rest: {
                method: "POST",
                path: "/update-message",
            },
            params: {},
            async handler(request: any) {
                await this.updateMessage(request.params, request.meta);
                return {
                    meta: this.settings.successResponse,
                };
            },
        },

        // Create Post
        markResolved: {
            rest: {
                method: "POST",
                path: "/mark-resolved",
            },
            params: {},
            async handler(request: any) {
                await this.markResolved(request);
                return {
                    meta: this.settings.successResponse,
                };
            },
        },
    },
    /**
     * Methods
     */
    methods: {},

    events: {},

    /**
     * Service created lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    created() {
    },

    /**
     * Service started lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async started() {
    },

    /**
     * Service stopped lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async stopped() {
    },
};

export = StudyGroupService;
