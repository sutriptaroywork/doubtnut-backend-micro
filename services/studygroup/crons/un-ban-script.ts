import {ServiceSchema} from "dn-moleculer";
import ImageProfanity from "../methods/profanity.checker";
import {wordProfanity} from "../profanity";
import Settings from "../methods/settings";
import {redisUtility} from "../../../common";

const StudyGroupBanScriptService: ServiceSchema = {
    name: "$studygroup-ban-script",
    mixins: [ImageProfanity, wordProfanity, Settings],
    methods: {

        async unBanGroups(studyGroups: any) {
            /* Steps:
                study_group_reporting = status = 2
                study_group = is_active = 1
                redis-cache reset
            */

            const groupIds = studyGroups.map(x => x.study_group_id);

            if (groupIds.length){
                const unbanGroup = await this.broker.call("$studygroupCronMysql.unbanGroup", {
                    group_ids: groupIds,
                });
                this.logger.info("unbanGroup count ", unbanGroup);

                const makeGroupAsActive = await this.broker.call("$studygroupCronMysql.makeGroupAsActive", {
                    group_ids: groupIds,
                });
                this.logger.info("makeGroupAsActive count ", makeGroupAsActive);
            }

            for (const group of groupIds) {
                console.log("group ", group);
                await redisUtility.deleteKey.call(this, group);
            }

            return groupIds.length;
        },

        async unbanStudyGroups() {
            try {
                let totalUnbanCount = 0;
                const chunk = 500;

                for (let i = 0; i < 5000000; i += chunk) {
                    const studyGroups = await this.broker.call("$studygroupCronMysql.getBannedGroups", {
                        offset: i,
                        limit: chunk,
                    });
                    if (!studyGroups.length) {
                        this.logger.info("Check on all groups completed");
                        break;
                    }
                    const unBanCount = await this.unBanGroups(studyGroups);
                    await this.sendAlertMessage("un-ban script confirmation", `out of ${studyGroups.length} groups ${unBanCount} are profane`);
                    totalUnbanCount += unBanCount;
                }
                await this.sendAlertMessage("un-ban script completed", `${totalUnbanCount} groups have been marked as profane`);
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },

    actions: {},
};

export = StudyGroupBanScriptService;
