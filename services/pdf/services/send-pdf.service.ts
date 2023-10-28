import { readFileSync } from "fs";
import { ServiceSchema, Context } from "moleculer";
import request from "request-promise";
import { newtonHost } from "../../../common";
import { staticCDN, staticCloudfrontCDN } from "../../../common";

const rp = request.defaults({ forever: true });

const SendPdf: ServiceSchema = {
	name: "$sendPdf",
	settings: {
		rest: "/pdf",
		templates: {
			"question-ask": {
				pdf: readFileSync("./services/pdf/template/question-ask/pdf.html", "utf8"),
				questionBlock: readFileSync("./services/pdf/template/question-ask/question-block.html", "utf8"),
				limitCheck: 10,
			},
			"web": {
				// TODO verify template
				pdf: readFileSync("./services/pdf/template/question-ask/pdf.html", "utf8"),
				questionBlock: readFileSync("./services/pdf/template/question-ask/question-block.html", "utf8"),
				limitCheck: true,
			},
			"playlist": {
				pdf: readFileSync("./services/pdf/template/question-ask/pdf.html", "utf8"),
				questionBlock: readFileSync("./services/pdf/template/question-ask/question-block.html", "utf8"),
			},
			"whatsapp": {
				pdf: readFileSync("./services/pdf/template/whatsapp/pdf.html", "utf8"),
				questionBlock: readFileSync("./services/pdf/template/whatsapp/question-block.html", "utf8"),
				limitCheck: true,
			},
		},
	},
	dependencies: [],
	actions: {
		getPdf: {
			rest: {
				method: "POST",
				path: "/:entityType",
			},
			params: {
				entityType: { type: "string" },
				filter: {
					type: "object",
					props: {
						entityId: { type: "string", required: false },
						class: { type: "number|integer|positive", required: false },
						subject: { type: "string", required: false },
						book: { type: "string", required: false },
						chapter: { type: "array", items: "string", required: false },
					},
				},
				limit: { type: "number", required: false, default: 20 },
				persist: { type: "boolean", required: false },
				fileName: { type: "string", required: false },
				title: { type: "string", required: false },
			},
			async handler(ctx: Context<{ entityType: string; filter: any; limit: number; persist: boolean; fileName?: string; title?: string }, { user: any }>) {
				const locale = (ctx.meta.user ? ctx.meta.user.locale : null) || "en";
				let entityId = ctx.params.filter.entityId;
				if (entityId && locale !== "en") {
					entityId = `${entityId}_${locale}`;
				}
				if (entityId && ctx.params.limit !== 20) {
					entityId = `${entityId}_${ctx.params.limit}`;
				}

				if (ctx.params.persist && entityId) {
					const pdfData: any[] = await ctx.call("$pdf.find", {
						query: {
							entityId,
							entityType: ctx.params.entityType,
						},
						limit: 1,
					});
					if (pdfData.length) {
						this.logger.info("Got PDF", pdfData[0].url);
						return { url: pdfData[0].url.replace(staticCloudfrontCDN, staticCDN) };
					}
				}
				const data = await ctx.call("$sendPdf.getPdfData", { entityType: ctx.params.entityType, deeplinkCampaign: ctx.params.entityType, filter: ctx.params.filter, limit: ctx.params.limit });
				if (!data) {
					return { url: null };
				}
				const html = this.buildHtml(this.settings.templates[ctx.params.entityType], data, { title: ctx.params.title });
				const url: string = await ctx.call("$pdf.build", { entityId, entityType: ctx.params.entityType, html, persist: ctx.params.persist, fileName: ctx.params.fileName });
				return { url: url.replace(staticCloudfrontCDN, staticCDN) };
			},
		},
		schedule: {
			rest: {
				method: "PUT",
				path: "/send/:entityType",
			},
			params: {
				studentId: { type: "string", required: false },
				questionId: "string",
				entityType: "string",
				notificationInfo: {
					type: "object",
					props: {
						gcmId: { type: "string", required: false },
						fileName: "string",
						campaign: { type: "string", required: false },
						limit: "number",
						footerImage: "string",
					},
				},
				nextEvent: { type: "string", required: false },
				nextEventGroup: { type: "string", required: false },
			},
			async handler(ctx: Context<{ studentId: string; questionId: string; entityType: string; notificationInfo: any; nextEvent: string; nextEventGroup: string }>) {
				const reqTime = new Date().getTime();
				const pdfData: any[] = await ctx.call("$pdf.find", {
					query: {
						entityId: ctx.params.questionId,
						entityType: ctx.params.entityType,
					},
					limit: 1,
				});
				if (pdfData.length) {
					this.logger.info("Got PDF", pdfData[0].url);
					switch (ctx.params.entityType) {
						case "question-ask":
							ctx.call("$sendPdf.notification", { studentId: ctx.params.studentId, url: pdfData[0].url, notificationInfo: ctx.params.notificationInfo });
							return;
						case "whatsapp":
							ctx.emit(ctx.params.nextEvent, { ...ctx.params.notificationInfo, url: pdfData[0].url }, ctx.params.nextEventGroup);
							return;
						default: return;
					}
				}
				this.logger.info("Scheduling PDF", ctx.params.questionId);
				this.createPdf(ctx, reqTime);
				return "PDF Scheduled";
			},
		},
		notification: {
			visibility: "protected",
			handler(ctx: Context<{ studentId: string; url: string; notificationInfo: any }>) {
				this.logger.info("Sending PDF", ctx.params.studentId, ctx.params.url);
				const payload = {
					event: "pdf_viewer",
					data: {
						pdf_url: ctx.params.url.replace(staticCloudfrontCDN, staticCDN),
					},
					...ctx.params.notificationInfo,
				};
				return this.sendToNewton(ctx.params.studentId, payload);
			},
		},
		getPdfData: {
			visibility: "protected",
			async handler(ctx: Context<{ entityType: string; deeplinkCampaign: string; filter: any; limit: number }>) {
				let similar: { question_id: number; ocr_text: number; resource_type: string }[];
				switch (ctx.params.entityType) {
					case "web":
						similar = await ctx.call("$sync-raw.getRandomByChapter", { filter: ctx.params.filter, limit: ctx.params.limit });
						break;
					case "playlist":
						similar = await ctx.call("$sync-raw.getResourceByPlaylistIdForPdf", { playlistId: ctx.params.filter.entityId, limit: ctx.params.limit });
						break;
					default:
						similar = await ctx.call("$sync-raw.getSimilar", { id: ctx.params.filter.entityId, limit: ctx.params.limit });
				}
				const limitCheck = this.settings.templates[ctx.params.entityType] ? this.settings.templates[ctx.params.entityType].limitCheck : true;
				if (limitCheck && typeof limitCheck === "number" && similar.length < Math.min(limitCheck, ctx.params.limit)) {
					return;
				}
				else if (limitCheck && similar.length < ctx.params.limit) {
					return;
				}
				const data = similar.map((x => ({
					questionId: x.question_id,
					resourceType: x.resource_type,
					url: null,
					ocr: x.ocr_text,
				})));
				const deeplinks = await ctx.call("$deeplink.createBulk", { studentId: 115, campaign: (ctx.params.deeplinkCampaign || ctx.params.entityType).toUpperCase(), data });
				data.forEach((x, i) => {
					x.url = deeplinks[i].url;
				});
				return data;
			},
		},
		getPdfHtml: {
			handler(ctx: Context<{ entityType: string; data: any; extra: any }>) {
				return this.buildHtml(this.settings.templates[ctx.params.entityType], ctx.params.data, ctx.params.extra);
			},
		},
	},
	events: {
		async send(ctx: Context<{ studentId: string; questionId: string; url: string; reqTime: number; notificationInfo: any }>) {
			const remTime = new Date().getTime() - ctx.params.reqTime;
			if (remTime > 300000 || !ctx.params.url) {
				return;
			}
			await ctx.call("$sendPdf.notification", { studentId: ctx.params.studentId, url: ctx.params.url, notificationInfo: ctx.params.notificationInfo });
		},
	},
	methods: {
		async createPdf(ctx: Context<{ studentId: string; questionId: string; entityType: string; notificationInfo: any; nextEvent: string; nextEventGroup: string }>, reqTime: number) {
			const limit = ctx.params.notificationInfo.limit || 10;
			const data = await ctx.call("$sendPdf.getPdfData", { entityType: ctx.params.entityType, deeplinkCampaign: ctx.params.notificationInfo.campaign, filter: { entityId: ctx.params.questionId }, limit });
			if (!data) {
				return ctx.emit(ctx.params.nextEvent, ctx.params.notificationInfo, ctx.params.nextEventGroup);
			}
			ctx.emit("create", {
				data: {
					studentId: ctx.params.studentId,
					questionId: ctx.params.questionId,
					entityType: ctx.params.entityType.toUpperCase(),
					notificationInfo: ctx.params.notificationInfo,
					html: this.buildHtml(this.settings.templates[ctx.params.entityType], data, ctx.params.notificationInfo),
					reqTime,
				},
				nextEvent: ctx.params.nextEvent || "send",
				nextEventGroup: ctx.params.nextEventGroup || "$sendPdf",
			}, "$pdf");
		},
		buildHtml(template, data: { questionId: number; resourceType: string; url: string; deeplink?: string; ocr: string }[], extra: any = {}) {
			const totalBlock = data.map((x, i) => template.questionBlock
				.replace(/###question_id###/g, x.questionId.toString())
				.replace(/###ocr_text###/g, x.ocr)
				.replace(/###branch_url###/g, x.deeplink || x.url)
				.replace(/###SRNO###/g, (i + 1).toString())
				.replace(/###TYPE###/g, x.resourceType)).join("");
			const html = template.pdf
				.replace("###QUESTION_LIST###", totalBlock)
				.replace("###RESULT_LENGTH###", typeof extra.subHeader !== "undefined" ? extra.subHeader : `+ ${data.length - 1} other related solutions`)
				.replace("###TITLE###", extra.title || "Practice Questions for You")
				.replace("###SOURCE_FOOTER###", extra.footerImage || "");
			return html;
		},
		async sendToNewton(id, notificationInfo) {
			const gcmId = notificationInfo.gcmId;
			delete (notificationInfo.gcmId);
			try {
				this.logger.info("Sending", id, gcmId);
				this.broker.emit("sendNotification", {
					studentId: [id],
					gcmRegistrationId: [gcmId],
					notificationInfo,
					topic: "micro.push.notification",
				}, "newton");
			} catch (e) {
				this.logger.error(e);
			}
		},
	},
};

export = SendPdf;
