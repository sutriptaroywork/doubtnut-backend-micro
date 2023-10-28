"use strict";

import {type} from "os";
import DbService from "dn-moleculer-db";
import moment from "moment";
import axios from "axios";
import Sequelize from "sequelize";
import { adapter } from "../config";
import {walletMysql} from "../helper/wallet.mysql";
import {walletUtil} from "../helper/wallet.util";

const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.INTEGER, primaryKey: true },
};

module.exports = {
    name: "bbps",
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
    settings: {
        MINIMUM_AMOUNT : 10,
        APB_MINIMUM_AMOUNT : 300,
        AIRTEL_BANKS_URL : "https://www.airtelbank.com/banklocator/cms/retailers",
        SMS_URL: "https://2factor.in/API/R1/?module=TRANS_SMS&apikey=",
        SMS_KEY: process.env.TWO_FA_KEY,
        WALLET_ADD_SMS_TEMPLATE: "wallet_add_success",
        NOTIFICATION_TEMPLATE : {
            title: "SUCCESS! ₹<amount> aapke wallet me add hogaye he!",
            message: "Now buy in seconds using DN Wallet",
            event: "wallet",
            firebase_eventtag : "user_journey",
        },
        NEWTON_URL: "https://micro.doubtnut.com/newton/notification/send",
        AIRTEL_HOME_BUCKET: "airtel_payment_home",
        AIRTEL_LOCATION_BUCKET: "airtel_payment_location",
    },
    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {

        generateToken: {
            rest: {
                method: "GET",
                path: "/generate-token",
            },
            params: {},
            async handler(ctx: any) {

                const apiKey = ctx.meta.apiKey;

                if (apiKey && apiKey === process.env.BBPS_KEY) {
                    return {token: process.env.BBPS_TOKEN};
                }
            },
        },

        fetchBillInfo: {
            rest: {
                method: "POST",
                path: "/fetch-bill",
            },
            params: {},
            // eslint-disable-next-line max-lines-per-function
            async handler(ctx: any) {


                // return (await axios.get("https://80b885be691b.ngrok.io/v1/payment/bbps/info")).data;


                const apiKey = ctx.meta.apiKey;
                const token = ctx.meta.bbpsToken;

                if (apiKey && apiKey === process.env.BBPS_KEY && token && token === process.env.BBPS_TOKEN) {
                    const customerIdentifiers = ctx.params.customerIdentifiers;

                    const attributeName = customerIdentifiers[0].attributeName;
                    const attributeValue = customerIdentifiers[0].attributeValue;

                    const response: any = walletUtil.responseTemplate();

                    let course_info = "NA"; let info;

                    try {
                        const phoneNo = attributeValue;
                        const studentInfo = await walletMysql.getStudentByPhone(this.adapter.db, phoneNo);

                        let name; let mobile;
                        if (studentInfo.length === 0)
                        {
                            response.meta = walletUtil.bbpsBillNotFound();
                            return response.meta;
                        }
                        else {
                            // name = ((studentInfo[0].student_fname ? studentInfo[0].student_fname : "NA") + " " + (studentInfo[0].student_lname ? studentInfo[0].student_lname : "NA")).trim().replace(/[^\x20-\x7E]/g, "");
                            name = "Doubtnut User";
                            mobile = studentInfo[0].mobile;
                        }

                        walletMysql.setBbpsAttempt(this.adapter.db, studentInfo[0].student_id);

                        const couponDetails = await walletMysql.fetchBillInfoByVendor(this.adapter.db, mobile, "BBPS");
                        let amountToPay;

                        if (couponDetails.length === 0) {
                            course_info = "Aapne koi course link nahi kara he.";
                            info = "Ye payment aapke DN Wallet me add hogi. Add any amount.";
                            amountToPay = "500";
                        }
                        else {
                            amountToPay = couponDetails[0].amount;
                            if (couponDetails[0].student_email == null) {
                                delete couponDetails[0].student_email;
                            } else {
                                couponDetails[0].email = couponDetails[0].student_email;
                                delete couponDetails[0].student_email;

                            }

                            if (couponDetails[0].variant_id != null)
                            {
                                const packageInfo = await walletMysql.fetchPackageInfoFromVariantId(this.adapter.db, couponDetails[0].variant_id);
                                console.log("packageInfo", packageInfo);
                                if (packageInfo[0].package_name_trans_manual)
                                {
                                    packageInfo[0].package_name = packageInfo[0].package_name_trans_manual;
                                }
                                else if (packageInfo[0].package_name_trans)
                                {
                                    packageInfo[0].package_name = packageInfo[0].package_name_trans;
                                }
                                // eslint-disable-next-line max-len
                                course_info = `${packageInfo[0].package_name} | ${parseInt(String(packageInfo[0].duration_in_days / 30), 10)} Months | Rs.${packageInfo[0].total_amount}`;
                                info = "Buy for Rs." + amountToPay;
                            }

                        }

                        const customerInfo = {
                            name,
                            additionalInfo: {
                                "Mobile Number": mobile,
                                "Course": course_info,
                                "Info": info,
                            },
                        };

                        const billDetails = {
                            billFetchStatus: "AVAILABLE",
                            bills: [{
                                amountExactness: "ANY",
                                additionalInfo: {
                                    "billerID": "DOUB00000NATLJ",
                                    "Mobile Number": mobile,
                                    "Course": course_info,
                                    "Info": info,

                                },
                                billerBillID: phoneNo,
                                generatedOn:moment().subtract(7, "d").utcOffset("+0530").format("YYYY-MM-DDTHH:mm:ssZ"),
                                dueDate:moment().add(2, "d").utcOffset("+0530").endOf("day").format("YYYY-MM-DDTHH:mm:ssZ"),
                                fees: [
                                    {
                                        displayName: "Course Purchase / Wallet Top Up",
                                        description: "Online purchases",
                                        aggregates: {
                                            total: {
                                                currencyCode: "INR",
                                                value: amountToPay,
                                            },
                                        },
                                    },
                                ],
                                customerAccount: {
                                    id: mobile,
                                },
                                aggregates: {
                                    subtotal: {
                                        amount: {
                                            value: amountToPay,
                                        },
                                        displayName: "Product Amount",
                                    },
                                    total: {
                                        amount: {
                                            value: amountToPay,
                                        },
                                        displayName: "Total payable amount",
                                    },
                                },
                                recurrence: "ONE_TIME",
                                validationRules: {
                                    amount: {
                                        maximum: 100000000,

                                        minimum: 1,
                                    },
                                },

                            }],
                        };

                        return {data: {customer: customerInfo, billDetails}, status: 200, success: true};
                    } catch (e) {
                        response.meta = walletUtil.bbpsBillerDown();
                        console.log(e);
                        return e;
                    }
         }

            },
        },
        paymentConfirmation: {
            rest: {
                method: "POST",
                path: "/payment-confirm",
            },
            params: {},
            // eslint-disable-next-line max-lines-per-function
            async handler(ctx: any) {
/*
                Sample Request

                {
                    "billerBillID": "123456789",
                    "paymentDetails": {
                    "additionalInfo": {},
                    "amountPaid": {
                        "currencyCode": "INR",
                            "value":2003000
                    },
                    "billAmount": {
                        "currencyCode": "INR",
                            "value": 2003000
                    },
                    "instrument": "UPI",
                        "uniquePaymentRefID": "CXRA37834"
                },
                    "platformBillID": "NUP06112008550345687v4"
                }

                Sample Response :

                {
                    "data": {
                    "receipt": {
                        "date": "2020-12-08T14:22:37+05:30",
                            "id": "ABC654564BN"
                    }
                },
                    "status": 200,
                    "success": true
                }
*/

                const returnResponse = walletUtil.bbpsPaymentConfirm();


                const apiKey = ctx.meta.apiKey;
                const token = ctx.meta.bbpsToken;
                let paymentInfoId;
                console.log(ctx.params);

                if (apiKey && apiKey === process.env.BBPS_KEY && token && token === process.env.BBPS_TOKEN) {

                    const billerBillID = ctx.params.billerBillID;
                    const paymentDetails = ctx.params.paymentDetails;
                    const additionalInfo = paymentDetails.additionalInfo;
                    const amountPaid = paymentDetails.amountPaid.value;
                    const billAmount = paymentDetails.billAmount.value;
                    const instrument = paymentDetails.instrument;
                    const uniquePaymentRefID = paymentDetails.uniquePaymentRefID;
                    const platformTransactionRefID = paymentDetails.platformTransactionRefID;
                    const platformBillID = ctx.params.platformBillID;

                    try {
                        const studentInfo = await walletMysql.getStudentByPhone(this.adapter.db, billerBillID );
                        if (studentInfo.length === 0)
                        {
                            return walletUtil.bbpsBillerDown();
                        }
                        const studentId = studentInfo[0].student_id;
                        // txn ref is stored in payment_info_bbps
                        paymentInfoId = await walletMysql.createPaymentInfo(this.adapter.db, studentId, amountPaid, (moment(new Date()).format("YYYYMMDDHHmmssSSS")).toString() + Math.floor(Math.random() * 100), "WALLET", "SUCCESS", "BBPS", uniquePaymentRefID, JSON.stringify(ctx.params));
                        walletMysql.createBBPSInfo(this.adapter.db, studentId, "USED", paymentInfoId, uniquePaymentRefID, platformTransactionRefID, platformBillID);

                        const walletSummaryInfo = await this.broker.call("wallet.getInfo", {student_id: studentId});

                        await this.broker.call("wallet.createWalletTransaction",
                            {
                                cash_amount : amountPaid,
                                student_id: studentId,
                                type: "CREDIT",
                                payment_info_id: paymentInfoId,
                                reason: "credit_wallet",
                            });


                        const authToken = await this.broker.call("$student.sign", { studentId });

                        ctx.params.wallet_balance = parseInt(walletSummaryInfo.data.amount, 10) + amountPaid;
                        ctx.params.payment_info_id = paymentInfoId;
                        const data = JSON.stringify({
                            payment_response: ctx.params,
                            source: "BBPS",
                        });

                        const payload: any = {
                            method: "post",
                            url: "https://api.doubtnut.com/v1/payment/complete",
                            headers: {
                                "x-auth-token": authToken,
                                "Content-Type": "application/json",
                            },
                            data,
                        };

                        await axios(payload)
                            .then(response => {
                                console.log(JSON.stringify(response.data));
                            })
                            .catch(error => {
                                console.log(error);
                            });


                        try {
                                // SEDNING CONFIRMATION MESSAGES
                                walletUtil.sendSMS(this.settings.WALLET_ADD_SMS_TEMPLATE, [amountPaid, studentInfo[0].mobile], studentInfo[0].mobile);
                                const notificationToSend = JSON.parse(JSON.stringify(this.settings.NOTIFICATION_TEMPLATE));
                                notificationToSend.title = notificationToSend.title.replace("<amount>", amountPaid);
                                const sendTo = [{
                                    id: studentInfo[0].student_id,
                                    gcmId: studentInfo[0].gcm_reg_id,
                                }];
                                walletUtil.sendNotification(sendTo, notificationToSend, this.broker);
                            } catch (e) {
                                console.log(e);
                            }

                        returnResponse.data.receipt.id = paymentInfoId;
                        returnResponse.data.receipt.date = moment().utcOffset("+0530").format("YYYY-MM-DDTHH:mm:ssZ");
                        returnResponse.data.additionalInfo.platformBillID = platformBillID;
                        return returnResponse;
                    } catch {
                        return walletUtil.bbpsBillerDown();
                    }
                }
                },

            },

    },
    /**
     * Methods
     */
    methods: {
    },

    /**
     * Service created lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    created() {


    },

    /**
     * Service started lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async started() {

    },

    /**
     * Service stopped lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async stopped() {

    },
};
