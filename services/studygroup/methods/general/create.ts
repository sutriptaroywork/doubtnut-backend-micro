import {ServiceSchema} from "dn-moleculer";
import profanity from "profanity-hindi";
import {v4 as uuid} from "uuid";
import moment from "moment";
import studGroupData from "../../data/studygroup.data";
import {customBadWords} from "../../profanity/data/custom-bad-words";
profanity.addWords(customBadWords);
import {redisUtility} from "../../../../common";
import {wordProfanity} from "../../profanity";
import StudyGroupNotificationService from "./notification";
import StudyGroupActionService from "./group.actions";
import _ from "lodash";
import studygroupData from "../../data/studygroup.data";

const StudyGroupCreateService: ServiceSchema = {
    name: "$studygroup-create",
    mixins: [StudyGroupNotificationService, StudyGroupActionService],
    methods: {

        respondProfane(groupName: string, ctx: any) {
            try {
                this.settings.message = ctx.user.locale === "hi" ? studGroupData.createGroupError.profane.hi : studGroupData.createGroupError.profane.en;
                this.adapter.db.collection("profane_group_names").insertOne({
                    room_type: "study_group",
                    group_name: groupName,
                    student_id: ctx.user.id,
                    created_at: this.settings.currentDate,
                });
                return {
                    message: this.settings.message,
                    is_group_created: false,
                    title: ctx.user.locale === "hi" ? studGroupData.profaneGroupNameHi : studGroupData.profaneGroupNameEn,
                    cta: ctx.user.locale === "hi" ? studGroupData.ctaTextHi : studGroupData.ctaTextEn,
                    group_guideline: studGroupData.groupMsgGuidLine,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async createGroup(groupData: any, ctx: any) {
            try {
                // groupId: string, groupName: string, groupImage: any, canMemberPost: number, groupType: number
                const currentDate = moment().add(5, "hours").add(30, "minutes").format("YYYY-MM-DD HH:mm:ss");
                let adminId = ctx.user.id;
                let randomBDA;
                const qaDnSupportId = studGroupData.dnSupportQAId;
                let lastSentMessage = "Group Created";
                const promises = [];
                if (groupData.groupType === 5) {
                    // fetching BDA Head for support tickets
                    adminId = _.sample(studGroupData.dnSupportAdminIds);
                    randomBDA = _.sample(studGroupData.dnSupportExecutiveIds);
                    const postData = _.cloneDeep(studGroupData.dnSupportFirstMessageStructure);
                    const groupGuideline = `${postData.message.widget_data.group_guideline}\n\n#${ctx.user.id}\nMobile - ${ctx.user.mobile}`;
                    postData.room_id = groupData.groupId;
                    postData.message.widget_data.group_guideline = groupGuideline;
                    const dateObj = moment().add(5, "hours").add(30, "minutes");
                    postData.created_at = dateObj.toDate();
                    postData.updated_at = dateObj.toDate();
                    lastSentMessage = studygroupData.lastSentMessageForSupport;
                    promises.push(
                        this.broker.call("publicChatroom.postPublicMessages", {postData}),
                        redisUtility.deleteHashField.call(this, `USER:${adminId}`, "LIST_GROUPS"),
                        redisUtility.deleteHashField.call(this, `USER:${randomBDA}`, "LIST_GROUPS"),
                        redisUtility.deleteHashField.call(this, `USER:${qaDnSupportId}`, "LIST_GROUPS"));
                }
                const data = {
                    group_id: groupData.groupId,
                    group_type: groupData.groupType,
                    group_name: escape(groupData.groupName),
                    group_image: groupData.groupImage,
                    can_member_post: groupData.canMemberPost,
                    member_post_updated_by: adminId,
                    member_post_updated_at: currentDate,
                    created_by: adminId,
                    image_updated_by: adminId,
                    image_updated_at: currentDate,
                    name_updated_by: adminId,
                    name_updated_at: currentDate,
                    created_by_class: ctx.user.student_class || 10,
                    is_verified: 0,
                };
                const studyGroupId = await this.broker.call("$studygroupMysql.createGroup", {data});
                // adding member as admin as self user created the group
                promises.push(this.addMember(studyGroupId, 1, adminId));
                if (groupData.groupType === 5) {
                    // in case of support requested, adding student also as member
                    promises.push(this.addMember(studyGroupId, 0, ctx.user.id));
                    // also adding any random BDA to the group, assigned BDA will provide support as sub admin
                    promises.push(this.addMember(studyGroupId, 2, randomBDA));
                    promises.push(this.addMember(studyGroupId, 2, qaDnSupportId));
                    // promises.push(this.supportGroupCreationNotify(groupData.groupId));
                } else {
                    promises.push(this.sendCreateGroupNotification(ctx));
                }
                promises.push(this.updateLastSentTimeAndMessage(lastSentMessage, groupData.groupId, ctx));
                this.settings.message = "Group successfully created!";
                this.settings.groupId = groupData.groupId;
                await Promise.all(promises);
                return true;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async processGroupCreation(groupName: string, groupImage: any, groupType: number, canMemberPost: number, ctx: any) {
            try {
                let isGroupCreated = false;
                let inviteUrl = null;
                const isImageProfaned = false;
                if (groupType === 5) {
                    groupName = `${this.createChatName(ctx.meta.user.student_fname, ctx.meta.user.student_lname)} ${ctx.meta.user.mobile} ${ctx.meta.user.id}`;
                    groupImage = studGroupData.dnSupportIcon;
                }
                const isEligibleToCreateGroup = await this.isEligibleToCreateGroupV2(ctx.meta);
                const canCreateGroupMapping = { 1: isEligibleToCreateGroup.private,
                                                2: isEligibleToCreateGroup.public,
                                                5: isEligibleToCreateGroup.support};
                const canCreateGroup = canCreateGroupMapping[groupType];
                if (!canCreateGroup) {
                    this.settings.message = ctx.meta.user.locale === "hi" ? studGroupData.createGroupError.maxReached.hi : studGroupData.createGroupError.maxReached.en;
                } else if (groupName.match(/[~`!@#$%^&()_={}[\]:;,.<>+\/?-]/)) {
                    this.settings.message = ctx.meta.user.locale === "hi" ? studGroupData.createGroupError.invalidGroupName.hi : studGroupData.createGroupError.invalidGroupName.en;
                } else if (await this.isDuplicateGroupName(groupName)) {
                    this.settings.message = ctx.meta.user.locale === "hi" ? studGroupData.createGroupError.duplicateGroupName.hi : studGroupData.createGroupError.duplicateGroupName.en;
                } else {
                    if (await profanity.isMessageDirty(groupName) || await wordProfanity.isWordProfane(groupName)) {
                        return this.respondProfane(groupName, ctx);
                    }
                    if (!groupImage || typeof groupImage === "undefined") {
                        groupImage = null;
                    } else {
                        groupImage = `${this.settings.CDN_URL}images/${groupImage}`;
                        // isImageProfaned = await this.isImageProfaned(groupImage);
                    }
                    if (isImageProfaned) {
                        // image is profaned
                        this.settings.message = ctx.meta.user.locale === "hi" ? studGroupData.createGroupError.exception.hi : studGroupData.createGroupError.exception.en;
                    } else {
                        const groupId = `${studGroupData.groupNamePrefixes[groupType]}-${uuid()}`;
                        const requestGroupCreate = await this.createGroup({
                            groupId,
                            groupName,
                            groupImage,
                            canMemberPost,
                            groupType,
                        }, ctx.meta);
                        if (!requestGroupCreate) {
                            this.settings.message = ctx.meta.user.locale === "hi" ? studGroupData.createGroupError.exception.hi : studGroupData.createGroupError.exception.en;
                        } else {
                            isGroupCreated = true;
                            inviteUrl = await this.generateStudyGroupBranchLink(this.settings.groupId, groupName, groupImage, ctx);
                            if (inviteUrl) {
                                await redisUtility.addHashField.call(this, groupId, `${ctx.meta.user.id}_INVITE`, inviteUrl, this.settings.monthlyRedisTTL);
                            }
                            await Promise.all([
                                redisUtility.deleteHashField.call(this, `USER:${ctx.meta.user.id}`, "GROUP_INVITE_COUNT"),
                                redisUtility.deleteHashField.call(this, `USER:${ctx.meta.user.id}`, "LIST_GROUPS")]);
                        }
                    }
                }
                return {
                    isGroupCreated, inviteUrl,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        // v1

        // to create private groups v1 and v2
        async create(ctx: any) {
            try {
                let groupType = 1;
                let isSupport = false;
                let isSupportGroupExists = false;
                let inviteUrl = null;
                let isGroupCreated = false;
                let groupId = null;
                let lastCreatedSupportGroup;
                if (this.isRequestedViaSupportScreen(ctx)) {
                    groupType = 5;
                    isSupport = true;
                    lastCreatedSupportGroup = await this.broker.call("$studygroupMysql.lastRequestedSupportGroup", {studentId: ctx.meta.user.id});
                    if (!_.isEmpty(lastCreatedSupportGroup)) {
                        isSupportGroupExists = true;
                    }
                }
                if (isSupportGroupExists) {
                    inviteUrl = await this.getGroupInviteUrl(lastCreatedSupportGroup[0].group_id, unescape(lastCreatedSupportGroup[0].group_name), lastCreatedSupportGroup[0].group_image, ctx);
                    isGroupCreated = true;
                    groupId = lastCreatedSupportGroup[0].group_id;
                    // await this.supportGroupCreationNotify(groupId);
                } else {
                    const groupCreation = await this.processGroupCreation(ctx.params.group_name, ctx.params.group_image, groupType, 1, ctx);
                    inviteUrl = groupCreation.inviteUrl;
                    isGroupCreated = groupCreation.isGroupCreated;
                    groupId = this.settings.groupId;
                }

                const initialMessageData = {
                    group_guideline: studGroupData.groupMsgGuidLine,
                    invite_message: studGroupData.firstInviteMessageEn,
                    invite_cta_text: studGroupData.inviteCtaTextEn,
                    copy_invite_cta_text: studGroupData.copyInviteCtaTextEn,
                    invite_deeplink: inviteUrl,
                };
                return {
                    message: this.settings.message,
                    is_group_created: isGroupCreated,
                    initial_messages_data: initialMessageData,
                    group_id: groupId,
                    group_chat_deeplink: `doubtnutapp://study_group/chat?group_id=${groupId}&is_faq=false&is_support=${isSupport}`,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async isEligibleToCreateGroup(ctx) {
            try {
                const totalGroupsAsAdmin = await this.broker.call("$studygroupMysql.getTotalGroupsAsAdmin", {studentId: ctx.user.id});
                return totalGroupsAsAdmin && totalGroupsAsAdmin[0].total < this.settings.TOTAL_ALLOWED_PRIVATE_GROUPS_AS_ADMIN;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async canCreateGroup(ctx) {
            try {
                const canCreateGroup = await this.isEligibleToCreateGroup(ctx);
                let sliderData = null;
                let heading = null;
                if (canCreateGroup) {
                    sliderData = (ctx.user.locale === "hi" ? studGroupData.createGroupHi : studGroupData.createGroupEn);
                    heading = (ctx.user.locale === "hi" ? studGroupData.groupCreateHeadingHi : studGroupData.groupCreateHeadingEn);
                    this.settings.message = "this user is eligible to create a group";
                } else {
                    this.settings.message = "this user can not create another group";
                }
                return {
                    message: this.settings.message, can_create_group: canCreateGroup, slider_data: sliderData, heading,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        // V2

        // to create public groups
        async createPublic(groupName: string, onlySubAdminCanPost: number, ctx: any, groupImage?: any) {
            try {
                // groupType = 2: public
                const canMemberPost = onlySubAdminCanPost ? 0 : 1; // member post should be opposite of onlySubAdminCanPost
                const groupCreation = await this.processGroupCreation(groupName, groupImage, 2, canMemberPost, ctx);
                const initialMessageData = {
                    group_guideline: studGroupData.groupMsgGuidLine,
                    invite_message: studGroupData.firstInviteMessageEn,
                    invite_cta_text: studGroupData.inviteCtaTextEn,
                    copy_invite_cta_text: studGroupData.copyInviteCtaTextEn,
                    invite_deeplink: groupCreation.inviteUrl,
                };
                return {
                    message: this.settings.message,
                    is_group_created: groupCreation.isGroupCreated,
                    initial_messages_data: initialMessageData,
                    group_id: this.settings.groupId,
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },

        async isEligibleToCreateGroupV2(ctx) {
            try {
                // 1 - private, 2 - public
                const canCreateGroup = {
                    private: true,
                    public: true,
                    support: true,
                };
                const totalGroupsAsAdmin = await this.broker.call("$studygroupMysql.getCountOfGroupsAsAdmin", {studentId: ctx.user.id});
                for (const group of totalGroupsAsAdmin) {
                    if (group.group_type === 1 && group.total >= this.settings.TOTAL_ALLOWED_PRIVATE_GROUPS_AS_ADMIN) {
                        canCreateGroup.private = false;
                    } else if (group.group_type === 2 && group.total >= this.settings.TOTAL_ALLOWED_PUBLIC_GROUPS_AS_ADMIN) {
                        canCreateGroup.public = false;
                    }
                }
                return canCreateGroup;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async isDuplicateGroupName(groupName) {
            try {
                const isDuplicateGroupNameData = await this.broker.call("$studygroupMysql.isDuplicateGroup", {groupName});
                return isDuplicateGroupNameData[0].exist === 1;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        // eslint-disable-next-line max-lines-per-function
        getCreateGroupWidget(widgetType, ctx) {

            const createGroupTypeWise = {
                public:
                    {
                        en: {
                            title: "Public",
                            group_type: 2,
                            can_create_group: false,
                            active_tab: false,
                            heading: "About Public Groups",
                            guidelines: [{
                                index: "1.",
                                content: "Anyone can search for any public groups and join them even without the invite link.",
                            }, {
                                index: "2.",
                                content: "1000 members can join public groups.",
                            }],
                            no_group_create_message: "You have crossed the number of limits for creating public groups so you won’t be able to create any further group",
                            group_name_title: "Group Name",
                            group_image_title: "Upload Group Image",
                            only_sub_admin_can_post_toggle: true,
                            sub_admin_post_container: {
                                title: "Allow only admin/sub-admin to post ",
                                only_sub_admin_can_post: false,
                            },
                        },
                        hi: {
                            title: "पब्लिक",
                            group_type: 2,
                            can_create_group: false,
                            active_tab: false,
                            heading: "पब्लिक ग्रुप के बारे में",
                            guidelines: [{
                                index: "1.",
                                content: "कोई भी व्यक्ति किसी भी पब्लिक ग्रुप को खोज सकता है और आमंत्रण लिंक के बिना भी उनमें शामिल हो सकता है",
                            }, {
                                index: "2.",
                                content: "1000 सदस्य पब्लिक ग्रुप में शामिल हो सकते हैं",
                            }],
                            no_group_create_message: "आपने पब्लिक ग्रुप बनाने की सीमा पार कर ली है, इसलिए आप आगे कोई ग्रुप नहीं बना पाएंगे",
                            group_name_title: "ग्रुप का नाम",
                            group_image_title: "ग्रुप की पिक्चर अपलोड करें",
                            only_sub_admin_can_post_toggle: true,
                            sub_admin_post_container: {
                                title: "पोस्ट करने के लिए केवल एडमिन/सब-एडमिन को अनुमति दें ",
                                only_sub_admin_can_post: false,
                            },
                        },
                    },
                private:
                    {
                        en: {
                            title: "Private",
                            group_type: 1,
                            can_create_group: false,
                            active_tab: false,
                            heading: "About Private Groups",
                            guidelines: [{
                                index: "1.",
                                content: "Other members can join private groups only if they have the group invite link.",
                            }, {
                                index: "2.",
                                content: "Only 250 members can be part of a private group.",
                            }],
                            no_group_create_message: "You have crossed the number of limits for creating public groups so you won’t be able to create any further group",
                            group_name_title: "Group Name",
                            group_image_title: "Upload Group Image",
                            only_sub_admin_can_post_toggle: false,
                            sub_admin_post_container: null,
                        },
                        hi: {
                            title: "प्राइवेट",
                            group_type: 1,
                            can_create_group: false,
                            active_tab: false,
                            heading: "प्राइवेट ग्रुप के बारे में",
                            guidelines: [{
                                index: "1.",
                                content: "अन्य सदस्य प्राइवेट ग्रुप में तभी शामिल हो सकते हैं जब उनके पास ग्रुप आमंत्रण लिंक हो",
                            }, {
                                index: "2.",
                                content: "केवल 250 सदस्य ही एक प्राइवेट ग्रुप का हिस्सा हो सकते हैं",
                            }],
                            no_group_create_message: "आपने प्राइवेट ग्रुप बनाने की सीमा पार कर ली है, इसलिए आप आगे कोई ग्रुप नहीं बना पाएंगे",
                            group_name_title: "ग्रुप का नाम",
                            group_image_title: "ग्रुप की पिक्चर अपलोड करें",
                            only_sub_admin_can_post_toggle: false,
                            sub_admin_post_container: null,
                        },
                    },
            };

            return ctx.user.locale === "hi" ? createGroupTypeWise[widgetType].hi : createGroupTypeWise[widgetType].en;
        },

        async canCreateGroupV2(ctx) {
            try {
                const canCreateGroup = await this.isEligibleToCreateGroupV2(ctx);
                const groupTypes = [];

                const heading = (ctx.user.locale === "hi" ? studGroupData.createGroupTypeWise.group_create_heading.hi : studGroupData.createGroupTypeWise.group_create_heading.en);
                this.settings.message = "this user is eligible to create a group";

                const privateGroups = this.getCreateGroupWidget("private", ctx);
                privateGroups.can_create_group = canCreateGroup.private;

                const publicGroups = this.getCreateGroupWidget("public", ctx);
                publicGroups.can_create_group = canCreateGroup.public;
                if (canCreateGroup.public) {
                    publicGroups.active_tab = true;
                } else {
                    privateGroups.active_tab = true;
                }
                groupTypes.push(publicGroups, privateGroups);

                return {
                    message: this.settings.message,
                    heading,
                    group_types: groupTypes,
                    cta_text: (ctx.user.locale === "hi" ? studGroupData.createGroupTypeWise.cta.hi : studGroupData.createGroupTypeWise.cta.en),
                };
            } catch (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = StudyGroupCreateService;
