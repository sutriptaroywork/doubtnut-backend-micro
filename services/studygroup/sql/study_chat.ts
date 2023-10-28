import {ServiceSchema} from "dn-moleculer";
import Sequelize from "sequelize";

const StudyChatMySQLSchema: ServiceSchema = {
    name: "$StudyChatMysql",
    actions: {
        isFriendConnected: {
            // inviter, invitee
            async handler(ctx) {
                const sql = `SELECT chat_id FROM study_chat WHERE (inviter = ${ctx.params.inviter} || inviter = ${ctx.params.invitee}) AND (invitee = ${ctx.params.inviter} || invitee = ${ctx.params.invitee})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        inviteFriend: {
            // inviter, invitee, chatId
            async handler(ctx) {
                const sql = `INSERT INTO study_chat (inviter, invitee, chat_id) VALUES (${ctx.params.inviter},${ctx.params.invitee}, '${ctx.params.chatId}')`;
                const result = await this.adapter.db.query(sql, {type: Sequelize.QueryTypes.INSERT});
                return result[0];
            },
        },

        getSpecificUserChatData: {
            // studentId, chatId
            async handler(ctx) {
                const sql = `SELECT s.id, s.chat_id, scm.is_active as is_member_active, scm.is_blocked FROM study_chat s join study_chat_members scm ON s.id = scm.study_chat_id WHERE scm.student_id=${ctx.params.studentId} AND s.is_active=1 AND s.chat_id='${ctx.params.chatId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getChatId: {
            // chatId
            async handler(ctx) {
                const sql = `SELECT id, inviter FROM study_chat WHERE chat_id='${ctx.params.chatId}' AND invitee='${ctx.params.invitee}' AND is_active=1`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        addFriend: {
            // studentId, studyChatId
            async handler(ctx) {
                const sql = `INSERT INTO study_chat_members (student_id, study_chat_id) VALUES (${ctx.params.studentId}, ${ctx.params.studyChatId})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.INSERT});
            },
        },

        acceptFriendInvite: {
            // studyChatId, studentId
            async handler(ctx) {
                const sql = `UPDATE study_chat s SET invitation_status=1, invitation_updated_at=NOW() WHERE id=${ctx.params.studyChatId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        rejectFriendInvite: {
            // studyChatId
            async handler(ctx) {
                const sql = `UPDATE study_chat SET invitation_status=2, invitation_updated_at=NOW() WHERE id=${ctx.params.studyChatId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        getAllChats: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT s.id, s.chat_id, s.inviter, s.invitee, scm.is_blocked, scm.blocked_at, scm.is_active, scm.muted_till FROM study_chat s JOIN study_chat_members scm ON s.id = scm.study_chat_id WHERE scm.student_id = ${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getStudentDetails: {
            // studentIds
            async handler(ctx) {
                const sql = `SELECT s.student_id as other_student_id, s.student_fname, s.student_lname, s.img_url as room_image FROM students s WHERE s.student_id IN (${ctx.params.studentIds})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getRoomDetails: {
            // studentIds, studyChatIds
            async handler(ctx) {
                const sql = `SELECT scm.student_id as other_student_id, scm.is_blocked as blocked_other, scm.blocked_at as blocked_other_at, scm.study_chat_id FROM study_chat_members scm WHERE scm.student_id IN (${ctx.params.studentIds}) AND scm.study_chat_id IN (${ctx.params.studyChatIds})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        pendingChatInviteCount: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT COUNT(*) as count FROM study_chat WHERE invitee = ${ctx.params.studentId} AND invitation_status = 0`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getChatInfo: {
            // chatId
            async handler(ctx) {
                const sql = `SELECT s.id as pk, s.chat_id, s.created_at AS chat_created_at, st.student_id, scm.is_blocked, scm.is_active, scm.is_blocked, scm.muted_till, st.student_fname, st.student_lname, IFNULL(st.img_url,'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9DACD18E-F46E-ED58-4B28-29B868531C28.webp') as image FROM study_chat s JOIN study_chat_members scm ON s.id = scm.study_chat_id JOIN students st on st.student_id = scm.student_id WHERE s.chat_id = '${ctx.params.chatId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getStudentData: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT student_id, student_fname, student_lname, img_url as image FROM students WHERE student_id=${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        pendingChatInvites: {
            // studentId, offset
            async handler(ctx) {
                const sql = `SELECT sc.inviter, sc.chat_id, sc.created_at, s.student_fname, s.student_lname, s.img_url as image FROM study_chat sc JOIN students s ON s.student_id = sc.inviter WHERE sc.invitee = ${ctx.params.studentId} AND sc.invitation_status = 0 ORDER BY sc.created_at desc LIMIT 10 OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        searchPendingChatInvites: {
            // studentId, offset
            async handler(ctx) {
                const sql = `SELECT sc.inviter, sc.chat_id, sc.created_at, s.student_fname,s.student_lname, s.img_url as image FROM study_chat sc JOIN students s ON s.student_id = sc.inviter WHERE sc.invitee = ${ctx.params.studentId} AND sc.invitation_status = 0 AND concat(s.student_fname," ",s.student_lname) like '%${ctx.params.keyword}%' ORDER BY sc.created_at desc LIMIT ${ctx.params.end} OFFSET ${ctx.params.start}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        muteChat: {
            // muteTill, studentId, chatId
            async handler(ctx) {
                const sql = `UPDATE study_chat s join study_chat_members scm ON s.id = scm.study_chat_id SET scm.muted_till = '${ctx.params.muteTill}' WHERE scm.student_id = ${ctx.params.studentId} AND s.chat_id = '${ctx.params.chatId}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        blockFriend: {
            // chatId, studentId
            async handler(ctx) {
                const sql = `UPDATE study_chat_members set is_blocked=1, blocked_at=NOW() WHERE study_chat_id=${ctx.params.chatId} AND student_id=${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        unBlockFriend: {
            // chatId, studentId
            async handler(ctx) {
                const sql = `UPDATE study_chat_members set is_blocked=0, blocked_at=NOW() WHERE study_chat_id=${ctx.params.chatId} AND student_id=${ctx.params.studentId}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.UPDATE});
            },
        },

        listBlockUsers: {
            // studentId, offset
            async handler(ctx) {
                const sql = `SELECT s.id as study_chat_id, s.chat_id, st.student_id, scm.is_blocked, scm.blocked_at, st.student_fname, st.student_lname, st.img_url FROM study_chat s JOIN study_chat_members scm ON s.id = scm.study_chat_id JOIN students st on st.student_id = scm.student_id WHERE scm.student_id != ${ctx.params.studentId} AND scm.is_blocked=1 AND (s.inviter = ${ctx.params.studentId} || s.invitee = ${ctx.params.studentId}) ORDER BY scm.blocked_at desc LIMIT 10 OFFSET ${ctx.params.offset}`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        countBlockUsers: {
            // studentId, offset
            async handler(ctx) {
                const sql = `SELECT COUNT(1) as count FROM study_chat s JOIN study_chat_members scm ON s.id = scm.study_chat_id WHERE scm.student_id != ${ctx.params.studentId} AND scm.is_blocked=1 AND (s.inviter = ${ctx.params.studentId} || s.invitee = ${ctx.params.studentId})`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        listChatMembers: {
            // chatId
            async handler(ctx) {
                const sql = `SELECT sc.chat_id, scm.student_id, scm.is_blocked, scm.muted_till, st.student_fname, st.student_lname, st.img_url, st.gcm_reg_id FROM study_chat sc JOIN study_chat_members scm on sc.id = scm.study_chat_id JOIN students st on scm.student_id = st.student_id WHERE sc.chat_id='${ctx.params.chatId}' AND sc.invitation_status=1 AND st.gcm_reg_id IS NOT NULL`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getFollowersList: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT s.student_id, s.student_fname, s.student_lname, s.student_class, s.img_url as image FROM user_connections uc INNER JOIN students s ON s.student_id = uc.user_id WHERE uc.connection_id = ${ctx.params.studentId} and uc.is_deleted = 0`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getFollowingList: {
            // studentId
            async handler(ctx) {
                const sql = `SELECT s.student_id, s.student_fname, s.student_lname, s.student_class, s.img_url as image FROM user_connections uc INNER JOIN students s ON s.student_id = uc.connection_id WHERE uc.user_id = ${ctx.params.studentId} and uc.is_deleted = 0`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getStudentIdByMobile: {
            // mobile
            async handler(ctx) {
                const sql = `SELECT student_id FROM students WHERE mobile = '${ctx.params.mobile}'`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },

        getInviterDetails: {
            // studentId, chatId
            async handler(ctx) {
                const sql = `SELECT st.student_id, st.gcm_reg_id, scm.muted_till FROM study_chat sc JOIN study_chat_members scm ON scm.study_chat_id = sc.id JOIN students st ON st.student_id = scm.student_id WHERE sc.chat_id = '${ctx.params.chatId}' AND scm.student_id NOT IN (${ctx.params.studentId}) AND scm.is_active = 1 AND is_blocked=0`;
                return this.adapter.db.query(sql, {type: Sequelize.QueryTypes.SELECT});
            },
        },
    },
    events: {},
    methods: {},
};

export = StudyChatMySQLSchema;
