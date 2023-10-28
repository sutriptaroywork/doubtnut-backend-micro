/* eslint-disable max-lines-per-function */
import https from "https";
import http from "http";
import { ServiceSchema, Context } from "moleculer";
import axios from "axios";
import Cron from "moleculer-cron";
import moment from "moment";
import { DLREvent, GupshupEvent, GupshupImage } from "./gupshup.interface";
import WhatsappTextService from "./whatsapp.text";
import WhatsappImageService from "./whatsapp.image";

const GupshupService: ServiceSchema = {
	name: "$gupshup",
	mixins: [Cron, WhatsappTextService, WhatsappImageService],
	settings: {
		rest: "whatsapp/gupshup",
		handledMessageTypes: ["image", "text", "interactive", "button"],
		api: {
			baseURL: process.env.GUPSHUP_BASE_URL,
			sendMsg: `${process.env.GUPSHUP_BASE_URL}/GatewayAPI/rest`,
			route: "/GatewayAPI/rest",
			ax: axios.create({
				httpAgent: new http.Agent({ keepAlive: true, maxSockets: 250 }),
				httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 250 }),
				baseURL: process.env.GUPSHUP_BASE_URL,
			}),
		},
		accounts: {
			8400400400: {
				credentials: {
					user: process.env.GUPSHUP_8400400400_USER,
					pass: process.env.GUPSHUP_8400400400_PASS,
					hsmUser: process.env.GUPSHUP_8400400400_HSM_USER,
					hsmPass: process.env.GUPSHUP_8400400400_HSM_PASS,
					userBulk: process.env.GUPSHUP_8400400400_USER_BULK,
					passBulk: process.env.GUPSHUP_8400400400_PASS_BULK,
					hsmUserBulk: process.env.GUPSHUP_8400400400_HSM_USER_BULK,
					hsmPassBulk: process.env.GUPSHUP_8400400400_HSM_PASS_BULK,
					hsmLimiter: {
						key: "GUPSHUP_8400400400_HSM_LIMITER",
						limitPerHr: process.env.GUPSHUP_8400400400_HSM_LIMIT_PER_HR || 40,
						ttl: 4000,
					},
				},
			},
			7428389810: {
				credentials: {
					user: process.env.GUPSHUP_7428389810_USER,
					pass: process.env.GUPSHUP_7428389810_PASS,
					hsmUser: process.env.GUPSHUP_7428389810_HSM_USER,
					hsmPass: process.env.GUPSHUP_7428389810_HSM_PASS,
					hsmLimiter: {
						key: "GUPSHUP_7428389810_HSM_LIMITER",
						limitPerHr: process.env.GUPSHUP_7428389810_HSM_LIMIT_PER_HR || 40,
						ttl: 4000,
					},
				},
			},
			6003009004: {
				credentials: {
					user: process.env.GUPSHUP_6003009004_USER,
					pass: process.env.GUPSHUP_6003009004_PASS,
					hsmUser: process.env.GUPSHUP_6003009004_HSM_USER,
					hsmPass: process.env.GUPSHUP_6003009004_HSM_PASS,
					hsmLimiter: {
						key: "GUPSHUP_6003009004_HSM_LIMITER",
						limitPerHr: process.env.GUPSHUP_6003009004_HSM_LIMIT_PER_HR || 40,
						ttl: 4000,
					},
				},
			},
		},
	},
	dependencies: ["$whatsapp-student"],
	crons: [{
		cronTime: "*/10 * * * * *", // every ten seconds.
		async onTick() {
			if (!process.env.NAMESPACE) {
				return;
			}
			this.logger.info("Starting gupshup service cron");
			const serviceName = "$gupshup";
			const localService = this.getLocalService(serviceName);
			await localService.actions.syntheticPooledTest();
			await localService.actions.syntheticTest();
			this.logger.info("Cron gupshup service completed");
		},
	}],
	actions: {
		optin: {
			rest: "PUT /optin",
			internal: true,
			params: {
				phone: "string",
				locale: "string",
				source: { type: "string", optional: true, default: "8400400400" },
			},
			// TODO handle source addition in API from doubtnut_backend
			async handler(ctx: Context<{ phone: string; locale: string; source?: string }>) {
				const source = ctx.params.source || "8400400400";
				const account = this.settings.accounts[source];
				if (!account) {
					throw new Error("Unknown account");
				}
				await this.optinGupshup(source, ctx.params.phone);
				if (source === "8400400400") {
					this.broker.emit("sendTextHSM", { source, phone: ctx.params.phone, text: this.settings.replyEvents.optin.msg, attributes: this.settings.replyEvents.optin.attributes, payload: {} }, account.service);
				}
			},
		},
		webhook: {
			rest: "POST /:sourceNumber",
			params: {
				sourceNumber: "string",
			},
			async handler(ctx: Context<GupshupEvent>) {
				this.logger.debug("Gupshup handling", JSON.stringify(ctx.params));
				const account = this.settings.accounts[ctx.params.sourceNumber];
				if (!account) {
					this.logger.error("Unknown account");
					return;
				}
				this.logSession(ctx.params.sourceNumber, ctx.params.mobile, ctx.params.name);
				if (!ctx.params.type || !ctx.params[ctx.params.type]) {
					this.logger.warn("Bad msg");
					return;
				}
				ctx.emit("log", { source: ctx.params.sourceNumber, phone: ctx.params.mobile, eventType: "MO", payload: { eventType: ctx.params.type, msg: ctx.params[ctx.params.type] } }, "$whatsapp-io-event");
				this.handleEvent(ctx.params.sourceNumber, ctx.params);
			},
		},
		dlr: {
			rest: "POST /dlr/:sourceNumber",
			params: {
				sourceNumber: "string",
			},
			timeout: 2000,
			retryPolicy: {
				enabled: true,
				retries: 3,
				check: () => true,
			},
			async handler(ctx: Context<{ sourceNumber: string; response: string }>) {
				const account = this.settings.accounts[ctx.params.sourceNumber];
				if (!account) {
					this.logger.error("Unknown account");
					return;
				}
				this.logger.debug("Gupshup dlr handling", ctx.params.response);
				const data: DLREvent[] = JSON.parse(ctx.params.response);
				data.forEach(x => ctx.emit("dlrLog", { id: x.externalId, status: x.eventType, code: x.errorCode }, "$whatsapp-io-event"));
			},
		},
		syntheticPooledTest: {
			params: {
			},
			async handler(ctx) {
				const route = "/GatewayAPI/monitor";
				const y = await this.settings.api.ax.get(route);
				this.logger.info(`Response time for Synthetic Pooled Test is ${y.responseTime}ms`);
			},
		},
		syntheticTest: {
			params: {
			},
			async handler(ctx) {
				const route = "/GatewayAPI/monitor";
				const ax = axios.create({
					baseURL: this.settings.api.baseURL,
				});
				ax.interceptors.request.use((y: any) => {
					y.meta = y.meta || {};
					y.meta.requestStartedAt = new Date().getTime();
					return y;
				});
				ax.interceptors.response.use((y: any) => {
					y.responseTime = new Date().getTime() - y.config.meta.requestStartedAt;
					return y;
				});
				const x: any = await ax.get(route);
				this.logger.info(`Response time for Synthetic Test is ${x.responseTime}ms`);
			},
		},
	},
	events: {
		sendTxtMsg: {
			async handler(ctx: Context<{ source: number; phone: string; payload: any; preview?: boolean; bulk?: boolean }>) {
				const account = this.settings.accounts[ctx.params.source];
				const replyType = (ctx.params.payload.replyType || "text").toUpperCase();
				this.logger.info(ctx.params.phone, ctx.params.payload.text, ctx.params.preview);
				let x;
				const msg = this.responseMsgParser(ctx.params.source, ctx.params.payload.text);
				const header = this.responseMsgParser(ctx.params.source, ctx.params.payload.header);
				const footer = this.responseMsgParser(ctx.params.source, ctx.params.payload.footer);
				const action = JSON.stringify(ctx.params.payload.action);
				const userId = ctx.params.bulk ? account.credentials.userBulk || account.credentials.user : account.credentials.user;
				const pass = ctx.params.bulk ? account.credentials.passBulk || account.credentials.pass : account.credentials.pass;
				switch (replyType) {
					case "TEXT":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMessage",
								send_to: ctx.params.phone,
								msg,
								msg_type: "DATA_TEXT",
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								preview_url: (ctx.params.payload.text.match(/http/g) || []).length === 1,
							},
						});
						break;
					case "LIST":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMessage",
								send_to: ctx.params.phone,
								msg_type: "TEXT",
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								interactive_type: "list",
								header,
								footer,
								action,
								msg,
							},
						});
						break;
					case "BUTTONS":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMessage",
								send_to: ctx.params.phone,
								msg_type: "TEXT",
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								interactive_type: "dr_button",
								header,
								footer,
								action,
								msg,
							},
						});
				}
				this.logger.debug(x.data);
				ctx.emit("log", { source: ctx.params.source, phone: ctx.params.phone, eventType: "MT", payload: { replyType, msg, header, footer, action }, apiResponse: { id: x.data.response.id, status: x.data.response.status, latency: x.responseTime } }, "$whatsapp-io-event");
			},
		},
		sendMediaMsg: {
			async handler(ctx: Context<{ source: number; phone: string; payload: any; bulk?: boolean }>) {
				const account = this.settings.accounts[ctx.params.source];
				this.logger.info(ctx.params.phone, ctx.params.payload.media);
				const replyType = (ctx.params.payload.replyType || "image").toUpperCase();
				let x;
				const caption = this.responseMsgParser(ctx.params.source, ctx.params.payload.caption || "#");
				const header = this.responseMsgParser(ctx.params.source, ctx.params.payload.header);
				const footer = this.responseMsgParser(ctx.params.source, ctx.params.payload.footer);
				const action = JSON.stringify(ctx.params.payload.action);
				const userId = ctx.params.bulk ? account.credentials.userBulk || account.credentials.user : account.credentials.user;
				const pass = ctx.params.bulk ? account.credentials.passBulk || account.credentials.pass : account.credentials.pass;
				switch (replyType) {
					case "IMAGE":
					case "DOCUMENT":
					case "VIDEO":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMediaMessage",
								send_to: ctx.params.phone,
								msg_type: ctx.params.payload.replyType || "image",
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								media_url: ctx.params.payload.media,
								caption,
							},
						});
						break;
					case "LIST":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMediaMessage",
								send_to: ctx.params.phone,
								msg_type: ctx.params.payload.mediaType || "image",
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								interactive_type: "list",
								header,
								footer,
								action,
								media_url: ctx.params.payload.media,
								caption,
							},
						});
						break;
					case "BUTTONS":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMediaMessage",
								send_to: ctx.params.phone,
								msg_type: ctx.params.payload.mediaType || "image",
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								interactive_type: "dr_button",
								header,
								footer,
								action,
								media_url: ctx.params.payload.media,
								caption,
							},
						});
				}
				this.logger.debug(x.data);
				ctx.emit("log", { source: ctx.params.source, phone: ctx.params.phone, eventType: "MT", payload: { replyType, caption, header, footer, action, url: ctx.params.payload.media }, apiResponse: { id: x.data.response.id, status: x.data.response.status, latency: x.responseTime } }, "$whatsapp-io-event");

			},
		},
		sendTextHSM: {
			async handler(ctx: Context<{ source: number; phone: string; text: string; attributes: string[]; payload: any; bulk?: boolean }>) {
				const account = this.settings.accounts[ctx.params.source];
				const cacheKey = `${account.hsmLimiter.key}_${new Date().getHours()}`;
				const alreadySent = await this.broker.cacher.client.llen(cacheKey);
				if (alreadySent >= account.hsmLimiter.limitPerHr) {
					throw new Error("HSM limit crossed");
				}
				this.broker.cacher.client.pipeline()
					.lpush(cacheKey, ctx.params.phone)
					.expire(cacheKey, account.hsmLimiter.ttl)
					.exec();
				let msg = ctx.params.text;
				ctx.params.attributes.forEach((x, i) => {
					msg = msg.replace(`{{${i}}}`, x);
				});
				msg = this.responseMsgParser(ctx.params.source, msg);
				this.logger.info(ctx.params.phone, msg);
				const header = this.responseMsgParser(ctx.params.source, ctx.params.payload.header);
				const footer = this.responseMsgParser(ctx.params.source, ctx.params.payload.footer);
				const action = JSON.stringify(ctx.params.payload.action);
				const replyType = ctx.params.payload.replyType || "TEXT";
				const userId = ctx.params.bulk ? account.credentials.hsmUserBulk || account.credentials.hsmUser : account.credentials.hsmUser;
				const pass = ctx.params.bulk ? account.credentials.hsmPassBulk || account.credentials.hsmPass : account.credentials.hsmPass;
				let x;
				switch (replyType) {
					case "TEXT":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMessage",
								send_to: ctx.params.phone,
								msg,
								msg_type: "HSM",
								isHSM: true,
								userid: userId,
								password: pass,
								isTemplate: true,
								header,
								footer,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
							},
						});
						break;
					case "LIST":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMessage",
								send_to: ctx.params.phone,
								msg_type: "TEXT",
								isHSM: true,
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								interactive_type: "list",
								isTemplate: true,
								header,
								footer,
								action,
								msg,
							},
						});
						break;
					case "BUTTONS":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMessage",
								send_to: ctx.params.phone,
								msg_type: "TEXT",
								isHSM: true,
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								interactive_type: "dr_button",
								isTemplate: true,
								header,
								footer,
								action,
								msg,
							},
						});
				};
				this.logger.debug(x.data);
				ctx.emit("log", { source: ctx.params.source, phone: ctx.params.phone, eventType: "MT", payload: { replyType, msg, isHsm: true }, apiResponse: { id: x.data.response.id, status: x.data.response.status, latency: x.data.responseTime } }, "$whatsapp-io-event");
			},
		},
		sendMediaHSM: {
			async handler(ctx: Context<{ source: number; phone: string; text: string; attributes: string[]; payload: any; bulk?: boolean }>) {
				const account = this.settings.accounts[ctx.params.source];
				const cacheKey = `${account.hsmLimiter.key}_${new Date().getHours()}`;
				const alreadySent = await this.broker.cacher.client.llen(cacheKey);
				if (alreadySent >= account.hsmLimiter.limitPerHr) {
					throw new Error("HSM limit crossed");
				}
				this.broker.cacher.client.pipeline()
					.lpush(cacheKey, ctx.params.phone)
					.expire(cacheKey, account.hsmLimiter.ttl)
					.exec();
				let msg = ctx.params.text;
				ctx.params.attributes.forEach((x, i) => {
					msg = msg.replace(`{{${i}}}`, x);
				});
				msg = this.responseMsgParser(ctx.params.source, msg);
				this.logger.info(ctx.params.phone, msg);
				const header = this.responseMsgParser(ctx.params.source, ctx.params.payload.header);
				const footer = this.responseMsgParser(ctx.params.source, ctx.params.payload.footer);
				const action = JSON.stringify(ctx.params.payload.action);
				const replyType = ctx.params.payload.replyType || "IMAGE";
				const userId = ctx.params.bulk ? account.credentials.hsmUserBulk || account.credentials.hsmUser : account.credentials.hsmUser;
				const pass = ctx.params.bulk ? account.credentials.hsmPassBulk || account.credentials.hsmPass : account.credentials.hsmPass;
				let x;
				switch (replyType) {
					case "IMAGE":
					case "DOCUMENT":
					case "VIDEO":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMediaMessage",
								send_to: ctx.params.phone,
								msg_type: ctx.params.payload.replyType || "image",
								isHSM: true,
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								isTemplate: true,
								media_url: ctx.params.payload.media,
								caption: msg,
							},
						});
						break;
					case "LIST":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMediaMessage",
								send_to: ctx.params.phone,
								msg_type: ctx.params.payload.mediaType || "image",
								isHSM: true,
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								interactive_type: "list",
								isTemplate: true,
								header,
								footer,
								action,
								media_url: ctx.params.payload.media,
								caption: msg,
							},
						});
						break;
					case "BUTTONS":
						x = await this.settings.api.ax.get(this.settings.api.route, {
							params: {
								method: "SendMediaMessage",
								send_to: ctx.params.phone,
								msg_type: ctx.params.payload.mediaType || "image",
								isHSM: true,
								userid: userId,
								password: pass,
								auth_scheme: "plain",
								data_encoding: "Unicode_text",
								v: "1.1",
								format: "JSON",
								interactive_type: "dr_button",
								isTemplate: true,
								header,
								footer,
								action,
								media_url: ctx.params.payload.media,
								caption: msg,
							},
						});
				};
				this.logger.debug(x.data);
				ctx.emit("log", { source: ctx.params.source, phone: ctx.params.phone, eventType: "MT", payload: { replyType, msg, isHsm: true }, apiResponse: { id: x.data.response.id, status: x.data.response.status, latency: x.data.responseTime } }, "$whatsapp-io-event");
			},
		},
	},
	methods: {
		async handleEvent(source: string, event: GupshupEvent) {
			const account = this.settings.accounts[source];
			if (account.loginAllowed && event.type === "text" && this.settings.loginText.includes(event.text.toLowerCase())) {
				this.sendWhatsappLoginMsg(source, event.mobile, event.text);
				return;
			}
			const [student, dailyCountData, context] = await Promise.all([
				this.broker.call("$whatsapp-student.createAndGet", {
					source,
					fingerprint: account.defaultCampaignFingerprint,
					phone: event.mobile,
					campaignText: event.text,
					name: event.name,
				}),
				this.getDailyCount(source, event.mobile),
				this.getConversationContext(source, event.mobile),
			]);
			this.logger.debug("StudentObject ", student);
			const lock = context && context.active && context.createdAt && ((moment().add("5:30").diff(moment(context.createdAt))) < 300000);
			if (lock) {
				return;
			}
			if (!this.settings.handledMessageTypes.includes(event.type)) {
				this.sendMsg(source, event.mobile, this.settings.replyEvents.unhandledMessage, student.locale);
				this.logEvent(source, event.mobile, student.id, { lock: true }, this.settings.replyEvents.unhandledMessage, context);
				this.logger.warn(event.type);
				return;
			}
			if (event.type === "interactive") {
				const interactive = JSON.parse(event.interactive);
				event.text = [interactive[interactive.type].title, interactive[interactive.type].description].filter(Boolean).join("\n");
				event.selectedOption = interactive[interactive.type].id;
				event.type = "text";
			} else if (event.type === "button") {
				const button: { text: string } = JSON.parse(event.button);
				event.text = button.text;
				event.type = "text";
			}
			this.handleMsg(source, event, student, dailyCountData, context);
		},
		async handleMsg(source: number, event: GupshupEvent, student, dailyCountData, context) {
			// TODO refactor this
			if (event.type === "image") {
				const imageObj: GupshupImage = JSON.parse(event.image);
				this.handleImage(source, {
					phone: event.mobile,
					studentId: student.id,
					name: event.name,
					studentClass: student.class,
					image: await this.getMedia(imageObj.url, imageObj.signature),
					dailyCountData,
					context,
					locale: student.locale,
					ccmIdList: student.ccmIdList,
				});
				return;
			}
			this.handleText(source, {
				phone: event.mobile,
				studentId: student.id,
				name: event.name,
				studentClass: student.class,
				text: event.text,
				selectedOption: event.selectedOption,
				textLower: event.text.toLowerCase(),
				dailyCountData,
				context,
				locale: student.locale,
				ccmIdList: student.ccmIdList,
			});
		},
		async getMedia(url: string, signature: string) {
			const { data } = await axios.get(url + signature, {
				responseType: "arraybuffer",
			});
			return data;
		},
		async optinGupshup(source: number, phone: string) {
			const account = this.settings.accounts[source];
			const { data } = await this.settings.api.ax.get(this.settings.api.route, {
				params: {
					method: "OPT_IN",
					format: "json",
					userid: account.credentials.hsmUser,
					password: account.credentials.hsmPass,
					phone_number: phone,
					v: "1.1",
					auth_scheme: "plain",
					channel: "WHATSAPP",
				},
			});
			this.logger.debug(data);
			if (data.response.status !== "success") {
				this.logger.warn(data);
				throw new Error("Gupshup optin failed");
			}
		},
	},
	async started() {
		this.settings.api.ax.interceptors.request.use(x => {
			x.meta = x.meta || {};
			x.meta.requestStartedAt = new Date().getTime();
			return x;
		});
		this.settings.api.ax.interceptors.response.use(x => {
			x.responseTime = new Date().getTime() - x.config.meta.requestStartedAt;
			return x;
		});
	},
};

export = GupshupService;
