import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { ServiceSchema, Context } from "moleculer";
import { adapter } from "../config";

const Question: ServiceSchema = {
	name: "$sync-question",
	mixins: [DbService],
	adapter,
	model: {
		name: "questions",
		define: {
			question_id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			student_id: Sequelize.INTEGER,
			class: Sequelize.STRING(255),
			subject: Sequelize.STRING(255),
			book: Sequelize.STRING(255),
			chapter: Sequelize.STRING(255),
			question: Sequelize.TEXT({ length: "medium" }),
			doubt: Sequelize.STRING(255),
			question_image: Sequelize.STRING(255),
			is_allocated: Sequelize.STRING(255),
			allocated_to: Sequelize.STRING(55),
			allocation_time: Sequelize.STRING(255),
			is_answered: Sequelize.INTEGER,
			is_text_answered: Sequelize.TINYINT({ length: 4 }),
			ocr_done: Sequelize.INTEGER({ length: 11 }),
			ocr_text: Sequelize.TEXT({ length: "long" }),
			original_ocr_text: Sequelize.TEXT({ length: "long" }),
			matched_question: Sequelize.INTEGER({ length: 11 }),
			question_credit: Sequelize.TINYINT({ length: 4 }),
			timestamp: Sequelize.DATE,
			is_trial: Sequelize.TINYINT({ length: 4 }),
			is_skipped: Sequelize.TINYINT({ length: 4 }),
			parent_id: Sequelize.INTEGER({ length: 11 }),
			incorrect_ocr: Sequelize.INTEGER({ length: 11 }),
			skip_question: Sequelize.INTEGER({ length: 11 }),
			locale: Sequelize.STRING(50),
			difficulty: Sequelize.TINYINT({ length: 4 }),
			is_community: Sequelize.BOOLEAN,
			matched_app_questions: Sequelize.BOOLEAN,
			wrong_image: Sequelize.TINYINT({ length: 4 }),
		},
		options: {
			timestamps: false,
		},
	},
	settings: {
		idField: "question_id",
	},
	dependencies: [],
	actions: {
		count: {
			cache: false,
		},
		find: {
			cache: false,
		},
		get: {
			cache: {
				enabled: true,
				ttl: 604800, // 7 days
			},
		},
		list: {
			cache: false,
		},
	},
	events: {
		create: {
			async handler(ctx: Context) {
				// TODO transform and call this.actions.create()
			},
		},
	},
	methods: {},
};

export = Question;
