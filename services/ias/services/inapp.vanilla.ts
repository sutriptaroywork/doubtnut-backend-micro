/* eslint-disable max-lines-per-function */
/* eslint-disable no-underscore-dangle */
import http from "http";
import https from "https";
import { ServiceSchema } from "moleculer";
import moment from "moment";
import _ from "lodash";
import axios from "axios";
import {staticCDN} from "../../../common";

const axiosInstanceEs5 = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
	baseURL: process.env.INAPP_ES_HOST,
	headers: {
		"Content-Type": "application/json",
	},
});

const axiosInstanceNew = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
	baseURL: process.env.VANILLA_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

const iasVanillaSearch: ServiceSchema = {
	name: "$ias-vanilla",
	mixins: [],
    settings: {
        content_types: ["liveClass", "video", "ncert", "playlist", "topic", "book", "pdf", "quiz", "teacher"],
        colorCodeInApp: ["#DBF2D9", "#D9EEF2", "#F2DDD9", "#F2EED9", "#D9DFF2", "#EBD9F2"],
		resultCount: 10,
		facetList: ["liveClass", "video", "book", "pdf", "teacher", "topic", "ncert", "playlist", "quiz"],
		vanillaFilterTerms:{
			class: "studentClass",
			live_class: "liveClass",
		},
		filterWordMap:{
			hindi:{
				class: "कक्षा",
				language: "भाषा",
				subject: "विषय",
				chapter: "अध्याय",
				book_name: "पुस्तक",
				author: "लेखक",
				publication: "प्रकाशन",
				board: "बोर्ड",
				exam: "परीक्षा",
			},
			english:{
				class: "Class",
				language: "Language",
				subject: "Subject",
				chapter: "Chapter",
				book_name: "Book",
				author: "Author",
				publication: "Publication",
				board: "Board",
				exam: "Exam",
			},
		},
		classLabelMapping:{
			6: "Class 6",
			7: "Class 7",
			8: "Class 8",
			9: "Class 9",
			10: "Class 10",
			11: "Class 11",
			12: "Class 12",
			13: "Dropper/Repeat Year",
			14: "Govt. Exams",
		},
		filterOrderFacetWise: {
			liveClass : [ "studentClass", "subject", "chapter", "language"],
			video : [ "studentClass", "subject", "chapter"],
			book : ["studentClass", "subject", "author", "publication", "book_name", "language"],
			pdf : ["studentClass", "subject", "author", "book_name"],
			teacher : ["studentClass", "subject", "language", "board", "exam"],
			topic : ["studentClass", "subject"],
			ncert : ["studentClass", "subject"],
			playlist : ["studentClass", "subject"],
			quiz : ["studentClass", "subject"],
		},
		languageMapping: { "en": "English", "hi-en": "English", "hi": "Hindi", "bn-en": "Bangla", "kn-en": "Kannada", "te-en": "Telugu", "ta-en": "Tamil" },
		sidForQidsRemove: [1, 95, -55, -56, -50, -48, -41, -35, -34, -32, -25, -23, -22, -12, -11, -10, -8, -5, -4, 22, 69, 73, 77, 78, 88, 89, 90, 91],
		thumbnailSid: [80, -56, 94, 81, 84, 93, 94, -24, 95, -55, -53],
		repoIndexWithSynonyms: "question_bank_stem_stop_synonyms_v7",
		repoIndexType: "repository",
    },
    dependencies: [],
    actions: {
		getVanillaResult:{
			handler(ctx) {
				try {
					const data: any = ctx.params.body;
					return axiosInstanceNew({
						method: "get",
						url: "api/v1/suggest",
						timeout: 2500,
						data,
					});
                } catch (e) {
                    this.logger.error(e);
                }
			},
		},
    },
    events: {
    },
    methods: {

		async qAskResponseFormatter(videoDataQAsk: any, stClass: any, lang: any) {
			let i: number; const coreLoopVideoArr = [];
			for (const qData of videoDataQAsk) {
				if (qData && qData._source){
					const obj: any = {
						_index: qData._index,
						_type: qData._type,
						_id: qData._id,
						_score: qData._score,
						_source: {
							id: qData._id,
							student_id: qData._source.student_id,
							class: stClass,
							type: "video",
							isVip: false,
							page: "SEARCH_SRP",
							tab_type: "video",
							breadcrumbs: "Video",
							search_key: qData._source.ocr_text,
							image_url: null,
							subject: qData._source.subject,
							bg_color: _.sample(this.settings.colorCodeInApp),
							language: this.settings.languageMapping[qData._source.video_language],
							duration: "0",
						},
					};
					obj._source.display = (lang === "hindi" && qData._source.ocr_text_hi)  ? qData._source.ocr_text_hi : qData._source.ocr_text;
					if (!obj._source.display || !obj._source.display.length){
						obj._source.display = qData._source.ocr_text_hi;
					}
					if (!_.includes(this.settings.sidForQidsRemove, qData._source.student_id)) {
						if (_.includes(this.settings.thumbnailSid, qData._source.student_id)) {
							obj._source.image_url = `${staticCDN}q-thumbnail/${qData._id}.png`;
						}
						coreLoopVideoArr.push(obj);
					}
				}
			}

			return { coreLoopVideoArr };
		},

		getSelectedFilter(tabs_filter){
			const selectedFilter: any = {}; let i: number; let j: number;
			const selectedFilterObject: any = {};
			const vanillaTerms = this.settings.vanillaFilterTerms;
			const tabType = Object.keys(tabs_filter);
			if (!tabType.length){
				return {selectedFilter, selectedFilterObject};
			}

			const filterType = Object.keys(tabs_filter[tabType[0]]);
			const selectedFacet = vanillaTerms[tabType[0]] || tabType[0];
			selectedFilter[selectedFacet] = {};
			selectedFilterObject[selectedFacet] = {};

			for (i = 0; i < filterType.length; i++){
				const filterTypeValue = tabs_filter[tabType[0]][filterType[i]];
				const selectedFacetFilter =  vanillaTerms[filterType[i]] || filterType[i];
				selectedFilter[selectedFacet][selectedFacetFilter] = [];
				selectedFilterObject[selectedFacet][selectedFacetFilter] = {};
				for (j = 0; j < filterTypeValue.length; j++ ){
					if (filterTypeValue[j].is_selected){
						if (filterType[i] === "board" || filterType[i] === "exam"){
							selectedFilter[selectedFacet][selectedFacetFilter].push(filterTypeValue[j].key);
							selectedFilterObject[selectedFacet][selectedFacetFilter][filterTypeValue[j].key] = true;
						} else {
							selectedFilter[selectedFacet][selectedFacetFilter].push(filterTypeValue[j].value);
							selectedFilterObject[selectedFacet][selectedFacetFilter][filterTypeValue[j].value] = true;
						}
					}
				}
			}
			if (tabType[0] !== "all"){
				return {selectedFilter, selectedFilterObject};
			}

			const possibleFacetList = this.settings.facetList;
			const allFilters: any = {};
			possibleFacetList.forEach(x => {
				allFilters[x] = selectedFilter.all;
			});
			return {selectedFilter: allFilters, selectedFilterObject};
		},

		async getTabsFilterList(selectedFilterObjectData: any, filters: any, lang: string){
			const facetList = Object.keys(filters); let i: number;
			const finalFacetFilterData: any = {};
			const  selectedTab = Object.keys(selectedFilterObjectData);
			const allFacetClassList = []; const allFacetSubjectList = [];
			const tabName = selectedTab.length ? selectedTab[0] : null;

			if (!facetList.length){
				return {};
			}

			for (i = 0; i < facetList.length; i++){
				const facetFilterList = this.settings.filterOrderFacetWise[facetList[i]];
				const actualFacet = facetList[i] === "liveClass" ? "live_class" : facetList[i];
				finalFacetFilterData[actualFacet] = []; let j: number;

				for (j = 0; facetFilterList && j < facetFilterList.length; j++){
					const filterType = facetFilterList[j] === "studentClass" ? "class" : facetFilterList[j];
					const list = []; let k: number;
					for (k = 0; filters[facetList[i]][facetFilterList[j]] && k < filters[facetList[i]][facetFilterList[j]].length; k++){
						let obj: any = {value: filters[facetList[i]][facetFilterList[j]][k].text, is_selected: false};
						if (filterType === "board" || filterType === "exam"){
							obj = {key: filters[facetList[i]][facetFilterList[j]][k].id, value: filters[facetList[i]][facetFilterList[j]][k].text, is_selected: false};
						}
						if (tabName && facetList[i] === tabName && selectedFilterObjectData[tabName][facetFilterList[j]]) {
							if ((filterType === "board" || filterType === "exam") && selectedFilterObjectData[tabName][facetFilterList[j]][obj.key]){
								obj.is_selected = true;
							} else if (selectedFilterObjectData[tabName][facetFilterList[j]][obj.value]){
								obj.is_selected = true;
							}
						}
						if (filterType === "class" || filterType === "subject" || filterType === "board" || filterType === "exam"){
							const allObject: any = {value: filters[facetList[i]][facetFilterList[j]][k].text, is_selected: false};
							if (tabName && tabName === "all" && selectedFilterObjectData.all[facetFilterList[j]] && selectedFilterObjectData.all[facetFilterList[j]][obj.value]){
								allObject.is_selected = true;
							}
							if (filterType === "class"){
								allObject.label = this.settings.classLabelMapping[obj.value];
								obj.label = this.settings.classLabelMapping[obj.value];
								allFacetClassList.push(allObject);
							} else if (filterType === "subject"){
								allFacetSubjectList.push(allObject);
							}
						}
						list.push(obj);
					}
					if (list.length){
						finalFacetFilterData[actualFacet].push({ key: filterType, label: this.settings.filterWordMap[lang][filterType], list});
					}
				}
			}
			if (finalFacetFilterData.live_class && finalFacetFilterData.live_class.length){
				finalFacetFilterData.live_class.push({key: "sort", label: "Sort By", list: [
					{
						value: "Most Recent",
						key:"live_at",
						is_selected: false,
						order: 0,
					},
					{
						value: "Oldest",
						is_selected: false,
						key:"live_at",
						order: 1,
					}]});
			}
			finalFacetFilterData.all = [];
			if (allFacetClassList.length){
				finalFacetFilterData.all.push({key: "class", label: this.settings.filterWordMap[lang].class, list: _.unionBy(allFacetClassList, "value")});
			}
			if (allFacetSubjectList.length){
				finalFacetFilterData.all.push({key: "subject", label: this.settings.filterWordMap[lang].subject, list: _.unionBy(allFacetSubjectList, "value")});
			}
			return finalFacetFilterData;
		},

		async getFinalVideoList(allVideoIds: any, coreloopResult: any, baseVideoResult: any, studentClass: any, lang: string, versionCode) {
			const finalVideoList: any = [];
			const { coreLoopVideoArr } = await this.qAskResponseFormatter(coreloopResult.docs, studentClass, lang);
			const baseVideoData = this.responseFormatter(baseVideoResult.docs, lang, versionCode);
			const mergedArray = [...baseVideoData, ...coreLoopVideoArr];
			const mergedArrayObjectByIDs: any = {};
			mergedArray.forEach(x => {
				mergedArrayObjectByIDs[x._id] = x;
			});
			allVideoIds.forEach(x => {
				if (mergedArrayObjectByIDs[x.srcId]){
					finalVideoList.push(mergedArrayObjectByIDs[x.srcId]);
				}
			});
			return finalVideoList;
		},

		async getNewVanillaSearch(text, studentClass, versionCode, contentAccess, iasFlagPayload, tabs_filter, source, userContext, facetOrderEnabled){
			try {
				let selectedFiltersData: any = {}; let selectedFilterObjectData: any = {};
				if (!_.isEmpty(tabs_filter)){
					const { selectedFilter, selectedFilterObject} = this.getSelectedFilter(tabs_filter);
					selectedFilterObjectData = selectedFilterObject;
					selectedFiltersData = selectedFilter;
				}
				const body: any = { text, studentClass: `${studentClass}`, count: iasFlagPayload.count || this.settings.resultCount, version: iasFlagPayload.version || "v12.8", contentAccess, userContext};
				if (!_.isEmpty(selectedFiltersData)){
					body.filters = selectedFiltersData;
				}
				if (source && (source === "LibraryFragmentHome" || source === "check_all_courses")){
					body.contentAccess = 1;
					body.filters = iasFlagPayload.is_price_show ? { course:{}, liveClass:{}, pdf: {}} : { course:{}, liveClass:{}};
				}
				body.facetOrderEnabled = facetOrderEnabled ? facetOrderEnabled : false;
				const {data: vanillaResultids} = await this.actions.getVanillaResult({body}) || {};
				const lang = (vanillaResultids && vanillaResultids.queryLang && vanillaResultids.queryLang === "hi") ? "hindi" : "english";

				const facetList = facetOrderEnabled ? vanillaResultids.facetOrder.order : Object.keys(vanillaResultids);
				const coreLoopIds = []; let allVideoIds = []; const iasResult = [];
				const filters: any = {}; let i: number;let j: number;let k: number;const baseVideoResult = {docs : []}; let result = [];let finalVideoList =  [];
				if (facetOrderEnabled) {
					for (i = 0; i < facetList.length; i++) {
						if (facetList[i] === "live_class") {
							facetList[i] = "liveClass";
						}
					}
				}
				for (i = 0; i < facetList.length; i++){
					if (versionCode <= 956 && facetList[i] === "teacher"){
						delete vanillaResultids[facetList[i]];
					}
					if (facetList[i] && vanillaResultids[facetList[i]] && vanillaResultids[facetList[i]].sugg){
						const str = facetList[i] + "_length";
						if (iasFlagPayload[str]){
							vanillaResultids[facetList[i]].sugg = vanillaResultids[facetList[i]].sugg.slice(0, iasFlagPayload[str]);
						}
						for (j = 0;j < vanillaResultids[facetList[i]].sugg.length;j++){
							const x = vanillaResultids[facetList[i]].sugg[j];
							// remove looping for teacher after indexing.
							if (facetList[i] === "teacher" && vanillaResultids[facetList[i]]){
								const teacher_details = []; const y: any = {}; const obj_keys = Object.keys(x._extras);
								for (k = 0; k < obj_keys.length;k++){
									if (x._extras[obj_keys[k]] && x._extras[obj_keys[k]].length && Array.isArray(x._extras[obj_keys[k]])){
										teacher_details.push({ key: obj_keys[k], value: x._extras[obj_keys[k]].join(", ")});
									} else if (x._extras[obj_keys[k]] && x._extras[obj_keys[k]].length && obj_keys[k] !== "expert_name"){
										y[obj_keys[k]] = x._extras[obj_keys[k]];
									}
									y.teacher_details = teacher_details;
									y.teacher_name = x._extras.expert_name;
									y.button_details = x._extras.button_details;
								}
								iasResult.push({_id : `${x.srcId}`, _index : "micro_ias_index_new", _type: "_doc", found: true, _source : {info : y}});
							} else if (facetList[i] === "liveClass"){
								iasResult.push({_id : `${x.srcId}_${x.class}`, _index : "micro_ias_index_new", _type: "_doc", found: true, _source : {info : x._extras}});
							} else if (facetList[i] !== "video") {
								if (source && source === "check_all_courses" && facetList[i] === "course") {
									x._extras.deeplink_url = `doubtnutapp://course_details?id=${x._extras.assortment_id}`;
								}
								iasResult.push({_id : `${x.srcId}`, _index : "micro_ias_index_new", _type: "_doc", found: true, _source : {info : x._extras}});
							}
						}
						if (facetList[i] === "video"){
							allVideoIds = vanillaResultids[facetList[i]].sugg;
							vanillaResultids[facetList[i]].sugg.forEach(x => {
								if (x.isCoreLoop){
									coreLoopIds.push({_index:this.settings.repoIndexWithSynonyms, _type: this.settings.repoIndexType, _id: `${x.srcId}`});
								} else {
									baseVideoResult.docs.push({_id : `${x.srcId}`, _index : "micro_ias_index_new", _type: "_doc", found: true, _source : {info : x._extras}});
								}
							});
						}
					}
					if (vanillaResultids[facetList[i]] && vanillaResultids[facetList[i]].agg){
						filters[facetList[i]] = vanillaResultids[facetList[i]].agg;
					}
				}

				const tabsFilterList = await this.getTabsFilterList(selectedFilterObjectData, filters, lang);
				const [coreloopResult] = await Promise.all([
					coreLoopIds.length ? axiosInstanceEs5({ method: "get", url: "_mget", timeout: 2500, data: {docs: coreLoopIds}}) : null,
				]);
				const coreloopVideo = (coreloopResult && coreloopResult.data) ? coreloopResult.data : {docs: []};
				result = this.responseFormatter(iasResult, lang, versionCode);
				finalVideoList = await this.getFinalVideoList(allVideoIds, coreloopVideo, baseVideoResult, studentClass, lang, versionCode);
				return {result: [...result, ...finalVideoList], tabsFilterList, lang, facetList};
			} catch (e){
				this.logger.error(e);
				return {result: [], tabsFilterList: {}, lang: "english", facetList: []};
			}
		},

		addFilterList(finalResult: any, tabsFilterList: any){
			if (finalResult && finalResult.tabs && finalResult.tabs.length && !_.isEmpty(tabsFilterList)){
				let i: number;
				for (i = 0; i < finalResult.tabs.length; i++){
					if (tabsFilterList[finalResult.tabs[i].key] && tabsFilterList[finalResult.tabs[i].key].length){
						finalResult.tabs[i].filterList = tabsFilterList[finalResult.tabs[i].key];
					}
				}
			}
		},

        hindiReplaceData(data){
			if (data._source.hindi_image_url) {
				data._source.image_url = data._source.hindi_image_url;
			}
			if (data._source.hindi_breadcrumbs) {
				data._source.breadcrumbs = data._source.hindi_breadcrumbs;
			}
			if (data._source.hindi_display) {
				data._source.display = data._source.hindi_display;
			}
		},

        responseFormatter(searchData, lang, versionCode){
            let i: number; const resultData = [];
            for (i = 0; i < searchData.length; i++) {
                if (searchData[i].found){
					const fetchedData: any = {_index: searchData[i]._index, _id:searchData[i]._id, _source: searchData[i]._source.info};
                    if (fetchedData._source.new_title){
                        fetchedData._source.display = fetchedData._source.new_title;
                    }
                    if (lang === "hindi") {
                        this.hindiReplaceData(fetchedData);
                    }
                    if (fetchedData._source.tab_type === "video" && !(versionCode < 733 && fetchedData._source.is_live_class) || (versionCode < 738 && fetchedData._source.meta_data &&
                        fetchedData._source.meta_data.player_type === "livevideo")) {
                            fetchedData._source.bg_color = _.sample(this.settings.colorCodeInApp);
                            if (fetchedData._source.is_live_class) {
                                if (fetchedData._source.meta_data){
                                    fetchedData._source.meta_data.current_time = moment().add("+05:30");
                                }
                                fetchedData._source.tab_type = "live_class";
                            }
                    }
                    resultData.push(fetchedData);
                }
            }
            return resultData;
        },
    },
};

export = iasVanillaSearch;
