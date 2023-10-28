/* eslint-disable max-lines-per-function */
/* eslint-disable no-underscore-dangle */
import { ServiceSchema } from "moleculer";
import _ from "lodash";

import { redisUtility } from "../../../common";
import { staticCDN } from "../../../common";
import { Data } from "../data/data";
import iasVanillaSearch from "./inapp.vanilla";

const InAppSearch: ServiceSchema = {
	name: "$inapp-search",   // Microservice name
	mixins: [iasVanillaSearch],

	// Static data and setting live_class_lecture
	settings: {
		rest: "/search",
		topicTabs: [
			{ key: "live_class", description: "Video classes", hindi: "वीडियो क्लासेस", size: 2 },
			{ key: "pdf", description: "PDFs", hindi: "पीडीएफ", size: 4 },
			{ key: "video", description: "Videos", hindi: "वीडियो", size: 4 },
			{ key: "course", description: "Course", hindi: "कोर्स", size: 2 },
			{ key: "playlist", description: "Playlist", hindi: "प्लेलिस्ट", size: 4 },
			{ key: "book", description: "Book Solutions", hindi: "पुस्तकें", size: 4 },
			{ key: "quiz", description: "QUIZ", hindi: "क्विज/परीक्षण", size: 4 },
			{ key: "teacher", description: "Teachers", hindi: "शिक्षक", size: 4 },
			{ key: "topic", description: "Topic Videos", hindi: "विषय वीडियो", size: 4 },
			{ key: "ncert", description: "NCERT", hindi: "NCERT", size: 4 },
		],
		topicBuniyadAppTabs: [
			{ key: "playlist", description: "Playlist", hindi: "प्लेलिस्ट", size: 4 },
			{ key: "book", description: "Book Solutions", hindi: "पुस्तकें", size: 4 },
			{ key: "topic", description: "Topic Videos", hindi: "विषय वीडियो", size: 4 },
			{ key: "ncert", description: "NCERT", hindi: "NCERT", size: 4 },
		],
		coursePageTabs: [
			{ key: "course", description: "Course", hindi: "कोर्स", size: 3 },
			{ key: "pdf", description: "PDFs", hindi: "पीडीएफ", size: 3 },
			{ key: "live_class", description: "Live Classes", hindi: "लाइव क्लास", size: 3 },
		],
		dafaultTab: {
			english: { key: "all", description: "All", is_vip: false },
			hindi: { key: "all", description: "सब देखें", is_vip: false },
		},
		subjectHindi: {
			"maths": "गणित",
			"science": "विज्ञान",
			"english": "अंग्रेज़ी",
			"chemistry": "रसायन विज्ञान",
			"physics": "भौतिक विज्ञान",
			"biology": "जीवविज्ञान",
			"accounting": "लेखांकन",
			"economics": "अर्थशास्त्र",
			"social science": "सामाजिक विज्ञान",
			"grammar": "व्याकरण",
		},
		languageMapping: {
			en: "English",
			hi: "Hindi",
			bn: "Bangla",
			te: "Telugu",
			ta: "Tamil",
			kn: "Kannada",
			ma: "Marathi",
		},
	},
	// Dependencies goes here
	dependencies: [],

	// Actions goes here
	actions: {
		// bulk: { visibility: "public" },
		// create: { visibility: "public" },
		// get: { visibility: "public" },
		// update: { visibility: "public" },
		// delete: { visibility: "public" },
		// search: { visibility: "public" },
		matches: {
			circuitBreaker: {
				enabled: true,
				minRequestCount: 400,
				halfOpenTime: 30 * 1000,
			},
			rest: {
				method: "POST",
				path: "/matches",
			},

			async handler(ctx) {
				try {
					const studentId: number = ctx.meta.user.id;
					const text: string = ctx.params.text;
					const versionCode = ctx.meta.versionCode ? ctx.meta.versionCode : 688;
					const locale = (ctx.meta.user.locale && ctx.meta.user.locale === "hi") ? "hi" : "en";
					const lang = (ctx.meta.user.locale) ? ctx.meta.user.locale : "other";
					const tabs_filter = ctx.params.tabs_filter || {};
					const isTopTagsClicked = (ctx.params.search_trigger && ctx.params.search_trigger === "top_tags_clicked");
					const stClass: string = ctx.params.class || "12";
					const source = ctx.params.source;
					const userBoard: string =  ctx.params.board ? ctx.params.board : "";
					const userExams: string =  ctx.params.exam ? ctx.params.exam : "";
					const packageValue = ctx.meta.packageName;

					// ias service flagr
					let iasFlagPayload: any = {};
					const flagAnalytics: any = [];
					const iasService: any = await this.getFlagrResponse(studentId);
					if (iasService.ias_service && iasService.ias_service.enabled) {
						flagAnalytics.push({ flag_name: "ias_service", variant_id: iasService.ias_service.variantId });
						iasFlagPayload = iasService.ias_service.payload || {};
					}

					const facetOrderEnabled = (iasFlagPayload && iasFlagPayload.facetOrderEnabled) ? iasFlagPayload.facetOrderEnabled : false;
					const textAfterSynonyms = await this.getTextAfterSynonymsReplace(text);
					const userContext = this.getUserContext(userBoard, userExams, lang);
					const finalResult = await this.newVanillaSearch(textAfterSynonyms, stClass, versionCode, iasFlagPayload, tabs_filter, source, userContext, locale, facetOrderEnabled, packageValue);
					if (iasFlagPayload && iasFlagPayload.version !== "v7.2"){
						if (!source || (source && source !== "LibraryFragmentHome")){
							await Promise.all([
								this.getAllLiveClassChapter(tabs_filter, finalResult, locale, stClass, textAfterSynonyms, isTopTagsClicked, iasFlagPayload),
								this.AllinOnePdf(finalResult, stClass),
							]);
						}
						if (iasFlagPayload.banner_count && _.includes(iasFlagPayload.banner_source_list, source) && packageValue !== "com.doubtnut.android.buniyad"){
							const courseBannerData: any = await this.broker.call("$sync-raw.getLatestCourseByCCMID", { studentId, limit: iasFlagPayload.banner_count});
							if (courseBannerData && courseBannerData.length){
								finalResult.course_banner_data = { title: null, tab_type: "banner", position: iasFlagPayload.banner_position || 1, list: courseBannerData};
							}
						}
					}
					if (iasFlagPayload.is_price_show){
						await this.premiumContentCheck(finalResult, studentId);
					}
					const feedbackData: any = {};

					const result = {
						tabs: finalResult.tabs,
						list: finalResult.output,
						landing_facet_type: finalResult.landing_facet_type,
						isVipUser: false,
						ias_facets: [],
						...(packageValue !== "com.doubtnut.android.buniyad" && {banner_data: finalResult.course_banner_data}),
						feed_data: feedbackData,
					};
					return { meta: { analytics: { variant_info: flagAnalytics } }, data: result };
				} catch (e) {
					this.logger.error(e);
					throw e;
				}
			},
		},
	},

	events: {

	},

	methods: {
		async getFlagrResponse(studentId: number) {
			let iasService: any = {};
			try {
				iasService = await this.broker.call("$app-config.get-flagr", { capabilities: { ias_service: {} }, entityId: `${studentId}` });
				return iasService;
			} catch (e) {
				iasService = {
					ias_service : {
						enabled : "true",
						variantId : 1667,
						payload : {
							"banner_count": 1,
							  "banner_position ": 1,
							"banner_source_list": [
								"HomeFeedFragmentV2",
								"LibraryFragmentHome",
							],
							"camera_slp_search_variant": 1,
							"count": 15,
							"data_logs_delay": 1000,
							"enabled": true,
							"feedback_time": 150,
							"index": "micro_ias_v30",
							"is_feedback_show": false,
							"is_price_show": true,
							"is_suggester_enabled": 0,
							"latest_live_class_tab": true,
							"testing_extras_meta_data": 1,
							"version": "v12.5",
							"video_order_change": true,
						},
					},
				};
				this.logger.error(e);
				return iasService;
			}
		},

		async getBatchByAssortmentListAndStudentId(studentId, assortmentList, checkActiveSubscriptions) {
			const obj: any = {}; let i: number;
			const latestBatchMcall = [];
			if (assortmentList && assortmentList.length) {
				const checkPurchaseHistory = await this.broker.call("$sync-raw.getUserExpiredPackages", { studentId });
				for (i = 0; i < assortmentList.length; i++) {
					const currentAssortmentPurchaseHistory = _.find(checkPurchaseHistory, ["assortment_id", +assortmentList[i]]) || _.find(checkActiveSubscriptions, ["assortment_id", +assortmentList[i]]);
					if (currentAssortmentPurchaseHistory && assortmentList[i]) {
						obj[assortmentList[i]] = currentAssortmentPurchaseHistory.batch_id;
					} else if (assortmentList[i]) {
						latestBatchMcall.push({ action: "$sync-raw.getLastestBatchByAssortment", params: { assortmentId: assortmentList[i] } });
					}
				}
				const latestBatch = await this.broker.mcall(latestBatchMcall);
				for (i = 0; i < latestBatch.length; i++) {
					if (latestBatch[i].length) {
						obj[latestBatch[i][0].assortment_id] = latestBatch[i][0].batch_id;
					}
				}
			}
			return obj;
		},

		async pricingExperiment(experimentPackages, studentId) {
			const capabilities: any = {};
			let i: number;
			for (i = 0; i < experimentPackages.length; i++) {
				capabilities[experimentPackages[i].flag_key] = {};
			}
			const flagrResponse = await this.broker.call("$app-config.get-flagr", { capabilities, entityId: `${studentId}` });
			const pricingMcall = [];
			for (const key in capabilities) {
				if (capabilities[key]) {
					const keyId = _.get(flagrResponse, `${key}.payload.key`, null) || 1;
					pricingMcall.push({ action: "$sync-raw.getAllVariantFromAssortmentIdHome", params: { flagKey: key, variantId: keyId} });
				}
			}
			const result = await this.broker.mcall(pricingMcall);
			let pricing = [];
			for (i = 0; i < result.length; i++) {
				if (result[i].length) {
					pricing = [...pricing, ...result[i]];
				}
			}
			return pricing;
		},

		async premiumContentCheck(data, studentId){
			const assortmentIdMcall: any = []; const checkExperiment = [];
			const assortmentIdList = []; const assortmentListObj: any = {};
			let i: number; let j: number;
			if (data && data.output && data.output.length){
				for (i = 0; i < data.output.length; i++){
					if (data.output[i].tab_type === "course" || data.output[i].tab_type === "pdf"){
						for (j = 0; j < data.output[i].list.length; j++){
							if (data.output[i].list[j]._source.is_free === 0 && data.output[i].list[j]._source.assortment_id){
								const assortmentId = data.output[i].list[j]._source.assortment_id;
								assortmentIdList.push(assortmentId);
								assortmentIdMcall.push({ action: "$sync-raw.getDefaultVariantFromAssortmentIdHome", params: { assortmentId } });
							}
						}
					}
				}
			}

			const allPackages: any = await this.broker.mcall(assortmentIdMcall);
			for (i = 0; i < allPackages.length; i++) {
				if (allPackages[i].length && allPackages[i][0].assortment_id){
					assortmentListObj[allPackages[i][0].assortment_id] = allPackages[i];
				}
				for (j = 0; j < allPackages[i].length; j++) {
					if (allPackages[i][j].flag_key && allPackages[i][j].flag_key !== "" && checkExperiment.indexOf({ flag_key: allPackages[i][j].flag_key, assortment_id: allPackages[i][j].assortment_id }) < 0) {
						checkExperiment.push({ flag_key: allPackages[i][j].flag_key, assortment_id: allPackages[i][j].assortment_id });
					}
				}
			}
			let experimentPricing = [];
			if (checkExperiment.length && studentId) {
				experimentPricing = await this.pricingExperiment(checkExperiment, studentId);
			}

			const enabled = true;
			const checkActiveSubscriptions: any = await this.broker.call("$sync-raw.getUserActivePackages", { studentId});
			const userBatches = await this.getBatchByAssortmentListAndStudentId(studentId, assortmentIdList, checkActiveSubscriptions);
			const userActiveAssortment: any = [];
			if (checkActiveSubscriptions && checkActiveSubscriptions.length){
				checkActiveSubscriptions.forEach((x: { assortment_id: number | string }) => {
					userActiveAssortment.push(x.assortment_id);
				});
			}

			if (assortmentIdList && assortmentIdList.length){
				for (i = 0; i < data.output.length; i++){
					if (data.output[i].tab_type === "course" || data.output[i].tab_type === "pdf"){
						for (j = 0; j < data.output[i].list.length; j++){
							const isFree = data.output[i].list[j]._source.is_free;
							const assortmentId = data.output[i].list[j]._source.assortment_id;
							const subAssortmentId = data.output[i].list[j]._source.subject_assortment_id;
							const courseAssortmentId = data.output[i].list[j]._source.course_assortment_id;
							const resourcePath = data.output[i].list[j]._source.resource_path;
							if (isFree === 0 && assortmentId && assortmentListObj[assortmentId] && assortmentId === assortmentListObj[assortmentId][0].assortment_id){
								assortmentListObj[assortmentId] = assortmentListObj[assortmentId].filter((item: { flag_key: any}) => !item.flag_key);
								const experiementObj = experimentPricing.filter(item => item.assortment_id === assortmentListObj[assortmentId][0].assortment_id);
								if (experiementObj.length) {
									assortmentListObj[assortmentId] = [...assortmentListObj[assortmentId], ...experiementObj];
									assortmentListObj[assortmentId] = _.orderBy(assortmentListObj[assortmentId], "duration_in_days");
								}
								if (userBatches[assortmentListObj[assortmentId][0].assortment_id]) {
									const latestBatch = assortmentListObj[assortmentId].filter((item: { batch_id: any}) => item.batch_id === userBatches[assortmentListObj[assortmentId][0].assortment_id]);
									assortmentListObj[assortmentId] = latestBatch.length ? latestBatch : assortmentListObj[assortmentId];
								}
								const priceObj = enabled ? assortmentListObj[assortmentId][0] : assortmentListObj[assortmentId][assortmentListObj[assortmentId].length - 1];
								if (priceObj) {
									const monthlyCoursePrice = (data.output[i].tab_type === "course" && priceObj.display_price && priceObj.duration_in_days) ? Math.floor(priceObj.display_price / Math.floor(priceObj.duration_in_days / 30)) : null;
									data.output[i].list[j]._source.course_price = monthlyCoursePrice ? `₹${monthlyCoursePrice}/Month` : `Only ₹${priceObj.display_price}/-`;
									data.output[i].list[j]._source.deeplink_url = (data.output[i].tab_type === "pdf") ? `doubtnutapp://vip?variant_id=${assortmentListObj[assortmentId][0].variant_id}` : data.output[i].list[j]._source.deeplink_url;
									data.output[i].list[j]._source.resource_path = null;
								}
							}

							if (userActiveAssortment && userActiveAssortment.length && (_.includes(userActiveAssortment, assortmentId) || (subAssortmentId && _.includes(userActiveAssortment, subAssortmentId)) || (courseAssortmentId && _.includes(userActiveAssortment, courseAssortmentId)))){
								data.output[i].list[j]._source.course_price = null;
								data.output[i].list[j]._source.deeplink_url = (data.output[i].tab_type === "pdf") ? `doubtnutapp://pdf_viewer?pdf_url=${resourcePath}` : data.output[i].list[j]._source.deeplink_url;
								data.output[i].list[j]._source.button_details = null;
							}
						}
					}
				}
			}
		},
		async getTextAfterSynonymsReplace(text) {
			text = text.replace(/^[,;.@\\%*#~!\s]*|[,;.@\\%*#~!\s]*$/g, "").toLowerCase();
			const searchText: string[] = [];
			let i: number;
			text = text.split(" ");
			const arr: any[] = await redisUtility.getMultiHashField.bind(this, "IAS_NORMAL_SYNONYMS", text)();
			for (i = 0; i < text.length; i++) {
				let pushText = text[i];
				if (arr[i]) {
					pushText = arr[i].correctKey;
					if (arr[i].isObject) {
						pushText = text[i];
						const parseedFieldData = JSON.parse(arr[i].correctKey);
						if (parseedFieldData[`${text[i + 1]}`]) {
							pushText = parseedFieldData[`${text[i + 1]}`];
							i++;
						}
					}
				}
				searchText.push(pushText);
			}
			return searchText.length ? searchText.join(" ") : text.join(" ");
		},

		getUserContext(userBoard: any, userExam: any, langs: any){
			let i: number;
			let str;
			const exams: any = [];
			const boards: any = [];
			const lang = (langs && (langs === "en" || langs === "hi")) ? langs : "others";
			const board = userBoard.toLowerCase().split(" ");
			const exam = userExam.toLowerCase().split(", ");
			for (i = 0; i < board.length; i++ ){
				str = board[i].split(" ").join("_");
				boards.push(str);
			}
			for (i = 0; i < exam.length; i++ ){
				str = exam[i].split(" ").join("_");
				exams.push(str);
			}
			return {exam: exams, board: boards, language: lang };
		},

		async newVanillaSearch(text: string, stClass: string, versionCode, iasFlagPayload: any, tabs_filter: any, source: string, userContext: any, locale: any, facetOrderEnabled: any, packageName: string){
			const {result, tabsFilterList, lang, facetList}  = await this.getNewVanillaSearch(text, stClass, versionCode, 0, iasFlagPayload, tabs_filter, source, userContext, facetOrderEnabled);
			const finalResult: any = await this.finalResponseFormatter(result, lang, text, versionCode, source, iasFlagPayload, locale, facetOrderEnabled, facetList, packageName);
			if (iasFlagPayload && iasFlagPayload.version !== "v7.2" && (!source || (source && source !== "LibraryFragmentHome"))){
				this.addFilterList(finalResult, tabsFilterList);
			}
			return finalResult;
		},

		latestLiveClassDataFormat(liveVideoData: any, subject: string, lang: string, locale: string){
			if (!liveVideoData || !liveVideoData.length){
				return [];
			}
			const data: any = []; let i: number;
			for ( i = 0; i < liveVideoData.length; i++ ){
				const obj: any = {_index: "micro_ias"};
				subject = subject.toLowerCase();
				let display = liveVideoData[i].chapter ? `${liveVideoData[i].chapter} | ${liveVideoData[i].display}` : liveVideoData[i].display;
				display = (lang === "hindi") ? `${this.settings.subjectHindi[subject] || _.startCase(subject)} | ${display}` : `${_.startCase(subject)} | ${display}`;

				let breadcrumbs = liveVideoData[i].expert_name ? `${_.startCase(_.toLower(liveVideoData[i].expert_name))} | Class ${liveVideoData[i].class}` : `Class ${liveVideoData[i].class}`;
				if ((liveVideoData[i].class).toString() === "14"){
					breadcrumbs = liveVideoData[i].expert_name ? `${_.startCase(_.toLower(liveVideoData[i].expert_name))} | Govt. Exams` : "Govt. Exams";
				}
				const image_url = (liveVideoData[i].resource_type === 1 && liveVideoData[i].player_type !== "livevideo") ? `https://img.youtube.com/vi/${liveVideoData[i].id}/hqdefault.jpg` : `${staticCDN}q-thumbnail/${liveVideoData[i].id}.png`;
				obj._source = {id: liveVideoData[i].id, display, breadcrumbs, image_url, duration: 0, tab_type: "latest_live_class", type: "video", premium_meta_content: { title: (locale && locale === "hi") ? "नई लाइव क्लास" : "Latest Live Class",
					gradient_bg_color: ["#a1d76f", "#e8fd96"]}, page: "SEARCH_SRP" };
				data.push(obj);
			}
			return data;
		},

		getSubjectFromSearchText(text) {
			let i: number; text = text.toLocaleLowerCase().split(" ");
			const longSubRegex = Data.longSubjectRegex;
			for ( i = 0; i < text.length; i++){
				if (text[i] && text[i].length && longSubRegex[text[i]] ){
					if (typeof longSubRegex[text[i]] === "string") {
						return longSubRegex[text[i]];
					}
					if (typeof longSubRegex[text[i]] === "object" && ((i < text.length - 1 && text[i + 1] && longSubRegex[text[i]][text[i + 1]]) || longSubRegex[text[i]]["1#1"])){
						return longSubRegex[text[i]][text[i + 1]] || longSubRegex[text[i]]["1#1"];
					}
				}
			}

			const shortSubRegex = Data.shortSubjectRegex;
			for (i = 0 ; i < text.length; i++){
				if (text[i] && text[i].length && shortSubRegex[text[i]]){
					return shortSubRegex[text[i]];
				}
			}
			return null;
		},

		async isHindiString(questionString) {
			const numberOfHindiCharacters = 128;
			const unicodeShift = 0x0900;
			const hindiAlphabet = [];
			for (let i = 0; i < numberOfHindiCharacters; i++) {
				hindiAlphabet.push(`\\u0${(unicodeShift + i).toString(16)}`);
			}
			const regex = new RegExp(`(?:^|\\s)[${hindiAlphabet.join("")}]+?(?:\\s|$)`, "g");
			const matchRes = questionString.match(regex);
			return (matchRes && matchRes.length) ? true : false;
		},

		async getLatestLiveClassWithDualLang(searchText: any, stClass: any, baseData: any, liveIndex: number, iasFlagPayload: any, userContext: any, locale: any) {
			const subject = this.getSubjectFromSearchText(searchText);
			const lang = await this.isHindiString(searchText) ? "hindi" : "english";
			let englishLatestLiveClassData: any = [];
			// let alternateSearchText = (lang === "english" && Data.iasTopTagsEngHin[searchText.toLocaleLowerCase()]) ? Data.iasTopTagsEngHin[searchText.toLocaleLowerCase()] : searchText;
			// alternateSearchText = (lang === "hindi" && Data.iasTopTagsHinEng[searchText]) ? Data.iasTopTagsHinEng[searchText] : alternateSearchText;
			// const dualLangResult = await this.newVanillaSearch(alternateSearchText, stClass.toString(), 900, iasFlagPayload, { liveClass: {} }, "", userContext, locale);
			// if (dualLangResult && dualLangResult.output && dualLangResult.output.length && dualLangResult.output[0].list &&
			// 	dualLangResult.output[0].list.length) {
			// 	baseData.output[liveIndex].text = searchText;
			// 	baseData.output[liveIndex].filter_list = baseData.tabs[liveIndex + 1].filterList;
			// 	baseData.output[liveIndex].description = lang === "hindi" ? "हिंदी में देखे " : "See in English";
			// 	baseData.output[liveIndex].secondary_list = dualLangResult.output[0].list;
			// 	baseData.output[liveIndex].secondary_text = alternateSearchText;
			// 	baseData.output[liveIndex].secondary_filter_list = dualLangResult.tabs[1].filterList || [];
			// 	baseData.output[liveIndex].secondary_description = lang === "hindi" ? "See in English" : "हिंदी में देखे ";
			// }
			if (subject && iasFlagPayload.latest_live_class_tab) {
				const latestLiveClassDataEnglish = await this.broker.call("$sync-raw.getLatestLiveClassData", { stClass, subject, lang });
				if (latestLiveClassDataEnglish && latestLiveClassDataEnglish.length){
					englishLatestLiveClassData = this.latestLiveClassDataFormat(latestLiveClassDataEnglish, subject, lang, locale);
					const latestLiveClassListObj: any = {
						tab_type: "latest_live_class",
						size: iasFlagPayload.latest_live_class_size || 2,
						seeAll: true,
						list: englishLatestLiveClassData,
					};
					latestLiveClassListObj.title = ((locale && locale === "hi") || (lang && lang === "hindi")) ? "लाइव क्लास" : "Live Class";
					if (iasFlagPayload.latest_live_class_length){
						latestLiveClassListObj.list = latestLiveClassListObj.list.slice(0, iasFlagPayload.latest_live_class_length);
					}
					baseData.output.splice(liveIndex, 0, latestLiveClassListObj);
					baseData.landing_facet_type = "latest_live_class";
					const latestLiveClassTabObj: any = {key: "latest_live_class", is_vip: false};
					latestLiveClassTabObj.description = ((locale && locale === "hi") || (lang && lang === "hindi")) ? "लाइव क्लास" : "Live Class";
					baseData.tabs.splice(liveIndex + 1, 0, latestLiveClassTabObj);
				}
			}
		},

		async getAllLiveClassChapter(tabs_filter, baseData, locale, stClass, searchText, isTopTagsClicked, iasFlagPayload, userContext){
			let language: string = (locale === "hi") ? "HINDI" : "ENGLISH";
			const selectedFilter: any = {}; let liveIndex: number;
			let i: number; let j: number;
			if (baseData && baseData.output && baseData.output.length){
				for (i = 0; i < baseData.output.length; i++){
					if (baseData.output[i].tab_type === "live_class"){
						liveIndex = i;
					}
				}
				if ((liveIndex || liveIndex === 0) && liveIndex < baseData.output.length){
					const filterList = (!_.isEmpty(tabs_filter) && tabs_filter.live_class) ? Object.keys(tabs_filter.live_class) : [];
					for (j = 0; j < filterList.length; j++ ){
						for (i = 0; i < tabs_filter.live_class[filterList[j]].length; i++){
							if (tabs_filter.live_class[filterList[j]][i].is_selected){
								selectedFilter[filterList[j]] = tabs_filter.live_class[filterList[j]][i].value;
								break;
							}
						}
					}
					stClass = selectedFilter.class || stClass;
					language = selectedFilter.language || language;
					language = (stClass === "13") ? "ENGLISH" : language;
					language = (stClass === "14") ? "HINDI" : language;
					stClass = +stClass;

					const courseDetails = await this.broker.call("$sync-raw.getCourseDetails", { stClass, language});
					if (courseDetails && courseDetails.length && courseDetails[0].medium){
						courseDetails[0].display = (locale === "hi") ? "सभी अध्याय देखें" : "View All Chapters";
						baseData.output[liveIndex].chapter_details = courseDetails[0];
					}
				}

				if ((liveIndex || liveIndex === 0) && isTopTagsClicked && stClass.toString() !== "13"){
					await this.getLatestLiveClassWithDualLang(searchText, stClass, baseData, liveIndex, iasFlagPayload, userContext, locale);
				}
			}
		},

		AllinOnePdf(baseData, stClass){
			let pdfIndex: number;
			const ClassIdMapping = { 11 : 104585, 12 : 104584 };
			if (stClass >= 10 && stClass <= 13){
				if (baseData && baseData.output && baseData.output.length){
					for (pdfIndex = 0; pdfIndex < baseData.output.length; pdfIndex++){
						if (baseData.output[pdfIndex].tab_type === "pdf"){
							const chapter_details_obj: any = {};
							chapter_details_obj.deeplink_url = (stClass === "10") ? "doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/Doubtnut_ALL_IN_ONE_PDF_CLASS_10.pdf" : `doubtnutapp://playlist?playlist_id=${ClassIdMapping[12]}&playlist_title=All In One PDF&is_last=0`;
							chapter_details_obj.class = stClass;
							chapter_details_obj.medium = "";
							chapter_details_obj.display = "All In One PDF";
							baseData.output[pdfIndex].chapter_details = chapter_details_obj;
							break;
						}
					}
				}
			}
		},

		async getFinalTabList(text, tabslist: any[]) {
			if (text.length > 55) {
				const videoTabData = tabslist.splice(1, 1);
				return [[...videoTabData, ...tabslist], "video"];
			}
			text = text.toLowerCase().split(" ");
			let i: number;
			const dynamictab: any = {};
			const leftTabData: any[] = [];
			const rightTabData: any[] = [];
			const tabsData = await redisUtility.getMultiHashField.bind(this, "IAS_FACET", text)();
			for (i = 0; i < text.length; i++) {
				if (tabsData[i]) {
					if (!tabsData[i].isObject && text[i] === tabsData[i].searchKey) {
						dynamictab[tabsData[i].type] = true;
					}
					else {
						const parseTabData = JSON.parse(tabsData[i].type);
						if (i < text.length && text[i] === tabsData[i].searchKey) {
							if (parseTabData[""] && !dynamictab[parseTabData[""]]){
								dynamictab[parseTabData[""]] = true;
							}
							if (parseTabData[text[i + 1]] && !dynamictab[parseTabData[text[i + 1]]]){
								dynamictab[parseTabData[text[i + 1]]] = true;
							}
						}
					}
				}
			}

			tabslist.forEach(x => {
				if (dynamictab[x.key]) {
					leftTabData.push(x);
				} else { rightTabData.push(x); }
			});
			const facetType = Object.keys(dynamictab);
			if ( facetType && facetType.length){
				return [[...leftTabData, ...rightTabData], facetType[0]] ;
			}
			return [[...leftTabData, ...rightTabData], null];
		},

		async resultFaceting(results: any, lang, searchText: string, versionCode, source: string, iasFlagPayload: any, locale: any, facetOrderEnabled: any, facetOrder: any, packageName: string) {
			const output: any = []; const tabs: any = []; let i: number; let j: number;
			let recommended_count = 0;
			if (results.video && results.video.length) {
				for (i = 0; i < results.video.length; i++) {
					if (results.video[i]._source.is_recommended) {
						results.video[i]._source.is_recommended = false;
						if (recommended_count < 2) {
							recommended_count = recommended_count + 1;
							results.video[i]._source.is_recommended = true;
						}
					}
				}
			}
			// result faceting goes here
			let tabObj: any = {}; let outputObj: any = {};
			let tabsList = (source && source === "LibraryFragmentHome") ? ((packageName === "com.doubtnut.android.buniyad") ? _.cloneDeep(this.settings.topicBuniyadAppTabs) : _.cloneDeep(this.settings.coursePageTabs)) : ((packageName === "com.doubtnut.android.buniyad") ? _.cloneDeep(this.settings.topicBuniyadAppTabs) : _.cloneDeep(this.settings.topicTabs));
			const finalTabListData = await this.getFinalTabList(searchText, tabsList);
			if (facetOrderEnabled && facetOrder && facetOrder.length) {
				tabsList = [];

				for (i = 0; i < facetOrder.length; i++) {
					if (facetOrder[i] === "liveClass") {
						facetOrder[i] = "live_class";
					}
					for (j = 0; j < finalTabListData[0].length ; j++) {
						if (facetOrder[i] === finalTabListData[0][j].key) {
							tabsList.push(finalTabListData[0][j]);
						}
					}
				}
			} else {
				tabsList = finalTabListData[0];
			}
			let landing_facet_type = finalTabListData[1];
			for (i = 0; i < tabsList.length; i++) {
				const tab = tabsList[i];
				if (locale === "hi" || lang === "hindi") {
					tab.description = tab.hindi;
				}
				if (results[tab.key] && results[tab.key].length) {
					let seeAll = true;
					if (results[tab.key].length < tab.size) {
						seeAll = false;
					}
					outputObj = {
						title: tab.description, tab_type: tab.key, size: iasFlagPayload[`${tab.key}_size`] || tab.size, seeAll, list: results[tab.key],
					};
					tabObj = { key: tab.key, description: tab.description };
					tabObj.is_vip = (tab.key === "live_class_vip") ? true : false;

					if (+versionCode <= 919 && tab.key === "course"){
						landing_facet_type = null;
						continue;
					}
					output.push(outputObj);
					tabs.push(tabObj);
				}
			}
			return { tabs, output, landing_facet_type};
		},

		async finalResponseFormatter(result: any, lang: string, searchText: string, versionCode = 870, source, iasFlagPayload: any, locale: any, facetOrderEnabled: any, facetOrder: any, packageName: string) {
			result = result.reduce((r: { [x: string]: any }, a: { _source: { tab_type: string | number } }) => {
				// eslint-disable-next-line no-underscore-dangle
				r[a._source.tab_type] = [...r[a._source.tab_type] || [], a];
				return r;
			}, {});
			if (result.book && result.book.length) {
				result.book.map((x: { _source: { image_url: string } }) => {
					x._source.image_url = x._source.image_url || `${staticCDN}images/inapp_book.png`;
					return x;
				});
			}
			const { tabs, output, landing_facet_type } = await this.resultFaceting(result, lang, searchText, versionCode, source, iasFlagPayload, locale, facetOrderEnabled, facetOrder, packageName);
			const language = ((locale && locale === "hi") || (lang && lang === "hindi")) ? "hindi" : "english";
			if (tabs.length) {
				tabs.unshift(_.cloneDeep(this.settings.dafaultTab[language]));
			}
			return { tabs, output, landing_facet_type };
		},
	},
};

export = InAppSearch;

