import { ServiceSchema, Context } from "moleculer";
import request from "request-promise";
import { v4 as uuid } from "uuid";
import { publishRawDE } from "../../../common";

const rp = request.defaults({ forever: true, pool: { maxSockets: 2000 } });

const AppConfigService: ServiceSchema = {
	name: "$app-config",
	settings: {
		rest: "/app-config",
		flagr: {
			baseUrl: process.env.FLAGR_HOST,
			evaluation: "/api/v1/evaluation",
		},
		kafkaTopic: "warehouse.queue.flagr-events",
	},
	dependencies: [],
	actions: {
		"get-flagr": {
			rest: "POST /flagr",
			params: {
				capabilities: { type: "object" },
				entityId: { type: "string", required: false },
			},
			async handler(ctx: Context<{ capabilities: { [expName: string]: any }; entityId?: string; timeout?: number }, { user: any }>) {
				let entityId = ctx.params.entityId || ctx.meta.user.id;
				if (!entityId) {
					entityId = uuid();
				}
				/**
				 * Doubt Paywall For Gulf Contry Users
				 * const locationPromise = [];
				 * locationPromise.push(ctx.call("wallet.getUserLocationDetails", { student_id: entityId}));
				 */
				const experiments = await this.actions.experiments({ timeout: ctx.params.timeout });
				const capabilities = Object.keys(ctx.params.capabilities);
				const evals = await Promise.all(capabilities.map((exp: string, i: number) => this.actions.evaluate({
					flagId: experiments[capabilities[i]],
					studentId: entityId.toString(),
					payload: ctx.params.capabilities[exp],
					timeout: ctx.params.timeout,
				})));
				const resp = {};
				for (let i = 0; i < capabilities.length; i++) {
					resp[capabilities[i]] = evals[i] ? {
						enabled: true,
						payload: evals[i].variantAttachment,
						variantId: evals[i].variantId,
					} : { enabled: false };
					/**
					 * Doubt Paywall For Gulf Contry Users
					 * try {
					 * 	if (capabilities[i] === "doubt_paywall") {
					 * 		const [userLocationDetails] = await Promise.all(locationPromise);
					 * 		console.log(entityId, userLocationDetails);
					 * 		if (userLocationDetails[0].true_country !== "IN") {
					 * 			resp[capabilities[i]] = {
					 * 				enabled: true,
					 * 				payload: { enabled: true },
					 * 				variantId: 605,
					 * 			};
					 * 		}
					 * 		ctx.emit("saveFlagrResponse", { student_id: entityId, flagr_response: resp[capabilities[i]], time_stamp: Date.now() }, "walletmongo");
					 * 	}
					 * } catch (e) {
					 * 	console.error(e);
					 * 	ctx.emit("saveFlagrResponse", { student_id: entityId, flagr_response: JSON.stringify(e), time_stamp: Date.now() }, "walletmongo");
					 * }
					 */
				}
				return resp;
			},
		},
		"experiments": {
			visibility: "public",
			cache: {
				enabled: true,
				ttl: 30,
			},
			async handler(ctx: Context<{ timeout?: number }>) {
				const data = await rp.post({
					baseUrl: this.settings.flagr.baseUrl,
					url: this.settings.flagr.evaluation,
					body: {
						flagID: 10,
					},
					json: true,
					timeout: ctx.params.timeout || 150,
				});
				return data.variantAttachment || {};
			},
			// async fallback() {
			// 	// this.broker.cacher.clean("$app-config.get-experiments.*");
			// 	return {};
			// },
		},
		"evaluate": {
			visibility: "public",
			async handler(ctx: Context<{ flagId: number; studentId: string; payload: any; timeout?: number }>) {
				if (!ctx.params.flagId) {
					return;
				}
				try {
					const data = await rp.post({
						baseUrl: this.settings.flagr.baseUrl,
						url: this.settings.flagr.evaluation,
						body: {
							entityID: ctx.params.studentId,
							entityContext: { ...ctx.params.payload, studentId: ctx.params.studentId, student_id: parseInt(ctx.params.studentId, 10) },
							flagID: ctx.params.flagId,
						},
						json: true,
						timeout: ctx.params.timeout || 150,
					});
					if (!data.variantAttachment) {
						return;
					}
					// this.broker.emit("flagr-eval", { entityId: ctx.params.studentId, flagId: ctx.params.flagId, variantId: data.variantID }, "$kinesis");
					this.broker.emit("flagr-eval", { id: `${ctx.params.studentId}-${ctx.params.flagId}`, entityId: ctx.params.studentId, flagId: ctx.params.flagId, variantId: data.variantID }, "$app-config");
					return { variantId: data.variantID, variantAttachment: data.variantAttachment };
				} catch (err) {
					this.logger.error(err);
					return;
				}
			},
		},
	},
	events: {
		"flagr-eval": {
			handler(ctx: Context<any>) {
				return publishRawDE(this.settings.kafkaTopic, ctx.params);
			},
		},
	},
};

export = AppConfigService;
