import {ServiceSchema} from "dn-moleculer";
import Sequelize from "sequelize";

const StudyGroupGeneralMySQLSchema: ServiceSchema = {
    name: "$GeneralMysql",
    dependencies: [],
    actions: {
        getTotalGroupsAsAdmin: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT count(1) as total FROM study_group_members sgm JOIN study_group sg on sgm.study_group_id = sg.id WHERE sgm.student_id= ${ctx.params.studentId} and sgm.is_active=1 and sgm.is_admin=1 and sg.group_type=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getCountOfGroupsAsAdmin: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT count(1) as total, s.group_type FROM study_group_members sgm JOIN study_group s ON s.id = sgm.study_group_id WHERE student_id= ${ctx.params.studentId} and sgm.is_active=1 and sgm.is_admin=1 GROUP BY s.group_type`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        addMember: {
            // studentId, studyGroupId, isAdmin
            async handler(ctx) {
                const sql = `INSERT INTO study_group_members (student_id, study_group_id, is_admin) VALUES (${ctx.params.studentId},${ctx.params.studyGroupId}, ${ctx.params.isAdmin})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.INSERT});
            },
        },

        getActivePrivateGroups: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT a.*, COUNT(DISTINCT b.student_id) AS subtitle FROM (SELECT s.id as pk , s.group_id, s.group_name, s.group_image, sgm.is_admin, sgm.is_left, sgm.left_at, sgm.is_blocked, sgm.blocked_by, sgm.blocked_at, sgm.is_active, sgm.muted_till FROM study_group s JOIN study_group_members sgm ON s.id = sgm.study_group_id WHERE sgm.student_id = ${ctx.params.studentId} AND s.group_type = 1) AS a INNER JOIN study_group_members b ON a.pk = b.study_group_id AND b.is_active = 1 GROUP BY a.pk`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getActiveGroups: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT a.*, COUNT(DISTINCT b.student_id) AS subtitle FROM (SELECT s.id as pk , s.group_id, s.group_name, s.group_image, s.group_type, s.can_member_post, sgm.is_admin,s.is_verified, sgm.is_left, sgm.left_at, sgm.is_blocked, sgm.blocked_by, sgm.blocked_at, sgm.is_active, sgm.muted_till FROM study_group s JOIN study_group_members sgm ON s.id = sgm.study_group_id WHERE sgm.student_id = ${ctx.params.studentId} and s.is_active=1 and sgm.is_active=1) AS a INNER JOIN study_group_members b ON a.pk = b.study_group_id AND b.is_active = 1 GROUP BY a.pk ORDER BY pk desc LIMIT 500`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getSpecificUserGroupData: {
            // studentId, groupId
            async handler(ctx) {
                // query time: 40 ms
                const sql = `SELECT s.id, s.group_id, s.group_name, s.group_type, s.group_image, s.image_updated_by, s.image_updated_at, s.created_at as group_created_at,sgm.is_admin, sgm.is_blocked, sgm.is_left,s.is_verified FROM study_group s join study_group_members sgm ON s.id = sgm.study_group_id WHERE sgm.student_id=${ctx.params.studentId} AND sgm.is_active=1 AND s.is_active=1 AND s.group_id='${ctx.params.groupId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getGroupMembers: {
            // groupId
            async handler(ctx) {
                const sql = `SELECT * FROM study_group_members WHERE is_active=1 and study_group_id=${ctx.params.groupId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        deactivateGroup: {
            // groupId, studentId, newMemberCount
            async handler(ctx) {
                const sql = `UPDATE study_group s join study_group_members sgm ON s.id = sgm.study_group_id SET s.is_active=0, sgm.is_active=0, sgm.left_at=NOW(), s.deactivated_at =NOW(), sgm.is_left=1 WHERE s.id=${ctx.params.groupId} AND sgm.student_id=${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        leaveAdmin: {
            // groupId, studentId
            async handler(ctx) {
                const sql = `UPDATE study_group_members set is_admin=0, is_left=1, is_active=0, left_at=NOW() WHERE study_group_id=${ctx.params.groupId} AND student_id=${ctx.params.studentId} AND is_admin=1 AND is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        assignNewAdmin: {
            // groupId, studentId
            async handler(ctx) {
                const sql = `UPDATE study_group_members set is_admin=1 WHERE study_group_id=${ctx.params.groupId} AND student_id=${ctx.params.studentId} AND is_admin=0 AND is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        leaveMember: {
            // groupId, studentId
            async handler(ctx) {
                const sql = `UPDATE study_group_members set is_active=0, is_left=1, is_admin=0, left_at=NOW() WHERE study_group_id=${ctx.params.groupId} AND student_id=${ctx.params.studentId} AND (is_admin=0 OR is_admin=2) AND is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        blockMember: {
            // blockedBy, groupId, studentId
            async handler(ctx) {
                const sql = `UPDATE study_group_members set is_active=0, is_blocked=1, blocked_at=NOW(), blocked_by=${ctx.params.blockedBy} WHERE study_group_id=${ctx.params.groupId} AND student_id=${ctx.params.studentId} AND is_admin=0 AND is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        blockAdmin: {
            // blockedBy, groupId, studentId
            async handler(ctx) {
                const sql = `UPDATE study_group_members set is_active=0, is_blocked=1, blocked_at=NOW(), blocked_by=${ctx.params.blockedBy}, is_admin=0 WHERE study_group_id=${ctx.params.groupId} AND student_id=${ctx.params.studentId} AND is_admin=1 AND is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        updateGroupName: {
            // groupName, studentId, studyGroupId
            async handler(ctx) {
                const sql = `UPDATE study_group SET group_name = '${ctx.params.groupName}', name_updated_by = ${ctx.params.studentId}, name_updated_at = NOW() WHERE id=${ctx.params.studyGroupId} AND is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        updateGroupImage: {
            // groupImage, studentId, studyGroupId
            async handler(ctx) {
                const sql = `UPDATE study_group SET group_image = '${ctx.params.groupImage}', image_updated_by = ${ctx.params.studentId}, image_updated_at = NOW() WHERE id=${ctx.params.studyGroupId} AND is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        getGroupInfo: {
            // groupId
            async handler(ctx) {
                // query time: 87 ms
                const sql = `SELECT s.id as pk, s.group_id,s.group_name,s.group_image, s.group_type, s.created_at AS group_created_at, s.can_member_post, st.student_id,sgm.is_blocked,sgm.is_left,sgm.is_admin,sgm.is_active,IFNULL(CONCAT(st.student_fname, ' ', st.student_lname), 'Doubtnut User') AS name, IFNULL(st.img_url,'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9DACD18E-F46E-ED58-4B28-29B868531C28.webp') as image, s.is_verified FROM study_group s JOIN study_group_members sgm ON s.id = sgm.study_group_id JOIN students st on st.student_id = sgm.student_id WHERE s.is_active = 1 AND s.group_id = '${ctx.params.groupId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getPaginatedGroupMembers: {
            // groupId, limit, offset
            async handler(ctx) {
                const sql = `SELECT sgm.is_admin,st.student_id,sgm.is_blocked,sgm.is_left,sgm.is_active,IFNULL(CONCAT(st.student_fname, ' ', st.student_lname), 'Doubtnut User') AS name,IFNULL(st.img_url, 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9DACD18E-F46E-ED58-4B28-29B868531C28.webp') as image FROM study_group s JOIN study_group_members sgm ON s.id = sgm.study_group_id JOIN students st on st.student_id = sgm.student_id WHERE s.is_active = 1 AND s.group_id = '${ctx.params.groupId}' LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        isInvited: {
            // inviter, invitee, groupId
            async handler(ctx) {
                const sql = `SELECT EXISTS(SELECT * FROM study_group_invites WHERE inviter = ${ctx.params.inviter} AND invitee = ${ctx.params.invitee} AND group_id = ${ctx.params.groupId} limit 1) AS EXIST`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        invitationStatus: {
            // inviter, invitee, groupId
            async handler(ctx) {
                const sql = `SELECT * FROM study_group_invites WHERE inviter = ${ctx.params.inviter} AND invitee = ${ctx.params.invitee} AND group_id = ${ctx.params.groupId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        listActiveGroups: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT s.group_id FROM study_group s JOIN study_group_members sgm ON s.id = sgm.study_group_id WHERE s.is_active = 1 AND sgm.student_id = ${ctx.params.studentId} AND sgm.is_active = 1 AND sgm.is_left=0 AND sgm.is_blocked=0`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        pendingGroupInvites: {
            // studentId
            async handler(ctx) {
                // keeping limit 200 max
                const sql = `SELECT sg.group_id, sg.group_name, sg.group_image, sgi.inviter, IFNULL(CONCAT(s.student_fname, ' ', s.student_lname), 'Doubtnut User') AS inviter_name, sgi.created_at as invited_at FROM study_group_invites sgi JOIN study_group sg ON sg.id = sgi.group_id JOIN students s ON s.student_id = sgi.inviter LEFT JOIN study_group_members sgm ON sgm.study_group_id = sg.id AND sgm.student_id = sgi.invitee WHERE sgi.invitee = ${ctx.params.studentId} AND sgi.is_accepted = 0 AND sg.is_active = 1 AND (sgm.student_id IS NULL OR sgm.is_active = 0) AND (sgm.is_blocked IS NULL OR sgm.is_blocked = 0) ORDER BY sgi.id desc limit ${ctx.params.end} offset ${ctx.params.start}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        searchPendingGroupInvites: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT sg.group_id, sg.group_name, sg.group_image, sg.total_members, sgi.inviter, IFNULL(CONCAT(s.student_fname, ' ', s.student_lname), 'Doubtnut User') AS inviter_name, sgi.created_at as invited_at FROM study_group_invites sgi JOIN study_group sg ON sg.id = sgi.group_id JOIN students s ON s.student_id = sgi.inviter LEFT JOIN study_group_members sgm ON sgm.study_group_id = sg.id AND sgm.student_id = sgi.invitee WHERE sgi.invitee = ${ctx.params.studentId} AND sgi.is_accepted = 0 AND sg.is_active = 1 AND (sgm.student_id IS NULL OR sgm.is_active = 0) AND (sgm.is_blocked IS NULL OR sgm.is_blocked = 0) AND sg.group_name like '%${ctx.params.keyword}%' ORDER BY sgi.id desc limit ${ctx.params.end} offset ${ctx.params.start}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        pendingGroupInviteCount: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT COUNT(*) as count FROM study_group_invites sgi JOIN study_group sg ON sg.id = sgi.group_id LEFT JOIN study_group_members sgm ON sgm.study_group_id = sg.id AND sgm.student_id = sgi.invitee WHERE sgi.invitee = ${ctx.params.studentId} AND sgi.is_accepted = 0 AND sg.is_active = 1 AND (sgm.student_id IS NULL OR sgm.is_active=0) AND (sgm.is_blocked IS NULL OR sgm.is_blocked = 0)`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        acceptInvite: {
            // studentId
            async handler(ctx) {
                const sql = `UPDATE study_group_invites set is_accepted = 1 WHERE invitee = ${ctx.params.studentId} AND group_id = ${ctx.params.groupId} AND inviter = ${ctx.params.inviter}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        rejectInvite: {
            // studentId
            async handler(ctx) {
                const sql = `UPDATE study_group_invites set is_accepted = 2 WHERE invitee = ${ctx.params.studentId} AND group_id = '${ctx.params.groupId}' AND inviter = ${ctx.params.inviter}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        inviteMember: {
            // inviter, invitee, groupId, isAdmin
            async handler(ctx) {
                const sql = `INSERT INTO study_group_invites (inviter, invitee, group_id, is_invited_by_admin) VALUES (${ctx.params.inviter},${ctx.params.invitee}, ${ctx.params.groupId},${ctx.params.isAdmin})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.INSERT});
            },
        },

        updateInviteMember: {
            // inviter, invitee, groupId, isAdmin
            async handler(ctx) {
                const sql = `UPDATE study_group_invites SET is_accepted = 0, is_invited_by_admin=${ctx.params.isAdmin}, created_at=NOW() WHERE invitee = ${ctx.params.invitee} AND group_id = '${ctx.params.groupId}' AND inviter = ${ctx.params.inviter}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        getTotalGroupMembers: {
            // groupId
            async handler(ctx) {
                const sql = `SELECT count(1) as TOTAL FROM study_group_members WHERE is_active=1 and study_group_id=${ctx.params.groupId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getGroupId: {
            // groupId
            async handler(ctx) {
                const sql = `SELECT id, group_name, group_type FROM study_group WHERE group_id='${ctx.params.groupId}' AND is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getTotalMembers: {
            async handler(ctx) {
                const sql = `SELECT total_members FROM study_group where group_id='${ctx.params.groupId}' and is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        // isActiveOnStudyGroup: {
        //     // studentId
        //     async handler(ctx) {
        //         const sql = `SELECT EXISTS(SELECT 1 FROM study_group_members WHERE is_active=1 AND student_id= ${ctx.params.studentId}) AS ACTIVE`;
        //         return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
        //     },
        // },

        isPreviouslyLeftThisStudyGroup: {
            // studentId, groupId
            async handler(ctx) {
                const sql = `SELECT EXISTS(SELECT * FROM study_group_members WHERE student_id=${ctx.params.studentId} AND study_group_id=${ctx.params.groupId} AND is_left=1 limit 1) AS EXIST`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        reJoinMember: {
            // groupId, studentId
            async handler(ctx) {
                const sql = `UPDATE study_group_members set is_left=0, is_active=1, left_at=NULL WHERE study_group_id=${ctx.params.groupId} AND student_id=${ctx.params.studentId} AND is_left=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        getStudentDetailsById: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT gcm_reg_id, locale, student_class FROM students WHERE student_id=${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        isMember: {
            // groupId, studentId
            async handler(ctx) {
                const sql = `SELECT EXISTS(SELECT 1 FROM study_group_members WHERE study_group_id = ${ctx.params.groupId} AND student_id = ${ctx.params.studentId} AND is_active = 1 limit 1) AS EXIST`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getActiveGroupsWithMembersCount: {
            // studentId
            async handler(ctx) {
                // query time: 68 ms
                const sql = `SELECT a.*, COUNT(DISTINCT b.student_id) AS total_members FROM (SELECT s.id, s.group_id, s.group_name, s.group_image, sgm.is_admin, s.is_verified FROM study_group s JOIN study_group_members sgm ON s.id = sgm.study_group_id WHERE sgm.student_id = ${ctx.params.studentId} AND sgm.is_active = 1 AND sgm.is_left=0 AND sgm.is_blocked=0 AND s.group_type=1) AS a INNER JOIN study_group_members b ON a.id = b.study_group_id AND b.is_active = 1 GROUP BY a.id`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getActiveGroupsWithMembersCountV2: {
            // studentId
            async handler(ctx) {
                // query time: 49 ms
                const sql = `SELECT a.*, COUNT(DISTINCT b.student_id) AS total_members FROM (SELECT s.id, s.group_id, s.group_name, s.group_image, sgm.is_admin, s.is_verified FROM study_group s JOIN study_group_members sgm ON s.id = sgm.study_group_id WHERE sgm.student_id = ${ctx.params.studentId} AND sgm.is_active = 1 AND sgm.is_left=0 AND sgm.is_blocked=0 AND s.group_type !=3) AS a INNER JOIN study_group_members b ON a.id = b.study_group_id AND b.is_active = 1 GROUP BY a.id`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getStudentName: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT IFNULL(CONCAT(student_fname, \' \', student_lname), \'Doubtnut User\') AS name FROM students WHERE student_id = ${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getStudyGroupMembersForNotifications: {
            // groupId, activeStudents
            async handler(ctx) {
                const sql = `SELECT st.student_id, st.student_fname, st.gcm_reg_id, sg.group_name, sgm.muted_till FROM study_group_members sgm JOIN study_group sg ON sgm.study_group_id = sg.id JOIN students st ON st.student_id = sgm.student_id LEFT JOIN study_group_reporting sgr ON sgr.student_id = sgm.student_id AND sgr.study_group_id = sg.group_id WHERE sg.group_id = '${ctx.params.groupId}' AND sgm.is_active = 1 AND (sgr.id IS NULL OR sgr.status = 2) AND (muted_till is null OR muted_till > NOW())`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        isBlocked: {
            // studentId, groupId
            async handler(ctx) {
                const sql = `SELECT EXISTS(SELECT * FROM study_group_members WHERE is_blocked=1 AND student_id=${ctx.params.studentId} AND study_group_id=${ctx.params.groupId} limit 1) AS EXIST`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        // getGroupIdBySId: {
        //     // studentId, requiredMembers
        //     async handler(ctx) {
        //         const sql = `SELECT b.room_id FROM (SELECT a.room_id, COUNT(m.student_id) AS members FROM
        //              (SELECT s.group_id as room_id, s.id FROM study_group_members sgm JOIN study_group s ON s.id = sgm.study_group_id
        //              WHERE sgm.student_id = ${ctx.params.studentId} AND sgm.is_active = 1) AS a INNER JOIN study_group_members m On
        //              m.study_group_id = a.id AND m.is_active = 1 GROUP BY a.room_id) AS b WHERE b.members >= ${ctx.params.requiredMembers}`;
        //         const result = await this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
        //         const roomIds = [];
        //         for (const room of result) {
        //             roomIds.push(room.room_id);
        //         }
        //         return roomIds;
        //     },
        // },

        // getStudentGcmId: {
        //     // studentIdList
        //     async handler(ctx) {
        //         const sql = `SELECT student_id, gcm_reg_id FROM students WHERE student_id IN (${ctx.params.studentIdList})`;
        //         return this.adapter.db.query(sql, { type: Sequelize.QueryTypes.SELECT });
        //     },
        // },

        muteGroup: {
            // muteTill, studentId, groupId
            async handler(ctx) {
                const sql = `UPDATE study_group s join study_group_members sgm ON s.id = sgm.study_group_id SET sgm.muted_till = '${ctx.params.muteTill}' WHERE sgm.student_id = ${ctx.params.studentId} AND sgm.is_active = 1 AND s.group_id = '${ctx.params.groupId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        getMuteTime: {
            // studentId, groupId
            async handler(ctx) {
                const sql = `SELECT sgm.muted_till FROM study_group s join study_group_members sgm ON s.id = sgm.study_group_id WHERE sgm.student_id = ${ctx.params.studentId} AND sgm.is_active = 1 AND s.group_id = '${ctx.params.groupId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        isMuteFeatureExist: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT EXISTS (SELECT 1 FROM study_group_notification WHERE student_id = ${ctx.params.studentId} limit 1) AS EXIST`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        updateFeatureMute: {
            // isMute, studentId
            async handler(ctx) {
                const sql = `UPDATE study_group_notification set is_mute = ${ctx.params.isMute} WHERE student_id = ${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        insertFeatureMute: {
            // studentId, isMute
            async handler(ctx) {
                const sql = `INSERT INTO study_group_notification (student_id, is_mute) VALUES (${ctx.params.studentId}, ${ctx.params.isMute})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.INSERT});
            },
        },

        isFeatureMute: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT is_mute FROM study_group_notification WHERE student_id = ${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        isFeatureMuteNotification: {
            // studentIds
            cache: {
                enabled: true,
                ttl: 600, // 10 minutes
            },
            async handler(ctx) {
                const sql = `SELECT student_id FROM study_group_notification WHERE student_id IN (${ctx.params.studentIds}) AND is_mute = 1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getGroupBanData: {
            // groupId
            async handler(ctx) {
                const sql = `select status from study_group_reporting where study_group_id= '${ctx.params.groupId}' and student_id is null order by id desc limit 1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getUserBanData: {
            // studentId, groupId
            async handler(ctx) {
                const sql = `select status from study_group_reporting where student_id= ${ctx.params.studentId} and study_group_id= '${ctx.params.groupId}' limit 1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        requestUnban: {
            // timestamp, studentId, groupId
            async handler(ctx) {
                const sql = `UPDATE study_group_reporting set status = 1, updated_at = '${ctx.params.timestamp}' WHERE student_id = ${ctx.params.studentId} AND study_group_id = '${ctx.params.groupId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        requestGroupUnban: {
            // timestamp, groupId
            async handler(ctx) {
                const sql = `UPDATE study_group_reporting set status = 1, updated_at ='${ctx.params.timestamp}'  WHERE student_id IS NULL AND study_group_id = '${ctx.params.groupId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        createGroup: {
            // data
            async handler(ctx) {
                const data = ctx.params.data;
                let sql = `INSERT INTO study_group SET group_id = '${data.group_id}', group_name = '${data.group_name}', group_type = ${data.group_type}, can_member_post = ${data.can_member_post}, member_post_updated_by = ${data.member_post_updated_by}, member_post_updated_at = '${data.member_post_updated_at}', image_updated_by = ${data.image_updated_by}, image_updated_at = '${data.image_updated_at}', name_updated_by = ${data.name_updated_by}, name_updated_at = '${data.name_updated_at}', created_by = ${data.created_by}, created_by_class = ${data.created_by_class || 10}, total_members=1,is_verified = ${data.is_verified}`;
                if (data.group_image) {
                    sql = `${sql}, group_image= '${data.group_image}'`;
                }
                const result = await this.adapter.db.query(sql, {type: Sequelize.QueryTypes.INSERT});
                return result[0];
            },
        },

        updateMessageRestriction: {
            // groupName, studentId, studyGroupId
            async handler(ctx) {
                const sql = `UPDATE study_group SET can_member_post = ${ctx.params.can_member_post}, member_post_updated_by = ${ctx.params.studentId}, member_post_updated_at = NOW() WHERE id=${ctx.params.studyGroupId} AND is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        updateSubAmin: {
            // adminStatus, studentId, studyGroupId
            async handler(ctx) {
                const sql = `UPDATE study_group_members SET is_admin = ${ctx.params.adminStatus} WHERE student_id = ${ctx.params.studentId} AND is_active = 1 AND study_group_id = ${ctx.params.studyGroupId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },
        getRecommendedGroupsData: {
            async handler(ctx) {
                // query time : 42 ms
                const sql = `SELECT sg.*,sgr.status from (SELECT group_id,group_name,group_image,created_at,group_type,total_members,is_verified FROM study_group WHERE group_type=2 and created_by_class = ${ctx.params.studentClass} and is_active = 1 and total_members >= 3 and created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)) as sg left join study_group_reporting sgr on sg.group_id=sgr.study_group_id where sgr.status=2 or sgr.status is null order by created_at desc LIMIT 1000`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        searchRecommendedGroups: {
            async handler(ctx) {
                // query time: 104 ms
                const sql = `SELECT group_id,group_name,group_image,created_at,group_type,total_members,is_verified FROM study_group WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR) and group_type=2 and total_members >= 3 and is_active = 1 and created_by_class = ${ctx.params.studentClass} and group_name like '%${ctx.params.keyword}%'  order by created_at desc limit ${ctx.params.end} offset ${ctx.params.start}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        getGroupsData: {
            async handler(ctx) {
                // query time : 137 ms
                const sql = `SELECT group_id,group_name,group_image,total_members,group_type,is_verified from study_group where group_id in (${ctx.params.finalGroupIds}) order by field(group_id,${ctx.params.finalGroupIds})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        searchMyGroups: {
            async handler(ctx) {
                // query time : 96 ms
                const sql = `SELECT s.group_id, s.group_name,s.total_members,s.group_type,s.group_image,s.is_verified FROM study_group s JOIN study_group_members sgm ON s.id = sgm.study_group_id WHERE sgm.student_id =${ctx.params.studentId} AND  sgm.is_active = 1 AND s.is_active=1 AND s.group_name like '%${ctx.params.keyword}%'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        searchAllPublicGroups: {
            async handler(ctx) {
                let sql = "";
                if (ctx.params.groupIds.length > 0) {
                    // query time : 82 ms
                    sql = `SELECT group_id, group_name,total_members,group_type,group_image,is_verified FROM study_group WHERE is_active=1 AND group_type=2 AND created_by_class = ${ctx.params.studentClass} AND group_id not in (${ctx.params.groupIds}) AND group_name like '%${ctx.params.keyword}%' limit 10 offset 0`;
                } else {
                    // query time : 54 ms
                    sql = `SELECT group_id, group_name,total_members,group_type,group_image,is_verified FROM study_group WHERE is_active=1 AND group_type=2 AND created_by_class = ${ctx.params.studentClass} AND group_name like '%${ctx.params.keyword}%' limit 10 offset 0`;
                }
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        searchPublicGroups: {
            async handler(ctx) {
                // query time : 97 ms
                const sql = `SELECT group_id,group_name,group_image,group_type,total_members,is_verified  FROM study_group WHERE group_type = 2 AND is_active = 1 And created_by_class =${ctx.params.studentClass} AND group_name like '%${ctx.params.keyword}%'  limit ${ctx.params.end} offset ${ctx.params.start}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        getSuggestedGroup: {
            async handler(ctx) {
                const sql = "SELECT sg.group_id,sg.group_name,sg.group_image,sg.created_at,count(1) as total_members FROM study_group sg join study_group_members sgm on sg.id = sgm.study_group_id WHERE sg.created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR) and sg.group_type=2 and sg.is_active=1 group by group_id order by created_at desc";
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        increaseGroupCount: {
            async handler(ctx) {
                const sql = `UPDATE study_group SET total_members = total_members + 1 WHERE group_id = '${ctx.params.groupId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        decreaseGroupCount: {
            async handler(ctx) {
                const sql = `UPDATE study_group SET total_members = total_members - 1 WHERE group_id = '${ctx.params.groupId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },
        updatingTeacherGroupCount: {
            async handler(ctx) {
                const sql = `UPDATE study_group SET total_members = ${ctx.params.total_members} WHERE group_id = '${ctx.params.groupId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },
        checkStudyGroupExists: {
            async handler(ctx) {
                const sql = `Select * from study_group where group_id = '${ctx.params.groupId}' and is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        checkIfUserIsMember: {
            async handler(ctx) {
                const sql = `SELECT * FROM study_group_members where study_group_id=${ctx.params.groupId} and student_id=${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        checkIfStudentsIsMember: {
            async handler(ctx) {
                const sql = `SELECT student_id,study_group_id FROM study_group_members where study_group_id=${ctx.params.groupId} and student_id = ${ctx.params.student_id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        addingMembers: {
            async handler(ctx) {
                return this.adapter.db.query(ctx.params.sqlQuery, {type: Sequelize.QueryTypes.INSERT});
            },
        },
        getCourseDataFromCourseId: {
            async handler(ctx) {
                const sql = `SELECT distinct du.id,du.name,du.student_id,ctm.assortment_id FROM course_teacher_mapping ctm inner join dashboard_users du on ctm.faculty_id= du.id where assortment_id= ${ctx.params.courseId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        getCourseIdForSubjectAssorment: {
            async handler(ctx) {
                const sql = `SELECT assortment_id FROM course_resource_mapping where course_resource_id =${ctx.params.courseId} and resource_type="assortment"`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        getCourseDetailsByAssortmentId: {
            async handler(ctx) {
                const sql = `SELECT assortment_id,batch_id,study_group_name,img_url as study_group_image,teacher_list FROM course_study_groups where assortment_id=${ctx.params.assortmentId} and batch_id=${ctx.params.batchId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
        addingGroupId: {
            async handler(ctx) {
                const sql = `UPDATE course_study_groups SET study_group_id='${ctx.params.groupId}' WHERE assortment_id=${ctx.params.courseId} and batch_id=${ctx.params.batchId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        isStudentBanned: {
            // timestamp, groupId
            async handler(ctx) {
                const sql = `select EXISTS(select * from banned_users where student_id = ${ctx.params.studentId} and is_active = 1 limit 1) AS banned;`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        isDuplicateGroup: {
            // groupName
            async handler(ctx) {
                const sql = `select EXISTS(select * from study_group where group_name = '${escape(ctx.params.groupName)}' and is_active = 1 limit 1) as exist`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getAllMembersOfSpecificGroupByGroupPk: {
            cache: {
                enabled: false,
            },
            async handler(ctx) {
                const sql = `select student_id from study_group_members where study_group_id = ${ctx.params.study_group_id}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        markSupportResolved: {
            // groupId
            async handler(ctx) {
                const sql = `UPDATE study_group s join study_group_members sgm ON s.id = sgm.study_group_id SET s.is_active=0, sgm.is_active=0, sgm.left_at=NOW(), s.deactivated_at =NOW(), sgm.is_left=1 WHERE s.group_id='${ctx.params.groupId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        getSelectedCcmDetails: {
            // cache: {
            //     enabled: true,
            //     ttl: 60 * 60 * 24,
            // },
            async handler(ctx) {
                // query time : 1.2 ms
                const sql = `SELECT a.ccm_id, b.course, b.category FROM student_course_mapping as a left join class_course_mapping as b on a.ccm_id=b.id WHERE a.student_id = ${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getGroupDataById: {
            // getting study group details by GROUP_ID
            async handler(ctx) {
                // query time : 2.4 ms
                const sql = `SELECT sg.*,sgr.status from (SELECT group_id,group_name,group_image,created_at,group_type,total_members,is_verified FROM study_group WHERE group_id IN ('${ctx.params.groupId.join("','")}') AND is_active = 1) as sg left join study_group_reporting sgr on sg.group_id=sgr.study_group_id ORDER BY field(sg.group_id, '${ctx.params.groupId.join("','")}')`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        lastRequestedSupportGroup: {
            // getting last created support group details by student
            async handler(ctx) {
                // query time : 4.3 ms
                const sql = `select group_id, group_name, group_image, sg.is_active, sg.is_verified, sg.deactivated_at, sg.created_at from study_group sg join study_group_members sgm on sg.id = sgm.study_group_id where sgm.student_id=${ctx.params.studentId} and sg.group_type=5 and sg.is_active=1 limit 1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getSupportExecutivesDetails: {
            // groupId
            async handler(ctx) {
                const sql = `SELECT st.student_id, st.student_fname, st.gcm_reg_id, sg.group_name, sgm.muted_till, sgm.is_admin FROM study_group_members sgm JOIN study_group sg ON sgm.study_group_id = sg.id JOIN students st ON st.student_id = sgm.student_id LEFT JOIN study_group_reporting sgr ON sgr.student_id = sgm.student_id AND sgr.study_group_id = sg.group_id WHERE sg.group_id = '${ctx.params.groupId}' AND sgm.is_active = 1 AND sgm.is_admin != 0;`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getSupportMembersOfGroup: {
            // groupId
            async handler(ctx) {
                const sql = `SELECT sgm.student_id FROM study_group_members sgm JOIN study_group sg ON sgm.study_group_id = sg.id WHERE sg.group_id = '${ctx.params.groupId}' AND sgm.is_active = 1;`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
    },
    events: {},
    methods: {},
};

export = StudyGroupGeneralMySQLSchema;
