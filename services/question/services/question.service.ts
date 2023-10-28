import { S3 } from "aws-sdk";
import { ServiceSchema, Context } from "moleculer";
import request from "request-promise";
import moment from "moment-timezone";
import DbService from "dn-moleculer-db";
import Sequelize from "sequelize";
import { v4 as uuid } from "uuid";
import { flagrHost, questionImagesBucket, adapter, videoCDN, searchServiceHost } from "../config";
import { OcrResponse, StringDiffResponse } from "./question.interface";

moment.tz.setDefault("+5:30");

const rp = request.defaults({ forever: true });

const s3 = new S3({
	signatureVersion: "v4",
	region: "ap-south-1",
});

enum QuestionType {
	TXT, IMG
};

const modelAttributes: Sequelize.ModelAttributes = {
	id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
	studentId: { type: Sequelize.STRING(32), allowNull: false },
	class: { type: Sequelize.TINYINT },
	// Subject: { type: Sequelize.TINYINT, references: { model: "subjects", key: "id" } },		// To find using Deep Learning, to be added later
	question: { type: Sequelize.STRING(512) },
	ocr: { type: Sequelize.TEXT({ length: "long" }) },					// Null if ocr fails, "" if OCR done but no ocr is empty string
	ocrCleaned: { type: Sequelize.TEXT({ length: "long" }) },
	ocrVersion: { type: Sequelize.ENUM("MP", "GV", "TS") },				// Mathpix, vision, teserract
	locale: { type: Sequelize.STRING(5) },
	searchVersion: { type: Sequelize.STRING(10) },
	isTrial: { type: Sequelize.BOOLEAN, defaultValue: false },			// Need to find a better column name
};

const QuestionService: ServiceSchema = {
	name: "$question",
	mixins: [DbService],
	adapter,
	model: {
		name: "QuestionAsk",
		define: modelAttributes,
		options: {
			paranoid: true,
			underscored: true,
			freezeTableName: true,
		},
	},
	settings: {
		rest: "/question",
	},
	dependencies: [],
	actions: {
		preSignedUrl: {
			rest: "GET /pre-signed-url",
			async handler() {
				const id = uuid();
				const timestamp = moment().toDate().getTime();
				const url = await s3.getSignedUrlPromise("putObject", {
					Bucket: questionImagesBucket,
					Key: this.getKey(id, timestamp),
					// CacheControl: "max-age=25920000, public",
				});
				return { id, timestamp, url };
			},
		},
		askImage: {
			rest: "PUT /ask/:timestamp/:id",
			async handler(ctx: Context<{ id: string; timestamp: string }, { user: { id: number } }>) {
				const variantAttachment = await ctx.call("$question.getFlagrResponse");
				const ocrData: OcrResponse = await ctx.call("$ocr.get", { url: `${videoCDN}${this.getKey(ctx.params.id, Number(ctx.params.timestamp))}`, variantAttachment });
				return ctx.call("$question.handleAsk", { ...ctx.params, ocrData, questionType: QuestionType.IMG, variantAttachment });
			},
		},
		askText: {
			rest: "PUT /ask",
			params: {
				text: "string",
			},
			async handler(ctx: Context<{ text: string }, { user: { id: number } }>) {
				const variantAttachment = await ctx.call("$question.getFlagrResponse");
				return ctx.call("$question.handleAsk", { ...ctx.params, ocrData: { ocr: ctx.params.text }, questionType: QuestionType.TXT, variantAttachment });
			},
		},
		handleAsk: {
			visibility: "protected",
			async handler(ctx: Context<{ id: string; timestamp: number; ocrData: OcrResponse; questionType: QuestionType; variantAttachment: any }, { user: { id: number; class: number } }>) {
				if (!ctx.params.ocrData.ocr) {
					throw new Error("Null OCR");
				}
				const translatedText = await ctx.call("$translate.to", { text: ctx.params.ocrData.ocr });
				const stringDiff: StringDiffResponse = await ctx.call("$question.getStringDiff", { variantAttachment: ctx.params.variantAttachment, ocrData: ctx.params.ocrData, text: translatedText });
				// TODO call methods to polulate metadata
				// Ctx.emit("$sync-question.create", {});
				const question = {
					id: ctx.params.id || uuid(),
					studentId: ctx.meta.user.id,
					class: ctx.meta.user.class,
					question: ctx.params.questionType === QuestionType.IMG ? this.getKey(ctx.params.id, ctx.params.timestamp) : ctx.params.ocrData.ocr,
					ocr: ctx.params.ocrData.ocr,
					ocrCleaned: ctx.params.ocrData.ocr,
					ocrVersion: ctx.params.ocrData.source,
					locale: ctx.params.ocrData.locale,
					searchVersion: ctx.params.variantAttachment.version,
				};
				await ctx.call("$question.create", question);
				return stringDiff;
			},
			async fallback(ctx: Context<{ id: string; timestamp: number; ocrData: OcrResponse; questionType: QuestionType; variantAttachment: any }, { user: { id: number; class: number } }>) {
				const id = ctx.params.id || uuid();
				const question = {
					id,
					studentId: ctx.meta.user.id,
					class: ctx.meta.user.class,
					question: ctx.params.questionType === QuestionType.IMG ? this.getKey(ctx.params.id, ctx.params.timestamp) : ctx.params.ocrData.ocr,
					searchVersion: ctx.params.variantAttachment ? ctx.params.variantAttachment.version : null,
				};
				await ctx.call("$question.create", question);
				return null;
			},
		},
		getFlagrResponse: {
			visibility: "public",
			async handler(ctx: Context<any, { user: { id: number } }>) {
				try {
					const data = await rp.post({
						baseUrl: flagrHost.baseUrl,
						url: flagrHost.evaluation,
						body: {
							entityContext: {
								studentId: ctx.meta.user.id,
							},
							flagID: 3,
						},
						json: true,
						timeout: 1000,
					});
					if (!data.variantAttachment) {
						return null;
					}
					ctx.emit("$ask.getFlagrResponse", { studentId: ctx.meta.user.id, variantAttachment: data.variantAttachment });
					return data.variantAttachment;
				} catch (e) {
					this.logger.error(e);
					ctx.emit("error", { tag: "ask", source: "getFlagrResponse", error: e.stack });
				}
			},
		},
		getStringDiff: {
			visibility: "public",
			handler(ctx: Context<{ text: string; ocrData: OcrResponse; variantAttachment: any }, { user: { class: number } }>) {
				try {
					this.logger.info("Calling SS", ctx.params.text);
					const body = {
						...ctx.params.variantAttachment,
						ocrText: ctx.params.text,
						ocrType: ctx.params.ocrData.ocrType || 0,
						studentClass: ctx.meta.user.class.toString(),
					};
					return rp.post({
						baseUrl: searchServiceHost,
						url: ctx.params.variantAttachment.apiUrl,
						body,
						json: true,
						timeout: 5000,
					});
				} catch (e) {
					this.logger.error(e);
				}
			},
		},
	},
	events: {},
	methods: {
		getKey(id: string, timestamp: number) {
			return `images/uploads/${moment(new Date(timestamp)).format("YYYY/MM/DD")}/${id}`;
		},
	},
};

export = QuestionService;
