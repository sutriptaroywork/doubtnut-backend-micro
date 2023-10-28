"use strict";
import fs from "fs";
import { promisify } from "util";
import { ToWords } from "to-words";
import { ServiceSchema, Context } from "moleculer";
import Sequelize from "sequelize";
import DbService from "dn-moleculer-db";

import { adapter } from "../config";
import { staticCDN } from "../../../common";

const readFileAsync = promisify(fs.readFile);


const modelAttributes: Sequelize.ModelAttributes = {
    id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
    entityId: { type: Sequelize.UUID, allowNull: false },
    entityType: { type: Sequelize.STRING(24), allowNull: false },
    url: { type: Sequelize.STRING, allowNull: false },
    payment_id: {type: Sequelize.INTEGER, allowNull: false},
};

const toWords = new ToWords({
    localeCode: "en-IN",
    converterOptions: {
        currency: true,
        ignoreDecimal: false,
        ignoreZeroCurrency: false,
    },
});

const invoice = "INVOICE";

const invoiceService: ServiceSchema = {
    name: "invoice",
    mixins: [DbService],
    adapter,
    model: {
        name: "payment_invoice",
        define: modelAttributes,
        options: {
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            indexes: [{
                unique: true,
                fields: ["entity_id", "entity_type", "payment_id"],
            }],
        },
    },
    settings: {
        rest: "/invoice",
        templates: {
            invoiceTemplate: readFileAsync("./services/wallet/templates/sales_invoice_template_new.html", "utf8"),
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
        createInvoice: {
            rest: "POST /create",
            internal: true,
            params: {
                paymentId: "number",
                version: "number"
            },
            async handler(ctx: Context<{ paymentId: number, version: string }>) {
                this.logger.info("Creating Invoices");

                await this.createInvoices(ctx);

                return "PDF Scheduled";
            },
        },
    },

    events: {
        async storeInDB(ctx: Context<{ studentId: string; questionId: number; entityType: string; url: string; paymentId: number }>) {
            this.logger.info("Storing the invoice to db");
            const s3Prefix = ctx.params.url.replace(staticCDN, "");

            await this.broker.call("invoice.create", {
                entityId: ctx.params.questionId,
                entityType: ctx.params.entityType,
                url: s3Prefix,
                payment_id: ctx.params.paymentId,
            });

        },

    },

    /**
     * Methods
     */
    methods: {
        async createInvoices(ctx: Context<{ paymentId: number, version: string }>) {
            try {
                let topic;
                if (ctx.params.version && ctx.params.version == "old") {
                    topic = await this.getAllTopicsOldpayments(this.adapter.db, ctx.params.paymentId);
                } else {
                    topic = await this.getAllTopics(this.adapter.db, ctx.params.paymentId);
                }

                if (!topic) {
                    this.logger.info(`No record found with ${ctx.params.paymentId}`);
                    return;
                }
                const reqTime = new Date().getTime();

                const image_name = "DN_" + topic.ps_id + "_" + topic.student_id;

                // sanitize input
                topic.coupon_code_discount = parseFloat(topic.coupon_code_discount);
                topic.wallet_reward_amount = parseFloat(topic.wallet_reward_amount);
                topic.wallet_cash_amount = parseFloat(topic.wallet_cash_amount);
                topic.total_amount = parseFloat(topic.total_amount);
                topic.amount = parseFloat(topic.amount);

                console.log("topic", topic);
                const notificationInfo = {
                    paymentId: topic.ps_id,
                    fileName: image_name,
                };

                // fs.writeFileSync(image_name + ".html", this.buildHtml(await this.settings.templates.invoiceTemplate, topic));

                ctx.emit("create", {
                    data: {
                        studentId: topic.student_id,
                        questionId: ctx.params.paymentId,
                        entityType: invoice.toUpperCase(),
                        notificationInfo,
                        html: this.buildHtml(await this.settings.templates.invoiceTemplate, topic),
                        reqTime,
                    },
                    nextEvent: "storeInDB",
                    nextEventGroup: "invoice",
                }, "$pdf");

            } catch (e) {
                this.logger.error(e);
            }
        },

        buildHtml(template, topic: any = {}) {
            const student_id = topic.student_id;

            let date_txn, start_date, end_date, invoice_no = "";
            if (topic.ps_id) {
                date_txn = topic.day_txn + "-" + topic.month_txn + "-" + topic.year_txn ;
                start_date = topic.day_sdate + "-" + topic.month_sdate + "-" + topic.year_sdate;
                end_date = topic.day_edate + "-" + topic.month_edate + "-" + topic.year_edate;
                invoice_no = topic.ps_id;
            } else if (topic.payment_for && topic.payment_for == "wallet") {
                date_txn = topic.wallet_txn_created_at;
                invoice_no = topic.wallet_transaction_id;
            }
            const mobile = topic.mobile;
            const package_name = topic.name;
            const payment_mode = topic.method ? `${topic.mode.toUpperCase()} - ${topic.method.toUpperCase()}` : topic.mode.toUpperCase();
            const total_amount = topic.total_amount;
            let coupon_discount = 0;
            let wallet_discount = 0;

            if (topic.coupon_code_discount) {
                coupon_discount = topic.coupon_code_discount;
            }
            if (topic.wallet_reward_amount) {
                wallet_discount = topic.wallet_reward_amount;
            }
            const net_taxable_amount = total_amount - wallet_discount - coupon_discount;
            const amount_paid = net_taxable_amount;
            const igst = Math.round((net_taxable_amount * 0.18 / 1.18) * 100) / 100;
            const selling_price = net_taxable_amount - igst;
            const total_amount_words = toWords.convert(+net_taxable_amount);

            template = template
                .replace(/##INVOICE_NO##/g, invoice_no)
                .replace("##DATE2##", date_txn)
                .replace("##ST_ID##", student_id)
                .replace("##MOBILE##", mobile)
                .replace("##PACKAGE_NAME##", package_name)
                .replace("##STARTDATE##", start_date)
                .replace("##ENDDATE##", end_date)
                .replace("##PAYMENT_ID##", topic.payment_id)
                .replace("##PAYMENT_MODE##", payment_mode)
                .replace(/##TOTAL_AMOUNT##/g, total_amount.toFixed(2))
                .replace(/##AMOUNT_PAID##/g, amount_paid.toFixed(2))
                .replace(/##SELLING_PRICE##/g, selling_price.toFixed(2))
                .replace(/##IGST##/g, igst.toFixed(2))
                .replace("##AMOUNT_PAID_WORDS##", total_amount_words);

            if (coupon_discount) {
                template = template
                    .replace(/##COUPON_CODE##/g, topic.coupon_code)
                    .replace(/##COUPON_DISCOUNT##/g, coupon_discount.toFixed(2));
            } else {
                // eslint-disable-next-line @typescript-eslint/quotes
                template = template.replace(`id="coupon-discount"`, `style="display: none;"`);
            }
            if (wallet_discount) {
                template = template.replace(/##WALLET_DISCOUNT##/g, wallet_discount.toFixed(2));
            } else {
                // eslint-disable-next-line @typescript-eslint/quotes
                template = template.replace(`id="wallet-discount"`, `style="display: none;"`);
            }

            return template;
        },

        async getAllTopics(db, paymentId) {
            // eslint-disable-next-line max-len
            // const sql = `SELECT a.student_id, RIGHT(CONCAT('00', DAY(a.created_at)), 2) AS day_txn, RIGHT(CONCAT('00', MONTH(a.created_at)), 2) AS month_txn, YEAR(a.created_at) AS year_txn, a.id AS subscription_id, d.mobile, c.name, c.description, RIGHT(CONCAT('00', MONTH(a.start_date)), 2) AS month_sdate, RIGHT(CONCAT('00', DAY(a.start_date)), 2) AS day_sdate, YEAR(a.start_date) AS year_sdate, RIGHT(CONCAT('00', MONTH(a.end_date)), 2) AS month_edate, RIGHT(CONCAT('00', DAY(a.end_date)), 2) AS day_edate, YEAR(a.end_date) AS year_edate, a.start_date, a.end_date, a.amount, ROUND(a.amount / 1.18, 0) AS no_gst_amount, ROUND((a.amount / 1.18) * 0.09, 0) AS cgst_amt, ROUND((a.amount / 1.18) * 0.09, 1) AS cgst_amt_1, b.txn_id, e.id AS payment_id FROM (SELECT * FROM student_package_subscription WHERE amount > 0) AS a LEFT JOIN payment_summary AS b ON a.id = b.subscription_id LEFT JOIN package AS c ON a.new_package_id = c.id LEFT JOIN students AS d ON a.student_id = d.student_id LEFT JOIN payment_info AS e ON b.txn_id = e.partner_txn_id where e.id = '${paymentId}' ORDER BY subscription_id`;
            const sql = `SELECT sps.student_id, ps.id as ps_id, pi.mode, pim.method, RIGHT(CONCAT('00', DAY(sps.created_at)), 2) AS day_txn, RIGHT(CONCAT('00', MONTH(sps.created_at)), 2) AS month_txn, YEAR(sps.created_at) AS year_txn, sps.id AS subscription_id, s.mobile, p.name, p.description, RIGHT(CONCAT('00', MONTH(sps.start_date)), 2) AS month_sdate, RIGHT(CONCAT('00', DAY(sps.start_date)), 2) AS day_sdate, YEAR(sps.start_date) AS year_sdate, RIGHT(CONCAT('00', MONTH(sps.end_date)), 2) AS month_edate, RIGHT(CONCAT('00', DAY(sps.end_date)), 2) AS day_edate, YEAR(sps.end_date) AS year_edate, sps.start_date, sps.end_date, pi.total_amount, pi.amount, pi.order_id, pi.coupon_code AS coupon_code, pi.discount AS coupon_code_discount, wt.cash_amount AS wallet_cash_amount, wt.reward_amount AS wallet_reward_amount, pi.id AS payment_id FROM student_package_subscription AS sps LEFT JOIN package AS p ON sps.new_package_id = p.id LEFT JOIN students AS s ON sps.student_id = s.student_id LEFT JOIN payment_info AS pi ON sps.payment_info_id= pi.id LEFT JOIN payment_info_meta AS pim ON pim.payment_info_id = pi.id LEFT JOIN payment_summary AS ps ON ps.txn_id = pi.partner_txn_id LEFT JOIN wallet_transaction wt ON wt.payment_info_id = pi.id WHERE pi.id = ${paymentId} ORDER BY subscription_id`;
            return db.query(sql).then(([res]) => res[0]);
        },

        async getAllTopicsOldpayments(db, paymentId) {
            const sql = `SELECT 
                    s.student_id,
                    ps.id AS ps_id,
                    pi.mode,
                    pim.method,
                    RIGHT(CONCAT('00', DAY(sps.created_at)),
                        2) AS day_txn,
                    RIGHT(CONCAT('00', MONTH(sps.created_at)),
                        2) AS month_txn,
                    YEAR(sps.created_at) AS year_txn,
                    sps.id AS subscription_id,
                    s.mobile,
                    CASE
                        WHEN p.id != NULL THEN p.name
                        WHEN pi.payment_for = 'wallet' THEN 'Payment For Wallet'
                    END AS name,
                    p.description,
                    RIGHT(CONCAT('00', MONTH(sps.start_date)),
                        2) AS month_sdate,
                    RIGHT(CONCAT('00', DAY(sps.start_date)),
                        2) AS day_sdate,
                    YEAR(sps.start_date) AS year_sdate,
                    RIGHT(CONCAT('00', MONTH(sps.end_date)),
                        2) AS month_edate,
                    RIGHT(CONCAT('00', DAY(sps.end_date)),
                        2) AS day_edate,
                    YEAR(sps.end_date) AS year_edate,
                    sps.start_date,
                    sps.end_date,
                    pi.total_amount,
                    pi.amount,
                    pi.payment_for,
                    pi.order_id,
                    pi.coupon_code AS coupon_code,
                    pi.discount AS coupon_code_discount,
                    wt.cash_amount AS wallet_cash_amount,
                    wt.reward_amount AS wallet_reward_amount,
                    DATE(wt.created_at) AS wallet_txn_created_at,
                    wt.id AS wallet_transaction_id,
                    pi.id AS payment_id
                FROM
                    payment_info pi
                        LEFT JOIN
                    students s ON s.student_id = pi.student_id
                        LEFT JOIN
                    payment_info_meta AS pim ON pim.payment_info_id = pi.id
                        LEFT JOIN
                    payment_summary AS ps ON ps.txn_id = pi.partner_txn_id
                        LEFT JOIN
                    wallet_transaction wt ON wt.payment_info_id = pi.id
                        LEFT JOIN
                    student_package_subscription AS sps ON sps.id = ps.subscription_id
                        LEFT JOIN
                    package p ON p.id = sps.new_package_id
                WHERE
                    pi.id = ${paymentId}
                ORDER BY subscription_id;`;
            return db.query(sql).then(([res]) => res[0]);
        }
    },

    /**
     * Service created lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    created() {},

    /**
     * Service started lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async started() {},

    /**
     * Service stopped lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async stopped() {},
};

module.exports = invoiceService;
