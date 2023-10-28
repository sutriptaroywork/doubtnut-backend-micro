import {ServiceSchema} from "dn-moleculer";
import {v4 as uuid} from "uuid";
import _ from "lodash";
import studyChatData from "../../data/studychat.data";
import studyChatBlockService from "./block";
import studyChatNotificationService from "./notification";
import {redisUtility} from "../../../../common";

const StudyChatInviteService: ServiceSchema = {
    name: "$studychat-invite",
    mixins: [studyChatBlockService, studyChatNotificationService],
    methods: {

        async addFriend(chatId: number, studentId: number) {
            try {
                await this.broker.call("$studygroupMysql.addFriend", {
                    studentId,
                    studyChatId: chatId,
                });
                return true;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async createRoom(chatId, inviteeId, ctx) {
            try {
                // invitation status = 0: pending, 1: accepted, 2: rejected
                const studyChatCreate = await this.broker.call("$studygroupMysql.inviteFriend", {
                    inviter: ctx.user.id,
                    invitee: inviteeId,
                    chatId,
                });

                await this.addFriend(studyChatCreate, ctx.user.id);

                await this.updateLastSentTimeAndMessage("Invitation Sent", chatId, ctx);
                return true;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async startChat(inviteeId, ctx: any) {
            try {
                let isMemberInvited = false;
                let deeplink = null;

                if (ctx.user.id === inviteeId) {
                    return {
                        message: "You cannot initiate a chat with yourself.",
                        is_invited: false,
                        deeplink: "doubtnutapp://study_group/list?tab_position=2",
                    };
                }

                // check if invitor has existing chatroom with invitee
                const isInvited = await this.broker.call("$studygroupMysql.isFriendConnected", {
                    inviter: ctx.user.id,
                    invitee: inviteeId,
                });
                if (isInvited.length && isInvited[0].chat_id) {
                    this.settings.message = "requested invitee has already been invited";
                    deeplink = studyChatData.listMyChats.deeplink.replace("{groupId}", isInvited[0].chat_id).replace("{otherStudentId}", inviteeId);
                } else {
                    // can be invite
                    isMemberInvited = true;
                    const chatId = `sc-${uuid()}`;
                    // to create new room
                    this.createRoom(chatId, inviteeId, ctx);
                    this.notificationToInvitee(inviteeId, chatId, ctx);

                    this.settings.message = "Successfully invited";
                    deeplink = studyChatData.listMyChats.deeplink.replace("{groupId}", chatId).replace("{otherStudentId}", inviteeId);
                    await Promise.all([
                        redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_CHATS"),
                        redisUtility.deleteHashField.call(this, `USER:${inviteeId}`, "LIST_CHATS"),
                        redisUtility.deleteKey.call(this, `MOL-$studygroupMysql.getChatInfo:chatId|${chatId}`),
                    ]);
                }

                return {message: this.settings.message, is_invited: isMemberInvited, deeplink};
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async accept(chatId, ctx) {
            try {
                let isMemberJoined = false;
                let description = null;
                let isAlreadyMember = false;
                const socketMsg = null;
                // check if invitee is already the member of the group or invitee check is authenticated
                const inviteeChatData = await this.broker.call("$studygroupMysql.getSpecificUserChatData", {
                    studentId: ctx.user.id,
                    chatId,
                });
                if (!inviteeChatData.length) {
                    this.settings.message = "invitee is not a active member, can join!";

                    const studyChatId = await this.broker.call("$studygroupMysql.getChatId", {
                        chatId,
                        invitee: ctx.user.id,
                    });

                    if (studyChatId.length) {
                        // user can join
                        await Promise.all([this.addFriend(studyChatId[0].id, ctx.user.id),
                            this.broker.call("$studygroupMysql.acceptFriendInvite", {
                                studentId: ctx.user.id,
                                studyChatId: studyChatId[0].id,
                            }),
                            this.updateLastSentTimeAndMessage("Invitation Accepted", chatId, ctx),
                            redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_CHATS"),
                        ]);
                        isMemberJoined = true;
                        this.notifyIfInviterActive(chatId, ctx);
                        this.settings.message = "Invitee is successfully joined";
                    } else {
                        this.settings.message = "User is not invited";
                    }
                } else {
                    this.settings.message = "invitee is already a member";
                    description = "invitee is already a member";
                    isAlreadyMember = true;
                }
                return {
                    message: this.settings.message,
                    is_member_joined: isMemberJoined,
                    description,
                    is_already_member: isAlreadyMember,
                    socket_msg: socketMsg,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        // reject group invite
        async reject(chatId, ctx) {
            try {
                // check if invitee is already the member of the group
                const inviteeChatData = await this.broker.call("$studygroupMysql.getSpecificUserChatData", {
                    studentId: ctx.user.id,
                    chatId,
                });
                if (!inviteeChatData.length) {

                    const studyChatId = await this.broker.call("$studygroupMysql.getChatId", {
                        chatId,
                        invitee: ctx.user.id,
                    });

                    if (studyChatId.length) {
                        await Promise.all([this.broker.call("$studygroupMysql.rejectFriendInvite", {
                            studyChatId: studyChatId[0].id,
                        }),
                            this.block(chatId, studyChatId[0].inviter, ctx),
                            redisUtility.deleteHashField.call(this, `USER:${ctx.user.id}`, "LIST_CHATS"),
                            redisUtility.deleteHashField.call(this, `USER:${studyChatId[0].inviter}`, "LIST_CHATS"),
                        ]);
                        this.settings.message = "Invite request rejected";
                    } else {
                        this.settings.message = "User is not invited";
                    }
                } else {
                    this.settings.message = "You are already a member";
                }
                return {message: this.settings.message};

            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        // List pending invites.
        async listPendingChatInvites(page: number, ctx: any) {
            try {
                let pendingInvites = await this.broker.call("$studygroupMysql.pendingChatInvites", {
                    studentId: ctx.user.id,
                    offset: page * 10,
                });
                const inviteChatIds = _.map(pendingInvites, "chat_id");

                // last sent details
                const lastSentRedis = await this.getLastSentDataActiveGroups(inviteChatIds);
                pendingInvites = pendingInvites.map(t1 => ({...t1, ...lastSentRedis.find(t2 => t1.chat_id === t2.group_id)}));

                const invites = [];
                for (const chatData of pendingInvites) {
                    const inviterName = this.createChatName(chatData.student_fname, chatData.student_lname);
                    const data = {
                        chat_id: chatData.chat_id,
                        student_name: inviterName,
                        // student_image: (chatData.image === null ? studyChatData.defaultUserImage : chatData.image),
                        student_image: studyChatData.defaultUserImage,
                        other_student_id: chatData.inviter,
                        blocked_at: null,
                        deeplink: studyChatData.listMyChats.deeplink.replace("{groupId}", chatData.chat_id).replace("{otherStudentId}", chatData.inviter),
                        timestamp: await this.lastSeenTimeFormat(chatData.created_at),
                        subtitle: chatData.last_sent_message_container ? chatData.last_sent_message_container.message : null,
                        is_faq: false,
                        is_mute: false,
                        unread_count: null,
                        left_at: null,
                        toast_message: null,
                        is_active: null,
                        cta_text: null,
                    };

                    invites.push({
                        widget_type: "widget_sg_individual_chat",
                        widget_data: data,
                    });
                }
                return {
                    title: ctx.user.locale === "hi" ? studyChatData.pendingRequests.title.hi : studyChatData.pendingRequests.title.en,
                    is_search_enabled: true,
                    min_search_characters: 1,
                    search_text: ctx.user.locale === "hi" ? studyChatData.search.people.hi : studyChatData.search.people.en,
                    is_reached_end: (invites.length < 10),
                    page: page + 1,
                    source: "pending_invites",
                    widgets: invites,
                };

            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyChatInviteService;
