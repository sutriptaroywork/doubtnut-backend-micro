import Sequelize from "sequelize";

export const walletMysql = {

    async getNameAndValueByBucket(database, bucket) {
        const sql = `select name,value from dn_property where bucket = "${bucket}" and is_active = 1 order by priority`;
        return database.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async getStudentById(database, id) {
        const sql = `select * from students where student_id = "${id}" limit 1`;
        return database.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async getStudentByPhone(database, mobile) {
        const sql = `select * from students where mobile = "${mobile}" limit 1`;
        return database.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async setLastKnownLocation(database, student_id, lat, lon) {
        // eslint-disable-next-line max-len
        const sql = `insert into apb_location_temp set student_id = "${student_id}", lat = "${lat}", lon = "${lon}" on duplicate key update lat = "${lat}", lon ="${lon}"`;
        return database.query(sql).then(([res]) => res);
    },

    async getLastKnownLocation(database, student_id) {
        const sql = `select * from apb_location_temp where student_id = "${student_id}"`;
        return database.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async getWalletSummary(db, student_id) {
        const sql = `select cash_amount, reward_amount, is_active from wallet_summary where student_id = ${student_id}`;
        console.log(sql);
        return db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async createWalletSummary(db, student_id) {
        const sql = `INSERT INTO wallet_summary set student_id = ${student_id}, amount = 0, is_active = 1`;
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },

    async updateWalletSummary(db, student_id, cash_amount, reward_amount) {
        // eslint-disable-next-line max-len
        const sql = `UPDATE wallet_summary set cash_amount = cash_amount + ${cash_amount}, reward_amount = reward_amount + ${reward_amount} where student_id = ${student_id}`;
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },

    async updateBalancePostTransaction(db, id, amount) {
        const sql = `UPDATE wallet_transaction set balance_post_transaction = ${amount} where id = ${id}`;
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },

    async updateBalancePostTransactionByStudentID(db, id, student_id) {
        // eslint-disable-next-line max-len
        const sql = `UPDATE wallet_transaction wt inner join wallet_summary ws on wt.student_id = ws.student_id set wt.cash_balance_post_transaction = ws.cash_amount, reward_balance_post_transaction = ws.reward_amount where wt.student_id = ${student_id} and wt.id = ${id}`;
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },

    async createWalletTransaction(db, obj) {
        let sql;
        if (obj.expiry == null && obj.reason_ref_id == null)
        {
            // eslint-disable-next-line max-len
            sql =   `INSERT INTO wallet_transaction set student_id = '${obj.student_id}' , cash_amount = '${obj.cash_amount}', reward_amount = '${obj.reward_amount}', type = '${obj.type}' , reason = '${obj.reason}', payment_info_id = '${obj.payment_info_id}'`;
        }
        else if (obj.expiry != null && obj.reason_ref_id == null){
            // eslint-disable-next-line max-len
            sql = `INSERT INTO wallet_transaction set student_id = '${obj.student_id}' , cash_amount = '${obj.cash_amount}', reward_amount = '${obj.reward_amount}', type = '${obj.type}' , reason = '${obj.reason}', payment_info_id = '${obj.payment_info_id}' , expiry = '${obj.expiry}'`;
        }
        else if (obj.expiry == null && obj.reason_ref_id != null) {
            sql = `INSERT INTO wallet_transaction set student_id = '${obj.student_id}' , cash_amount = '${obj.cash_amount}', reward_amount = '${obj.reward_amount}', type = '${obj.type}' , reason = '${obj.reason}', payment_info_id = '${obj.payment_info_id}' , reason_ref_id = '${obj.reason_ref_id}'`;
        }
        else {
            sql = `INSERT INTO wallet_transaction set student_id = '${obj.student_id}' , cash_amount = '${obj.cash_amount}', reward_amount = '${obj.reward_amount}', type = '${obj.type}' , reason = '${obj.reason}', payment_info_id = '${obj.payment_info_id}' , reason_ref_id = '${obj.reason_ref_id}' , expiry = '${obj.expiry}'`;
        }
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },
    async generateCouponCode(db, obj) {
        // eslint-disable-next-line max-len
        const sql = `INSERT INTO third_party_coupon SET student_id= '${obj.student_id}', amount = '${obj.amount}', vendor = '${obj.vendor}' , expiry = '${obj.expiry}', code = '${obj.code}'`;
        return db.query(sql).then(([res]) => res);
    },

    async updateUnusedCouponCode(db, obj) {
        // eslint-disable-next-line max-len
        const sql = `UPDATE third_party_coupon SET amount = '${obj.amount}', vendor = '${obj.vendor}' , expiry = '${obj.expiry}' where student_id='${obj.student_id}' and status='ACTIVE' and code = '${obj.code}'`;
        return db.query(sql).then(([res]) => res);
    },

    async updateCouponStatus(db, obj) {
        // eslint-disable-next-line max-len
        const sql = `UPDATE third_party_coupon SET status = '${obj.status}', paid_amount = '${obj.amount}', vendor = '${obj.vendor}' , transaction_id = '${obj.transaction_id}' where code = '${obj.code}' and status = "ACTIVE"`;
        return db.query(sql).then(([res]) => res);
    },

    async updateCouponStatusByStudentId(db, obj) {
        // eslint-disable-next-line max-len
        const sql = `UPDATE third_party_coupon SET status = '${obj.status}', paid_amount = '${obj.amount}', vendor = '${obj.vendor}' , transaction_id = '${obj.transaction_id}' where student_id = '${obj.student_id}' and code = '${obj.code}' and status = "ACTIVE"`;
        return db.query(sql).then(([res]) => res);
    },

    async updateCouponSession(db, obj) {
        const sql = `UPDATE third_party_coupon SET session_id = '${obj.session_id}' where code = '${obj.code}' and status = "ACTIVE"`;
        return db.query(sql).then(([res]) => res);
    },

    async fetchCouponDetails(db, coupon_code) {
        // eslint-disable-next-line max-len
        const sql = `select concat(s.student_fname," ",s.student_lname) as name, s.student_username as username, s.mobile, tpc.amount, s.student_email, tpc.expiry, tpc.status from students s join (select student_id, amount, expiry, status from third_party_coupon where vendor = 'APB' and code = '${coupon_code}' order by id desc limit 1) tpc on tpc.student_id = s.student_id limit 1`;
        return db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async fetchCouponInfoByVendor(db, coupon_code, vendor) {
        // eslint-disable-next-line max-len
        const sql = `select concat(s.student_fname," ",s.student_lname) as name, s.student_id, s.student_class, s.student_username as username, s.mobile, tpc.amount, s.student_email, tpc.expiry, tpc.status from students s join (select student_id, amount, expiry, status from third_party_coupon where vendor = '${vendor}' and code = '${coupon_code}' order by id desc limit 1) tpc on tpc.student_id = s.student_id limit 1`;
        return db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async fetchBillInfoByVendor(db, billNumberOrPhoneNumber, vendor) {
        // eslint-disable-next-line max-len
        const sql = `select concat(s.student_fname," ",s.student_lname) as name, s.student_id, s.student_class, s.student_username as username, s.mobile, pi.amount, s.student_email , pi.variant_id from students s join payment_info_bbps pib on pib.student_id = s.student_id join payment_info pi on pi.id = pib.payment_info_id where s.mobile = "${billNumberOrPhoneNumber}" and pib.status = "ACTIVE" limit 1`;
        return db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async fetchPackageInfoFromVariantId(db, variant_id) {
        // eslint-disable-next-line max-len
        const sql = `select a.id, a.base_price as original_amount, a.display_price as final_amount, a.display_price as total_amount, a.package_id, b.min_limit, a.base_price-a.display_price as discount_amount, b.type, b.assortment_id , b.duration_in_days, b.name as package_name, b.emi_order, pnt.package_name_trans_manual, pnt.package_name_trans from (select * from variants where id=${variant_id}) a left join package b on a.package_id=b.id left join  package_name_transliterate  pnt on pnt.package_id = b.id where b.id is not null`;
        return db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async fetchCouponInfoByStudentIdAndVendor(db, student_id, vendor) {
        // eslint-disable-next-line max-len
        const sql = `select concat(s.student_fname," ",s.student_lname) as name, s.student_id, s.student_class, s.student_username as username, s.mobile, tpc.amount, s.student_email, tpc.expiry, tpc.status from students s join (select student_id, amount, expiry, status from third_party_coupon where vendor = '${vendor}' and student_id = '${student_id}' and status = "ACTIVE" order by id desc limit 1) tpc on tpc.student_id = s.student_id limit 1`;
        return db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },

    async createPaymentInfo(db, student_id, amount, order_id, payment_for, status, source, partner_txn_id, partner_txn_response, ) {
        // eslint-disable-next-line max-len
        const sql = `insert into payment_info set student_id = '${student_id}', amount = '${amount}', order_id = '${order_id}', payment_for = '${payment_for}', status = '${status}' , source = '${source}', partner_txn_id = '${partner_txn_id}' , partner_txn_response = '${partner_txn_response}', total_amount = '${amount}'`;
        return db.query(sql).then(([res]) => res);
    },

    async createBBPSInfo(db, student_id, status, payment_info_id, unique_payment_ref_id, platform_transaction_ref_id, platform_bill_id) {
        // eslint-disable-next-line max-len
        const sql = `insert into payment_info_bbps set student_id = '${student_id}', status = '${status}', payment_info_id = '${payment_info_id}', unique_payment_ref_id = '${unique_payment_ref_id}', platform_transaction_ref_id = '${platform_transaction_ref_id}', platform_bill_id= '${platform_bill_id}'`;
        return db.query(sql).then(([res]) => res);
    },

    async getPaymentInfo(db, id) {
        const sql = `select * from payment_info where id = ${id}`;
        return db.query(sql).then(([res]) => res);
    },

    async setBbpsAttempt(db, student_id) {
        const sql = `insert into payment_info_bbps_attempt set student_id = '${student_id}'`;
        return db.query(sql).then(([res]) => res);
    },

    async getPaymentInfoByStudentIdAndSourceAndStatus(db, student_id, source, status) {
        const sql = `select * from payment_info where student_id = '${student_id}' and source = '${source}' and status = '${status}' order by id desc limit 1`;
        return db.query(sql).then(([res]) => res);
    },

    async fetchCouponByStudentAndVendor(db, studentID, vendor) {
        const sql = `select * from third_party_coupon where student_id = '${studentID}' and vendor = '${vendor}' and status='ACTIVE' order by id desc`;
        return db.query(sql, { type: Sequelize.QueryTypes.SELECT });
    },


    // wallet adjustment by student
    async getWalletStatusRecon(db, student_id) {
        const sql = `select * from wallet_summary_recon where student_id = '${student_id}' order by id desc limit 1`;
        return db.query(sql).then(([res]) => res);
    },

    async setWalletStatusRecon(db, student_id, status) {
        const sql = `insert into wallet_summary_recon set student_id = '${student_id}', status = "${status}"`;
        return db.query(sql).then(([res]) => res);
    },

    async updateWalletStatusRecon(db, student_id, status) {
        const sql = `update wallet_summary_recon set status = "${status}" where student_id = '${student_id}'`;
        return db.query(sql).then(([res]) => res);
    },

    async getWalletTxn(db, student_id){
        const sql = `select * from wallet_transaction where student_id = ${student_id}`;
        return db.query(sql).then(([res]) => res);
    },

    async updateWalletSummaryRecon(db, student_id, cash_amount, reward_amount){
        // eslint-disable-next-line max-len
        const sql = `update wallet_summary set cash_amount = cash_amount + ${cash_amount}, reward_amount = reward_amount + ${reward_amount} where student_id = ${student_id}`;
        return db.query(sql).then(([res]) => res);
    },

    async updateWT(db, obj)
    {
        // eslint-disable-next-line max-len
        const sql = `update wallet_transaction set cash_amount = ${obj.cash_amount}, reward_amount = ${obj.reward_amount}, cash_balance_post_transaction = ${obj.cash_balance_post_transaction}, reward_balance_post_transaction = ${obj.reward_balance_post_transaction} where id = ${obj.id}`;
        return db.query(sql).then(([res]) => res);
    },

    async getActiveVPAByStudentId(db, student_id) {
        const sql = `select * from payment_info_smart_collect where student_id = ${student_id} and is_active = 1 limit 1`;
        return db.query(sql).then(([res]) => res);
    },

    async setPaymentInfoSmartCollect(db, obj) {
        const sql = `insert into payment_info_smart_collect set student_id = '${obj.student_id}', virtual_account_id = '${obj.virtual_account_id}', account_number = '${obj.account_number}', ifsc_code = '${obj.ifsc_code}', upi_id = '${obj.upi_id}', bank_name = '${obj.bank_name}', is_active = '${obj.is_active}', created_by = '${obj.created_by}'`;
        return db.query(sql).then(([res]) => res);
    },

    async createWalletTransactionExpiry(db, obj)
    {
        const sql = `insert into wallet_transaction_expiry set wallet_transaction_id = '${obj.wallet_transaction_id}', amount_left = '${obj.amount_left}', status='${obj.status}' `;
        console.log(sql);
        return db.query(sql,).then(([res]) => res);
    },

    async fetchSumOfExpiringRewardsByStudentId(db, obj)
    {
        const sql = `select sum(wte.amount_left) as amount from wallet_transaction_expiry wte join wallet_transaction wt on wt.id = wte.wallet_transaction_id where wt.student_id = '${obj.student_id}' and wte.status = "ACTIVE"`;
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },

    async fetchListOfExpiringRewardsByStudentId(db, obj)
    {
        const sql = `select wte.id, wte.amount_left, wte.wallet_transaction_id from wallet_transaction_expiry wte join wallet_transaction wt on wt.id = wte.wallet_transaction_id where wt.student_id = '${obj.student_id}' and wte.status = "ACTIVE" and date(wt.expiry) >= '${obj.date}' order by wt.expiry asc`;
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },

    async updateExpiringRewardsToUsedByWTE(db, obj)
    {
        const sql = `update wallet_transaction_expiry set status = 'USED', amount_left = 0, wallet_transaction_ref_id = ${obj.wallet_transaction_ref_id} where id in (${obj.wte_id.join(",")})`;
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },

    async getRewardsExpiringByDate(db, obj)
    {
        const sql = `select sum(wte.amount_left) as amount from wallet_transaction_expiry wte join wallet_transaction wt on wt.id = wte.wallet_transaction_id where wte.status ='ACTIVE' and date(wt.expiry) = '${obj.expiry}' and wt.student_id = '${obj.student_id}'`;
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },

    async getRewardsExpiringWithinDate(db, obj)
    {
        const sql = `select sum(wte.amount_left) as amount from wallet_transaction_expiry wte join wallet_transaction wt on wt.id = wte.wallet_transaction_id where wte.status ='ACTIVE' and date(wt.expiry) >= '${obj.start}' and date(wt.expiry) <= '${obj.expiry}' and wt.student_id = '${obj.student_id}'`;
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },

    async getUserLocationData(db, studentId)
    {
        const sql = `select true_country from student_location where student_id = ${studentId}`;
        console.log(sql);
        return db.query(sql).then(([res]) => res);
    },
};


