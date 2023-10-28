import request from "request";
import moment from "moment";
import {walletMysql} from "./wallet.mysql";

const bufferObj = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`, "utf8");
const base64String = bufferObj.toString("base64");

export const walletUtil = {

    quotesEscape(str: string) {
        return str.replace(/'/g, "\\'").replace(/"/g, '\\"').trim();
    },

    toIST()
    {
        return moment().add(5, "hours").add(30, "minutes");
    },

    responseTemplate(){
            return {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: { },
            };
        },

    metaSomethingWentWrong(){
        return {
            code : "E000",
        success: false,
        message: "something went wrong!",

        };
    },
    metaCouponNotFound(){
        return {
            code : "E001",
        success: false,
        message: "coupon not found!",
        };
    },
    metaCouponUsed(){
        return {
            code : "E002",
        success: false,
        message: "payment already done against this coupon code/coupon already used",
        };
    },
    metaCouponExpired(){
        return {
            code : "E003",
        success: false,
        message: "coupon expired",
        };
    },
    bbpsBillNotFound() {
        return {
            statusCode: "NP050",
            statusDesc: "bill-not-found",
            success: false,
        };
    },

    bbpsBillAlreadyFulfilled() {
        return {
            statusCode: "NP051",
            statusDesc: "bill-not-found",
            success: false,
        };
    },

    bbpsBillerDown() {
        return {
            statusCode: "NP054",
            statusDesc: "biller-down",
            success: false,
        };
    },

    bbpsPaymentConfirm() {
        return {
            data: {
            additionalInfo: {
                platformBillID: "a",
            },
            receipt: {
                date: "2021-03-10T12:09:51+05:30",
                id: "",
            },
        },
            status: 200,
            success: true,
        };
    },
    NEWTON_URL: "https://micro.doubtnut.com/newton/notification/send",
    SMS_KEY: process.env.TWO_FA_KEY,

    async sendSMS(template_name, var_array, phone) {
        let url = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${this.SMS_KEY}&to=${phone}&from=DOUBTN&templatename=${template_name}&`;
        let var_string = "";
        for (let i = 0; i < var_array.length; i++) {
            var_string += `var${i + 1}=${encodeURI(var_array[i])}&`;
        }
        url += var_string;
        // console.log(url);
        const options = {
            method: "GET",
            url,
        };
        // console.log("SMS", options);
        request(options, (error, response) => {
            if (error) { throw new Error(error); }
            console.log(response.body);
        });
    },
    async sendNotification(user, notificationInfo, broker){
        const studentId = [];
        const gcmRegistrationId = [];
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < user.length; i++) {
            studentId.push(user[i].id);
            gcmRegistrationId.push(user[i].gcmId);
        }
        await broker.emit("sendNotification", {
            studentId,
            gcmRegistrationId,
            notificationInfo,
            topic: "micro.push.notification",
        }, "newton");
    },
    // eslint-disable-next-line max-lines-per-function
    async adjustWallet(db, student_id) {

        const reconStatus = await walletMysql.getWalletStatusRecon(db, student_id);
        if (reconStatus.length === 0)
        {
            await walletMysql.setWalletStatusRecon(db, student_id, "STARTED");


            const total_reward_amount = 0; const total_cash_amount = 0; let cash_balance_post_transaction = 0; let reward_balance_post_transaction = 0;
            try {

                const wtList = await walletMysql.getWalletTxn(db, student_id);

                if (wtList.length === 0)
                {
                    walletMysql.updateWalletStatusRecon(db, wtList[0].student_id, "COMPLETE");
                    return;
                }


                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let i = 0; i < wtList.length; i++)
                {

                    const wt = wtList[i];

                    if (wt.amount == null) {continue;}
                    else if (wt.amount >= 0) {
                        // eslint-disable-next-line eqeqeq
                        if (wt.type == "CREDIT") {
                            // eslint-disable-next-line eqeqeq
                            if (wt.reason == "add_wallet_payment") {
                                cash_balance_post_transaction += +wt.amount;
                                await walletMysql.updateWT(db, {
                                    id: wt.id,
                                    cash_amount: wt.amount,
                                    reward_amount: 0,
                                    cash_balance_post_transaction,
                                    reward_balance_post_transaction,
                                });
                            } else {
                                reward_balance_post_transaction += +wt.amount;
                                await walletMysql.updateWT(db,  {
                                    id: wt.id,
                                    cash_amount: 0,
                                    reward_amount: wt.amount,
                                    cash_balance_post_transaction,
                                    reward_balance_post_transaction,
                                });
                            }
                            // eslint-disable-next-line eqeqeq
                        } else if (wt.type == "DEBIT") {
                            // if only cash balance can be used for the txn
                            if (cash_balance_post_transaction >= wt.amount) {
                                const cash_amount = wt.amount;
                                cash_balance_post_transaction -= wt.amount;
                                await walletMysql.updateWT(db, {
                                    id: wt.id,
                                    cash_amount,
                                    reward_amount: 0,
                                    cash_balance_post_transaction,
                                    reward_balance_post_transaction,
                                });
                            }

                            // cash balance can be partly used, check if reward balance can fulfill otherwise log the error;
                            else if (wt.amount >= cash_balance_post_transaction) {
                                const cash_amount = cash_balance_post_transaction;
                                const reward_amount = wt.amount - cash_amount;

                                cash_balance_post_transaction = 0;

                                if (reward_amount > reward_balance_post_transaction) { // should not have happened
                                    console.log("error", wt);
                                    await walletMysql.updateWalletStatusRecon(db, wt.student_id, "ERROR");
                                    throw Error("error");
                                } else {
                                    reward_balance_post_transaction -= reward_amount;
                                    await walletMysql.updateWT(db, {
                                        id: wt.id,
                                        cash_amount,
                                        reward_amount,
                                        cash_balance_post_transaction,
                                        reward_balance_post_transaction,
                                    });
                                }
                            }
                        }
                    }
                    else {
                        await walletMysql.updateWalletStatusRecon(db, wt.student_id, "ERROR");
                        throw Error("error");
                    }
                }

                console.log("student_summary", wtList[0].student_id, cash_balance_post_transaction, reward_balance_post_transaction);
                await walletMysql.updateWalletSummaryRecon(db, wtList[0].student_id, cash_balance_post_transaction, reward_balance_post_transaction);
                walletMysql.updateWalletStatusRecon(db, wtList[0].student_id, "COMPLETE");

            }
            catch (e)
            {
                console.log("catch error", e);
            }

        }
    },
    async createVPA(obj){
        // eslint-disable-next-line id-blacklist
        const payload: any = {
            method: "post",
            url: "https://api.razorpay.com/v1/virtual_accounts",
            headers: {
                "Authorization": `Basic ${base64String}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                receivers: {
                    types: [
                        "bank_account",
                        // "vpa",
                    ],
                    // vpa: {
                    //     descriptor: `91${obj.mobile}`,
                    // },
                },
                description: obj.description,
            }),
        };

        return new Promise((res, rej) => {
            request(payload, (error, response, body) => {
                if (error) {
                    console.log(error);
                    rej(error);
                }
                console.log(body);
                res(body);
            });
        });
    },

};


