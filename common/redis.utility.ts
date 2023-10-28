export const redisUtility = {
    addHashField(key, field, payload, ttl?: number) {
        return this.broker.cacher.client.pipeline()
            .hset(key, field, JSON.stringify(payload))
            .expire(key, ttl || this.settings.cacheTTL)
            .exec();
    },
    addMultiHashField(key, data: { [field: string]: any } | any[], ttl?: number) {
        let pipeline = this.broker.cacher.client.pipeline();
        // eslint-disable-next-line guard-for-in
        for (const field in data) {
            pipeline = pipeline.hset(key, field, JSON.stringify(data[field]));
        }
        return pipeline.expire(key, ttl || this.settings.cacheTTL)
            .exec();
    },
    countHashFields(key) {
        return this.broker.cacher.client.hlen(key);
    },
    deleteHashField(key, field) {
        return this.broker.cacher.client.hdel(key, field);
    },
    getAllKeys(pattern) {
        return this.broker.cacher.client.keys(`${pattern}*`);
    },
    deleteKey(key) {
        this.logger.debug("Deleting", key);
        return this.broker.cacher.client.del(key);
    },
    getHashField(key, field) {
        return this.broker.cacher.client.hget(key, field).then((res: string) => JSON.parse(res));
    },
    getMultiHashField(key, fields: string[]) {
        return this.broker.cacher.client.hmget(key, fields).then((res: string[]) => res.map(x => JSON.parse(x)));
    },
    getAllHashFields(key) {
        return this.broker.cacher.client.hgetall(key).then((res: { [field: string]: string }) => {
            // eslint-disable-next-line guard-for-in
            for (const field in res) {
                try {
                    res[field] = JSON.parse(res[field]);
                    // eslint-disable-next-line no-empty
                } catch (e) {
                }
            }
            return res;
        });
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
    async getHashFieldWithPipeline(keys: string[], field) {
        const client = this.broker.cacher.client.pipeline();
        for (const key of keys) {
            client.hget(key, field);
        }
        const cachedData = await client.exec();
        const response = [];
        for (let i = 0; i < cachedData.length; i++) {
            response.push({
                key: keys[i],
                value: typeof (cachedData[i][1]) === "string" ? JSON.parse(cachedData[i][1]) : cachedData[i][1],
            });
        }
        return response;
    },
    setRedisKeyData(key, data, ttl?: number) {
        return this.broker.cacher.client.pipeline()
            .set(key, JSON.stringify(data))
            .expire(key, ttl)
            .exec();
    },
    getRedisKeyData(key) {
        return this.broker.cacher.client.get(key).then((res: string) => JSON.parse(res));
    },
    incrKeyData(key, count, ttl) {
        return this.broker.cacher.client.pipeline()
            .incrby(key, count)
            .expire(key, ttl)
            .exec();
    },
    decrKeyData(key, count, ttl) {
        return this.broker.cacher.client.pipeline()
            .decrby(key, count)
            .expire(key, ttl)
            .exec();
    },
    setNonExistKeyData(key, data, ttl?: number) {
        return this.broker.cacher.client.pipeline()
            .setnx(key, JSON.stringify(data))
            .expire(key, ttl)
            .exec();
    },
};
