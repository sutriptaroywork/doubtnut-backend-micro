import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import moment from "moment";
import SettingsService from "../settings";
import {redisUtility} from "../../../../common";
import StudyGroupData from "../../data/studygroup.data";
import studyChatData from "../../data/studychat.data";

const StudyGroupPopularGroups: ServiceSchema = {
    name: "$studygroup-public-groups",
    mixins: [SettingsService],
    methods: {
        async newPublicGroups(ctx) {
            try {
                let widgets = [];
                let finalObj = {};
                const publicGroupRedisKey = `PUBLIC_GROUPS_${ctx.user.id}`;
                const publicGroupFromRedis = await redisUtility.getRedisKeyData.call(this, publicGroupRedisKey);

                if (publicGroupFromRedis) {
                    return publicGroupFromRedis;
                } else {
                    const promise = [];
                    const fromListPublicGroup = true;
                    const source = "public_groups";
                    const title = ctx.user.locale === "hi" ? StudyGroupData.joinNewGroups.hi : StudyGroupData.joinNewGroups.en;

                    promise.push(this.getPopularGroups(this.settings.PUBLIC_GROUP_PER_CONTAINER, 0, ctx, false, fromListPublicGroup));
                    promise.push(this.getRecommendedGroups(this.settings.PUBLIC_GROUP_PER_CONTAINER, 0, fromListPublicGroup, ctx));
                    promise.push(this.getSuggestedGroups(this.settings.PUBLIC_GROUP_PER_CONTAINER, 0, fromListPublicGroup, ctx));
                    const publicGroups = await Promise.all(promise);

                    for (const group of publicGroups) {
                        widgets = widgets.concat(group);
                    }

                    finalObj = {
                        is_reached_end: true,
                        is_search_enabled: true,
                        search_text: ctx.user.locale === "hi" ? StudyGroupData.search.group.hi : StudyGroupData.search.group.en,
                        min_search_characters: 1,
                        title,
                        source,
                        page: 1,
                        widgets,
                    };
                    await redisUtility.setRedisKeyData.call(this, publicGroupRedisKey, finalObj, 60 * 15);
                }
                return finalObj;
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }

        },

        async listPublicGroups(page: number, source: string, ctx: any) {
            try {
                if (source === "public_groups") {
                    return this.newPublicGroups(ctx);
                }
                let title;
                let groupsToBeShown = [];
                const start = page * this.settings.TOTAL_GROUPS_SHOWN_PER_PAGE;
                const end = start + this.settings.TOTAL_GROUPS_SHOWN_PER_PAGE;

                let widgets = [];
                if (source === "popular") {
                    title = "POPULAR GROUPS";
                    widgets = widgets.concat(await this.getPopularGroups(end, start, ctx));
                } else if (source === "recommended") {
                    title = "RECOMMENDED GROUPS";
                    widgets = widgets.concat(await this.getRecommendedGroups(end, start, false, ctx));
                } else if (source === "suggested") {
                    title = "SUGGESTED GROUPS";
                    widgets = widgets.concat(await this.getSuggestedGroups(end, start, false, ctx));
                }

                let isReachedEnd = false;
                if (!_.isEmpty(widgets) && widgets[0] && widgets[0].widget_data && widgets[0].widget_data.items) {
                    groupsToBeShown = widgets[0].widget_data.items;
                }
                if (groupsToBeShown.length < this.settings.TOTAL_GROUPS_SHOWN_PER_PAGE) {
                    isReachedEnd = true;
                }
                return {
                    title,
                    is_reached_end: isReachedEnd,
                    is_search_enabled: true,
                    min_search_characters: 1,
                    search_text: ctx.user.locale === "hi" ? StudyGroupData.search.group.hi : StudyGroupData.search.group.en,
                    page: page + 1,
                    source,
                    widgets: groupsToBeShown,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }

        },

        async todaySpecialGroups(ctx) {
            const widgets = [];
            widgets.push(await this.getPopularGroups(this.settings.PUBLIC_GROUP_PER_CONTAINER, 0, ctx, true, true));
            return {
                is_reached_end: true,
                widgets,
                page: 1,
            };
        },

        // eslint-disable-next-line max-lines-per-function
        async searchPublicGroups(page, source, keyword, ctx) {
            keyword = keyword.trim();
            keyword = escape(keyword);
            const start = page * this.settings.TOTAL_GROUPS_SHOWN_PER_PAGE;
            const end = start + this.settings.TOTAL_GROUPS_SHOWN_PER_PAGE;

            let groupsData = [];
            let mysqlSearch = false;
            let finalGroups = [];
            switch (source) {
                case "popular" : {
                    groupsData = groupsData.concat(await this.getPopularGroups(this.settings.TOTAL_POPULAR_GROUPS, 0, ctx));
                    break;
                }
                case "recommended" : {
                    mysqlSearch = true;
                    groupsData = await this.broker.call("$studygroupMysql.searchRecommendedGroups", {
                        studentClass: ctx.user.student_class || 10,
                        keyword,
                        end,
                        start,
                    });
                    finalGroups = finalGroups.concat(await this.getGroupWidgetStructure(groupsData, ctx, 3));
                    finalGroups = finalGroups[0].widget_data.items;
                    break;
                }
                case "suggested" : {
                    groupsData = groupsData.concat(await this.getSuggestedGroups(this.settings.TOTAL_POPULAR_GROUPS, 0, false, ctx));
                    break;
                }
                case "public_groups" : {
                    mysqlSearch = true;
                    groupsData = await this.broker.call("$studygroupMysql.searchPublicGroups", {
                        studentClass: ctx.user.student_class || 10,
                        keyword,
                        end,
                        start,
                    });
                    finalGroups = finalGroups.concat(await this.getGroupWidgetStructure(groupsData, ctx, 3));
                    finalGroups = finalGroups[0].widget_data.items;
                    break;
                }
                case "my_groups" : {
                    mysqlSearch = true;
                    finalGroups = finalGroups.concat(await this.myGroupSearchingResponse(keyword, ctx));
                    break;
                }
                case "pending_group_invites" : {
                    mysqlSearch = true;
                    groupsData = await this.broker.call("$studygroupMysql.searchPendingGroupInvites", {
                        studentId: ctx.user.id,
                        keyword,
                        end,
                        start,
                    });
                    finalGroups = finalGroups.concat(await this.getPendingGroupInvites(groupsData, ctx));
                    break;
                }
                case "pending_invites" : {
                    mysqlSearch = true;
                    groupsData = await this.broker.call("$studygroupMysql.searchPendingChatInvites", {
                        studentId: ctx.user.id,
                        keyword,
                        end,
                        start,
                    });
                    finalGroups = finalGroups.concat(await this.getPendingChatInvites(groupsData));
                    break;
                }
            }

            if (!mysqlSearch) {
                // for lodash searching
                finalGroups = [];
                if (!_.isEmpty(groupsData)) {
                    const groups = groupsData[0].widget_data.items;

                    finalGroups = _.filter(groups, function(obj) {
                        const group_name = obj.widget_data.group_name.toLowerCase();
                        return group_name.includes(keyword.toLowerCase());
                    });
                }
            }

            if (_.isEmpty(finalGroups)) {
                return {
                    is_reached_end: true,
                    no_widget_container: ctx.user.locale === "hi" ? StudyGroupData.no_group_found_container.hi : StudyGroupData.no_group_found_container.en,
                    widgets: [],
                    page: 1,
                };
            }

            return {
                is_reached_end: true,
                widgets: finalGroups,
                page: 1,
            };
        },
        async myGroupSearchingResponse(keyword, ctx) {
            let finalGroups = [];
            let groupIds = [];
            let finalRes = [];
            const groupsData = await this.broker.call("$studygroupMysql.searchMyGroups", {
                studentId: ctx.user.id,
                keyword,
            });

            if (!_.isEmpty(groupsData)) {
                groupIds = [];
                for (const group of groupsData) {
                    groupIds.push("'" + group.group_id + "'");
                }
                finalGroups = finalGroups.concat(await this.getGroupWidgetStructure(groupsData, ctx, 0, true));
                finalGroups[0].widget_data.title = ctx.user.locale === "hi" ? StudyGroupData.myGroups.hi : StudyGroupData.myGroups.en;
                finalGroups[0].widget_data.title_text_size = 13.0;
                finalGroups[0].widget_data.title_text_color = "#2c87ea";
            }

            const allGroups = await this.broker.call("$studygroupMysql.searchAllPublicGroups", {
                studentClass: ctx.user.student_class || 10,
                groupIds,
                keyword,
            });
            if (!_.isEmpty(allGroups)) {
                finalRes = finalRes.concat(await this.getGroupWidgetStructure(allGroups, ctx));
                finalRes[0].widget_data.title = ctx.user.locale === "hi" ? StudyGroupData.allGroups.hi : StudyGroupData.allGroups.en;
                finalRes[0].widget_data.title_text_size = 13.0;
                finalRes[0].widget_data.title_text_color = "#2c87ea";
            }

            return [...finalGroups, ...finalRes];
        },
        async getPendingGroupInvites(groupsData, ctx) {
            let newChats = [];
            for (const group of groupsData) {
                const data = StudyGroupData.pendingGroupInvitePage.widget;

                data.widget_data.group_id = group.group_id;
                data.widget_data.title = unescape(group.group_name);
                data.widget_data.image = group.group_image;
                data.widget_data.inviter = group.inviter;
                data.widget_data.timestamp = await this.lastSeenTimeFormat(group.invited_at);
                data.widget_data.subtitle = (ctx.user.locale === "hi" ? StudyGroupData.pendingGroupInvitePage.invite.invited_by.hi : StudyGroupData.pendingGroupInvitePage.invite.invited_by.en).concat(group.inviter_name);
                data.widget_data.primary_cta = (ctx.user.locale === "hi" ? StudyGroupData.pendingGroupInvitePage.invite.primary_cta.hi : StudyGroupData.pendingGroupInvitePage.invite.primary_cta.en);
                data.widget_data.primary_cta_deeplink = StudyGroupData.pendingGroupInvitePage.invite.primary_cta_deeplink.replace("{groupId}", group.group_id).replace("{inviter}", group.inviter);
                data.widget_data.secondary_cta = (ctx.user.locale === "hi" ? StudyGroupData.pendingGroupInvitePage.invite.secondary_cta.hi : StudyGroupData.pendingGroupInvitePage.invite.secondary_cta.en);
                data.widget_data.secondary_cta_deeplink = StudyGroupData.pendingGroupInvitePage.invite.secondary_cta_deeplink.replace("{groupId}", group.group_id).replace("{inviter}", group.inviter);
                data.widget_data.deeplink = StudyGroupData.pendingGroupInvitePage.invite.deeplink.replace("{groupId}", group.group_id);
                newChats.push(JSON.parse(JSON.stringify(data)));
            }

            if (groupsData.length) {
                let activeGroups = await this.broker.call("$studygroupMysql.listActiveGroups", {studentId: ctx.user.id});
                activeGroups = activeGroups.map(item => item.group_id);
                newChats = newChats.filter(item => !_.includes(activeGroups, item.group_id));
            }
            return newChats;
        },

        async getPendingChatInvites(pendingInvites) {
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
                    student_image: (chatData.image === null ? studyChatData.defaultUserImage : chatData.image),
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
            return invites;
        },

        async getPopularGroups(limit: number, offset: number, ctx: any, noticesGroups?: boolean, fromListPublicGroup?: false) {
            const redisKey = `POPULAR_GROUPS_${ctx.user.student_class || 10}`;
            let popularGroupsFromRedis = await redisUtility.getRedisKeyData.call(this, redisKey);

            let popularGroupIds = [];
            let groupsData;

            if (!_.isEmpty(popularGroupsFromRedis)) {
                let viewAllText = null;
                if (popularGroupsFromRedis.length > this.settings.PUBLIC_GROUP_PER_CONTAINER) {
                    if (fromListPublicGroup) {
                        viewAllText = ctx.user.locale === "hi" ? StudyGroupData.viewAll.hi : StudyGroupData.viewAll.en;
                    }
                }
                if (fromListPublicGroup) {
                    popularGroupsFromRedis = this.shuffleArray(popularGroupsFromRedis);
                }

                popularGroupIds = popularGroupsFromRedis.slice(offset, limit);
                const finalGroupIds = [];
                for (const group of popularGroupIds) {
                    finalGroupIds.push("'" + group.group_id + "'");
                }

                if (!_.isEmpty(finalGroupIds)) {
                    groupsData = await this.broker.call("$studygroupMysql.getGroupsData", {finalGroupIds});
                    const type = noticesGroups ? 4 : 1;
                    groupsData = await this.getGroupWidgetStructure(groupsData, ctx, type);
                    groupsData.widget_data.link_text = viewAllText;
                }
            }
            return groupsData;
        },

        async getPromoGroupData(ctx) {
            const { promotedGroupDetails, nonExamClasses, examClasses } = StudyGroupData;
            let promotedGroupList = [];
            let promoGroupData = [];
            const studentData = await this.broker.call("$studygroupMysql.getStudentDetailsById", {studentId: ctx.user.student_id});
            if (studentData.length > 0) {
                if (nonExamClasses.includes(parseInt(studentData[0].student_class, 10))) {
                    promotedGroupList = promotedGroupDetails[studentData[0].student_class];
                } else if (examClasses.includes(parseInt(studentData[0].student_class, 10))) {
                    const ccmIdDetails = await this.broker.call("$studygroupMysql.getSelectedCcmDetails", {studentId: ctx.user.student_id});
                    if (!_.isEmpty(ccmIdDetails)) {
                        const listDetails = promotedGroupDetails[studentData[0].student_class];
                        if (!_.isEmpty(listDetails)) {
                            listDetails.forEach(x => {
                                ccmIdDetails.forEach(y => {
                                    if (Object.keys(x).includes(y.ccm_id.toString())) {
                                        promotedGroupList.push(x[y.ccm_id]);
                                    }
                                });
                            });
                        }
                    }
                }

                if (!_.isEmpty(promotedGroupList)) {
                    promoGroupData = await this.broker.call("$studygroupMysql.getGroupDataById", {groupId: promotedGroupList});
                }
            }
            return promoGroupData;
        },

        async getRecommendedGroups(limit, offset, fromListPublicGroup, ctx) {
            try {
                let groupsData;
                groupsData = await this.broker.call("$studygroupMysql.getRecommendedGroupsData", {studentClass: ctx.user.student_class || 10});
                const promoGroupData = await this.getPromoGroupData(ctx);
                if (promoGroupData.length > 0) {
                    groupsData = [...promoGroupData, ...groupsData];
                }

                if (!_.isEmpty(groupsData)) {
                    let viewAllText = null;
                    if (groupsData.length > this.settings.PUBLIC_GROUP_PER_CONTAINER) {
                        if (fromListPublicGroup) {
                            viewAllText = ctx.user.locale === "hi" ? StudyGroupData.viewAll.hi : StudyGroupData.viewAll.en;
                        }
                    }
                    groupsData = groupsData.slice(offset, limit);
                    groupsData = await this.getGroupWidgetStructure(groupsData, ctx, 2);
                    groupsData.widget_data.link_text = viewAllText;
                }
                return groupsData;
            } catch (e) {
                console.error(e);
                return [];
            }
        },

        async getSuggestedGroups(limit, offset, fromListPublicGroup, ctx) {
            try {
                let suggestedGroupIds = [];
                let groupsData;
                const redisKey = `SUGGESTED_GROUP_${ctx.user.student_class || 10}`;
                let suggestedGroupsFromRedis = await redisUtility.getRedisKeyData.call(this, redisKey);
                let viewAllText = null;

                if (!_.isEmpty(suggestedGroupsFromRedis)) {
                    if (suggestedGroupsFromRedis.length > this.settings.PUBLIC_GROUP_PER_CONTAINER) {
                        if (fromListPublicGroup) {
                            viewAllText = ctx.user.locale === "hi" ? StudyGroupData.viewAll.hi : StudyGroupData.viewAll.en;
                        }
                    }
                    if (fromListPublicGroup) {
                        suggestedGroupsFromRedis = this.shuffleArray(suggestedGroupsFromRedis);
                    }

                    suggestedGroupIds = suggestedGroupsFromRedis.slice(offset, limit);
                    const finalGroupIds = [];
                    for (const group of suggestedGroupIds) {
                        finalGroupIds.push("'" + group.group_id + "'");
                    }
                    if (!_.isEmpty(finalGroupIds)) {
                        groupsData = await this.broker.call("$studygroupMysql.getGroupsData", {finalGroupIds});
                        groupsData = await this.getGroupWidgetStructure(groupsData, ctx, 3);
                        groupsData.widget_data.link_text = viewAllText;
                    }
                }
                return groupsData;
            } catch (e) {
                console.error(e);
                return [];
            }
        },

        // eslint-disable-next-line max-lines-per-function
        async getGroupWidgetStructure(groupsData, ctx: any, type?: number, groupMember?: boolean) {
            // type 1 for popular group, 2 for recommended and 3 for suggested 4 for todaysSpecial 5 for Mygroups
            let title;
            let deeplink;

            switch (type) {
                case 1: {
                    title = ctx.user.locale === "hi" ? StudyGroupData.popularGroupTitle.hi : StudyGroupData.popularGroupTitle.en;
                    deeplink = "doubtnutapp://study_group?screen=popular";
                    break;
                }
                case 2: {
                    title = ctx.user.locale === "hi" ? StudyGroupData.recommendedGroupTitle.hi : StudyGroupData.recommendedGroupTitle.en;
                    deeplink = "doubtnutapp://study_group?screen=recommended";
                    break;
                }
                case 3: {
                    title = ctx.user.locale === "hi" ? StudyGroupData.suggestedGroupTitle.hi : StudyGroupData.suggestedGroupTitle.en;
                    deeplink = "doubtnutapp://study_group?screen=suggested";
                    break;
                }
                case 4: {
                    title = ctx.user.locale === "hi" ? StudyGroupData.todaySpecialGroupTitle.hi : StudyGroupData.todaySpecialGroupTitle.en;
                    deeplink = "doubtnutapp://study_group?screen=popular";
                    break;
                }
                case 5: {
                    title = ctx.user.locale === "hi" ? StudyGroupData.myGroups.hi : StudyGroupData.myGroups.en;
                    break;
                }
            }
            const groupIds = [];
            for (const group of groupsData) {
                groupIds.push(group.group_id);
            }
            const lastMsgSentData = await this.getLastSentDataActiveGroups(groupIds);
            const items = [];
            for (let i = 0; i < groupsData.length; i++) {
                let subtitle = groupsData[i].total_members > 1 ? `${groupsData[i].total_members} Members` : `${groupsData[i].total_members} Member`;
                let timestamp = null;
                if (lastMsgSentData[i].timestamp) {
                    subtitle = subtitle + `  |  Last active ${moment(lastMsgSentData[i].timestamp).subtract(5, "hours").subtract(30, "minutes").fromNow()}`;
                }
                let lastMsgContainer = false;
                if (groupMember && lastMsgSentData[i].last_sent_message_container) {
                    timestamp = lastMsgSentData[i].timestamp ? await this.lastSeenTimeFormat(lastMsgSentData[i].timestamp) : null;
                    lastMsgContainer = true;
                }
                const widget = {
                    widget_type: "widget_sg_group_chat",
                    widget_data: {
                        group_id: groupsData[i].group_id,
                        group_name: unescape(groupsData[i].group_name),
                        // group_image: groupsData[i].group_image,
                        group_image: StudyGroupData.defaultGroupImage,
                        group_type: groupsData[i].group_type,
                        is_admin: 0,
                        is_verified: groupsData[i].is_verified === 1,
                        left_at: null,
                        blocked_at: null,
                        is_active: 1,
                        subtitle: lastMsgContainer ? null : subtitle,
                        timestamp,
                        unread_count: null,
                        last_message_sent_at: lastMsgSentData[i].timestamp,
                        last_sent_message_container: lastMsgContainer ? lastMsgSentData[i].last_sent_message_container : null,
                        is_faq: false,
                        is_mute: false,
                        toast_message: null,
                        cta_text: null,
                        deeplink: `doubtnutapp://study_group/chat?group_id=${groupsData[i].group_id}&is_faq=false`,
                    },
                };
                items.push(widget);
            }
            const widget_data = {
                title,
                show_item_decorator: true,
                remove_padding: true,
                title_text_size: "16",
                deeplink,
                scroll_direction: "vertical",
                items,
            };

            return {
                widget_type: "widget_parent",
                widget_data,
            };
        },

    },
};

export = StudyGroupPopularGroups;
