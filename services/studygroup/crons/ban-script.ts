import {ServiceSchema} from "dn-moleculer";
import ImageProfanity from "../methods/profanity.checker";
import {wordProfanity} from "../profanity";
import Settings from "../methods/settings";
import {redisUtility} from "../../../common";

const StudyGroupBanScriptService: ServiceSchema = {
    name: "$studygroup-ban-script",
    mixins: [ImageProfanity, wordProfanity, Settings],
    methods: {

        async reportProfaneGroups(studyGroups: any) {
            /* Steps:
                getAllGroupsFromReporting
                divide in status = 3 or else
                remove status 3 entries
                perform action on remaining entries divide them based on insert or update
            */

            const reportedGroups = await this.broker.call("$studygroupCronMysql.getReportedGroups", {
                group_ids: studyGroups.map(x => x.group_id),
            });
            this.logger.info("already reported groups ", reportedGroups.length, reportedGroups);

            const bannedGroups = reportedGroups.filter(x => x.status === 3).map(item => item.study_group_id);
            const nonBannedGroups = reportedGroups.filter(x => x.status !== 3).map(item => item.study_group_id);

            this.logger.info("bannedGroups ", bannedGroups.length, bannedGroups);
            this.logger.info("nonBannedGroups ", nonBannedGroups.length, nonBannedGroups);

            studyGroups = studyGroups.filter(x => !bannedGroups.includes(x.group_id));

            const updateReports = [];
            const insertReports = [];

            for (const group of studyGroups) {

                let isImageProfaned = false;
                const isNameProfaned = (group.group_name && await wordProfanity.isWordProfane(unescape(group.group_name)));

                if (!isNameProfaned && group.group_image) {
                    isImageProfaned = await this.isImageProfaned(group.group_image);
                }

                this.logger.info(unescape(group.group_name), "=> name -", isNameProfaned, group.group_image, isImageProfaned);

                if (isImageProfaned || isNameProfaned) {

                    if (nonBannedGroups.includes(group.group_id)) {
                        updateReports.push(JSON.parse(JSON.stringify(group.group_id)));
                    } else {
                        insertReports.push(JSON.parse(JSON.stringify(group.group_id)));
                    }
                    await redisUtility.deleteKey.call(this, group.group_id);
                }
            }

            this.logger.info("updateReports ", updateReports.length, updateReports);
            this.logger.info("insertReports ", insertReports.length, insertReports);

            if (insertReports.length){
                const banGroup = await this.broker.call("$studygroupCronMysql.banGroup", {
                    group_ids: insertReports,
                });
                this.logger.info("inserted group count ", banGroup);
            }


            if (updateReports.length){
                const updateGroupBan = await this.broker.call("$studygroupCronMysql.updateGroupBan", {
                    group_ids: updateReports,
                });
                this.logger.info("updated group count ", updateGroupBan);
            }

            if (insertReports.length || updateReports.length){
                const makeGroupAsInactive = await this.broker.call("$studygroupCronMysql.makeGroupAsInactive", {
                    group_ids: updateReports.concat(insertReports),
                });
                this.logger.info("updated group count study_group ", makeGroupAsInactive);
            }

            return insertReports.length + updateReports.length;
        },

        async banStudyGroups() {
            try {
                let totalProfaneGroups = 0;
                const chunk = 500;

                for (let i = 0; i < 5000000; i += chunk) {
                    const studyGroups = await this.broker.call("$studygroupCronMysql.getAllGroups", {
                        offset: i,
                        limit: chunk,
                    });
                    if (!studyGroups.length) {
                        this.logger.info("Check on all groups completed");
                        break;
                    }
                    const profaneCount = await this.reportProfaneGroups(studyGroups);
                    await this.sendAlertMessage("ban script confirmation", `out of ${studyGroups.length} groups ${profaneCount} are profane`);
                    totalProfaneGroups += profaneCount;
                }
                await this.sendAlertMessage("ban script completed", `${totalProfaneGroups} groups have been marked as profane`);
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },

    actions: {},
};

export = StudyGroupBanScriptService;
