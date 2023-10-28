import {ServiceSchema} from "moleculer";
import MongoDBAdapter from "moleculer-db-adapter-mongo";
import _ from "lodash";
import moment from "moment";
import {ObjectId} from "mongodb";
import {redisUtility} from "../../../common";

const TOTAL_POPULAR_GROUPS = 50;
const TOTAL_SUGGESTED_GROUPS_LIMIT = 500;

const PopularStudyGroups: ServiceSchema = {
    name: "$studygroup-storing-popular-groups-cron",
    adapter: new MongoDBAdapter(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}),
    methods: {
        async setPopularStudyGroups() {
            try {
                const classes = [6, 7, 8, 9, 10, 11, 12, 13, 14];

                for (const studentClass of classes) {
                    const PopularGroupRedisKey = `POPULAR_GROUPS_${studentClass}`;
                    const SuggestedGroupRedisKey = `SUGGESTED_GROUP_${studentClass}`;

                    const popularGroups = await this.broker.call("$studygroupCronMysql.getStudyGroupsOnMembersAndClassBasis", {studentClass});
                    const teachersGroups = await this.broker.call("$studygroupCronMysql.getFreeTeachersGroups", {studentClass});

                    const popularGroupsIds = [];
                    let suggestedGroupsIds = [];
                    if (!_.isEmpty(popularGroups)) {
                        for (const group of popularGroups) {
                            suggestedGroupsIds.push({
                                group_id: group.group_id,
                                group_name: unescape(group.group_name),
                            });
                        }
                    }

                    if (!_.isEmpty(teachersGroups)) {
                        for (const group of teachersGroups) {
                            popularGroupsIds.push({
                                group_id: group.group_id,
                                group_name: unescape(group.group_name),
                            });
                        }
                    }
                    // const popularGroupsIds = finalGroupIds.slice(0, TOTAL_POPULAR_GROUPS);
                    suggestedGroupsIds = suggestedGroupsIds.slice(0, TOTAL_SUGGESTED_GROUPS_LIMIT);

                    // setting redis key for a day
                    await Promise.all([
                        redisUtility.setRedisKeyData.call(this, PopularGroupRedisKey, popularGroupsIds, 60 * 60 * 24),
                        redisUtility.setRedisKeyData.call(this, SuggestedGroupRedisKey, suggestedGroupsIds, 60 * 60 * 24)]);
                    console.log("PopularGroup and SuggestedGroup cron executed");
                }
            } catch
                (e) {
                console.error(e);
                this.logger.error(e);
                throw (e);
            }
        },
        objectIdFromDate(date) {
            return Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000";
        },
        async getGroupsAfterProfanityCheck(groupIds) {
            const now = moment().add(5, "hours").add(30, "minutes").subtract(1, "days").toDate();
            const objectIdFroomDate = this.objectIdFromDate(now);

            const facetObj = {};
            const projectObj = {};
            for (const data of groupIds) {
                facetObj[data.group_id] = [
                    {
                        $match: {
                            room_id: data.group_id,
                            _id: {
                                $gt: new ObjectId(objectIdFroomDate),
                            },
                        },
                    },
                    {$count: data.group_id},
                ];
                projectObj[data.group_id] = {$arrayElemAt: ["$" + `${data.group_id}.${data.group_id}`, 0]};
            }
            const pipeline = [
                {
                    $facet: facetObj,
                },
                {
                    $project: projectObj,
                },
            ];

            return await this.adapter.db.collection("profane_messages").aggregate(pipeline).toArray();
        },

        async getGroupsAfterReportCheck(groupIds) {
            if (_.isEmpty(groupIds)) {
                return [];
            }

            const facetObj = {};
            const projectObj = {};
            for (const data of groupIds) {
                facetObj[data.group_id] = [
                    {$match: {room_id: data.group_id}},
                    {$count: data.group_id},
                ];
                projectObj[data.group_id] = {$arrayElemAt: ["$" + `${data.group_id}.${data.group_id}`, 0]};
            }
            const pipeline = [
                {
                    $facet: facetObj,
                },
                {
                    $project: projectObj,
                },
            ];

            return await this.adapter.db.collection("chatroom_group_report").aggregate(pipeline).toArray();
        },
    },

    actions: {},
};

export = PopularStudyGroups;
