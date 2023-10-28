import { ServiceSchema, Context } from "moleculer";
import _ from "lodash";
import axios, { AxiosInstance } from "axios";
import { staticCDN } from "../../../../common";
import WhatsappSettingsService from "../whatsapp.settings";
import WhatsappWebHandlingService from "../whatsapp.web-handling";
import DialogueSettingsService from "../dialogues/common/dialogue.settings";
import WhatsappBaseService from "../whatsapp.base";
import { DialogueCondition } from "../dialogues/dialogue.interface";
import moment from "moment";

const WhatsappFreeClassService: ServiceSchema = {
    name: "$whatsapp-free-class",
    mixins: [WhatsappWebHandlingService, WhatsappSettingsService, DialogueSettingsService, WhatsappBaseService],
    dependencies: [],
    settings: {
        subjectHindiPayload:{
            "MATHS":"गणित",
            "SCIENCE":"विज्ञान",
            "ENGLISH":"अंग्रेजी",
            "ENGLISH GRAMMAR":"अंग्रेजी व्याकरण",
            "SOCIAL SCIENCE":"सामाजिक विज्ञान",
            "PHYSICS":"भौतिकी",
            "CHEMISTRY":"रसायन विज्ञान",
            "BIOLOGY":"जीव विज्ञान",
        },
    },
    actions: {
        getFreeClassSubjectsList: {
            async handler(ctx: Context<{class: string; language: string;}>){
                const classSubjectsProperty : any[] = await ctx.call("$sync-dn-property.find", { query: { bucket: 'wa_free_class', name: `${ctx.params.class}_${ctx.params.language}`, is_active: 1 } });
                const clasSubjectsArr = classSubjectsProperty.map(x => x.value);
                if (!clasSubjectsArr.length) {
                    this.logger.debug("Dn_property: No subject for selected class and language");
                    return [];
                }
                const subjectList = [...clasSubjectsArr[0].split("||")];
                this.logger.debug("#####getFreeClassSubjects: subjectList ", subjectList);
                return subjectList;
            }
        },
        getFreeClassChaptersList: {
            async handler(ctx: Context<{class: string; language: string; subject: string; }>) {
                // TODO add a day's cache
                const data = JSON.stringify({
                    classes: [parseInt(ctx.params.class)],
                    subjects: [ctx.params.subject.toUpperCase()],
                    languages: [ctx.params.language.toUpperCase()],
                    start_date: moment().subtract(30, 'days').format("YYYY-MM-DD HH:mm:ss"),
                    end_date: moment().format("YYYY-MM-DD HH:mm:ss"),
                    resource_types: ["1","4","8"],
                    limit: 10
                });
                this.logger.debug("#####getFreeClassChaptersList - data: ", data);
                const chaptersResp = await axios({
                    method: "get",
                    url: `${this.settings.pznURL}/api/v1/get-top-videos/chapter-by-sum-engage-time`,
                    data: data,
                });
                this.logger.debug("#####getChapterPZN response: ", chaptersResp.data);
                return chaptersResp.data;
            }
        },
        getFreeClassVideoIds: {
            async handler(ctx: Context<{class: string; language: string; subject: string; chapter: string; }>){
                const data = JSON.stringify({
                    class: parseInt(ctx.params.class),
                    subjects: [ctx.params.subject.toUpperCase()],
                    languages: [ctx.params.language.toUpperCase()],
                    chapters: [ctx.params.chapter.toUpperCase()],
                    start_date: moment().subtract(30, 'days').format("YYYY-MM-DD HH:mm:ss"),
                    end_date: moment().format("YYYY-MM-DD HH:mm:ss"),
                    resource_types: ["1","4","8"],
                    limit: 10
                });
                this.logger.debug("#####getVideo - data: ", data);
                const videoResp = await axios({ method: "get", url: `${this.settings.pznURL}/api/v1/get-top-videos/question-id-by-sum-engage-time`, data: data });
                this.logger.debug("getFreeClassVideoIds response: ", videoResp.data);
                return videoResp.data;
            }
        },
        getFreeClassVideoDetails: {
            async handler(ctx: Context<{studentId: Number; questionIds: string[];}>){
                const videoPropObj = {};
                for( let i =0;i<ctx.params.questionIds.length; i++){
                    const questionId = ctx.params.questionIds[i];
                    const videoDetail: any[] = await ctx.call("$sync-question.find", { query: { question_id: questionId } });
                    const encryptedStudentId = await ctx.call("$student.getEncryptedId", { studentId: ctx.params.studentId });
                    const webUrl = await this.getWebUrl("WHA_LF", { question_id: questionId }, encryptedStudentId, "1234", { is_lf: true });
                    const deeplinkPayload = {
                        studentId: ctx.params.studentId,
                        campaign: "whatsapp_lf",
                        source: "WHA_LF",
                        channel: `${questionId}_${ctx.params.studentId}_${moment().format("DD-MM-YYYY")}_${i}`,
                        data: [{
                            questionId: questionId,
                            webUrl: webUrl,
                        }],
                    };
                    this.logger.debug("#####getFreeClassVideoDetails:  web ", videoDetail, "\n deeplink: ", deeplinkPayload );
                    const output: { url: string }[] = await this.broker.call("$deeplink.createBulk", deeplinkPayload);
                    this.logger.debug("#####getFreeClassVideoDetails:  output ", output );

                    videoPropObj[questionId] = {
                        videoTitle: _.get(videoDetail[0], "question", "Video"),
                        videoLink: output[0].url,
                        videoOcr: _.get(videoDetail[0], "ocr_text", "OCR")
                    };
                }
                this.logger.debug("#####getFreeClassVideoDetails: videoPropObj ", videoPropObj);
                return videoPropObj;
            }
        },
    },
    methods: {
        async getFreeClasses(params: DialogueCondition) {
            // this.broker.emit("delEntities", { contextId: params.contextId }, "$dialogue");   
            const classList = [
                { id: "1", title: "Class 6", description: "" },
                { id: "2", title: "Class 7", description: "" },
                { id: "3", title: "Class 8", description: "" },
                { id: "4", title: "Class 9", description: "" },
                { id: "5", title: "Class 10", description: "" },
                { id: "6", title: "Class 11", description: "" },
                { id: "7", title: "Class 12", description: "" },
                { id: "8", title: "Dropper/Repeater", description: "" },
            ];
            return {
                class_list: classList,
            }
        },
        async getFreeClassLanguages(params: DialogueCondition) {
            // const selectedClass = (+params.entities.option < 8) ? (+params.entities.option+5).toString() : "12";
            const selectedClassText = (+params.entities.option < 8) ? (+params.entities.option+5).toString() : "Dropper/Repeater";
            const selectedClassValue = (+params.entities.option < 8) ? (+params.entities.option+5).toString() : "12";

            this.logger.debug("#####getFreeClassLanguages: getFreeClassLanguages class select", selectedClassValue);
            const languageList = [
                { id: "1", title: "English", description: "" },
                { id: "2", title: "हिन्दी", description: "" },
            ];
            return {
                classValue: selectedClassValue,
                selected_class: selectedClassText,
                language_list: languageList,
            };
        },
        async getFreeClassSubjects(params: DialogueCondition) { 
            const selectedClass = params.entities.classValue;
            const selectedLanguage =  params.entities.option == "2"? "hindi" : "english";
            const classSubjects = await this.actions.getFreeClassSubjectsList({class: selectedClass, language: selectedLanguage });
            const subjectList = classSubjects.map(((sub, ind) => ({ 
                id: (ind+1).toString(), 
                title: selectedLanguage === "hindi" ? this.settings.subjectHindiPayload[sub] : sub, 
                description: "", 
            })));
            this.logger.debug("######getFreeClassSubjects- class: ", selectedClass, " language: ", selectedLanguage, "\nsubjectList: ", subjectList);
            return {
                // selected_class: selectedClass,
                selected_language: selectedLanguage,
                languageValue: selectedLanguage, 
                subject_list: subjectList,
                subjectArray: classSubjects.map(((sub) => ({ 
                    value: sub,
                }))),
            };
        },
        async getFreeClassChapters(params: DialogueCondition) { 
            const selectedClass = params.entities.classValue;
            const selectedLanguage =  params.entities.languageValue; 
            const selectedSubject = params.entities.subjectArray[+params.entities.option-1].value.toUpperCase();
            const chapterData = await this.actions.getFreeClassChaptersList({class: selectedClass, language: selectedLanguage, subject: selectedSubject });
            const chapterList = chapterData.slice(0, 7);
            return {
                subjectValue: selectedSubject,
                // selected_class: selectedClass,
                // selected_language: selectedLanguage, 
                selected_subject: selectedSubject,
                chapter_list: chapterList.map((x, i) => ({ id: (i + 1).toString(), title: x.substring(0, 20), description: x.substring(0, 72) })),
                chapterArray: chapterList.map((x) => ({ value: x })),
            }  
        },
        async getFreeClassVideo(params: DialogueCondition) { 
            const selectedClass = params.entities.classValue;
            const selectedLanguage =  params.entities.languageValue; 
            const selectedSubject = params.entities.subjectValue;
            const selectedChapter = params.entities.chapterArray[+params.entities.option - 1].value;
            const subjectValue = (selectedLanguage === "hindi") ? this.settings.subjectHindiPayload[selectedSubject] : selectedSubject;
            await this.sendMsg(params.source, params.phone, { selected_class: selectedClass, selected_language: selectedLanguage, selected_subject: subjectValue, selected_chapter: selectedChapter, ...this.settings.replyEvents.searchingForFreeClassVideo }, "en");
            const videoData = await this.actions.getFreeClassVideoIds({class: selectedClass, language: selectedLanguage, subject: selectedSubject, chapter: selectedChapter });
            const videoArr = videoData.slice(0, 5);
            const videoDetailsObj = await this.actions.getFreeClassVideoDetails({studentId: params.studentId, questionIds: videoArr});
            this.logger.debug("#####getFreeClassVideo: videoDetailsObj ", videoDetailsObj);
            for(let i = 0; i<videoArr.length; i++){
                const videoID = videoArr[i];
                await this.sendMsg(params.source, params.phone, { video_title: videoDetailsObj[videoID].videoTitle, video_link: videoDetailsObj[videoID].videoLink, question_id: videoID, ...this.settings.replyEvents.freeClassVideo }, "en");
            }
            await this.delay(2000);
            return {};
        },   
    },
};

export = WhatsappFreeClassService;
