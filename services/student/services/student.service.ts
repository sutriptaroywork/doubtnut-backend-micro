import { ServiceSchema, Context } from "moleculer";
import jwt from "jsonwebtoken";
const crypto = require('crypto');

const StudentService: ServiceSchema = {
	name: "$student",
	settings: {
		secrets: {
			jwtSecret: process.env.JWT_SECRET,
			jwtSecretNew: process.env.JWT_SECRET_NEW || process.env.JWT_SECRET,
			jwtSecretRefresh: process.env.JWT_SECRET_REFRESH || process.env.JWT_SECRET_NEW || process.env.JWT_SECRET,
		},
		tokenExpiry: {
			token: process.env.TOKEN_EXPIRY || "7d",
			refresh: process.env.REFRESH_TOKEN_EXPIRY || "90d",
		},
		encrypt: {
			webAuthKey: process.env.WEBAUTHKEY,
			webAuthIv: process.env.WEBAUTHIV,
		},
	},
	dependencies: [],
	actions: {
		sign: {
			params: {
				studentId: "number",
			},
			visibility: "public",
			async handler(ctx: Context<{ studentId: number; role?: string; meta?: { [key: string]: any } }>) {
				return jwt.sign({
					id: ctx.params.studentId,
					role: ctx.params.role,
					...ctx.params.meta,
				}, this.settings.secrets.jwtSecretNew);
			},
		},
		verify: {
			params: {
				token: { type: "string", required: false },
				refreshToken: { type: "string", required: false },
			},
			visibility: "public",
			cache: {
				enabled: true,
				ttl: 3600, // 1 hr
			},
			async handler(ctx: Context<{ token?: string; refreshToken?: string }, any>) {
				if (!(ctx.params.token || ctx.params.refreshToken)) {
					ctx.meta.$statusCode = 401;
					return;
				}
				let payload;
				let regenerate;
				try {
					payload = ctx.params.refreshToken
						? jwt.verify(ctx.params.refreshToken, this.settings.secrets.jwtSecretRefresh, { algorithms: ["HS256"] })
						: jwt.verify(ctx.params.token, this.settings.secrets.jwtSecretNew, { algorithms: ["HS256"] });
				} catch (e) {
					if (e.name === "TokenExpiredError") { // refresh token/token has expired
						ctx.meta.$statusCode = 401;
						return;
					}
					if (e.name === "JsonWebTokenError" && e.message === "invalid signature" && !ctx.params.refreshToken) { // token secret mismatch and refresh token not available
						try {
							payload = jwt.verify(ctx.params.token, this.settings.secrets.jwtSecret, { algorithms: ["HS256"] });
							regenerate = true;
						} catch (e2) {
							ctx.meta.$statusCode = 401;
							return;
						}
					}
				}
				if (!payload || !payload.id) {
					ctx.meta.$statusCode = 401;
					return;
				}
				if (ctx.params.refreshToken || regenerate) {
					const token = jwt.sign({ id: payload.id }, this.settings.secrets.jwtSecretNew, { algorithm: "HS256", expiresIn: this.settings.tokenExpiry.token });
					const refreshToken = jwt.sign({ id: payload.id }, this.settings.secrets.jwtSecretRefresh, { algorithm: "HS256", expiresIn: this.settings.tokenExpiry.refresh });
					ctx.meta.$responseHeaders = {
						"dn-x-auth-token": token,
						"dn-x-auth-refresh-token": refreshToken,
					};
				}
				try {
					switch (payload.role) {
						case "internet-expert":
						case "crm-socket-relay-server":
							const expert: any = await ctx.call("$sync-raw.getInternetExpertById", { id: payload.id });
							return {
								id: expert.id,
								...expert,
							};
						case "student":
						default:
							const student: any = await ctx.call("$sync-student.get", { id: payload.id });
							return {
								id: student.student_id,
								...student,
								class: parseInt(student.student_class, 10),
							};

					}
				} catch (e) {
					ctx.meta.$statusCode = 401;
					return;
				}
			},
		},
		getEncryptedId: {
			params: {
				studentId: "number",
			},
			visibility: "public",
			async handler(ctx: Context<{ studentId: number; meta?: { [key: string]: any }}>) {
				const key = this.settings.encrypt.webAuthKey;
				const iv = this.settings.encrypt.webAuthIv;
				this.logger.debug('###key: ', key, ' iv: ', iv, ' id: ', ctx.params.studentId);
				const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
				let encryptedId = cipher.update(ctx.params.studentId, 'utf8', 'hex');
				encryptedId += cipher.final('hex');
				this.logger.debug('###encrypted Id: ', encryptedId, typeof encryptedId);				
				return encryptedId;
			}
		},
	},
	events: {},
	methods: {},
};

export = StudentService;
