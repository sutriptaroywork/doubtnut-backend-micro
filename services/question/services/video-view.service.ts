import { ServiceSchema, Context } from "moleculer";
import Cron from "moleculer-cron";
import Sequelize from "sequelize";
import DbService from "dn-moleculer-db";
import { v4 as uuid } from "uuid";
import { adapter } from "../config";

const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
    studentId: { type: Sequelize.INTEGER({ length: 25 }), allowNull: false },
    questionId: { type: Sequelize.INTEGER({ length: 25 }), allowNull: false },
    answerId: { type: Sequelize.INTEGER({ length: 25 }), allowNull: false },
    videoTime: { type: Sequelize.INTEGER({ length: 25 }), allowNull: false, defaultValue: 0 },
    engageTime: { type: Sequelize.INTEGER({ length: 25 }), allowNull: false, defaultValue: 0 },
    parentId: { type: Sequelize.INTEGER({ length: 11 }) },
    source: { type: Sequelize.STRING({ length: 25 }) },
    viewFrom: { type: Sequelize.STRING({ length: 50 }) }, // If UUID then isBack=1
    referStudentId: { type: Sequelize.INTEGER({ length: 25 }), defaultValue: 0 },
};

const VideoViewService: ServiceSchema = {
    name: "$video-view",
    mixins: [Cron, DbService],
    adapter,
    model: {
        name: "video_view_stats",
        define: modelAttributes,
        options: {
            paranoid: true,
            underscored: false,
            freezeTableName: true,
        },
    },
    settings: {
        rest: "/video-view",
        cacheKeyPrefix: "VIDEO-VIEW",
        cacheTTL: 86400, // 1 day
        lockTTL: 65,
        lockedKey: null,
        timeBuffer: [0, 1],
    },
    dependencies: [],
    // crons: [{
    //     name: "createVideoView",
    //     cronTime: "* * * * *",
    //     async onTick() {
    //         this.logger.info("Starting video view cron");
    //         const serviceName = "$video-view";
    //         const localService = this.getLocalService(serviceName);
    //         if (localService.settings.lockedKey) {
    //             this.logger.info("Video view cron already running");
    //             localService.extendLock(localService.settings.lockedKey);
    //             return;
    //         }
    //         const skipKeys = localService.settings.timeBuffer.map((x: number) => localService.generateHashKey(x));
    //         const keys = (await localService.getAllKeys()).filter((x: string) => !skipKeys.includes(x)).sort((a: number, b: number) => (a > b ? 1 : -1));
    //         this.logger.info(keys.length, "key(s) to be processed");
    //         for (const key of keys) {
    //             if (!(await localService.lockKey(key))) {
    //                 this.logger.warn("Unable to lock", key);
    //                 continue;
    //             }
    //             localService.settings.lockedKey = key;

    //             // #region locked hash
    //             this.logger.info("Processing: ", key);
    //             const records = await localService.getAllFields(key);
    //             this.logger.info("Total:", records.length);
    //             try {
    //                 await localService.bulkUpsert(records);
    //                 localService.deleteKey(key);
    //             } catch (e) {
    //                 this.logger.error(e);
    //             }
    //             // #endregion

    //             localService.settings.lockedKey = null;
    //         }
    //     },
    // }],
    actions: {
        put: {
            rest: "PUT /:id?",
            internal: true,
            params: {},
            async handler(ctx: Context<any, { user: any }>) {
                const id = ctx.params.id || uuid();
                this.addHashField(id, { ...ctx.params, id });
                return id;
            },
        },
        patch: {
            rest: "PATCH /:id",
            internal: true,
            params: {},
            async handler(ctx: Context<any, { user: any }>) {
                this.updateHashField(ctx.params.id, ctx.params);
                return ctx.params.id;
            },
        },
    },
    events: {},
    methods: {
        generateHashKey(minutesToSubtract = 0) {
            const d = new Date();
            d.setMinutes(d.getMinutes() - minutesToSubtract);
            return `${this.settings.cacheKeyPrefix}:${d.toISOString().replace(/T/, "|").replace(/\..+/, "").replace(/-/g, "|").replace(":", "|").split(":")[0]}`;
        },
        addHashField(field, payload) {
            const key = this.generateHashKey();
            return this.broker.cacher.client.pipeline()
                .hset(key, field, JSON.stringify(payload))
                .expire(key, this.settings.cacheTTL)
                .exec();
        },
        async updateHashField(field, payload) {
            const prevKey = this.generateHashKey(1);
            const key = this.generateHashKey();
            let data = (await this.getHashField(prevKey, field)) || (await this.getHashField(key, field)) || {};
            data = { ...data, ...payload };
            this.deleteHashField(prevKey, field);
            return this.addHashField(field, data);
        },
        deleteHashField(key, field) {
            return this.broker.cacher.client.hdel(key, field);
        },
        getAllKeys() {
            return this.broker.cacher.client.keys(`${this.settings.cacheKeyPrefix}*`);
        },
        deleteKey(key) {
            this.logger.info("Deleting", key);
            return this.broker.cacher.client.del(key);
        },
        getHashField(key, field) {
            return this.broker.cacher.client.hget(key, field).then((res: string) => JSON.parse(res));
        },
        getAllFields(key) {
            return this.broker.cacher.client.hgetall(key).then((res: { [id: string]: string }) => Object.values(res)).then((obj: string[]) => obj.map((x: string) => JSON.parse(x)));
        },
        async lockKey(key) {
            try {
                await this.broker.cacher.tryLock(key, this.settings.lockTTL * 1000);
                return true;
            } catch (e) {
                return false;
            }
        },
        extendLock(key) {
            return this.broker.cacher.client.expire(`MOL-${key}-lock`, this.settings.lockTTL);
        },
        bulkUpsert(records: any[]) {
            records.forEach(e => {
                e.updatedAt = new Date().toISOString();
            });
            return this.model.bulkCreate(records, {
                updateOnDuplicate: ["videoTime", "engageTime", "updatedAt"],
            });
        },
    },
};

export = VideoViewService;
