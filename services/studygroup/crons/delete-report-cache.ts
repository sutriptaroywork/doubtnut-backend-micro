import {ServiceSchema} from "moleculer";
import {redisUtility} from "../../../common";

const StudyGroupDelReportCacheCronService: ServiceSchema = {
    name: "$studygroup-report-cache-cron",
    methods: {
        async delReportedCache() {
            try {
                const updatedReports = await this.broker.call("$studygroupCronMysql.getUpdatedReports", {});
                this.logger.info("updatedReports ", updatedReports.length);
                for (const report of updatedReports) {
                    await redisUtility.deleteKey.call(this, report.study_group_id);
                }
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },

    actions: {},
};

export = StudyGroupDelReportCacheCronService;
