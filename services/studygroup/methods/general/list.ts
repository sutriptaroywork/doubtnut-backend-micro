import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import moment from "moment";
import {ObjectId} from "mongodb";
import studGroupData from "../../data/studygroup.data";
import {redisUtility} from "../../../../common";
import PublicGroup from "./public.groups";

const StudyGroupListService: ServiceSchema = {
    name: "$studygroup-list",
    mixins: [PublicGroup],
    methods: {

        // V1 for list groups - Should work as earlier
        async listGroups(ctx: any) {
            try {
                const data = await this.broker.call("$studygroupMysql.getActivePrivateGroups", {studentId: ctx.user.id});
                const groups = [];
                for (let i = 0; i <= data.length; i++) {
                    if (data[i] && data[i].pk) {
                        data[i].last_message_sent_at = await this.getLastSentData(data[i].group_id);
                        let subtitle = "";
                        let isMute = false;

                        if (data[i].last_message_sent_at !== null && data[i].is_active === 1) {
                            subtitle = `${data[i].subtitle} Students\nLast message sent ${moment(data[i].last_message_sent_at).subtract(5, "hours").subtract(30, "minutes").fromNow()}`;
                        } else if (data[i].is_active === 1) {
                            subtitle = `${data[i].subtitle} Students`;
                        } else if (data[i].is_left === 1 && data[i].left_at) {
                            subtitle = `You left ${moment(data[i].left_at).fromNow()}`;
                        } else if (data[i].is_blocked === 1 && data[i].blocked_at) {
                            subtitle = `You were removed from this group ${moment(data[i].blocked_at).fromNow()}`;
                        }

                        if (data[i].muted_till) {
                            isMute = moment().add(5, "hours").add(30, "minutes").isBefore(moment(data[i].muted_till));
                        }
                        delete data[i].muted_till;
                        data[i].subtitle = subtitle;
                        data[i].is_faq = false;
                        data[i].is_mute = isMute;
                        data[i].group_image = (data[i].group_image === null ? studGroupData.defaultGroupImage : data[i].group_image);
                        data[i].group_name = unescape(data[i].group_name);
                        groups.push(data[i]);
                    }
                }

                let canCreateGroup = false;
                let sortedGroups = [];
                const activeGroups = _.orderBy(_.filter(groups, item => item.is_active === 1), [o => o.last_message_sent_at || ""], ["desc"]);
                const leftGroups = _.orderBy(_.filter(groups, item => item.is_left === 1 || item.is_blocked === 1), ["left_at", "blocked_at"], ["desc"]);
                sortedGroups.push(...activeGroups, (ctx.user.locale === "hi" ? studGroupData.faqGroupDataHi : studGroupData.faqGroupDataEn), ...leftGroups);
                const GroupsAsAdmin = _.filter(activeGroups, item => item.is_admin === 1);
                if (GroupsAsAdmin.length < this.settings.TOTAL_ALLOWED_PRIVATE_GROUPS_AS_ADMIN) {
                    canCreateGroup = true;
                }
                if (ctx.versionCode < 959) {
                    sortedGroups = _.filter(sortedGroups, item => item.widget_data && item.widget_data.group_type !== 3);
                }
                return {
                    groups: sortedGroups,
                    user_left_message: (ctx.user.locale === "hi" ? studGroupData.userLefFromGroupHi : studGroupData.userLefFromGroupEn),
                    user_blocked_message: (ctx.user.locale === "hi" ? studGroupData.userBlockedFromGroupHi : studGroupData.userBlockedFromGroupEn),
                    cta_text: (ctx.user.locale === "hi" ? studGroupData.ctaTextHi : studGroupData.ctaTextEn),
                    can_create_group: canCreateGroup,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        // eslint-disable-next-line max-lines-per-function
        async getAllMyGroups(ctx: any) {
            // Used in V2 for structuring my groups
            try {
                let data = await redisUtility.getHashField.call(this, `USER:${ctx.user.id}`, "LIST_GROUPS") || {};
                // checking the attributes from redis first, if not available then sql will be performed
                if (_.isEmpty(data)) {
                    data = await this.broker.call("$studygroupMysql.getActiveGroups", {studentId: ctx.user.id});
                    await redisUtility.addHashField.call(this, `USER:${ctx.user.id}`, "LIST_GROUPS", data, this.settings.dailyRedisTTL);
                }
                const activeGroups = _.map(_.filter(data, item => item.is_active === 1), "group_id");

                // last sent details
                const lastSentRedis = await this.getLastSentDataActiveGroups(activeGroups);
                data = data.map(t1 => ({...t1, ...lastSentRedis.find(t2 => t1.group_id === t2.group_id)}));

                const groups = [];
                const groupsForUnreadCount = [];
                for (let i = 0; i <= data.length; i++) {
                    if (data[i] && data[i].pk) {

                        let subtitle = null;
                        let isMute = false;
                        let toastMessage = null;
                        let ctaText = null;
                        let lastSentTime = null;

                        if (data[i].is_active === 1) {
                            // last_sent_container + subtitle
                            data[i].unread_count = null;
                            data[i].last_message_sent_at = data[i].timestamp;
                            if (data[i].last_message_sent_at !== null) {
                                lastSentTime = moment(data[i].timestamp).valueOf();
                                data[i].timestamp = await this.lastSeenTimeFormat(data[i].timestamp);
                                data[i].subtitle = data[i].subtitle > 1 ? `${data[i].subtitle} Members` : `${data[i].subtitle} Member`;
                                if (data[i].last_sent_message_container && data[i].last_sent_message_container.sender_id !== ctx.user.id) {
                                    groupsForUnreadCount.push(data[i].group_id);
                                }
                            } else {
                                subtitle = data[i].subtitle > 1 ? `${data[i].subtitle} Members` : `${data[i].subtitle} Member`;
                                groupsForUnreadCount.push(data[i].group_id);
                                data[i].timestamp = null;
                            }

                        } else if (data[i].is_left === 1 && data[i].left_at) {
                            subtitle = (ctx.user.locale === "hi" ? studGroupData.groupLeftSubtitle.hi : studGroupData.groupLeftSubtitle.en);
                            toastMessage = (ctx.user.locale === "hi" ? studGroupData.userLefFromGroupHi : studGroupData.userLefFromGroupEn);
                            ctaText = (ctx.user.locale === "hi" ? studGroupData.ctaTextHi : studGroupData.ctaTextEn);
                            lastSentTime = moment(data[i].left_at).add(5, "hours").add(30, "minutes").valueOf();
                            data[i].timestamp = await this.lastSeenTimeFormat(lastSentTime);
                            data[i].is_active = 0;
                        } else if (data[i].is_blocked === 1 && data[i].blocked_at) {
                            subtitle = (ctx.user.locale === "hi" ? studGroupData.groupRemovedSubtitle.hi : studGroupData.groupRemovedSubtitle.en);
                            toastMessage = (ctx.user.locale === "hi" ? studGroupData.userBlockedFromGroupHi : studGroupData.userBlockedFromGroupEn);
                            ctaText = (ctx.user.locale === "hi" ? studGroupData.ctaTextHi : studGroupData.ctaTextEn);
                            lastSentTime = moment(data[i].blocked_at).add(5, "hours").add(30, "minutes").valueOf();
                            data[i].timestamp = await this.lastSeenTimeFormat(lastSentTime);
                            data[i].is_active = 0;
                        }

                        if (data[i].muted_till) {
                            isMute = moment().add(5, "hours").add(30, "minutes").isBefore(moment(data[i].muted_till));
                        }
                        data[i].subtitle = subtitle;
                        data[i].is_faq = false;
                        data[i].is_mute = isMute;
                        data[i].group_image = (data[i].group_type === 5 ? studGroupData.dnSupportIcon : studGroupData.defaultGroupImage);
                        // data[i].group_image = (data[i].group_image === null ? studGroupData.defaultGroupImage : data[i].group_image);
                        data[i].group_name = unescape(data[i].group_name);
                        data[i].toast_message = toastMessage;
                        data[i].cta_text = ctaText;
                        data[i].last_sent_time = lastSentTime;
                        data[i].deeplink = studGroupData.listGroups.deeplink.replace("{groupId}", data[i].group_id);
                        data[i].is_verified = data[i].is_verified === 1;
                        // removing additional keys
                        ["pk", "muted_till", "is_left", "is_blocked", "blocked_by"].forEach(e => delete data[i][e]);

                        groups.push({
                            widget_type: "widget_sg_group_chat",
                            widget_data: data[i],
                        });
                    }
                }
                return {
                    groups,
                    groups_for_unread_count: groupsForUnreadCount,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async addUnreadCount(groups: any, groupsForUnreadCount: any, ctx: any) {
            try {
                // last seen for all activeGroups
                const lastSeenRedis = await redisUtility.getMultiHashField.call(this, `SG:${ctx.user.id}`, groupsForUnreadCount);
                const chatLastSeen = [];
                for (let i = 0; i < groupsForUnreadCount.length; i++) {
                    chatLastSeen.push({
                        group_id: groupsForUnreadCount[i],
                        last_seen: lastSeenRedis[i],
                    });
                }

                const privateFacetQuery = {};
                const privateProjectQuery = {};
                const publicFacetQuery = {};
                const publicProjectQuery = {};
                for (const group of chatLastSeen) {
                    const date = (group.last_seen ? moment(group.last_seen).subtract(5, "hours").subtract(30, "minutes") : moment().subtract(30, "days").subtract(30, "days")).valueOf();
                    if (group.group_id.split("-")[0] === "sg") {
                        // private Group
                        privateFacetQuery[group.group_id] = [
                            {
                                $match: {
                                    room_id: group.group_id,
                                    _id: {$gt: new ObjectId(`${Math.floor(date / 1000).toString(16)}0000000000000000`)},
                                    is_message: true,
                                },
                            },
                            {$count: group.group_id},
                        ];
                        privateProjectQuery[group.group_id] = {$arrayElemAt: [`$${group.group_id}.${group.group_id}`, 0]};
                    } else {
                        // public Group
                        publicFacetQuery[group.group_id] = [
                            {
                                $match: {
                                    room_id: group.group_id,
                                    _id: {$gt: new ObjectId(`${Math.floor(date / 1000).toString(16)}0000000000000000`)},
                                    is_message: true,
                                },
                            },
                            {$count: group.group_id},
                        ];
                        publicProjectQuery[group.group_id] = {$arrayElemAt: [`$${group.group_id}.${group.group_id}`, 0]};
                    }
                }
                const promises = [];

                if (!_.isEmpty(privateFacetQuery)) {
                    promises.push(this.adapter.db.collection(this.settings.messageCollection).aggregate([
                        {$facet: privateFacetQuery},
                        {$project: privateProjectQuery},
                    ]).maxTimeMS(1).toArray());
                }

                if (!_.isEmpty(publicFacetQuery)) {
                    promises.push(this.adapter.db.collection(this.settings.publicMessageCollection).aggregate([
                        {$facet: publicFacetQuery},
                        {$project: publicProjectQuery},
                    ]).maxTimeMS(1).toArray());
                }

                const unreadCountPromise = await Promise.all(promises);
                let unreadCount = [];

                for (const promiseResult of unreadCountPromise) {
                    unreadCount = unreadCount.concat(promiseResult);
                }
                if (unreadCount.length) {
                    for (const [key, value] of Object.entries(unreadCount[0])) {
                        for (const j of groups) {
                            if (j.widget_data.group_id === key) {
                                j.widget_data.unread_count = value;
                            }
                        }
                    }
                }

                return groups;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getSortedMyGroup(groups: any, pageType: string, ctx: any) {
            try {
                const sortedGroups = [];
                const activeGroups = _.orderBy(_.filter(groups, item => item.widget_data.is_active === 1), [o => o.widget_data.last_message_sent_at || ""], ["desc"]);
                // const leftGroups = _.orderBy(_.filter(groups, item => item.widget_data.is_active === 0), ["widget_data.left_at", "widget_data.blocked_at"], ["desc"]);
                if (pageType === "my_groups") {
                    // sortedGroups.push(...activeGroups, (ctx.user.locale === "hi" ? studGroupData.faqGroupDataHiV2 : studGroupData.faqGroupDataEnV2), ...leftGroups);
                    // Removing left Groups
                    sortedGroups.push(...activeGroups, (ctx.user.locale === "hi" ? studGroupData.faqGroupDataHiV2 : studGroupData.faqGroupDataEnV2));
                } else {
                    const activatedGroups = _.filter(activeGroups, item => item.widget_data.can_member_post === 1 || (item.widget_data.can_member_post === 0 && item.widget_data.is_admin !== 0));
                    sortedGroups.push(...activatedGroups);
                }
                return sortedGroups;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        // Pending Group Invites
        async pendingGroupInvitesListGroup(ctx) {
            try {
                let groupInvites = await redisUtility.getHashField.call(this, `USER:${ctx.user.id}`, "GROUP_INVITE_COUNT") || {};
                // checking the attributes from redis first, if not available then sql will be performed
                if (_.isEmpty(groupInvites)) {
                    let isPendingGroupInvitesAvailable = false;
                    let pendingGroupInvitesContainer = null;
                    const pendingGroupInvites = await this.broker.call("$studygroupMysql.pendingGroupInviteCount", {studentId: ctx.user.id});
                    if (pendingGroupInvites.length && pendingGroupInvites[0].count) {
                        const groupInviteCount = pendingGroupInvites[0].count;
                        isPendingGroupInvitesAvailable = true;
                        pendingGroupInvitesContainer = studGroupData.listGroups.pendingGroup.widget;
                        pendingGroupInvitesContainer.widget_data.title = (ctx.user.locale === "hi" ? "स्टडी ग्रुप इन्वाइट " : "Study Group Invites ").concat(`(${groupInviteCount})`);
                        pendingGroupInvitesContainer.widget_data.subtitle = ctx.user.locale === "hi" ? studGroupData.listGroups.pendingGroup.subtitle.hi : (groupInviteCount > 1 ? studGroupData.listGroups.pendingGroup.subtitle.en.concat("s") : studGroupData.listGroups.pendingGroup.subtitle.en);
                        pendingGroupInvitesContainer.widget_data.pending_request_count = `${groupInviteCount}`;

                        groupInvites = {
                            is_pending_invites: isPendingGroupInvitesAvailable,
                            invites_container: pendingGroupInvitesContainer,
                        };
                        await redisUtility.addHashField.call(this, `USER:${ctx.user.id}`, "GROUP_INVITE_COUNT", groupInvites, this.settings.monthlyRedisTTL);
                    }
                }
                return groupInvites;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        // V2 for list groups - currently showing my groups
        // eslint-disable-next-line max-lines-per-function
        async listGroupsV2(page: number, pageType: string, ctx: any, showJoinGroupWidget) {
            try {
                let joinHeading = null;
                let isReachedEnd = false;
                let isMyGroupsAvailable = false;
                // My groups
                let mySortedGroups = [];
                let source = "public_groups";
                let isSearchEnabled = false;
                let isCreateGroupAvailable = false;
                let ctaText = null;

                if (page === 0) {
                    const {groups, groups_for_unread_count: groupsForUnreadCount} = await this.getAllMyGroups(ctx);
                    if (_.isEmpty(groups)) {
                        joinHeading = ctx.user.locale === "hi" ? studGroupData.listGroups.joinGroupTitle.hi : studGroupData.listGroups.joinGroupTitle.en;
                    }
                    let allMyGroups = groups;
                    // adding false in condition, to stop query from running
                    if (groupsForUnreadCount.length && pageType === "no_page") {
                        allMyGroups = await this.addUnreadCount(groups, groupsForUnreadCount, ctx);
                    }
                    mySortedGroups = await this.getSortedMyGroup(allMyGroups, pageType, ctx);

                    // Pending Group Invites for only my_groups page
                    if (pageType === "my_groups") {
                        const {
                            is_pending_invites: isPendingInvites,
                            invites_container: invitesContainer,
                        } = await this.pendingGroupInvitesListGroup(ctx);
                        if (isPendingInvites) {
                            mySortedGroups.unshift(invitesContainer);
                        }
                        mySortedGroups = mySortedGroups.length > 1 ? mySortedGroups : [];
                        const privateGroupsAsAdmin = (_.filter(mySortedGroups, item => item.widget_data.is_admin === 1 && item.widget_data.group_type === 1)).length;
                        const publicGroupsAsAdmin = (_.filter(mySortedGroups, item => item.widget_data.is_admin === 1 && item.widget_data.group_type === 2)).length;

                        if (privateGroupsAsAdmin < this.settings.TOTAL_ALLOWED_PRIVATE_GROUPS_AS_ADMIN || publicGroupsAsAdmin < this.settings.TOTAL_ALLOWED_PUBLIC_GROUPS_AS_ADMIN) {
                            isCreateGroupAvailable = true;
                        }
                    }

                    if (mySortedGroups.length) {
                        isMyGroupsAvailable = true;
                        source = "my_groups";
                    }
                }

                // Public Groups
                if (pageType === "my_groups") {
                    isSearchEnabled = true;

                    if (isCreateGroupAvailable) {
                        ctaText = {
                            title: ctx.user.locale === "hi" ? studGroupData.listGroups.cta.hi : studGroupData.listGroups.cta.en,
                            deeplink: studGroupData.listGroups.createGroupDeeplink,
                        };
                    }

                    if (mySortedGroups.length < 10) {
                        isReachedEnd = true;
                        const data = await this.newPublicGroups(ctx);
                        mySortedGroups = mySortedGroups.concat(data.widgets);
                    }
                } else {
                    isReachedEnd = true;
                }
                if (ctx.versionCode < 959) {
                    mySortedGroups = _.filter(mySortedGroups, item => item.widget_data && item.widget_data.group_type !== 3);
                }
                if (showJoinGroupWidget === "true" && page === 0) {
                    mySortedGroups.unshift(studGroupData.joinNewGroupContainer);
                }
                if (ctx.versionCode > 999 && page === 0) {
                    mySortedGroups.unshift({
                        widget_type: "banner_image",
                        layout_config: {
                            margin_top: 0,
                            margin_bottom: 0,
                            margin_right: 0,
                            margin_left: 0,
                        },
                        widget_data: {
                            _id: "app_social_banner",
                            image_url: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BC2EB3EB-9148-0384-DE47-3F626546B0E1.webp",
                            card_ratio: "31:5",
                        },
                    });
                }
                return {
                    title: ctx.user.locale === "hi" ? studGroupData.listGroups.title.hi : studGroupData.listGroups.title.en,
                    new_group_container: ctx.user.locale === "hi" ? studGroupData.listGroups.new_group_container.hi : studGroupData.listGroups.new_group_container.en,
                    is_my_groups_available: isMyGroupsAvailable,
                    is_widget_available: Boolean(mySortedGroups.length),
                    widgets: _.compact(mySortedGroups),
                    no_widget_container: ctx.user.locale === "hi" ? studGroupData.no_group_container.hi : studGroupData.no_group_container.en,
                    join_heading: joinHeading,
                    is_search_enabled: isSearchEnabled,
                    min_search_characters: 1,
                    search_text: ctx.user.locale === "hi" ? studGroupData.search.group.hi : studGroupData.search.group.en,
                    source,
                    cta: ctaText,
                    is_reached_end: isReachedEnd,
                    page: page + 1,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyGroupListService;
