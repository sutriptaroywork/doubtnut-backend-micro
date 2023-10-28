import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import moment from "moment";
import {redisUtility} from "../../../../common";
import RequestSignature from "../qwickcilver/request.signature";

const qwickCilverSchema: ServiceSchema = {
    name: "$qwickcilver",
    mixins: [RequestSignature],
    methods: {

        /**
         * To Deactivate Any QwickCilver Voucher
         * @returns {Object} mongo updateOne
         */
        deactivateQwickCilverVoucher(sku: string) {
            try {
                return this.adapter.db.collection(this.settings.voucherCollection).updateOne({
                    sku,
                }, {
                    $set: {
                        is_active: false,
                        is_visible: false,
                    },
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        /**
         * OAuth Verification of QwickCilver with consumerKey, username, password.
         * @returns {Object} authorization code
         */
        async oAuthVerify() {
            try {
                const { data } = await this.settings.AxiosInstance({
                    method: "POST",
                    url: this.settings.qwickCilver.BaseURL + this.settings.qwickCilver.OAuthVerifyURL,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: {
                        clientId: this.settings.qwickCilver.ConsumerKey,
                        username: this.settings.qwickCilver.Username,
                        password: this.settings.qwickCilver.Password,
                    },
                    json: true,
                    timeout: this.settings.qwickCilver.timeout,
                });

                return data;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        /**
         * OAuth Bearer Token of QwickCilver with consumerKey, consumerSecret, authorizationCode.
         * @param {String} authorizationCode Response from oAuthVerify() method
         * @returns {Object} auth token
         */
        async oAuthBearerToken(authorizationCode: string) {
            try {
                const { data } = await this.settings.AxiosInstance({
                    method: "POST",
                    url: this.settings.qwickCilver.BaseURL + this.settings.qwickCilver.OAuthTokenURL,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: {
                        clientId: this.settings.qwickCilver.ConsumerKey,
                        clientSecret: this.settings.qwickCilver.ConsumerSecret,
                        authorizationCode,
                    },
                    json: true,
                    timeout: this.settings.qwickCilver.timeout,
                });

                return data;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        /**
         * This function is used to get QwickCilver Auth Token (Temporarily Stored in Redis with TTL of 5 days)
         * @returns {String} auth token
         */
        async getQwickCilverAuthToken() {
            try {
                let authToken = await redisUtility.getRedisKeyData.call(this, "DNR_QWICKCILVER_AUTH");
                console.log("authToken ", authToken);
                if (_.isNull(authToken)) {
                    const authCode = await this.oAuthVerify();
                    if (authCode && authCode.authorizationCode) {
                        const bearerToken = await this.oAuthBearerToken(authCode.authorizationCode);
                        console.log("bearerToken ", bearerToken);
                        if (bearerToken && bearerToken.token) {
                            authToken = bearerToken.token;
                            // Auth Token expires in 7 days. (For safety we will update token in every 5 days)
                            await redisUtility.setRedisKeyData.call(this, "DNR_QWICKCILVER_AUTH", authToken, this.settings.dailyRedisTTL * 5);
                        }
                    }
                }
                return authToken;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        /**
         * This function is used to refund the dnr, when any voucher redemption fails
         * @returns {Object} mongo insert object
         */
        async instantRefund(studentId: number, refOrderId: any, orderId: string, voucherAmount: number) {
            try {
                await this.confirmOrder(studentId, {status: 30}, orderId);

                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                const walletAmt = await this.addAmountToWallet(studentId, voucherAmount, currTime);
                await this.broker.call("transactions.insert", {
                    transactionData: {
                        student_id: studentId,
                        dnr: voucherAmount,
                        milestone_id: null,
                        voucher_id: null,
                        type: 0,
                        closing_balance: walletAmt,
                        created_at: currTime,
                        ref: "refund",
                        ref_order_id: refOrderId,
                    },
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        /**
         * This function is used to create qwickCilver order
         * @returns {Object} /rest/v3/orders - API response
         */
        async createOrderAPI(ctx: any, refOrderId: any, orderId: string, sku: string, price: number, dnr: number, requestCount: number = 0) {
            try {
                const requestBody = {
                    address: this.settings.orderDeliveryAddress,
                    payments: [{
                            code: "svc", // Credit limit assigned at the platform level
                            amount: price, // Total amount i.e. Price * Quantity
                        }],
                    refno: orderId,
                    products: [{
                            sku,
                            price,
                            qty: 1,
                            currency: 356, // Currency Code for INR
                        }],
                    syncOnly: true,
                    deliveryMode: "API",
                };
                const signature = this.generateRequestSignature("POST", this.settings.qwickCilver.BaseURL + this.settings.qwickCilver.createOrdersPath, requestBody);
                const bearerToken = await this.getQwickCilverAuthToken();

                const { data } = await this.settings.AxiosInstance({
                    method: "POST",
                    url: this.settings.qwickCilver.BaseURL + this.settings.qwickCilver.createOrdersPath,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${bearerToken}`,
                        "dateAtClient": moment().toISOString(),
                        signature,
                    },
                    data: requestBody,
                    json: true,
                    timeout: this.settings.qwickCilver.timeout,
                });

                return data;
            } catch (e) {
                this.logger.error(e);
                if (e && e.response && e.response.data && _.isNumber(e.response.data.code)) {
                    if (e.response.data.code === 401 && e.response.data.message === "oauth_problem=token_rejected" && requestCount < 3) {
                        console.log("OAuth Request Failed ", requestCount);
                        // delete older redis auth token
                        await redisUtility.deleteKey.call(this, "DNR_QWICKCILVER_AUTH");
                        return this.createOrderAPI(ctx, refOrderId, orderId, sku, price, dnr, ++requestCount);
                    } else if ([5307, 5338, 5310, 6000, 5318].includes(e.response.data.code)) {
                        await this.deactivateQwickCilverVoucher(sku);
                    }
                    this.sendAlertMessage(`qwickcilver createOrderAPI sku-${sku}`, JSON.stringify(e.response.data));
                    await this.instantRefund(ctx.meta.user.student_id, refOrderId, orderId, dnr);
                    await redisUtility.decrKeyData.call(this, `DNR_VOUCHER_COUNT_${ctx.meta.user.student_id}`, 1, this.getTodayEndTime());
                }
                return null;
            }
        },

        /**
         * This function is used to redeem qwickcilver vouchers
         * @returns {Object} redeem voucher page response
         */
        async redeemQwickcilverVouchers(ctx: any, voucherData: any, userTotalDNR: number, orderId: string) {
            try {
                let voucherResponse = null;
                const data = {
                    studentId: ctx.meta.user.student_id,
                    versionCode: parseInt(ctx.meta.versionCode, 10),
                    voucherId: ctx.params.voucher_id,
                    product_guid: voucherData.product_guid,
                    brand: voucherData.brand,
                    brandLogo: voucherData.brand_logo,
                    expiryDate: null,
                    vendor: voucherData.vendor,
                    orderId,
                    rewardType: "coupon",
                    reward_amount: 0,
                    voucherAmount: voucherData.dnr,
                    couponCode: null,
                    voucherPin: null,
                };
                const initiateOrderData = await this.initiateOrder(data);
                const refOrderId = initiateOrderData ? initiateOrderData.insertedId : null;

                const qwickCilverRequest = await this.createOrderAPI(ctx, refOrderId, orderId, voucherData.sku, voucherData.voucher_price, voucherData.dnr);
                console.log("qwickCilverRequest ", JSON.stringify(qwickCilverRequest));
                if (qwickCilverRequest) {
                    if (qwickCilverRequest.status === "COMPLETE" && qwickCilverRequest.cards.length) {
                        let voucherExpiry = null;
                        if (ctx.params.reward_type === "daily_streak") {
                            // if daily streak - keeping expiry of 3 days
                            voucherExpiry = moment().add(3, "days").endOf("day").add(5, "hours").add(30, "minutes").toDate();
                        } else {
                            voucherExpiry = moment(qwickCilverRequest.cards[0].validity).add(5, "hours").add(30, "minutes").toDate();
                        }
                        const finalVoucherData = {
                            expiry_date: voucherExpiry,
                            coupon_code: qwickCilverRequest.cards[0].cardNumber,
                            voucher_no: qwickCilverRequest.orderId,
                            voucher_pin: qwickCilverRequest.cards[0].cardPin,
                            voucher_name: qwickCilverRequest.cards[0].productName,
                            activation_code: qwickCilverRequest.cards[0].activationCode,
                            activation_url: qwickCilverRequest.cards[0].activationUrl,
                            status: 20,
                        };
                        await this.confirmOrder(ctx.meta.user.student_id, finalVoucherData, orderId);

                        voucherResponse = this.redeemVoucherPage(ctx, voucherData, finalVoucherData, userTotalDNR, orderId);
                        await redisUtility.deleteHashField.call(this, ctx.meta.user.student_id, "DNR_PENDING_REDEEM");
                    } else if (qwickCilverRequest.status === "PROCESSING") {
                        // can use SQS + Lambda function instead of cron
                        const finalVoucherData = {
                            status: 10,
                        };
                        await this.confirmOrder(ctx.meta.user.student_id, finalVoucherData, orderId);
                        voucherResponse = this.redeemVoucherPage(ctx, voucherData, finalVoucherData, userTotalDNR, orderId);
                    } else {
                        await this.instantRefund(ctx.meta.user.student_id, refOrderId, orderId, voucherData.dnr);
                        await this.deactivateQwickCilverVoucher(voucherData.sku);
                        await redisUtility.decrKeyData.call(this, `DNR_VOUCHER_COUNT_${ctx.meta.user.student_id}`, 1, this.getTodayEndTime());
                    }
                }
                return voucherResponse;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        /**
         * Testing API for getting categories from qwickCilver
         * @returns {Object} category API response
         */
        async categoryAPI() {
            try {
                const bearerToken = await this.getQwickCilverAuthToken();
                const signature = this.generateRequestSignature("GET", this.settings.qwickCilver.BaseURL + this.settings.qwickCilver.categoryPath);

                const { data } = await this.settings.AxiosInstance({
                    method: "GET",
                    url: this.settings.qwickCilver.BaseURL + this.settings.qwickCilver.categoryPath,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${bearerToken}`,
                        "dateAtClient": moment().toISOString(),
                        signature,
                    },
                    json: true,
                    timeout: this.settings.qwickCilver.timeout,
                });

                return data;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        /**
         * Testing API for getting product list from qwickCilver
         * @returns {Object} /rest/v3/catalog/categories/121/products API response
         */
        async productListAPI() {
            try {
                const bearerToken = await this.getQwickCilverAuthToken();
                const signature = this.generateRequestSignature("GET", this.settings.qwickCilver.BaseURL + this.settings.qwickCilver.productListPath);

                const { data } = await this.settings.AxiosInstance({
                    method: "GET",
                    url: this.settings.qwickCilver.BaseURL + this.settings.qwickCilver.productListPath,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${bearerToken}`,
                        "dateAtClient": moment().toISOString(),
                        signature,
                    },
                    json: true,
                    timeout: this.settings.qwickCilver.timeout,
                });

                return data;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        /**
         * Testing API for getting product data from qwickCilver based on sku
         * @returns {Object} /rest/v3/catalog/products/{sku} API response
         */
        async productAPI(sku: string) {
            try {
                const bearerToken = await this.getQwickCilverAuthToken();
                const signature = this.generateRequestSignature("GET", this.settings.qwickCilver.BaseURL + this.settings.qwickCilver.productPath + sku);

                const { data } = await this.settings.AxiosInstance({
                    method: "GET",
                    url: this.settings.qwickCilver.BaseURL + this.settings.qwickCilver.productPath + sku,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${bearerToken}`,
                        "dateAtClient": moment().toISOString(),
                        signature,
                    },
                    json: true,
                    timeout: this.settings.qwickCilver.timeout,
                });

                return data;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async qwickCilverTesting(ctx: any) {
            try {
                const category = await this.categoryAPI();
                const productList = await this.productListAPI();
                const product = await this.productAPI("CNPIN");

                return {category, productList, product};
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = qwickCilverSchema;
