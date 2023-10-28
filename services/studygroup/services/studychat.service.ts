import DbService from "dn-moleculer-db";
import MongoDBAdapter from "moleculer-db-adapter-mongo";
import {ServiceSchema} from "dn-moleculer";
import InviteService from "../methods/study_chat/invite";
import ListService from "../methods/study_chat/list";
import BlockService from "../methods/study_chat/block";
import MessageService from "../methods/study_chat/message";
import FriendService from "../methods/study_chat/friend";
import DeleteService from "../methods/study_chat/delete";
import FeatureSettings from "../methods/feature.settings";

const StudyChatService: ServiceSchema = {
    name: "studychat",
    mixins: [DbService, InviteService, ListService, BlockService, MessageService, FriendService, FeatureSettings, DeleteService],
    adapter: new MongoDBAdapter(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}),
    collection: "chatroom_messages",
    settings: {
        rest: "/study-chat",
    },
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
        // startChat
        startChat: {
            rest: {
                method: "POST",
                path: "/start-chat",
            },
            params: {
                // this.req.params.invitee
            },
            async handler(request: any) {
                const data = await this.startChat(request.params.invitee, request.meta);
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
                // this.req.params.chat_id
            },
            async handler(request: any) {
                const data = await this.accept(request.params.chat_id, request.meta);
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
                // request.params.chat_id
            },
            async handler(request: any) {
                const data = await this.reject(request.params.chat_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // list chats
        listChats: {
            rest: {
                method: "GET",
                path: "/list-chats",
            },
            params: {},
            async handler(request: any) {
                const data = await this.listChats(parseInt(request.params.page, 10), request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // chat info
        chatInfo: {
            rest: {
                method: "POST",
                path: "/chat-info",
            },
            params: {
                // request.params.group_id, request.params.other_student_id
            },
            async handler(request: any) {
                const data = await this.chatInfo(request.params.chat_id, request.params.other_student_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        pendingInvites: {
            rest: {
                method: "POST",
                path: "/list-pending-invites",
            },
            params: {
                // request.params.page
            },
            async handler(request: any) {
                const data = await this.listPendingChatInvites(parseInt(request.params.page, 10), request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // mute chat
        mute: {
            rest: {
                method: "POST",
                path: "/mute",
            },
            params: {
                // request.params.chat_id, request.params.type
            },
            async handler(request: any) {
                const data = await this.muteChat(request.params.chat_id, request.params.type, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // block chat
        block: {
            rest: {
                method: "POST",
                path: "/block",
            },
            params: {
                // request.params.chat_id, request.params.student_id
            },
            async handler(request: any) {
                const data = await this.block(request.params.group_id, request.params.student_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // unblock chat
        unblock: {
            rest: {
                method: "POST",
                path: "/unblock",
            },
            params: {
                // request.params.chat_id, request.params.student_id
            },
            async handler(request: any) {
                const data = await this.unBlock(request.params.group_id, request.params.student_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // list blocked users
        blockedUsers: {
            rest: {
                method: "GET",
                path: "/list-blocked-users",
            },
            params: {
                // request.params.page
            },
            async handler(request: any) {
                const data = await this.listBlockedUsers(parseInt(request.params.page, 10), request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // Create Post
        createChatPost: {
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

        // list messages
        listChatMessage: {
            rest: {
                method: "GET",
                path: "/messages/:room_id",
            },
            params: {},
            async handler(request: any) {
                const page = parseInt(request.params.page, 10) || 1;
                const data = await this.listMessages(request.params.offset_cursor, page, request.params.room_id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // friends Tabs
        friendsTabs: {
            rest: {
                method: "GET",
                path: "/friends-tabs",
            },
            params: {},
            async handler(request: any) {
                const data = await this.friendsTabs(request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // friends
        friends: {
            rest: {
                method: "POST",
                path: "/friends",
            },
            params: {
                // request.params.id
            },
            async handler(request: any) {
                const data = await this.friends(request.params.id, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // invite With Number
        inviteWithNumber: {
            rest: {
                method: "POST",
                path: "/invite-with-number",
            },
            params: {
                // request.params.mobile
            },
            async handler(request: any) {
                const data = await this.inviteWithNumber(request.params.mobile, request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },


        // feature settings
        featureSettings: {
            rest: {
                method: "GET",
                path: "/settings",
            },
            params: {},
            async handler(request: any) {
                const data = await this.settingsHomePage(request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // get unread count for app homepage
        getTotalUnreadCount: {
            rest: {
                method: "GET",
                path: "/unread-count",
            },
            params: {},
            async handler(request: any) {
                const data = await this.getTotalUnreadCount(request.meta);
                return {
                    meta: this.settings.successResponse,
                    data,
                };
            },
        },

        // Delete Chat Message
        deleteMessage: {
            rest: {
                method: "POST",
                path: "/delete-message",
            },
            params: {
                // request.params.room_id, request.params.message_id, request.params.millis, request.params.sender_id
            },
            async handler(request: any) {
                await this.deleteChatMessage(request.params.room_id, request.params.message_id, request.params.millis, request.params.sender_id);
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

export = StudyChatService;
