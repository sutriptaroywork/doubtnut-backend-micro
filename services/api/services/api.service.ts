import { ServiceSchema, Context } from "moleculer";
import ApiGateway from "moleculer-web";

const ApiService: ServiceSchema = {
	name: "api",

	mixins: [ApiGateway],

	// More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
	settings: {
		// Exposed port
		port: process.env.PORT || 3000,

		// Exposed IP
		ip: "0.0.0.0",

		// Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
		use: [],
		cors: {
			// Configures the Access-Control-Allow-Origin CORS header.
			origin: "*",
			// Configures the Access-Control-Allow-Methods CORS header.
			methods: ["GET", "OPTIONS", "POST", "PUT"],
			// Configures the Access-Control-Allow-Headers CORS header.
			allowedHeaders: ["X-ACCESS_TOKEN", "Access-Control-Allow-Origin", "Authorization", "Origin", "x-requested-with", "Content-Type", "Content-Range", "Content-Disposition", "Content-Description", "x-forwarded-for", "x-auth-token"],
			// Configures the Access-Control-Expose-Headers CORS header.
			exposedHeaders: ["dn-x-auth-token", "dn-x-auth-refresh-token"],
			// Configures the Access-Control-Allow-Credentials CORS header.
			credentials: true,
			// Configures the Access-Control-Max-Age CORS header.
			maxAge: 3600,
		},
		routes: [
			{
				path: "/api",

				whitelist: ["**"],

				// Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
				use: [],

				// Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
				mergeParams: true,

				// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
				authentication: true,

				// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
				authorization: true,

				// The auto-alias feature allows you to declare your route alias directly in your services.
				// The gateway will dynamically build the full routes from service schema.
				autoAliases: true,

				aliases: {

				},

				/**
				 * Before call hook. You can check the request.
				 * @param {Context} ctx
				 * @param {Object} route
				 * @param {IncomingRequest} req
				 * @param {ServerResponse} res
				 * @param {Object} data
				 *
				 * */
				onBeforeCall(ctx: Context<any, any>, route: any, req: any, res: any) {
					// Set request headers to context meta
					ctx.meta.userAgent = req.headers["user-agent"];
					ctx.meta.versionCode = req.headers.version_code;
					ctx.meta.packageName = req.headers.package_name || "default";
					ctx.meta.host = req.headers.host;
					ctx.meta.xAuthToken = req.headers["x-auth-token"] || req.headers.authorization;
					ctx.meta.country = (req.headers.country as string || "IN").toUpperCase();
					this.logger.debug(ctx.meta);
				},

				/**
				 * After call hook. You can modify the data.
				 * @param {Context} ctx
				 * @param {Object} route
				 * @param {IncomingRequest} req
				 * @param {ServerResponse} res
				 * @param {Object} data
				onAfterCall(ctx, route, req, res, data) {
					// Async function which return with Promise
					return doSomething(ctx, res, data);
				}, */

				// Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
				callingOptions: {},

				bodyParsers: {
					json: {
						strict: false,
						limit: "1MB",
					},
					urlencoded: {
						extended: true,
						limit: "1MB",
					},
				},

				// Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
				mappingPolicy: "all", // Available values: "all", "restrict"

				// Enable/disable logging
				logging: true,
			},
			{
				path: "/",

				whitelist: [
					"*health.*",
					"$gupshup.webhook",
					"$gupshup.dlr",
					"$netcore.webhook",
					"$telegram.webhook",
					"$sendPdf.getPdf",
					"liveclass.quizPush",
					"liveclass.pollsList",
					"liveclass.pollPush",
					"liveclass.pollResult",
					"liveclass.pollResultWithResponses",
					"liveclass.broadcastList",
					"liveclass.broadcastPush",
					"liveclass.quizResult",
					"liveclass.quizResultWithResponses",
					"liveclass.getFeedback",
					"liveclass.pollsByDetailID",
					"liveclass.infoByDetailId",
					"liveclasscomment.panelInsert",
					"liveclasscomment.getInfoForPanel",
					"liveclasscomment.getAdminCommentsConfig",
					"liveclass-socket.insert",
					"wallet.createWalletTransaction",
					"games.getScoreList",
					"games.processScoreV2",
					"$2fa.dlr",
					"$vf.dlr",
					"$gupshup-otp.dlr",
					"apb.generateCoupon",
					"apb.fetchCouponDetails",
					"apb.paymentConfirmation",
					"$otp.sendCall",
					"bbps.generateToken",
					"bbps.fetchBillInfo",
					"bbps.paymentConfirmation",
					"$whatsapp-crm-lead-agent-mapping.login",
					"invoice.createInvoice",
					"liveclass-cdc.course-resource-mapping",
					"liveclass-cdc.course-details",
					"liveclass-cdc.course-resources",
					"liveclass-course.getFutureData",
					"liveclass-course.getResourcesByAssortmentList",
					"liveclass-course.getPastData",
					"liveclass-course.getAssortmentsByResourceReference",
				],

				// Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
				use: [],

				// Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
				mergeParams: true,

				// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
				authentication: false,

				// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
				authorization: false,

				bodyParsers: {
					json: {
						strict: false,
						limit: "1MB",
					},
					urlencoded: {
						extended: true,
						limit: "1MB",
					},
				},

				// Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
				mappingPolicy: "all", // Available values: "all", "restrict"

				// Enable/disable logging
				logging: true,

				autoAliases: true,

				/**
				 * Before call hook. You can check the request.
				 * @param {Context} ctx
				 * @param {Object} route
				 * @param {IncomingRequest} req
				 * @param {ServerResponse} res
				 * @param {Object} data
				 *
				 * */
				onBeforeCall(ctx: Context<any, any>, route: any, req: any, res: any) {
					// Set request headers to context meta
					ctx.meta.userAgent = req.headers["user-agent"];
					ctx.meta.versionCode = req.headers.version_code;
 					ctx.meta.packageName = req.headers.package_name || "default";
					ctx.meta.host = req.headers.host;
					ctx.meta.apiKey = req.headers["api-key"];
					ctx.meta.bbpsToken = req.headers.token;
					ctx.meta.country = (req.headers.country as string || "IN").toUpperCase();
					this.logger.debug(ctx.meta);
				},
			},
		],

		// Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
		log4XXResponses: false,
		// Logging the request parameters. Set to any log level to enable it. E.g. "info"
		logRequestParams: null,
		// Logging the response data. Set to any log level to enable it. E.g. "info"
		logResponseData: null,


		// Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
		assets: {
			folder: "public",

			// Options to `server-static` module
			options: {},
		},
	},

	actions: {
		listAliases: {
			visibility: process.env.INTERNAL === "true" ? "published" : "public",
		},
	},

	methods: {

		/**
		 * Authenticate the request. It check the `Authorization` token value in the request header.
		 * Check the token value & resolve the user by the token.
		 * The resolved user will be available in `ctx.meta.user`
		 *
		 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		async authenticate(ctx, route, req) {
			const auth = req.headers["x-auth-token"] || req.headers.authorization;
			const token = auth && (auth.startsWith("Bearer") || auth.startsWith("bearer")) ? auth.slice(7) : auth;
			const refreshToken = req.headers["x-auth-refresh-token"];
			if (!(token || refreshToken)) {
				if (process.env.INTERNAL === "true") {
					return;
				}
				throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN, req.headers);
			}
			const student = await ctx.call("$student.verify", { token, refreshToken });
			if (student) {
				return student;
			}
			if (process.env.INTERNAL === "true") {
				return;
			}
			// Invalid token
			throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, req.headers);
		},

		/**
		 * Authorize the request. Check that the authenticated user has right to access the resource.
		 *
		 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		authorize: async (ctx, route, req) => {
			// Get the authenticated user.
			const user = ctx.meta.user;

			// It check the `auth` property in action schema.
			if (req.$action.internal && ((req.headers.host.includes("doubtnut.com") || req.headers.host.includes("doubtnut.app")) && !(req.headers.host.includes("internal.doubtnut.com") || req.headers.host.includes("internal.stg.doubtnut.com")))) {
				throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS", req.headers);
			}
			if (req.$action.auth && !user) {
				throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS", req.headers);
			}
		},

	},
};

export = ApiService;
