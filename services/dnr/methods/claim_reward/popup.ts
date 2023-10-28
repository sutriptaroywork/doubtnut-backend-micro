/* eslint-disable no-underscore-dangle */
import {ServiceSchema} from "dn-moleculer";
import {ObjectId} from "mongodb";
import _ from "lodash";
import dnrData from "../../data/dnr.data";
import WalletService from "../wallet";
import {walletMysql} from "../../../wallet/helper/wallet.mysql";

const RewardPopUpSchema: ServiceSchema = {
    name: "$rewardPopup",
    mixins: [WalletService],
    methods: {

        createPopupResponse(locale: string, milestoneType: string, prizeDnr: number) {
            // creating response for reward pop up
            const popUpContainer = dnrData.popUp.widget;
            popUpContainer.title = locale === "hi" ? dnrData.popUp[milestoneType].title.hi : dnrData.popUp[milestoneType].title.en;
            popUpContainer.subtitle = (locale === "hi" ? dnrData.popUp[milestoneType].subtitle.hi : dnrData.popUp[milestoneType].subtitle.en)
                .replace("{amount}", String(prizeDnr));
            popUpContainer.cta = locale === "hi" ? dnrData.popUp.cta.hi : dnrData.popUp.cta.en;
            popUpContainer.dialog_title = (locale === "hi" ? dnrData.popUp.dialog_title.hi : dnrData.popUp.dialog_title.en).replace("{amount}", String(prizeDnr));
            popUpContainer.type = dnrData.popUp[milestoneType].type;
            popUpContainer.image = dnrData.popUp[milestoneType].image;
            popUpContainer.pop_up_image = dnrData.popUp[milestoneType].pop_up_image;
            popUpContainer.max_popup_count = dnrData.popUp[milestoneType].max_popup_count;

            return popUpContainer;
        },

        async createReferralBottomSheet(locale: string, studentId){
            const milestoneType = "referral_popup";
            let localeToBeUsed = locale;
            if (locale !== "en" && locale !== "hi"){
                localeToBeUsed = "other";
            }

            let bottomSheetToBeShown = false;

            // checking if user is invitee or inviter
            let userStatus = await this.broker.call("$dnrMysql.checkingIfUserIsInvitee", {
                invitee_id: studentId,
            });

            const popUpContainer = dnrData.popUp[milestoneType].widget;
            popUpContainer.dialog_title = null;
            popUpContainer.type = dnrData.popUp[milestoneType].type;
            popUpContainer.image = dnrData.popUp[milestoneType].image;
            popUpContainer.pop_up_image = dnrData.popUp[milestoneType].pop_up_image;
            popUpContainer.no_max_limit_for_bottom_sheet = true;


            if (!_.isEmpty(userStatus) && userStatus[0].bottom_sheet_viewed_invitee === 0){
                bottomSheetToBeShown = true;
                const inviterData =  await this.broker.call("$dnrMysql.getStudentNameAndUsername", {studentId: userStatus[0].inviter_id});

                const inviterName = inviterData[0].student_fname ? inviterData[0].student_fname : inviterData[0].student_username;

                popUpContainer.title = dnrData.popUp[milestoneType].invitee_title[localeToBeUsed].replace("xxnamexx", inviterName);
                popUpContainer.subtitle = dnrData.popUp[milestoneType].subtitle[localeToBeUsed].replace("xxdnrxx", dnrData.popUp.referral_popup.dnr_reward_per_user).replace("xxpaytmxx", dnrData.popUp.referral_popup.dnr_paytm_mapping.dnr_reward_per_user);
                popUpContainer.cta = dnrData.popUp[milestoneType].cta[localeToBeUsed];

                this.broker.call("$dnrMysql.updatingInviteeViewedStatus", {
                    id : userStatus[0].id,
                });
            } else {
                userStatus = await this.broker.call("$dnrMysql.checkingIfUserIsInviter", {
                    inviter_id: studentId,
                });

                if (!_.isEmpty(userStatus) && userStatus[0].bottom_sheet_viewed_inviter === 0){
                    bottomSheetToBeShown = true;

                    const totalUsersReferred =  await this.broker.call("$dnrMysql.getReferralsCount", {
                        inviter_id: studentId,
                    });

                    if (totalUsersReferred[0].count % 5 === 0){
                        const friendsTitle = dnrData.popUp[milestoneType].friends[localeToBeUsed];
                        popUpContainer.title = dnrData.popUp[milestoneType].title[localeToBeUsed].replace("xxnamexx", totalUsersReferred[0].count + " " + friendsTitle);
                        popUpContainer.subtitle = dnrData.popUp[milestoneType].subtitle[localeToBeUsed].replace("xxdnrxx", dnrData.popUp.referral_popup.dnr_reward_per_5_users).replace("xxpaytmxx", dnrData.popUp.referral_popup.dnr_paytm_mapping.dnr_reward_per_5_users);
                        popUpContainer.cta = dnrData.popUp[milestoneType].cta[localeToBeUsed];
                    } else {
                        const lastReferredUserData =  await this.broker.call("$dnrMysql.getStudentNameAndUsername", {studentId: userStatus[0].invitee_id});
                        const studentName = lastReferredUserData[0].student_fname ? lastReferredUserData[0].student_fname : lastReferredUserData[0].student_username;
                        popUpContainer.title = dnrData.popUp[milestoneType].title[localeToBeUsed].replace("xxnamexx", studentName);
                        popUpContainer.subtitle = dnrData.popUp[milestoneType].subtitle[localeToBeUsed].replace("xxdnrxx", dnrData.popUp.referral_popup.dnr_reward_per_user).replace("xxpaytmxx", dnrData.popUp.referral_popup.dnr_paytm_mapping.dnr_reward_per_user);
                        popUpContainer.cta = dnrData.popUp[milestoneType].cta[localeToBeUsed];
                    }
                    this.broker.call("$dnrMysql.updatingInviterViewedStatus", {
                        id : userStatus[0].id,
                    });
                }
            }
            return bottomSheetToBeShown ? popUpContainer : null;
        },

        async updateNKCVideoViewDNR(prizeDnr: number, milestoneType: string, transactionData: any) {
            try {
                if ((milestoneType === "video_view" || milestoneType === "q_ask") && transactionData.question_id) {

                    const questionData = await this.broker.call("$dnrMysql.getFacultyId", {
                        question_id: transactionData.question_id,
                    });

                    const nkcFaculty = [590, 800, 803, 804, 805, 806];

                    // In case of NKC faculties, 2 * prize_dnr will be credited
                    if (questionData.length && nkcFaculty.includes(questionData[0].faculty_id)) {
                        return 2 * prizeDnr;
                    }
                }
                return prizeDnr;
            } catch (e) {
                this.logger.error(e);
                return prizeDnr;
            }
        },

        async getPopupContainer(milestoneType: string, milestone: any, request: any, currentTime: object, transactionData: any) {
            try {
                // initiating response request and returning pop up widget
                const studentId = request.meta.user.student_id;
                const achievedAmount = await this.getAchievedDNR(studentId, milestone[0]._id);
                let popUpContainer = null;
                let prizeDnr = milestone[0].prize_dnr;
                const updatedWalletLimit = achievedAmount + prizeDnr;

                // prize won = achievementCount * milestone[0].prize (Should be lass than limit per day)
                if (updatedWalletLimit <= milestone[0].limit_per_day) {
                    prizeDnr = await this.updateNKCVideoViewDNR(prizeDnr, milestoneType, transactionData);
                    const walletAmt = await this.addAmountToWallet(studentId, prizeDnr, currentTime);

                    this.broker.call("transactions.insert", {
                        transactionData: {
                            student_id: studentId,
                            dnr: prizeDnr,
                            milestone_id: new ObjectId(milestone[0]._id),
                            voucher_id: null,
                            type: 0,
                            closing_balance: walletAmt,
                            created_at: currentTime,
                            ...transactionData,
                        },
                    });
                    popUpContainer = this.createPopupResponse(request.meta.user.locale, milestoneType, prizeDnr);
                }
                return popUpContainer;

            } catch (e) {
                this.logger.error(e);
                throw (e);
            }
        },
    },
};

export = RewardPopUpSchema;
