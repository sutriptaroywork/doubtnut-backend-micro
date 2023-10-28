/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import _ from "lodash";
import {redisUtility} from "../../../common";

const purchasePopupSchema: ServiceSchema = {
    name: "$purchasePopup",
    methods: {

        async getPurchasePopup(request: any) {
            try {
                // To show popup for pdf/course purchase reward on explore page
                let popupContainer = null;
                const coursePurchasedData = await redisUtility.getHashField.call(this, request.meta.user.student_id, "DNR_PURCHASE_REWARD");
                if (!_.isNull(coursePurchasedData)) {
                    popupContainer = this.createPopupResponse(request.meta.user.locale, coursePurchasedData.milestone_type, coursePurchasedData.prize_dnr);
                    await redisUtility.deleteHashField.call(this, request.meta.user.student_id, "DNR_PURCHASE_REWARD");
                }
                return popupContainer;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = purchasePopupSchema;

