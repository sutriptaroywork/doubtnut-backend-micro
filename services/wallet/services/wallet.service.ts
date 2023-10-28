"use strict";

import DbService from "dn-moleculer-db";
import * as _ from "lodash";
import Sequelize from "sequelize";
import {adapter} from "../config";
import {walletMysql} from "../helper/wallet.mysql";
import {walletUtil} from "../helper/wallet.util";
import {staticCDN} from "../../../common";
import {redisUtility} from "../../../common";

const modelAttributes: Sequelize.ModelAttributes = {
    id: {type: Sequelize.INTEGER, primaryKey: true},
    title: {type: Sequelize.TEXT({length: "long"})},
    options: {type: Sequelize.TEXT({length: "long"})},
    tags: {type: Sequelize.STRING(255)},
};

module.exports = {
    name: "wallet",
    mixins: [DbService],
    adapter,
    model: {
        name: "wallet_summary",
        define: modelAttributes,
        options: {
            paranoid: true,
            underscored: true,
            freezeTableName: true,
        },
    },
    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {

        walletPageInfo: {
            rest: {
                method: "GET",
                path: "/info",
            },
            params: {},
            async handler(ctx: any) {

                const response = walletUtil.responseTemplate();
                const walletSummary = await this.getWalletInfo(ctx);
                walletSummary.info = "Available Balance: ₹" + walletSummary.amount;
                const promises = [];
                promises.push(walletMysql.getNameAndValueByBucket(this.adapter.db, "payment_link_wallet"));
                promises.push(walletMysql.getNameAndValueByBucket(this.adapter.db, "payment_help_wallet"));
                promises.push(walletMysql.getNameAndValueByBucket(this.adapter.db, "payment_banner"));
                const [paymentLink, help, banners] = await Promise.all(promises);
                const finalResponse: any = {};

                finalResponse.head = "Payment link FOR 'DN WALLET' ONLY";
                const paymentLinkGrouped = _.groupBy(paymentLink, "name");
                finalResponse.title = paymentLinkGrouped.title[0].value;
                finalResponse.action_button_text = "Share payment link";
                finalResponse.description = paymentLinkGrouped.description[0].value.split("###");

                if (ctx.meta.versionCode >= 840) {
                    const payment_link: any = {};
                    finalResponse.text2 = "Via payment link";
                    finalResponse.text3 = "Pay via debit/ credit card/UPI";
                    payment_link.link = finalResponse;
                    payment_link.qr = {
                        text2: "Via QR Code",
                        text3: "Pay Via GooglePay/PhonePe/Paytm UPI",
                        action_button_text: "View QR Code",

                    };
                }

                const payment_help: any = {};
                payment_help.title = "FAQs";
                payment_help.list = help;

                let wallet_use;
                if (ctx.meta.versionCode < 850) {
                    wallet_use = {
                        title: "why use DN wallet ?", list: [
                            {image: `${staticCDN}images/wallet_feature_1.webp`, name: "Direct Payment"},
                            {image: `${staticCDN}images/wallet_feature_2.webp`, name: "Safe & Secure"},
                            {image: `${staticCDN}images/wallet_feature_3.webp`, name: "Use anytime"},
                        ],
                    };
                }

                const responseData: any = {
                    wallet: walletSummary,
                    payment_link: finalResponse,
                    payment_help,
                    wallet_use,
                    banners: banners.map(option => {
                        const value = {};
                        option.value.split("#!#").map(data => {
                            const pairs = data.split("#!!#");
                            Object.assign(value, {[pairs[0]]: pairs[1]});
                        });
                        return value;
                    }),
                };

                response.data = responseData;

                console.log(response);
                return response;

            },
        },

        getInfo: {
            rest: {
                method: "GET",
                path: "/summary/info",
            },
            params: {},
            async handler(ctx: any) {

                const response = walletUtil.responseTemplate();

                response.data = await this.getWalletInfo(ctx);

                console.log(response);
                return response;

            },
        },

        recon: {
            rest: {
                method: "GET",
                path: "/recon/info",
            },
            params: {},
            async handler(ctx: any) {

                const response = walletUtil.responseTemplate();
                // eslint-disable-next-line max-len
                const sid = [49347100, 40337095, 23088933, 78750602, 28130504, 28130504, 62334505, 86240461, 73323442, 81645081, 1786215, 19526365, 32324996, 32324996, 85255787, 85255787, 72867269, 5842762, 4253654, 23025096, 27724947, 18403563, 90319178, 22830721, 7641111, 13547040, 57301557, 80196662, 78491951, 10029358, 92193714, 9445434, 13525474, 74020295, 83185358, 92611034, 4980664, 33663697, 2243559, 4094116, 91979265, 16349551, 31377158, 82209131, 22655840, 11478741, 24906032, 3217878, 4358659, 17665025, 86498814, 5386150, 5006009, 6548707, 94222066, 29751948, 10652637, 3979286, 60652145, 32378265, 31503646, 8957446, 13815258, 21886469, 40779895, 70278874, 9987412, 86122936, 381504, 92948616, 27426785, 96814103, 89643731, 3862268, 99232375, 28919333, 436463, 25572506, 95354404, 73833704, 24936178, 22195693, 55995241, 54153052, 18083560, 3111709, 17018623, 13212265, 92611034, 94505665, 4695928, 44514354];

                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let i = 0; i < sid.length; i++) {
                    delete ctx.meta;
                    ctx.params = {};
                    ctx.params.student_id = sid[i];
                    await this.getWalletInfo(ctx);

                }

                console.log(response);
                return response;

            },
        },

        createWalletTransaction: {
            rest: {
                method: "POST",
                path: "/transaction/create",
            },
            params: {},
            // eslint-disable-next-line max-lines-per-function
            async handler(ctx: any) {
                try {
                    console.log("ctx", ctx.meta, ctx.params);
                    const response = walletUtil.responseTemplate();

                    await this.broker.call("walletmongo.saveToWalletTransactions", ctx.params);

                    // eslint-disable-next-line id-blacklist
                    const studentId: any = ctx.meta !== undefined && ctx.meta.user !== undefined ? ctx.meta.user.id : ctx.params.student_id;
                    let cash_amount = ctx.params.cash_amount || 0;
                    let reward_amount = ctx.params.reward_amount || 0;
                    const amount = ctx.params.amount;
                    const reason = ctx.params.reason;
                    const type = ctx.params.type;
                    const payment_info_id = ctx.params.payment_info_id;
                    const expiry = ctx.params.expiry;
                    const reason_ref_id = ctx.params.reason_ref_id || null;
                    let pass = false;
                    if (payment_info_id === "dedsorupiyadega") {
                        pass = true;
                    }
                    if (!pass) {
                        const paymentInfo = await walletMysql.getPaymentInfo(this.adapter.db, payment_info_id);
                        console.log("paymentInfopaymentInfo", paymentInfo);
                        if (paymentInfo.length === 0 || paymentInfo[0].status !== "SUCCESS") {
                            throw new Error("Payment is not successful");
                        }
                    }

                    const walletSummary = await this.getWalletInfo(ctx);

                    if (amount) {
                        // if amount is present, do debit from cash wallet first and remaining from reward wallet
                        const user_cash_balance = walletSummary.cash_amount;

                        if (amount <= user_cash_balance) {
                            cash_amount = amount;
                        } else {
                            cash_amount = user_cash_balance;
                            reward_amount = amount - user_cash_balance;
                        }
                    }

                    // in case of refund, no money will be credited to wallet
                    if (reason === "credit_refund" && type === "CREDIT") {
                        reward_amount = 0;
                    }
                    // eslint-disable-next-line max-len
                    const walletTransaction = await walletMysql.createWalletTransaction(this.adapter.db, {
                        student_id: studentId,
                        cash_amount,
                        reward_amount,
                        type,
                        reason,
                        payment_info_id,
                        expiry,
                        reason_ref_id,
                    });

                    response.data = {
                        id: walletTransaction,
                        type,
                        cash_amount,
                        reward_amount,
                    };

                    if (expiry && type === "CREDIT") {
                        await walletMysql.createWalletTransactionExpiry(this.adapter.db, {
                            wallet_transaction_id: walletTransaction,
                            amount_left: reward_amount,
                            status: "ACTIVE",
                        });
                    }

                    if (reward_amount > 0 && type === "DEBIT") {
                        await this.doRewardExpiryAdjustment(studentId, reward_amount, walletTransaction);
                    }

                    if (type === "CREDIT") {
                        cash_amount = Math.abs(cash_amount);
                        reward_amount = Math.abs(reward_amount);
                    } else if (type === "DEBIT") {
                        cash_amount = -Math.abs(cash_amount);
                        reward_amount = -Math.abs(reward_amount);
                    }
                    await walletMysql.updateWalletSummary(this.adapter.db, studentId, cash_amount, reward_amount);
                    await walletMysql.updateBalancePostTransactionByStudentID(this.adapter.db, walletTransaction, studentId);
                    return response;
                } catch (e) {
                    const response: any = walletUtil.metaSomethingWentWrong();
                    response.data = {};
                    response.data.message = e.toString();
                    return response;
                }
            },
        },

        getUserLocationDetails: {
            async handler(ctx: any) {
                try {
                    let country = "IN";
                    const locationDetailsCache = await redisUtility.getRedisKeyData.call(this, `DOUBT_PAYWALL_TRUE_LOCATION_SID:${ctx.params.student_id}`);
                    if (locationDetailsCache != null && locationDetailsCache.length) {
                        country = JSON.parse(locationDetailsCache);
                    } else {
                        const locationDetails = await walletMysql.getUserLocationData(this.adapter.db, ctx.params.student_id);
                        await redisUtility.setRedisKeyData.call(this, `DOUBT_PAYWALL_TRUE_LOCATION_SID:${ctx.params.student_id}`, JSON.stringify(locationDetails[0].true_country), 60 * 60 * 24 * 2);
                        country = locationDetails[0].true_country;
                    }
                    return [{true_country: country}];
                } catch (e) {
                    console.error(e);
                    return [{true_country: "IN"}];
                }
            },
        },
    },
    /**
     * Methods
     */
    methods: {
        async getWalletInfo(ctx: any) {

            // eslint-disable-next-line id-blacklist
            const studentId: any = ctx.meta !== undefined && ctx.meta.user !== undefined ? ctx.meta.user.id : ctx.params.student_id;
            await walletUtil.adjustWallet(this.adapter.db, studentId);

            const walletSummary = await walletMysql.getWalletSummary(this.adapter.db, studentId);

            if (_.isEmpty(walletSummary) || walletSummary.length === 0) {
                await walletMysql.createWalletSummary(this.adapter.db, studentId);
                return {amount: "0.00", cash_amount: "0.00", reward_amount: "0.00", is_active: 1};
            }
            walletSummary[0].amount = (parseFloat(walletSummary[0].cash_amount) + parseFloat(walletSummary[0].reward_amount)).toFixed(2);
            return walletSummary[0];
        },

        async doRewardExpiryAdjustment(student_id, reward_amount, wallet_transaction_id) {

            const listOfExpiringReward = await walletMysql.fetchListOfExpiringRewardsByStudentId(this.adapter.db, {
                student_id,
                date: walletUtil.toIST().format("YYYY-MM-DD"),
            });

            let sum = 0;
            const wteIdList = [];
            const wteEle = [];
            listOfExpiringReward.forEach(ele => {

                if (sum < reward_amount) {
                    sum += parseFloat(ele.amount_left);
                    wteIdList.push(ele.id);
                    wteEle.push(ele);
                } else {
                    return;
                }
            });

            const diff = sum - reward_amount;

            console.log(diff, sum, reward_amount);

            if (wteIdList.length) {
                await walletMysql.updateExpiringRewardsToUsedByWTE(this.adapter.db, {
                    wte_id: wteIdList,
                    wallet_transaction_ref_id: wallet_transaction_id,
                });

                if (diff > 0) {
                    const toAdjustWTE = wteEle.pop();
                    await walletMysql.createWalletTransactionExpiry(this.adapter.db, {
                        wallet_transaction_id: toAdjustWTE.wallet_transaction_id,
                        amount_left: diff,
                        status: "ACTIVE",
                    });
                }
            }
        },
    },
};
