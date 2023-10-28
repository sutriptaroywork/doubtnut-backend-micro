import {ServiceSchema} from "dn-moleculer";
import {redisUtility} from "../../../common";
import MilestoneService from "./milestones";

const achievedActivitiesSchema: ServiceSchema = {
    name: "$achievedActivities",
    mixins: [MilestoneService],
    methods: {

        async getAchievedActivities(ctx: any) {
            try {
                return await redisUtility.getAllHashFields.call(this, `ACTIVITY_BASED_${ctx.meta.user.student_id}`);
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = achievedActivitiesSchema;
