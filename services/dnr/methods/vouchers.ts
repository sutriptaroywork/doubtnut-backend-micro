/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import moment from "moment";
import {ObjectId} from "mongodb";
import _ from "lodash";
import dnrData from "../data/dnr.data";
import Settings from "./settings";

const voucherSchema: ServiceSchema = {
    name: "$voucher",
    mixins: [Settings],
    methods: {

        getVouchers(request: any, currTime: any, offset: number, limit: number) {
            try {
                // to get all active vouchers
                return this.adapter.db.collection(this.settings.voucherCollection).find({
                    is_active: true,
                    min_version: {$lte: parseInt(request.meta.versionCode, 10)},
                    max_version: {$gte: parseInt(request.meta.versionCode, 10)},
                    start_date: {$lte: currTime},
                    end_date: {$gt: currTime},
                    is_visible: true,
                })
                    .sort({rank: 1})
                    .skip(offset)
                    .limit(limit)
                    .toArray();
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getSpecificVoucher(voucherId: any) {
            try {
                // get details of a specific voucher
                const hex = /[0-9A-Fa-f]{6}/g;
                voucherId = hex.test(voucherId) ? new ObjectId(voucherId) : voucherId;
                return this.adapter.db.collection(this.settings.voucherCollection).findOne({
                    _id: new ObjectId(voucherId),
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getSpecificUnlockedVoucher(studentId: number, redeemId: any) {
            try {
                // get details of a specific unlocked voucher
                return this.adapter.db.collection(this.settings.redeemVoucherCollection).findOne({
                    _id: new ObjectId(redeemId),
                    student_id: studentId,
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        rangeData(totalDNR: number, versionCode: number, type: string) {
            try {
                // get redeem_dnr_amt and its applicable voucher_ids for spin wheel/mystery_box
                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                const collectionName = type === "spin_wheel" ? this.settings.spinWheelCollection : this.settings.mysteryBoxCollection;
                return this.adapter.db.collection(collectionName).find({
                    is_active: true,
                    min_dnr: {$lte: totalDNR},
                    max_dnr: {$gte: totalDNR},
                    min_version: {$lte: versionCode},
                    max_version: {$gte: versionCode},
                    start_date: {$lte: currTime},
                    end_date: {$gt: currTime},
                }).toArray();
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async spinWheelWidget(locale: string, studentId: number, versionCode: number) {
            try {
                // creating spin wheel widget with redeem amt
                const cta = locale === "hi" ? dnrData.spinWheel.spinCta.hi : dnrData.spinWheel.spinCta.en;
                const content = locale === "hi" ? dnrData.spinWheel.content.hi : dnrData.spinWheel.content.en;
                const widgetData = dnrData.spinWheel.widget;
                widgetData.widget_data.title = content.widget_title;
                widgetData.widget_data.subtitle = content.offer;

                const totalDNR = await this.getWalletAmount(studentId);
                let dnr = 0;
                const spinData = await this.rangeData(totalDNR, versionCode, "spin_wheel");
                if (spinData.length) {
                    dnr = spinData[0].redeem_dnr;
                }
                widgetData.widget_data.cta = cta.replace("{dnr}", String(dnr));
                return widgetData;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async mysteryBoxWidget(locale: string, studentId: number, versionCode: number) {
            try {
                // creating mystery_box widget with redeem amt
                const cta = locale === "hi" ? dnrData.mysteryBox.cta.hi : dnrData.mysteryBox.cta.en;
                const content = locale === "hi" ? dnrData.mysteryBox.content.hi : dnrData.mysteryBox.content.en;
                const widgetData = dnrData.mysteryBox.widget;
                widgetData.widget_data.title = content.widget_title;
                widgetData.widget_data.subtitle = content.offer;

                const totalDNR = await this.getWalletAmount(studentId);
                let dnr = 0;
                const mysteryData = await this.rangeData(totalDNR, versionCode, "mystery_box");
                if (mysteryData.length) {
                    dnr = mysteryData[0].redeem_dnr;
                }
                widgetData.widget_data.cta = cta.replace("{dnr}", String(dnr));
                return widgetData;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        voucherWidget() {
            return {
                widget_type: "widget_dnr_redeem_voucher",
                widget_data: {
                    title: "",
                    title_color: "#808080",
                    subtitle: "",
                    subtitle_color: "#808080",
                    cta: "",
                    cta_color: "#FFFFFF",
                    cta_background_color: "",
                    dnr_image: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp",
                    deeplink: "doubtnutapp://dnr/voucher_explore?voucher_id={voucherId}",
                    background_color: "",
                    voucher_image: "",
                    voucher_background_color: "",
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 15,
                    margin_left: 15,
                    margin_right: 15,
                },
            };
        },

        async getVoucherData(request: any, currTime: object, offset: number, limit: number, pageType?: string) {
            try {
                // widget for list-redeem-voucher page
                const vouchers = await this.getVouchers(request, currTime, offset, limit);
                const cta = request.meta.user.locale === "hi" ? dnrData.home.voucher.cta.hi : dnrData.home.voucher.cta.en;
                const data = [];
                if (pageType === "list_redeem_vouchers") {
                    // adding spin_wheel and mystery_box for list_redeem_page_only
                    data.push(JSON.parse(JSON.stringify(
                        await this.spinWheelWidget(request.meta.user.locale, request.meta.user.student_id, parseInt(request.meta.versionCode, 10)),
                    )));
                    data.push(JSON.parse(JSON.stringify(
                        await this.mysteryBoxWidget(request.meta.user.locale, request.meta.user.student_id, parseInt(request.meta.versionCode, 10)),
                    )));
                }
                for (const item of vouchers) {
                    const voucherWidget = this.voucherWidget();
                    voucherWidget.widget_data.cta = cta;
                    voucherWidget.widget_data.title = item.brand + " Vouchers";
                    voucherWidget.widget_data.title_color = item.title_color;
                    voucherWidget.widget_data.subtitle = (request.meta.user.locale === "hi" ? item.content.hi : item.content.en).offer;
                    voucherWidget.widget_data.cta = voucherWidget.widget_data.cta.replace("{amt}", item.dnr);
                    voucherWidget.widget_data.cta_background_color = item.cta_background_color;
                    voucherWidget.widget_data.deeplink = `${voucherWidget.widget_data.deeplink.replace("{voucherId}", item._id)}${pageType === "list_redeem_vouchers" ? "&source=redeem_voucher" : ""}`;
                    voucherWidget.widget_data.background_color = item.background_color;
                    voucherWidget.widget_data.voucher_image = item.brand_logo;
                    voucherWidget.widget_data.voucher_background_color = item.voucher_background_color;
                    data.push(JSON.parse(JSON.stringify(voucherWidget)));
                }

                return data;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async getVouchersWidget(request: any, currTime: object, offset: number, limit: number) {
            try {
                // adding getVoucherData widget details in widget_parent
                let voucherContainer = null;
                const vouchers = await this.getVoucherData(request, currTime, offset, limit);

                if (vouchers.length) {
                    voucherContainer = {
                        widget_type: "widget_parent",
                        widget_data: {
                            title: request.meta.user.locale === "hi" ? "डाउटनट रुपिया रिडीम करें" : "Redeem Doubtnut Rupya",
                            link_text: request.meta.user.locale === "hi" ? dnrData.viewAll.hi : dnrData.viewAll.en,
                            scroll_direction: "vertical",
                            deeplink: dnrData.vouchers.deeplink.replace("{tab_id}", String(1)),
                            remove_padding: true,
                            title_text_size: 20,
                            is_title_bold: true,
                            items: vouchers,
                        },
                        layout_config: dnrData.layout_config,
                    };
                }

                return voucherContainer;
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },


        async listRedeemVouchers(request: any) {
            try {
                const currTime = moment().add(5, "hours").add(30, "minutes").toDate();
                const page = parseInt(request.params.page, 10) || 0;
                const pageSize = 100;
                const offset = page * pageSize;

                const vouchers = await this.getVoucherData(request, currTime, offset, offset + pageSize, "list_redeem_vouchers");

                return {
                    widgets: vouchers,
                    page: page + 1,
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async pendingCouponAvailable(studentId: number) {
            try {
                // check if pending coupons are available
                const pendingCoupons = await this.adapter.db.collection(this.settings.redeemVoucherCollection).find({
                    student_id: studentId,
                    status: 10,
                }).toArray();

                return pendingCoupons.length !== 0;
            } catch (e) {
                this.logger.error(e);
                return false;
            }
        },

        async voucherTabs(request: any) {
            try {
                // list voucher page tabs
                const pageTitle = request.meta.user.locale === "hi" ? dnrData.vouchers.title.hi : dnrData.vouchers.title.en;
                const totalDNR = await this.getWalletAmount(request.meta.user.student_id);
                const toolbarData = this.getToolbarData(pageTitle, totalDNR);

                let tabs = request.meta.user.locale === "hi" ? dnrData.vouchers.tabs.hi : dnrData.vouchers.tabs.en;

                const unlockedVoucherData = await this.unlockedVouchers(request.meta.user.student_id, 0, 1);
                if (!unlockedVoucherData.length) {
                    tabs = tabs.slice(0, 1);
                }

                // to show popup if pending coupons are there
                let pendingVoucherDeeplink = null;
                const isPendingCoupons = await this.pendingCouponAvailable(request.meta.user.student_id);
                if (isPendingCoupons) {
                    pendingVoucherDeeplink = "doubtnutapp://dnr/pending_vouchers";
                }

                return {
                    toolbar_data: toolbarData,
                    tabs,
                    active_tab: 1,
                    pending_voucher_deeplink: pendingVoucherDeeplink,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getToolbarData(title: string, totalDNR: any) {
            try {
                return {
                    title,
                    dnr: totalDNR,
                    dnr_image: dnrData.dnrLogo,
                    deeplink: dnrData.milestoneScreen.deeplink,
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        inSufficientVoucherState(locale: string) {
            try {
                // warning container if total dnr is less than voucher redeem value
                const warningContainer = {
                    description: locale === "hi" ? dnrData.voucherPage.warningMessage.hi : dnrData.voucherPage.warningMessage.en,
                    description_color: "#FF0000",
                    background_color: "#FFEFEF",
                };
                const deeplink = dnrData.milestoneScreen.deeplink;
                const cta = locale === "hi" ? dnrData.voucherPage.earnCta.hi : dnrData.voucherPage.earnCta.en;

                return {
                    warningContainer,
                    deeplink,
                    cta,
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getLoadingAndErrorState(locale: string, brandName: string, deeplink: string) {
            try {
                // loading screen and error screen data, sent with voucher page (to be shown in case of redemption)
                const loadingStateData = {
                    description: (locale === "hi" ? dnrData.voucherPage.loadingState.description.hi : dnrData.voucherPage.loadingState.description.en)
                        .replace("{brand}", brandName),
                    deeplink,
                    cta: locale === "hi" ? dnrData.voucherPage.loadingState.cta.hi : dnrData.voucherPage.loadingState.cta.en,
                    duration: 5000,
                    animation_file_name: "",
                };
                const errorStateData = locale === "hi" ? dnrData.voucherPage.errorState.hi : dnrData.voucherPage.errorState.en;

                return {
                    loadingStateData,
                    errorStateData,
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        createPendingOrRefundState(locale: string, orderStatus: string) {
            // if status is 30 or 10, will be sending refund/pending widget
            const widget = dnrData.orderStates.widget;
            widget.description = locale === "hi" ? dnrData.orderStates[orderStatus].hi : dnrData.orderStates[orderStatus].en;
            return widget;
        },

        // eslint-disable-next-line max-lines-per-function
        async voucherPage(request: any) {
            try {
                let toolbarData = null;
                let infoData = null;
                let loadingStateData = null;
                let errorStateData = null;
                let warningContainer = null;
                let voucherImageUrl = null;
                let voucherBackgroundColor = null;
                let redeemedDetails = null;
                let unlockedVoucherData = null;
                let voucherId = request.params.voucher_id;
                if (request.params.source === "unlocked_vouchers") {
                    unlockedVoucherData = await this.getSpecificUnlockedVoucher(request.meta.user.student_id, request.params.redeem_id);
                    voucherId = unlockedVoucherData ? unlockedVoucherData.voucher_id : "";
                }
                const totalDNR = await this.getWalletAmount(request.meta.user.student_id);

                const voucherData = voucherId ? await this.getSpecificVoucher(voucherId) : null;

                if (voucherData) {
                    const voucherPageResponse = this.voucherPageData(voucherData, request.meta.user.locale, totalDNR);
                    toolbarData = voucherPageResponse.toolbar_data;
                    toolbarData.deeplink = null;
                    infoData = voucherPageResponse.info_data;

                    voucherImageUrl = voucherData.brand_logo_large;
                    voucherBackgroundColor = voucherData.voucher_background_color;

                    if (request.params.source === "unlocked_vouchers" && unlockedVoucherData) {
                        // changing info_data details if voucher has been unlocked
                        if (unlockedVoucherData.reward_type === "wallet") {
                            infoData.title = (request.meta.user.locale === "hi" ? dnrData.voucherPage.dnCashTitle.hi : dnrData.voucherPage.dnCashTitle.en).replace("{amt}", unlockedVoucherData.reward_amount);
                            infoData.deeplink = dnrData.voucherPage.walletDeeplink;
                            infoData.cta = request.meta.user.locale === "hi" ? dnrData.voucherPage.walletCta.hi : dnrData.voucherPage.walletCta.en;
                        } else {
                            infoData.deeplink = (dnrData.vouchers.deeplink).replace("{tab_id}", String(2));
                            infoData.cta = request.meta.user.locale === "hi" ? dnrData.voucherPage.loadingState.cta.hi : dnrData.voucherPage.loadingState.cta.en;

                            switch (unlockedVoucherData.status) {
                                case 10:
                                    // pending state
                                    warningContainer = this.createPendingOrRefundState(request.meta.user.locale, "pending");
                                    break;
                                case 30:
                                    // refund state
                                    warningContainer = this.createPendingOrRefundState(request.meta.user.locale, "refund");
                                    break;
                                case 20:
                                    const redeemContent = request.meta.user.locale === "hi" ? dnrData.redeemedDetails.hi : dnrData.redeemedDetails.en;
                                    redeemedDetails = {
                                        title: redeemContent.title,
                                        expire_on: redeemContent.expiry + moment(unlockedVoucherData.expiry_date).format("DD MMM YYYY"),
                                        voucher_code: this.getCouponCode(unlockedVoucherData.coupon_code, unlockedVoucherData.voucher_pin, voucherData.brand, voucherData.vendor),
                                        voucher_pin: unlockedVoucherData.voucher_pin,
                                        copy_code_text: redeemContent.copyCode,
                                        cta: redeemContent.cta,
                                        deeplink: unlockedVoucherData.activation_url ? unlockedVoucherData.activation_url : voucherData.redeem_url,
                                    };
                                    break;
                            }
                        }

                    } else {
                        // in case of locked state
                        // check if user has enough dnr to redeem that coupon
                        if (totalDNR < voucherData.dnr) {
                            const insufficientState = this.inSufficientVoucherState(request.meta.user.locale);
                            warningContainer = insufficientState.warningContainer;
                            infoData.deeplink = insufficientState.deeplink;
                            infoData.cta = insufficientState.cta;
                        }

                        const data = this.getLoadingAndErrorState(request.meta.user.locale, voucherData.brand, dnrData.voucherPage.loadingState.deeplink + voucherData._id);
                        loadingStateData = data.loadingStateData;
                        errorStateData = data.errorStateData;
                        errorStateData.title = infoData.title;
                    }
                }

                return {
                    toolbar_data: toolbarData,
                    info_data: infoData,
                    voucher_image_url: voucherImageUrl,
                    voucher_background_color: voucherBackgroundColor,
                    loading_state_data: loadingStateData,
                    error_state_data: errorStateData,
                    warning_container: warningContainer,
                    redeemed_details: redeemedDetails,
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getMultipleStates(data: any) {
            try {
                const infoData = {
                    title: data.title,
                    subtitle: data.subtitle,
                    description: data.about,
                    deeplink: "",
                    cta: (data.locale === "hi" ? dnrData.spinWheel.spinCta.hi : dnrData.spinWheel.spinCta.en).replace("{dnr}", data.unlockAmount),
                    warning_container: null,
                };

                const otherStates = this.getLoadingAndErrorState(data.locale, data.pageTitle, data.deeplink);
                otherStates.errorStateData.title = data.title;

                return {
                    infoData,
                    ...otherStates,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        randomiseReward(data: any, size: number) {
            try {
                // based on the probability of each reward choosing random reward voucher for spin_wheel
                const voucherIds = data.map(item => item.product_code);
                const weights = data.map(item => item.probability);
                const distribution = [];
                const sum = weights.reduce((a, b) => a + b);
                for (let i = 0; i < voucherIds.length; ++i) {
                    const count = (weights[i] / sum) * size;
                    for (let j = 0; j < count; ++j) {
                        distribution.push(i);
                    }
                }

                const index = Math.floor(distribution.length * Math.random());  // random index
                return distribution[index];
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getVoucherDataFromCode(productCode: any) {
            try {
                // get voucher details from voucher_code
                return this.adapter.db.collection(this.settings.voucherCollection).findOne({
                    product_code: productCode,
                });
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        async spinWheelPage(request: any) {
            try {
                // spin wheel page response
                const totalDNR = await this.getWalletAmount(request.meta.user.student_id);

                const content = request.meta.user.locale === "hi" ? dnrData.spinWheel.content.hi : dnrData.spinWheel.content.en;
                const pageTitle = request.meta.user.locale === "hi" ? dnrData.spinWheel.title.hi : dnrData.spinWheel.title.en;
                const toolbarData = this.getToolbarData(pageTitle, String(totalDNR));
                toolbarData.deeplink = null;
                let betterLuckState = null;
                let multipleStates = {
                    infoData: null,
                    loadingStateData: null,
                    errorStateData: null,
                };
                const spinData = await this.rangeData(totalDNR, parseInt(request.meta.versionCode, 10), "spin_wheel");
                if (spinData.length) {
                    multipleStates = this.getMultipleStates({
                        title: content.title,
                        subtitle: content.subtitle,
                        about: content.about,
                        locale: request.meta.user.locale,
                        cta: (request.meta.user.locale === "hi" ? dnrData.spinWheel.spinCta.hi : dnrData.spinWheel.spinCta.en).replace("{dnr}", spinData[0].redeem_dnr),
                        totalDNR,
                        unlockAmount: spinData[0].redeem_dnr,
                        pageTitle,
                        deeplink: dnrData.spinWheel.deeplink,
                    });
                    multipleStates.infoData.item = spinData.map(item => ({
                        color: item.color_code,
                        image_url: item.image,
                        image_width: 64,
                        image_height: 64,
                    }));
                    // randomly selecting index
                    const selectedIndex = this.randomiseReward(spinData, 100);
                    multipleStates.infoData.selected_index = selectedIndex + 1; // android array (for spin wheel) starts with 1 instead of 0
                    const selectedProductCode = spinData[selectedIndex].product_code;
                    // getting voucher details for selected voucher
                    const selectedVoucherData = await this.getVoucherDataFromCode(selectedProductCode);

                    if (!_.isNull(selectedVoucherData)) {
                        multipleStates.infoData.selected_voucher_id = selectedVoucherData._id;
                        multipleStates.infoData.deeplink = `doubtnutapp://dnr/voucher_explore?voucher_id=${selectedVoucherData._id}&source=spin_wheel`;
                        if (selectedVoucherData.product_code === "BETTERLUCK") {
                            // if reward type is better_luck
                            multipleStates.infoData.deeplink = `doubtnutapp://dnr/voucher_explore?voucher_id=${selectedVoucherData._id}&source=better_luck_next_time`;
                            betterLuckState = request.meta.user.locale === "hi" ? dnrData.voucherPage.betterLuckState.hi : dnrData.voucherPage.betterLuckState.en;
                        }
                    } else {
                        multipleStates.infoData.warning_container = request.meta.user.locale === "hi" ? dnrData.tryAgainContainer.hi : dnrData.tryAgainContainer.en;
                    }

                    if (totalDNR < spinData[0].redeem_dnr) {
                        const insufficientState = this.inSufficientVoucherState(request.meta.user.locale);
                        multipleStates.infoData.warning_container = insufficientState.warningContainer;
                        multipleStates.infoData.deeplink = insufficientState.deeplink;
                        multipleStates.infoData.cta = insufficientState.cta;
                    }
                }

                return {
                    toolbar_data: toolbarData,
                    info_data: multipleStates.infoData,
                    loading_state_data: multipleStates.loadingStateData,
                    error_state_data: multipleStates.errorStateData,
                    better_luck_state: betterLuckState,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },


        async mysteryBoxPage(request: any) {
            try {
                const totalDNR = await this.getWalletAmount(request.meta.user.student_id);

                const content = request.meta.user.locale === "hi" ? dnrData.mysteryBox.content.hi : dnrData.mysteryBox.content.en;
                const pageTitle = request.meta.user.locale === "hi" ? dnrData.mysteryBox.title.hi : dnrData.mysteryBox.title.en;
                const toolbarData = this.getToolbarData(pageTitle, totalDNR);
                toolbarData.deeplink = null;
                let multipleStates = {
                    infoData: null,
                    loadingStateData: null,
                    errorStateData: null,
                };
                const mysteryData = await this.rangeData(totalDNR, parseInt(request.meta.versionCode, 10), "mystery_box");
                if (mysteryData.length) {
                    multipleStates = this.getMultipleStates({
                        title: content.title,
                        subtitle: content.subtitle,
                        about: content.about,
                        locale: request.meta.user.locale,
                        cta: (request.meta.user.locale === "hi" ? dnrData.mysteryBox.cta.hi : dnrData.mysteryBox.cta.en).replace("{dnr}", mysteryData[0].redeem_dnr),
                        totalDNR,
                        unlockAmount: mysteryData[0].redeem_dnr,
                        pageTitle,
                        deeplink: dnrData.mysteryBox.deeplink,
                    });
                    const selectedIndex = Math.floor(mysteryData.length * Math.random());
                    multipleStates.infoData.selected_index = selectedIndex;
                    const selectedProductCode = mysteryData[selectedIndex].product_code;
                    // getting voucher details for selected voucher
                    const selectedVoucherData = await this.getVoucherDataFromCode(selectedProductCode);

                    if (!_.isNull(selectedVoucherData)) {
                        multipleStates.infoData.selected_voucher_id = selectedVoucherData._id;
                        multipleStates.infoData.deeplink = `doubtnutapp://dnr/voucher_explore?voucher_id=${selectedVoucherData._id}&source=mystery_box`;
                    } else {
                        multipleStates.infoData.warning_container = request.meta.user.locale === "hi" ? dnrData.tryAgainContainer.hi : dnrData.tryAgainContainer.en;
                    }

                    if (totalDNR < mysteryData[0].redeem_dnr) {
                        const insufficientState = this.inSufficientVoucherState(request.meta.user.locale);
                        multipleStates.infoData.warning_container = insufficientState.warningContainer;
                        multipleStates.infoData.deeplink = insufficientState.deeplink;
                        multipleStates.infoData.cta = insufficientState.cta;
                    }
                }

                return {
                    toolbar_data: toolbarData,
                    info_data: multipleStates.infoData,
                    loading_state_data: multipleStates.loadingStateData,
                    error_state_data: multipleStates.errorStateData,
                };
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        unlockedVouchers(studentId: number, offset: number, limit: number) {
            try {
                return this.adapter.db.collection(this.settings.redeemVoucherCollection).find({
                    student_id: studentId,
                })
                    .sort({_id: -1})
                    .skip(offset)
                    .limit(limit)
                    .toArray();
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        getSelectedVoucher(voucherData: any) {
            try {
                let voucherList = [];
                for (const voucher of voucherData) {
                    voucherList = voucherList.concat(voucher.voucher_id);
                }
                return this.adapter.db.collection(this.settings.voucherCollection).find({
                    _id: {$in: voucherList},
                }).toArray();
            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },

        unlockedVoucherWidget() {
            return {
                widget_type: "widget_dnr_unlocked_voucher",
                widget_data: {
                    title: "",
                    title_color: "",
                    subtitle: "",
                    subtitle_color: "#000000",
                    expiry_on_text: "",
                    coupon_code: null,
                    copy_text: "",
                    cta_text: "Check Wallet",
                    cta_deeplink: dnrData.voucherPage.walletDeeplink,
                    deeplink: "",
                    status_text: null,
                    status_text_color: "#eb532c",
                    voucher_image_url: "",
                    voucher_background_color: "",
                    background_color: "",
                    is_active: true,
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 15,
                    margin_left: 15,
                    margin_right: 15,
                },
            };
        },

        async listUnlockedVouchers(request: any) {
            try {
                // listing all unlocked-vouchers
                const page = parseInt(request.params.page, 10) || 0;
                const pageSize = 100;
                const offset = page * pageSize;
                const unlockedVoucherData = await this.unlockedVouchers(request.meta.user.student_id, offset, offset + pageSize);
                const selectedVoucherData = await this.getSelectedVoucher(unlockedVoucherData);
                let widgets = [];
                for (const vouchers of unlockedVoucherData) {
                    const unlockedWidget = this.unlockedVoucherWidget();
                    const voucherDetails = selectedVoucherData.find(item => String(item._id) === String(vouchers.voucher_id));

                    unlockedWidget.widget_data.title = voucherDetails.brand + " Vouchers";
                    unlockedWidget.widget_data.title_color = voucherDetails.title_color;
                    unlockedWidget.widget_data.subtitle = vouchers.voucher_name;

                    unlockedWidget.widget_data.voucher_image_url = voucherDetails.brand_logo;
                    unlockedWidget.widget_data.voucher_background_color = voucherDetails.voucher_background_color;
                    unlockedWidget.widget_data.background_color = voucherDetails.background_color;
                    unlockedWidget.widget_data.status_text = "Explore";
                    unlockedWidget.widget_data.deeplink = `doubtnutapp://dnr/voucher_explore?redeem_id=${vouchers._id}&source=unlocked_vouchers`;
                    if (vouchers.status === 10 || vouchers.status === 30) {
                        // voucher pending/ refunded
                        unlockedWidget.widget_data.status_text = vouchers.status === 10 ? "Pending" : "Refunded";
                        unlockedWidget.widget_data.cta_deeplink = `doubtnutapp://dnr/voucher_explore?redeem_id=${vouchers._id}&source=unlocked_vouchers`;
                        unlockedWidget.widget_data.status_text_color = "#000000";
                        unlockedWidget.widget_data.cta_text = "View Details";

                    } else if (vouchers.status === 20) {
                        // voucher received
                        const expiryDate = moment(vouchers.expiry_date).add(5, "hours").add(30, "minutes").format("DD MMM YYYY");
                        unlockedWidget.widget_data.expiry_on_text = `Expires on : ${expiryDate}`;
                        if (vouchers.reward_type === "coupon") {
                            let couponCode = vouchers.coupon_code;
                            if (voucherDetails.vendor === "qwickcilver") {
                                couponCode = vouchers.voucher_pin;
                            }
                            unlockedWidget.widget_data.coupon_code = couponCode;
                            unlockedWidget.widget_data.copy_text = "Copy code";
                            unlockedWidget.widget_data.cta_text = "Redeem Now";
                            unlockedWidget.widget_data.cta_deeplink = voucherDetails.redeem_url;
                        }
                        const expDaysLeft = this.daysDifference(vouchers.expiry_date, this.getDayStartOfTime());
                        if (expDaysLeft < 0) {
                            unlockedWidget.widget_data.is_active = false;
                            unlockedWidget.widget_data.status_text = "Expired";
                            unlockedWidget.widget_data.status_text_color = "#000000";
                            unlockedWidget.widget_data.cta_deeplink = null;
                            unlockedWidget.widget_data.expiry_on_text = `Expired on : ${expiryDate}`;
                        }
                    }

                    widgets = widgets.concat(unlockedWidget);
                }

                return {
                    widgets,
                    page: page + 1,
                };

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = voucherSchema;
