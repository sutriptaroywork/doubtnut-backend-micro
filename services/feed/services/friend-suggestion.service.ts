import { ServiceSchema } from "moleculer";
import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";

import { adapter } from "../config";

const FriendSuggestionService: ServiceSchema = {
    name: "$friend-suggestion",
    mixins: [DbService],
    adapter,
    model: {
        name: "feed_categories_followers",
        define: {
            category: Sequelize.STRING,
            studentId: Sequelize.INTEGER,
            isActive: Sequelize.TINYINT,
        },
        options: {
            underscored: true,
            timestamps: false,
            freezeTableName: true,
        },
    },
    actions: {
        getFollowers: {
            async handler(ctx) {
                const query = `select  cf.category, s.student_id, concat(s.student_fname,' ',s.student_lname) as student_name, s.img_url,  COUNT(uc.connection_id) as followers  from classzoo1.feed_categories_followers cf 
                left join students s on cf.student_id = s.student_id
                left join user_connections uc ON s.student_id = uc.user_id 
                where category = '${ctx.params.category}'
                group by cf.category, s.student_id order by followers desc limit 3`;
                const friendsList = await this.adapter.db.query(query, { type: Sequelize.QueryTypes.SELECT });
                return friendsList;
            },
        },
    },
};

export = FriendSuggestionService;
