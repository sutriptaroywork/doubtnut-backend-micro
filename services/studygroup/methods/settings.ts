import http from "http";
import https from "https";
import {ServiceSchema} from "dn-moleculer";
import axios from "axios";
import moment from "moment";
import _ from "lodash";
import Enum from "enum";
import {publishRawBackend, redisUtility, staticCDN} from "../../../common";
import studGroupData from "../data/studygroup.data";
import studyChatData from "../data/studychat.data";

const SettingsService: ServiceSchema = {
        name: "$studygroup-settings",
        settings: {
            rest: "/study-group",
            dailyRedisTTL: 60 * 60 * 24, // 24 hours
            weeklyRedisTTL: 60 * 60 * 24 * 7, // 7 days
            minuteRedisTTL: 60, // 1 minute
            TOTAL_SUB_ADMINS_PER_PUBLIC_GROUP: 2,
            TOTAL_SUB_ADMINS_PER_TEACHER_GROUP: 50,
            TOTAL_ALLOWED_PRIVATE_GROUPS_AS_ADMIN: 5,
            TOTAL_ALLOWED_PUBLIC_GROUPS_AS_ADMIN: 15,
            TOTAL_ALLOWED_MEMBERS_IN_GROUP: 1000,
            TOTAL_ALLOWED_MEMBERS_IN_PUBLIC_GROUP: 5000,
            TOTAL_SUGGESTED_GROUPS_LIMIT: 5,
            TOTAL_POPULAR_GROUPS: 16,
            TOTAL_GROUPS_SHOWN_PER_PAGE: 10,
            TOTAL_MEMBERS_SHOWN_PER_PAGE: 100,
            MIN_MEMBERS_IN_GROUP_TO_ENABLE_COMMUNICATION: 1,
            CDN_URL: staticCDN,
            MIN_REPORT_COUNT_MESSAGE: 10, // 10 default value
            MIN_REPORT_COUNT_MEMBER: 5, // 5 default value
            PERCENT_REPORT_PRIVATE: 10,
            PERCENT_REPORT_PUBLIC: 10,
            MIN_REPORT_COUNT_GROUP: 3,
            MIN_PUBLIC_REPORT_COUNT_MESSAGE: 10, // 10 default value
            MIN_PUBLIC_REPORT_COUNT_MEMBER: 5, // 5 default value
            MIN_PUBLIC_REPORT_COUNT_GROUP: 3,
            PUBLIC_GROUP_PER_CONTAINER: 3,
            REPORT_PERIOD: 30, // to check if the user has been reported in last 30 days
            MUTED_TILL_DAYS: 365 * 2,
            monthlyRedisTTL: 60 * 60 * 24 * 30, // 30 days
            pageSize: 10,
            archivalBatchSize: 10000,
            studyChatMessageCollection: "study_chat_messages_new",
            archivedStudyChatMessageCollection: `study_chat_archive_${moment().add(5, "hours").add(30, "minutes").year()}`,
            publicMessageCollection: "public_group_messages_2022",
            archivedPublicMessageCollection: `public_group_archive_${moment().add(5, "hours").add(30, "minutes").year()}`,
            messageCollection: "chatroom_messages",
            archivedMessageCollection: `studygroup_archive_${moment().add(5, "hours").add(30, "minutes").year()}`,
            reportedMessageCollection: "chatroom_message_report",
            reportedMemberCollection: "chatroom_member_report",
            reportedGroupCollection: "chatroom_group_report",
            message: "Success",
            dashboard_pagination_ratio: {
                messages: 6,
                members: 4,
            },
            fields: ["_id", "room_id", "room_type", "attachment", "message", "student_id", "attachment_mime_type", "student_displayname", "student_img_url", "report_by", "created_at", "updated_at", "is_active", "is_deleted", "cdn_url", "is_author", "is_admin", "user_tag", "question_id", "thumbnail_image"],
            populates: {
                async cdn_url(ids, messages, rule, ctx) {
                    messages.forEach(message => message.cdn_url = staticCDN);
                },
            },
            objectIdFromDate: () => {
                // Creating objectId from timestamp
                const date = moment().add(5, "hours").add(30, "minutes").subtract(30, "days").valueOf();
                return `${Math.floor(date / 1000).toString(16)}0000000000000000`;
            },
            axiosInstance: axios.create({
                httpAgent: new http.Agent({keepAlive: true, maxSockets: 50}),
                httpsAgent: new https.Agent({keepAlive: true, maxSockets: 50}),
                baseURL: "https://api.doubtnut.com/v1/study-group",
            }),
            getCorrectedName: studentName => (studentName ? studentName.replace(/\r?\n|\r/g, " ").replace(/ +/g, " ") : "Doubtnut User"),
            capitalize: s => {
                if (typeof s !== "string") {
                    return "";
                }
                return s.charAt(0).toUpperCase() + s.slice(1);
            },
            inWords: num => {
                num = num.toString();
                const a = ["", "one ", "two ", "three ", "four ", "five ", "six ", "seven ", "eight ", "nine ", "ten ", "eleven ",
                    "twelve ", "thirteen ", "fourteen ", "fifteen ", "sixteen ", "seventeen ", "eighteen ", "nineteen "];
                const b = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
                if (num.length > 9) {
                    return "";
                }
                const n = (`000000000${num}`).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
                if (!n) {
                    return;
                }
                let str = "";
                str += (parseInt(n[1], 10) !== 0) ? `${a[Number(n[1])] || `${b[n[1][0]]} ${a[n[1][1]]}`}crore ` : "";
                str += (parseInt(n[2], 10) !== 0) ? `${a[Number(n[2])] || `${b[n[2][0]]} ${a[n[2][1]]}`}lakh ` : "";
                str += (parseInt(n[3], 10) !== 0) ? `${a[Number(n[3])] || `${b[n[3][0]]} ${a[n[3][1]]}`}thousand ` : "";
                str += (parseInt(n[4], 10) !== 0) ? `${a[Number(n[4])] || `${b[n[4][0]]} ${a[n[4][1]]}`}hundred ` : "";
                str += (parseInt(n[5], 10) !== 0) ? `${((str !== "") ? "and " : "") + (a[Number(n[5])] || `${b[n[5][0]]} ${a[n[5][1]]}`)}` : "";
                return str;
            },
            minGroupReportCountPrivate: (totalMembers, percentReport) => {
                if (totalMembers <= 5) {
                    return 2;
                }
                if (totalMembers >= 6 && totalMembers <= 10) {
                    return 3;
                }
                if (totalMembers >= 11 && totalMembers <= 25) {
                    return 5;
                }
                if (totalMembers > 25) {
                    return Math.round((totalMembers / 100) * percentReport);
                }
            },
            minGroupReportCountPublic: (totalMembers, percentReport) => {
                if (totalMembers <= 5) {
                    return 2;
                }
                if (totalMembers >= 6 && totalMembers <= 10) {
                    return 3;
                }
                if (totalMembers >= 11 && totalMembers <= 25) {
                    return 5;
                }
                if (totalMembers > 25) {
                    return Math.round((totalMembers / 100) * percentReport);
                }
            },
            successResponse: {
                code: 200,
                success: true,
                message: "SUCCESS",
            },
            profaneStatus: new Enum(["VERY_LIKELY", "LIKELY"]),
            // In case of failure (Cron and QwickCilver Authorization), error msg is sent to @vaibhav-aggarwal-DN @shubham-dn @anikeat-1202
            stakeHolders: [8699616342],
            ArchivalConsumerTopic: "mongo.study.group.archival",
        },
        methods: {

            async resolveLoggedUser() {
                this.settings.currentDate = moment().add(5, "hours").add(30, "minutes").format("YYYY-MM-DD HH:mm:ss");
            },

            msToTime(duration: number) {
                let seconds: string | number = Math.floor((duration / 1000) % 60);
                let minutes: string | number = Math.floor((duration / (1000 * 60)) % 60);
                let hours: string | number = Math.floor((duration / (1000 * 60 * 60)) % 24);

                minutes = (minutes < 10) ? "0" + minutes : minutes;
                seconds = (seconds < 10) ? "0" + seconds : seconds;

                if (hours === 0) {
                    return minutes + ":" + seconds;
                }
                hours = (hours < 10) ? "0" + hours : hours;
                return hours + ":" + minutes + ":" + seconds;
            },

            async generateStudyGroupBranchLink(groupId: string, groupName: string, groupImage: any, ctx: any) {
                try {
                    let inviteUrl = "";
                    const inviteLink = await this.broker.call("$deeplink.createBulk", {
                        studentId: ctx.meta.user.id,
                        campaign: "invite_members",
                        channel: "studygroup",
                        feature: "study_group_chat",
                        data: [{
                            groupId,
                            isFaq: false,
                            inviterId: ctx.meta.user.id,
                            title: `Join ${groupName} Study Group on Doubtnut Now`,
                            description: "Study together with your friends on Doubtnut App and share your notes, pdf, audio, videos and text messages. Join Group Now!",
                            imageUrl: !_.isNull(groupImage) ? groupImage : studGroupData.defaultGroupImage,
                            is_support: this.isRequestedViaSupportScreen(ctx),
                        }],
                    });

                    if (inviteLink && inviteLink[0].url) {
                        inviteUrl = inviteLink[0].url;
                    }
                    return inviteUrl;
                } catch (e) {
                    this.logger.error(e);
                    throw (e);
                }
            },

            async generateStudyChatBranchLink(studentName: string, studentImage: any, studentId: any, ctx: any) {
                try {
                    let inviteUrl = "";
                    const inviteLink = await this.broker.call("$deeplink.createBulk", {
                        studentId: ctx.user.id,
                        campaign: "invite_members",
                        channel: "studygroup",
                        feature: "profile",
                        data: [{
                            student_id: studentId,
                            title: `Chat with ${studentName} or invite him/her to your study group on Doubtnut.`,
                            description: " Click the link to view profile",
                            imageUrl: !_.isNull(studentImage) ? studentImage : studyChatData.defaultUserImage,
                        }],
                    });

                    if (inviteLink && inviteLink[0].url) {
                        inviteUrl = inviteLink[0].url;
                    }
                    return inviteUrl;
                } catch (e) {
                    this.logger.error(e);
                    throw (e);
                }
            },

            async getGroupInviteUrl(groupId: string, groupName: string, groupImage: any, ctx: any) {
                let inviteUrl = await redisUtility.getHashField.call(this, groupId, `${ctx.meta.user.id}_INVITE`);
                if (_.isNull(inviteUrl)) {
                    inviteUrl = await this.generateStudyGroupBranchLink(groupId, groupName, groupImage, ctx);
                    if (inviteUrl) {
                        await redisUtility.addHashField.call(this, groupId, `${ctx.meta.user.id}_INVITE`, inviteUrl, this.settings.monthlyRedisTTL);
                    }
                }
                return inviteUrl;
            },

// This function is used to handle conflicts b/w new & old LAST_SENT redis format
// TODO: Checks to be removed after 1 month
            async getLastSentData(groupId: string) {
                // Using in V1 list chats
                try {
                    const lastSentRedis = await redisUtility.getHashField.call(this, groupId, "LAST_SENT");
                    if (!_.isNull(lastSentRedis) && typeof (lastSentRedis) === "object") {
                        return lastSentRedis.timestamp;
                    }
                    return lastSentRedis;
                } catch (e) {
                    this.logger.error(e);
                    throw (e);
                }
            },

            async getLastSentDataActiveGroups(groups: any) {
                try {
                    const lastSentRedis = await redisUtility.getHashFieldWithPipeline.call(this, groups, "LAST_SENT");
                    return lastSentRedis.map(item => {
                        if (!_.isNull(item.value) && typeof (item.value) === "object") {
                            return {
                                group_id: item.key,
                                last_sent_message_container: {
                                    message: item.value.message,
                                    sender_name: item.value.sender_name,
                                    sender_id: item.value.sender_id,
                                },
                                timestamp: item.value.timestamp,
                            };
                        }
                        return {
                            group_id: item.key,
                            last_sent_message_container: null,
                            timestamp: item.value,
                        };
                    });
                } catch (e) {
                    this.logger.error(e);
                    throw (e);
                }
            },

            // The function will returned in 3 formats -  Yesterday/ time - 5:09 PM /Date - 23/08/21)
            async lastSeenTimeFormat(time: any) {
                const date = moment(time);
                const dayDiff = moment().add(5, "hours").add(30, "minutes").diff(date, "days");
                if (dayDiff === 0) {
                    return date.format("h:mm A");
                } else if (dayDiff === 1) {
                    return date.calendar().split(" ")[0]; // 'Today', 'Yesterday', 'Tomorrow'
                }
                return date.format("DD/MM/YY");
            },

            // This function will update last sent time and message
            async updateLastSentTimeAndMessage(message: any, roomId: string, ctx: any) {
                try {
                    const payload = {
                        timestamp: this.settings.currentDate,
                        message,
                        sender_name: this.createChatName(ctx.user.student_fname, ctx.user.student_lname),
                        sender_id: ctx.user.id,
                    };

                    await redisUtility.addHashField.call(this, roomId, "LAST_SENT", payload, this.settings.monthlyRedisTTL); // 30 days redis
                } catch (e) {
                    this.logger.error(e);
                    throw (e);
                }
            },

            createChatName(studentFname: any, studentLname: any) {
                try {
                    let name = `${this.settings.capitalize(studentFname)} ${this.settings.capitalize(studentLname)}`;
                    name = name.replace(/^\s+|\s+$|\s+(?=\s)/g, "").trim();
                    return unescape(name) || "Doubtnut User";
                } catch (e) {
                    this.logger.error(e);
                    throw (e);
                }
            },

            // This function will update member count
            async updateMemberCount(groupId: string, updateType: string) {
                try {
                    // updateType = INCR for increment and DECR for decrement
                    if (updateType === "INCR") {
                        await this.broker.call("$studygroupMysql.increaseGroupCount", {groupId});
                    } else if (updateType === "DECR") {
                        await this.broker.call("$studygroupMysql.decreaseGroupCount", {groupId});
                    }
                    return true;
                } catch (e) {
                    this.logger.error(e);
                    throw (e);
                }
            },

            // for shuffling array
            shuffleArray(array) {
                let currentIndex = array.length;
                let temporaryValue;
                let randomIndex;

                // While there remain elements to shuffle...
                // eslint-disable-next-line eqeqeq
                while (currentIndex != 0) {
                    // Pick a remaining element...
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex -= 1;

                    // And swap it with the current element.
                    temporaryValue = array[currentIndex];
                    array[currentIndex] = array[randomIndex];
                    array[randomIndex] = temporaryValue;
                }

                return array;
            },

            async checkRedisLockStatus(redisKey: string, ttl: number) {
                // redis lock - This is done to ensure cron doesn't run multiple times (It is happening because of multiple pods)
                const isCronLocked = await redisUtility.setNonExistKeyData.call(this, redisKey, true, ttl);
                return !isCronLocked.length || isCronLocked[0].length !== 2 || isCronLocked[0][1] === 0;
            },

            sendAlertMessage(cronName, exception) {
                const message = `Dear user, Error occurred in doubtnut studygroup - ${cronName}, Exception: ${exception}`;
                if (process.env.NODE_ENV === "production") {
                    for (const mobile of this.settings.stakeHolders) {
                        this.broker.emit("sendSms", { mobile, message }, "studygroup");
                    }
                }
                return true;
            },

            async pushArchivalData(consumerTopic: string, messagePost: any) {
                // pushing in kafka for archival (kafka -> Hudi -> s3)
                const kafkaMsgData = {
                    ...messagePost,
                    produced_at: Date.now(),
                };
                kafkaMsgData.message = JSON.stringify(kafkaMsgData.message);
                await publishRawBackend(consumerTopic, kafkaMsgData);
            },

            isRequestedViaSupportScreen(ctx: any) {
                return ctx.params.is_support && ctx.params.is_support === true;
            },
        },
    }
;

export = SettingsService;
