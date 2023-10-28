"use strict";

import axios from "axios";
import request from "request";
import DbService from "dn-moleculer-db";
import moment from "moment";
import Sequelize from "sequelize";
import { adapter } from "../config";
import {walletMysql} from "../helper/wallet.mysql";
import {walletUtil} from "../helper/wallet.util";

const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.INTEGER, primaryKey: true },
};

module.exports = {
    name: "apb",
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

        generateCoupon: {
            rest: {
                method: "POST",
                path: "/generate-coupon/:studentID",
            },
            params: {},
            async handler(ctx: any) {

                const response: any = walletUtil.responseTemplate();

                try {
                    const studentId: number = ctx.params.studentID;
                    const couponDetails = await this.generateCoupon(studentId, ctx.params.amount);
                    response.data = couponDetails;
                    return response;
                }
                catch (e)
                {
                    response.meta = walletUtil.metaSomethingWentWrong();
                    return response;
                }
            },
        },
        fetchCouponDetails: {
            rest: {
                method: "POST",
                path: "/coupon-details",
            },
            params: {},
            async handler(ctx: any) {

                const response: any = walletUtil.responseTemplate();

                try {
                    const coupon_code = ctx.params.code;

                    const couponDetails = await walletMysql.fetchCouponDetails(this.adapter.db, coupon_code);

                    if (couponDetails.length === 0) {
                        response.meta = walletUtil.metaCouponNotFound();
                        return response;
                    } else if (couponDetails[0].status === "USED") {
                        response.meta = walletUtil.metaCouponUsed();
                        return response;
                    } else if (moment(couponDetails[0].expiry).isBefore(moment())) {
                        response.meta = walletUtil.metaCouponExpired();
                        return response;
                    }

                    if (couponDetails[0].student_email == null) {
                        delete couponDetails[0].student_email;
                    } else {
                        couponDetails[0].email = couponDetails[0].student_email;
                        delete couponDetails[0].student_email;
                    }
                    response.data = couponDetails[0];
                    response.data.session_id = Math.random().toString(36).slice(2);

                    await walletMysql.updateCouponSession(this.adapter.db, {
                        code: coupon_code,
                        session_id: response.data.session_id,
                    });

                    return response;
                } catch (e)
                {
                    response.meta = walletUtil.metaSomethingWentWrong();
                    return response;
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

                const response: any = walletUtil.responseTemplate();

                try {
                    const session_id = ctx.params.session_id;
                    const transaction_id = ctx.params.transaction_id;
                    const coupon_code = ctx.params.code;
                    const amount = ctx.params.amount;

                    if (amount.length === 0 || session_id.length === 0 || coupon_code.length === 0)
                    {
                        response.meta = walletUtil.metaSomethingWentWrong();
                        return response;
                    }
                    const couponDetails = await walletMysql.fetchCouponInfoByVendor(this.adapter.db, coupon_code, "APB");

                    if (couponDetails.length === 0) {
                        response.meta = walletUtil.metaSomethingWentWrong();
                        return response;
                    }

                    if (session_id !== couponDetails[0].session_id) {
                        response.meta = walletUtil.metaSomethingWentWrong();
                        return response;
                    }

                    if (couponDetails[0].status === "USED") {
                        response.data = {
                            status: "SUCCESS",
                            message: "Payment confirmed",
                        };
                        try {
                            const studentInfo = await walletMysql.getStudentById(this.adapter.db, couponDetails[0].student_id);
                            // SEDNING CONFIRMATION MESSAGES
                            walletUtil.sendSMS(this.settings.WALLET_ADD_SMS_TEMPLATE, [amount, studentInfo[0].mobile], studentInfo[0].mobile);
                            const notificationToSend = JSON.parse(JSON.stringify(this.settings.NOTIFICATION_TEMPLATE));
                            notificationToSend.title = notificationToSend.title.replace("<amount>", amount);
                            const sendTo = [{
                                id: studentInfo[0].student_id,
                                gcmId: studentInfo[0].gcm_reg_id,
                            }];
                            walletUtil.sendNotification(sendTo, notificationToSend, this.broker);
                        } catch (e) {
                            console.log(e);
                        }
                        return response;
                    }

                    if (couponDetails[0].status === "ACTIVE") {
                        const updateStatus = await walletMysql.updateCouponStatus(this.adapter.db, {
                            transaction_id,
                            amount,
                            status: "USED",
                            vendor: "APB",
                            code: coupon_code,
                        });

                        // console.log(updateStatus);
                        if (updateStatus.affectedRows === 1) {

                            const insertedRow = await walletMysql.createPaymentInfo(this.adapter.db, couponDetails[0].student_id, amount, (moment(new Date()).format("YYYYMMDDHHmmssSSS")).toString() + Math.floor(Math.random() * 100), "WALLET", "SUCCESS", "APB", transaction_id, JSON.stringify(ctx.params));
                            await this.broker.call("wallet.createWalletTransaction",
                                {cash_amount : amount, student_id: couponDetails[0].student_id, type: "CREDIT", payment_info_id: insertedRow, reason: "credit_wallet"});
                        }
                        response.data = {
                            status: "SUCCESS",
                            message: "Payment confirmed",
                        };
                        try {
                            const studentInfo = await walletMysql.getStudentById(this.adapter.db, couponDetails[0].student_id);

                            // SEDNING CONFIRMATION MESSAGES
                            walletUtil.sendSMS(this.settings.WALLET_ADD_SMS_TEMPLATE, [amount, studentInfo[0].mobile], studentInfo[0].mobile);
                            const notificationToSend = this.settings.NOTIFICATION_TEMPLATE;
                            notificationToSend.title = notificationToSend.title.replace("<amount>", amount);
                            const sendTo = [{
                                id: studentInfo[0].student_id,
                                gcmId: studentInfo[0].gcm_reg_id,
                            }];
                            walletUtil.sendNotification(sendTo, notificationToSend, this.broker);
                        } catch (e) {
                            console.log(e);
                        }
                        return response;

                    }
                    return {
                        meta: {
                            code: 200,
                            success: true,
                            message: "SUCCESS",
                        },
                        data: {
                            status: "SUCCESS",
                            message: "Payment confirmed",
                        },
                    };
                }
                catch {
                    response.meta = walletUtil.metaSomethingWentWrong();
                    return response;
                }

            },
        },
        startScreen: {
            rest: {
                method: "GET",
                path: "/screen",
            },
            params: {},
            async handler(ctx: any) {
                const response: any = walletUtil.responseTemplate();
                try {
                    const studentId: number = ctx.meta.user.student_id;
                    const promises = [];
                    promises.push(this.generateCoupon(studentId, (ctx.params.amount || this.settings.MINIMUM_AMOUNT)));
                    promises.push(walletMysql.getNameAndValueByBucket(this.adapter.db, this.settings.AIRTEL_HOME_BUCKET));
                    const [couponDetails, options] = await Promise.all(promises);
                    const finalData = {
                        steps: [],
                        coupon_code: couponDetails.code,
                        show_voice_instructions: true,
                        language: [],
                    };
                    // console.log(options);
                    options.map(option => {
                        const [key, value] = this.formatOptions(option, finalData);
                        finalData[key] = value;
                    });
                    let userLocale: string = ctx.meta.user.locale;
                    userLocale = finalData.language.includes(userLocale) ? userLocale : "en";
                    const localeOptions = await walletMysql.getNameAndValueByBucket(this.adapter.db, `${this.settings.AIRTEL_HOME_BUCKET}_${userLocale}`);
                    localeOptions.map(option => {
                        const [key, value] = this.formatOptions(option, finalData);
                        finalData[key] = value;
                    });
                    delete finalData.language;
                    response.data = finalData;
                    return response;
                }
                catch (e)
                {
                    console.log(e);
                    response.meta = walletUtil.metaSomethingWentWrong();
                    return response;
                }
            },
        },
        locationScreen: {
            rest: {
                method: "GET",
                path: "/locationScreen",
            },
            params: {},
            async handler(ctx: any) {
                const response: any = walletUtil.responseTemplate();
                try {
                    const studentId: number = ctx.meta.user.student_id;
                    let lat: any = ctx.params.lat;
                    let long: any = ctx.params.long;

                    if (lat  && long && lat !== "null" && long !== "null")
                    {
                        walletMysql.setLastKnownLocation(this.adapter.db, studentId, lat, long);
                    }
                    else {
                       const locationInfo: any = await walletMysql.getLastKnownLocation(this.adapter.db, studentId);
                       if (locationInfo.length)
                       {
                           lat = parseFloat(locationInfo[0].lat);
                           long = parseFloat(locationInfo[0].lon);
                       }
                    }
                    const promsies = [];
                    promsies.push(walletMysql.getNameAndValueByBucket(this.adapter.db, this.settings.AIRTEL_LOCATION_BUCKET));
                    promsies.push(walletMysql.fetchCouponByStudentAndVendor(this.adapter.db, studentId, "APB"));
                    const [options, coupon] = await Promise.all(promsies);
                    const finalData = {
                        coupon_code: coupon[0].code || "INVALID TOKEN",
                        airtel_banks: null,
                        points_text: null,
                        airtel_image: null,
                        language: [],
                    };
                    options.map(option => {
                        const [key, value] = this.formatOptions(option, finalData);
                        finalData[key] = value;
                    });
                    let userLocale: string = ctx.meta.user.locale;
                    userLocale = finalData.language.includes(userLocale) ? userLocale : "en";
                    const localeOptions = await walletMysql.getNameAndValueByBucket(this.adapter.db, `${this.settings.AIRTEL_LOCATION_BUCKET}_${userLocale}`);
                    localeOptions.map(option => {
                        const [key, value] = this.formatOptions(option, finalData);
                        finalData[key] = value;
                    });
                    try {
                        if (lat && long && lat !== "null" && long !== "null"){
                            const query = `?amount=${this.settings.APB_MINIMUM_AMOUNT}&size=30&latitude=${lat}&longitude=${long}&product=CMS&withMap=false`;
                            const airtelBanks = await axios.get(`${this.settings.AIRTEL_BANKS_URL}${query}`);
                            let banks = airtelBanks.data.data ? (airtelBanks.data.data.retailers || []) : [];
                            banks = banks.map(bank => ({
                                shopName: bank.shopName || "",
                                address: bank.address,
                                mobileNumber: bank.phoneNumber,
                                imageUrl: finalData.airtel_image,
                                city: bank.city,
                                distance: parseInt(bank.distance, 10) + "m",
                                pincode: bank.pinCode,
                            }));
                            finalData.airtel_banks = banks;
                            finalData.points_text = `${banks.length ? banks.length : null } ${finalData.points_text}`;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                    delete finalData.language;
                    delete finalData.airtel_image;
                    response.data = finalData;
                    return response;
                }
                catch (e)
                {
                    console.log(e);
                    response.meta = walletUtil.metaSomethingWentWrong();
                    return response;
                }
            },
        },

    },
    /**
     * Methods
     */
    methods: {
        formatOptions(data: any, finalData: any) {
            let key = data.name;
            let value = data.value;
            switch (key) {
                case "step":
                    const options = value.split("#!#");
                    value = {};
                    key = "steps";
                    value.step = options[0];
                    value.title = options[1];
                    value.sub_title = options[2];
                    value.image_url = options[3];
                    value = finalData.steps.concat(value);
                    break;
                case "language":
                    value = value.split("#!#");
                    break;
                default:
                    break;
            }
            return [key, value];
          },
        async generateCoupon(studentID, amount){
            const existingCoupon = await walletMysql.fetchCouponByStudentAndVendor(this.adapter.db, studentID, "APB");
            const insertObj = {
                student_id: studentID,
                amount,
                expiry: moment().add(7, "d").format("YYYY-MM-DD HH:mm:ss").toString(),
                vendor: "APB",
                code: Math.random().toString().slice(2, Math.floor(Math.random() * (12 - 8 + 1) + 8)),
            };
            if (existingCoupon.length && existingCoupon[0].code) {
                insertObj.code = existingCoupon[0].code;
                // await walletMysql.updateUnusedCouponCode(this.adapter.db, insertObj);
            } else {
                await walletMysql.generateCouponCode(this.adapter.db, insertObj);
            }
            return insertObj;
        },
    },
};
