import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema } from "moleculer";
import { adapter } from "../config";

const Answer: ServiceSchema = {
	name: "$sync-answer",
	mixins: [DbService],
	adapter,
	model: {
		name: "answers",
		define: {
			answer_id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			expert_id: Sequelize.INTEGER({ length: 55 }),
			question_id: Sequelize.INTEGER({ length: 55 }),
			answer_video: Sequelize.STRING(255),
			is_approved: Sequelize.TINYINT({ length: 4 }),
			answer_rating: Sequelize.STRING(255),
			answer_feedback: Sequelize.STRING(255),
			timestamp: Sequelize.DATE,
			youtube_id: Sequelize.STRING(256),
			duration: Sequelize.STRING(10),
			isDuplicate: Sequelize.TINYINT({ length: 4 }),
			review_expert_id: Sequelize.INTEGER({ length: 11 }),
			is_reviewed: Sequelize.TINYINT({ length: 4 }),
			is_positive_review: Sequelize.TINYINT({ length: 4 }),
			vdo_cipher_id: Sequelize.STRING(200),
			is_vdo_ready: Sequelize.TINYINT({ length: 4 }),
			aspect_ratio: Sequelize.STRING(45),
			updated_at: Sequelize.DATE,
		},
		options: {
			timestamps: false,
		},
	},
	settings: {
		idField: "answer_id",
	},
	dependencies: [],
	actions: {
		count: {
			cache: false,
		},
		find: {
			cache: {
				enabled: true,
				ttl: 604800, // 7 days
			},
		},
		get: {
			cache: false,
		},
		list: {
			cache: false,
		},
	},
	events: {},
	methods: {},
};

export = Answer;
