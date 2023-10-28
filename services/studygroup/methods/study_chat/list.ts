import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import moment from "moment";
import {ObjectId} from "mongodb";
import studyChatData from "../../data/studychat.data";
import studGroupData from "../../data/studygroup.data";
import {redisUtility} from "../../../../common";
import InfoService from "./chat.info";

const StudyChatListService: ServiceSchema = {
    name: "$studychat-list",
    mixins: [InfoService],
    methods: {
        async getChatroomDetails(chats: any, ctx: any) {
            try {
                const studentIds = _.map(chats, item => item.inviter === ctx.user.id ? item.invitee : item.inviter);
                const studentNames = await this.broker.call("$studygroupMysql.getStudentDetails", {studentIds});

                for (const student of studentNames) {
                    student.student_name = this.createChatName(student.student_fname, student.student_lname);
                    // student.student_image = (student.room_image === null ? studyChatData.defaultUserImage : student.room_image);
                    student.student_image = studyChatData.defaultUserImage;
                    // removing additional keys
                    ["student_fname", "student_lname", "room_image"].forEach(e => delete student[e]);
                }
                chats = chats.map(t1 => ({...t1, ...studentNames.find(t2 => (t1.inviter === t2.other_student_id || t1.invitee === t2.other_student_id))}));

                const studyChatIds = _.map(chats, item => item.id);
                const roomDetails = await this.broker.call("$studygroupMysql.getRoomDetails", {
                    studentIds,
                    studyChatIds,
                });

                return chats.map(t1 => ({...t1, ...roomDetails.find(t2 => t1.other_student_id === t2.other_student_id && t1.id === t2.study_chat_id)}));
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getAllMyChats(ctx: any) {
            try {
                let data = await redisUtility.getHashField.call(this, `USER:${ctx.user.id}`, "LIST_CHATS") || {};
                // checking the attributes from redis first, if not available then sql will be performed
                if (_.isEmpty(data)) {
                    data = await this.broker.call("$studygroupMysql.getAllChats", {studentId: ctx.user.id});
                    await redisUtility.addHashField.call(this, `USER:${ctx.user.id}`, "LIST_CHATS", data, this.settings.dailyRedisTTL);
                }
                // to get student name and img_url
                if (!_.isEmpty(data)) {
                    // get chatroom details, if one-one chat exists
                    data = await this.getChatroomDetails(data, ctx);

                    // get all chatIds
                    const activeChats = _.map(data, "chat_id");
                    // last sent details
                    const lastSentRedis = await this.getLastSentDataActiveGroups(activeChats);
                    data = data.map(t1 => ({...t1, ...lastSentRedis.find(t2 => t1.chat_id === t2.group_id)}));
                }

                const chats = [];
                const chatsForUnreadCount = [];
                for (const chatData of data) {

                    let subtitle = "";
                    let isMute = false;
                    let lastSentTime = null;

                    if (chatData.blocked_other === 1 && chatData.blocked_other_at) {
                        const blockedTime = moment(chatData.blocked_other_at).add(5, "hours").add(30, "minutes");
                        lastSentTime = blockedTime.valueOf();
                        chatData.last_message_sent_at = blockedTime.format("YYYY-MM-DD HH:mm:ss");
                        chatData.timestamp = await this.lastSeenTimeFormat(lastSentTime);
                        chatData.last_sent_message_container = null;
                        subtitle = "You blocked!";
                    } else {
                        // last_sent_container + subtitle
                        chatData.last_message_sent_at = chatData.timestamp;
                        if (chatData.last_message_sent_at !== null) {
                            lastSentTime = moment(chatData.timestamp).valueOf();
                            chatData.timestamp = await this.lastSeenTimeFormat(chatData.timestamp);
                            if (chatData.last_sent_message_container.sender_id !== ctx.user.id) {
                                chatsForUnreadCount.push(chatData.group_id);
                            }
                        } else {
                            chatsForUnreadCount.push(chatData.group_id);
                            chatData.timestamp = null;
                        }
                        chatData.blocked_other = 0;
                        chatData.blocked_other_at = null;
                        if (!_.isNull(chatData.last_sent_message_container)) {
                            subtitle = chatData.last_sent_message_container.message;
                        }
                    }

                    if (chatData.muted_till) {
                        isMute = moment().add(5, "hours").add(30, "minutes").isBefore(moment(chatData.muted_till));
                    }
                    chatData.deeplink = studyChatData.listMyChats.deeplink.replace("{groupId}", chatData.group_id).replace("{otherStudentId}", chatData.other_student_id);
                    chatData.subtitle = subtitle;
                    chatData.is_faq = false;
                    chatData.is_mute = isMute;
                    chatData.last_sent_time = lastSentTime;
                    // removing additional keys
                    ["muted_till", "is_blocked", "blocked_other_at", "study_chat_id", "id", "blocked_at", "group_id", "inviter", "invitee", "last_sent_message_container"].forEach(e => delete chatData[e]);

                    chats.push({
                        widget_type: "widget_sg_individual_chat",
                        widget_data: chatData,
                    });
                }
                return {
                    chats,
                    chats_for_unread_count: chatsForUnreadCount,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async addUnreadChatCount(chats: any, chatsForUnreadCount: any, ctx: any) {
            try {
                // last seen for all activeGroups
                const lastSeenRedis = await redisUtility.getMultiHashField.call(this, `SG:${ctx.user.id}`, chatsForUnreadCount);
                const chatLastSeen = [];
                for (let i = 0; i < chatsForUnreadCount.length; i++) {
                    chatLastSeen.push({
                        group_id: chatsForUnreadCount[i],
                        last_seen: lastSeenRedis[i],
                    });
                }

                const facetQuery = {};
                const projectQuery = {};
                for (const chat of chatLastSeen) {
                    const date = (chat.last_seen ? moment(chat.last_seen).subtract(5, "hours").subtract(30, "minutes") : moment().subtract(30, "days").subtract(30, "days")).valueOf();
                    facetQuery[chat.group_id] = [
                        {
                            $match: {
                                room_id: chat.group_id,
                                _id: {$gt: new ObjectId(`${Math.floor(date / 1000).toString(16)}0000000000000000`)},
                                is_message: true,
                            },
                        },
                        {$count: chat.group_id},
                    ];
                    projectQuery[chat.group_id] = {$arrayElemAt: [`$${chat.group_id}.${chat.group_id}`, 0]};
                }

                const unreadCount = await this.adapter.db.collection(this.settings.studyChatMessageCollection).aggregate([
                        {$facet: facetQuery},
                        {$project: projectQuery},
                    ], {$maxTimeMS: 100}).toArray();

                if (unreadCount.length) {
                    for (const j of chats) {
                        j.widget_data.unread_count = null;
                        for (const [key, value] of Object.entries(unreadCount[0])) {
                            if (j.widget_data.chat_id === key) {
                                j.widget_data.unread_count = value;
                                break;
                            }
                        }
                    }
                }

                return chats;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        // Pending Chat Invites
        async pendingChatInvitesListChats(ctx: any) {
            try {
                let chatInvites = {};
                let isPendingChatInvitesAvailable = false;
                let pendingChatInvitesContainer = null;
                const pendingChatInvites = await this.broker.call("$studygroupMysql.pendingChatInviteCount", {studentId: ctx.user.id});

                if (pendingChatInvites.length && pendingChatInvites[0].count) {
                    const groupInviteCount = pendingChatInvites[0].count;
                    isPendingChatInvitesAvailable = true;
                    pendingChatInvitesContainer = studyChatData.listMyChats.pendingInvites.widget;
                    pendingChatInvitesContainer.widget_data.title = (ctx.user.locale === "hi" ? studyChatData.listMyChats.pendingInvites.title.hi : studyChatData.listMyChats.pendingInvites.title.en).concat(`(${groupInviteCount})`);
                    pendingChatInvitesContainer.widget_data.subtitle = ctx.user.locale === "hi" ? studyChatData.listMyChats.pendingInvites.subtitle.hi : (groupInviteCount > 1 ? studyChatData.listMyChats.pendingInvites.subtitle.en.concat("s") : studyChatData.listMyChats.pendingInvites.subtitle.en);
                    pendingChatInvitesContainer.widget_data.pending_request_count = `${groupInviteCount}`;

                    chatInvites = {
                        is_pending_invites: isPendingChatInvitesAvailable,
                        invites_container: pendingChatInvitesContainer,
                    };

                }

                return chatInvites;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        // list chats - showing pending Invites and my_chats
        async listChats(page: number, ctx: any) {
            try {

                // My Chats
                let mySortedChats = [];

                if (page === 0) {
                    const {chats, chats_for_unread_count: chatsForUnreadCount} = await this.getAllMyChats(ctx);
                    const allMyChats = chats;
                    // adding false in condition, to stop query from running
                    if (chatsForUnreadCount.length) {
                        console.log("Calculate unread count");
                        // allMyChats = await this.addUnreadChatCount(chats, chatsForUnreadCount, ctx);
                    }
                    mySortedChats = _.orderBy(allMyChats, [o => o.widget_data.last_message_sent_at || ""], ["desc"]);

                    // Pending Group Invites
                    const {
                        is_pending_invites: isPendingInvites,
                        invites_container: invitesContainer,
                    } = await this.pendingChatInvitesListChats(ctx);
                    if (isPendingInvites) {
                        mySortedChats.unshift(invitesContainer);
                    }
                }

                return {
                    title: ctx.user.locale === "hi" ? studyChatData.listMyChats.title.hi : studyChatData.listMyChats.title.en,
                    new_group_container: ctx.user.locale === "hi" ? studGroupData.listGroups.new_group_container.hi : studGroupData.listGroups.new_group_container.en,
                    is_widget_available: (mySortedChats.length !== 0),
                    widgets: mySortedChats,
                    no_widget_container: ctx.user.locale === "hi" ? studyChatData.listMyChats.no_chats_container.hi : studyChatData.listMyChats.no_chats_container.en,
                    is_search_enabled: false,
                    min_search_characters: 1,
                    search_text: ctx.user.locale === "hi" ? studyChatData.search.chat.hi : studyChatData.search.chat.en,
                    cta: {
                        title: ctx.user.locale === "hi" ? studyChatData.listMyChats.cta.hi : studyChatData.listMyChats.cta.en,
                        deeplink: studyChatData.listMyChats.createChatDeeplink,
                    },
                    is_reached_end: true,
                    page: 1,
                    source: "my_chats",
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },


        async getTotalUnreadCount(ctx: any) {
            try {

                return {
                    is_widget_available: false,
                    widget: {},
                };

                // const {chats, chats_for_unread_count: chatsForUnreadCount} = await this.getAllMyChats(ctx);
                // let allMyChats = chats;
                // if (chatsForUnreadCount.length) {
                //     allMyChats = await this.addUnreadChatCount(chats, chatsForUnreadCount, ctx);
                // }
                // let totalUnreadCount = 0;
                // const friends = [];
                // for (const data of allMyChats) {
                //     if (data.widget_data.unread_count) {
                //         totalUnreadCount += data.widget_data.unread_count;
                //         friends.push(data.widget_data.student_name);
                //     }
                // }
                //
                // let widget = {};
                // if (totalUnreadCount) {
                //     let description = null;
                //     if (ctx.user.locale === "hi") {
                //         description = `आपके पास ${friends[0]}`;
                //         if (friends.length > 1) {
                //             description += ` और ${friends.length - 1} अन्य लोगों `;
                //         }
                //         description += " के {unread} हैं।";
                //     } else {
                //         description = `You have {unread} from ${friends[0]}`;
                //         if (friends.length > 1) {
                //             description += ` and ${friends.length - 1} ` + (friends.length - 1 > 1 ? "others" : "other");
                //         }
                //     }
                //     widget = {
                //         widget_type: "widget_sg_home",
                //         widget_data: {
                //             id: 1,
                //             title: ctx.user.locale === "hi" ? "नया संदेश प्राप्त हुआ" : "New Message Received",
                //             image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/93E85408-4200-C418-26CE-99A8DEB83BB8.webp",
                //             subtitle: description,
                //             string_to_replace_with: ctx.user.locale === "hi" ? `${totalUnreadCount} अपठित संदेश` : `${totalUnreadCount} unread messages`,
                //             string_to_replace_with_color: "#007aff",
                //             subtitle_char_to_replace: "{unread}",
                //             cta: ctx.user.locale === "hi" ? "जांचें" : "Check Now",
                //             cta_color: "#ffffff",
                //             cta_background_color: "#007aff",
                //             cta_deeplink: "doubtnutapp://study_group/list?tab_position=1",
                //         },
                //     };
                // }
                // return {
                //     is_widget_available: Boolean(totalUnreadCount),
                //     widget,
                // };

            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyChatListService;
