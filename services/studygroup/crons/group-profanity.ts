import {ServiceSchema} from "dn-moleculer";
import DbService from "dn-moleculer-db";
import profanity from "profanity-hindi";
import moment from "moment";
import ImageProfanity from "../methods/profanity.checker";
import {customBadWords} from "../profanity/data/custom-bad-words";
profanity.addWords(customBadWords);
import Settings from "../methods/settings";
import {redisUtility} from "../../../common";
import dbMixin from "../config/db.mixin";
import {wordProfanity} from "../profanity";

const StudyGroupProfanityCheckScriptService: ServiceSchema = {
    name: "studygroup-profanity-check-script",
    mixins: [dbMixin("profane_groups"), DbService, ImageProfanity, Settings],
    methods: {

        async banProfanedGroups(studyGroups: any) {
            /* Steps:
                get All active study groups
                check group name profanity
                check group image profanity
                ban profaned groups with cache removal and mongo entries for logs
            */

            const profanedGroupIds = [];
            const profanedStudyGroupPk = [];

            for (const group of studyGroups) {

                const isImageProfaned = false;
                const groupName = unescape(group.group_name);
                const isNameProfaned = await profanity.isMessageDirty(groupName) || await wordProfanity.isWordProfane(groupName);

                // if (!isNameProfaned && group.group_image) {
                //     console.log("bypassed image profanity for now");
                //     // isImageProfaned = await this.isImageProfaned(group.group_image);
                // }


                if (isImageProfaned || isNameProfaned) {
                    this.logger.info(unescape(group.group_name), "=> name -", isNameProfaned, group.group_image, isImageProfaned);
                    profanedGroupIds.push(JSON.parse(JSON.stringify(group.group_id)));
                    profanedStudyGroupPk.push(group.id);
                    // group is profaned
                    await this.adapter.db.collection("profane_groups").insertOne({
                        room_type: group.group_type,
                        group_id: group.group_id,
                        group_name: unescape(group.group_name),
                        group_image: group.group_image,
                        student_id: group.created_by,
                        is_group_name_profaned: isNameProfaned,
                        name_updated_by: group.name_updated_by,
                        is_image_profaned: isImageProfaned,
                        image_updated_by: group.image_updated_by,
                        created_at: moment().add(5, "hours").add(30, "minutes").toDate(),
                    });
                    await redisUtility.deleteKey.call(this, group.group_id);
                }
            }

            this.logger.info("updateReports ", profanedGroupIds.length, profanedGroupIds);
            if (profanedGroupIds.length){
                const makeGroupAsInactive = await this.broker.call("$studygroupCronMysql.makeGroupAsInactive", {
                    group_ids: profanedGroupIds,
                });
                this.logger.info("updated group count study_group ", makeGroupAsInactive);
            }

            return {profanedGroupIds, profanedStudyGroupPk};
        },

        async deactivateMembers(studyGroupIds: any) {
            /* Steps:
                block all members of profaned groups
            */

            if (studyGroupIds.length){
                await this.broker.call("$studygroupCronMysql.makeMembersAsInactive", {
                    study_group_ids: studyGroupIds,
                });
                this.logger.info(`total ${studyGroupIds.length} studygroup ids members blocked`);
            }
            return true;
        },

        async resetCacheForAffectedMembers(studyGroupIds: any) {
            /* Steps:
                block all members of profaned groups
            */
            if (studyGroupIds.length){
                const affectedMembers = await this.broker.call("$studygroupCronMysql.getAllMembersByGroupPk", {
                    study_group_ids: studyGroupIds,
                });
                this.logger.info(`total ${studyGroupIds.length} studygroup ids members blocked`);

                for (const member of affectedMembers) {
                    await redisUtility.deleteHashField.call(this, `USER:${member.student_id}`, "LIST_GROUPS");
                }
            }
            return true;
        },

        async inactiveGroups() {
            try {
                let totalProfaneGroups = 0;
                // const index = await redisUtility.getRedisKeyData.call(this, "DEACTIVATE_PROFANE_GROUPS") || 0;
                const chunk = 10000;

                for (let i = 0; i < 500000; i += chunk) {
                    const studyGroups = await this.broker.call("$studygroupCronMysql.getActiveGroups", {
                        offset: i,
                        limit: chunk,
                    });
                    if (!studyGroups.length) {
                        this.logger.info("Check on all groups completed");
                        break;
                    }
                    const profaneCount = await this.banProfanedGroups(studyGroups);
                    totalProfaneGroups += profaneCount;
                    this.logger.info("now deactivating group members");
                    await this.deactivateMembers(profaneCount.profanedStudyGroupPk);
                    this.logger.info("now resetting cache of affected group members");
                    await this.resetCacheForAffectedMembers(profaneCount.profanedStudyGroupPk);
                    // this.logger.info("cache reset done");
                    // await redisUtility.incrKeyData.call(this, "DEACTIVATE_PROFANE_GROUPS", i, this.settings.weeklyRedisTTL);
                    await this.sendAlertMessage("ban script confirmation", `out of ${studyGroups.length} groups ${profaneCount.profanedGroupIds.length} are profane`);
                }
                await this.sendAlertMessage("ban Profaned Groups completed", `${totalProfaneGroups} groups have been marked as in active`);
                return totalProfaneGroups;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },

    actions: {},
};

export = StudyGroupProfanityCheckScriptService;
