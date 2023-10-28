import { ServiceSchema, Context } from "moleculer";
import _ from "lodash";
import { AxiosInstance } from "axios";
import WhatsappSettingsService from "../../whatsapp.settings";
import DialogueSettingsService from "../common/dialogue.settings";

const CoursePurchaseDialogueService: ServiceSchema = {
    name: "$dialogue-course-purchase",
    mixins: [WhatsappSettingsService, DialogueSettingsService],
    dependencies: [],
    settings: {},
    actions: {
        getPackageDetails: {
            cacher: {
                enabled: true,
                ttl: 60 * 60,
            },
            async handler(ctx: Context<{ source: number; phone: string; studentId: string; courseId: string }>) {
                try {
                    const row: any = await ctx.call("$sync-raw.getAssortmentIdByCourseId", { courseId: ctx.params.courseId });
                    const { data } = await (this.settings.adminUrl as AxiosInstance).get(`/v1/package/crm-get-package-details?assortment_id=${row.assortment_id}&mobile=${ctx.params.phone}&&AddOn=9632c630-9185-11eb-9806-0278d7aae882`);
                    return { ...data.data, assortment_id: row.assortment_id };
                } catch (e) {
                    this.logger.error(e);
                    ctx.emit("log", { source: ctx.params.source, phone: ctx.params.phone, studentId: ctx.params.studentId, courseId: +ctx.params.courseId }, "$course-purchase-lead");
                    throw e;
                }
            },
        },
        getCourseDetails: {
            cacher: {
                enabled: true,
                ttl: 60 * 60,
            },
            async handler(ctx: Context<{ source: number; phone: string; studentId: number; msgId: number; entities: { [key: string]: string } }>) {
                const packageData = await this.actions.getPackageDetails({ source: ctx.params.source, phone: ctx.params.phone, studentId: ctx.params.studentId, courseId: ctx.params.entities.course_id });
                ctx.emit("log", { source: ctx.params.source, phone: ctx.params.phone, studentId: ctx.params.studentId, courseId: +ctx.params.entities.course_id, assortmentId: +packageData.assortment_id }, "$course-purchase-lead");
                const timetablePdfUrl = packageData.timetable.pdf_url ? await ctx.call("$deeplink.createTinyUrl", { url: packageData.timetable.pdf_url, tags: ["whatsapp"] }) : null;
                // const answers: any[] = await this.broker.call("$sync-answer.find", { query: { question_id: parseInt(packageData.basicDetails.demo_video_qid, 10) }, limit: 1 });
                // const answerResources: any[] = await this.broker.call("$sync-answer-video-resources.find", { query: { answer_id: answers[0].answer_id, resource_type: ["YOUTUBE"] } });
                // const ytRow = answerResources.find(x => x.resource_type === "YOUTUBE");
                const shareUrl = await ctx.call("$deeplink.createTinyUrl", { url: `https://app.doubtnut.com/share?cli=${ctx.params.phone.substr(-10)}&assortment_id=${packageData.assortment_id}`, tags: ["whatsapp"] });
                let course_testimonials = "Iss course ke student reviews abhi available nahi hai";
                let course_teachers = "Iss course ke teacher details abhi available nahi hai";
                try {
                    packageData.testimonials.sort((a, b) => b.review_order - a.review_order);
                    course_testimonials = packageData.testimonials.slice(0, 2).map(x => `${x.student_name}\n${x.review_text.length > 100 ? `${x.review_text}...` : x.review_text}\n${x.review_qid_deeplink}`).join("\n\n");
                } catch (e) {
                    this.logger.error(e);
                }
                try {
                    course_teachers = packageData.teachers.subjects.map(x => `<strong>${x.subjectName}</strong>\n${x.teachers.map(y => `${_.startCase(_.toLower(y.faculty_name))} - ${y.degree}`).join("\n")}`).join("\n\n");
                } catch (e) {
                    this.logger.error(e);
                }


                return {
                    course_name: packageData.basicDetails.display_name,
                    course_brochure: shareUrl,
                    // course_intro_yt: ytRow ? `https://www.youtube.com/watch?v=${ytRow.resource}` : packageData.basicDetails.demo_video_qid, // TODO create deeplink
                    course_timetable_pdf: timetablePdfUrl,
                    course_subjects: (packageData.subjects && packageData.subjects.length) ?
                        packageData.subjects.map((x: { subject: any }) => `<strong>${x.subject}</strong>`).join("\n") :
                        "Iss course ke subjects and topic abhi available nahi",
                    course_topic_details: shareUrl, // TODO build this text as well later
                    course_subject_video_list: [
                        {
                            title: "Subject",
                            rows: packageData.subjects.map((x: { subject: any }, i: number) => ({
                                id: (i + 1).toString(),
                                title: x.subject,
                                description: `#${ctx.params.entities.course_id} ${x.subject} ka demo video`,
                            })),
                        },
                        // {
                        //     title: "Other options",
                        //     rows: [
                        //         { id: data.subjects.length.toString(), title: "Request a call", description: "" },
                        //         { id: (data.subjects.length + 1).toString(), title: "Get Admission", description: "" },
                        //         { id: (data.subjects.length + 2).toString(), title: "Course menu", description: "" },
                        //     ],
                        // },
                    ],
                    price_variants_list: [
                        {
                            title: "Package Price List",
                            rows: packageData.variants.map((x, i) => ({
                                id: (i + 1).toString(),
                                title: `Full Course ${x.duration_in_days} days`,
                                description: `₹${Math.floor(x.display_price / Math.floor(x.duration_in_days / 30))}/month (Total price ₹${x.display_price})`,
                            })),
                        },
                        {
                            title: "Subject Wize Price List",
                            rows: packageData.subjectVariant.slice(0, 10 - packageData.variants.length).map((x, i) => ({
                                id: (i + 1 + packageData.variants.length).toString(),
                                title: `${x.display_subject} ${x.duration_in_days} days`,
                                description: `₹${Math.floor(x.display_price / Math.floor(x.duration_in_days / 30))}/month (Total price ₹${x.display_price})`,
                            })),
                        },
                    ],
                    course_testimonials,
                    course_teachers,
                };
            },
        },
    },
    methods: {
        async requestForCall(params: { source: number; phone: string; studentId: number; msgId: number; entities: { [key: string]: string } }) {
            const token = await this.broker.call("$student.sign", { studentId: params.studentId });
            const row: any = await this.broker.call("$sync-raw.getAssortmentIdByCourseId", { courseId: params.entities.course_id });
            this.logger.debug(params.entities.course_id, row.assortment_id);
            (this.settings.backendUrl as AxiosInstance).post("v1/course/request-callback", {
                assortment_id: row.assortment_id || 0,
            }, {
                headers: { "Content-Type": "application/json", "x-auth-token": token },
            });
            return {};
        },
        async getPaymentLink(params: { source: number; phone: string; studentId: number; msgId: number; entities: { [key: string]: string } }) {
            const packageData = await this.actions.getPackageDetails({ source: params.source, phone: params.phone, studentId: params.studentId, courseId: params.entities.course_id });
            const variant = packageData.variants[+params.entities.option - 1] ? packageData.variants[+params.entities.option - 1] : packageData.subjectVariant[+params.entities.option - packageData.variants.length - 1];
            const { data } = await (this.settings.backendUrl as AxiosInstance).get(`v1/package/offline-sales-deeplinks?id=${variant.id}&type=payment`);
            return {
                course_name: packageData.basicDetails.display_name,
                variant_duration: variant.duration_in_days,
                variant_price: variant.display_price,
                payment_link: data.data,
            };
        },
        async getSubjectNotes(params: { source: number; phone: string; studentId: number; msgId: number; entities: { [key: string]: string } }) {
            const packageData = await this.actions.getPackageDetails({ source: params.source, phone: params.phone, studentId: params.studentId, courseId: params.entities.course_id });
            const notes = _(packageData.samplePDF.map(x => (
                x.data.filter(y =>
                    ["Teacher Notes", "Teacher Slides"].includes(y.meta_info)).slice(0, 2).map(y =>
                        ({ subject: y.subject, url: y.resource_reference, meta_info: y.meta_info })
                    )
            ))).flatten().groupBy("subject").value();
            let notesStr = "<strong>Teacher Notes and Slides</strong>\n\n";
            // eslint-disable-next-line guard-for-in
            for (const subject in notes) {
                const urls = await this.broker.mcall(notes[subject].map(x => ({ action: "$deeplink.createTinyUrl", params: { url: x.url, tags: ["whatsapp"] } })));
                notesStr += `<strong>${subject}</strong>\n${urls.map((x, i) => `${notes[subject][i].meta_info} - ${x}`).join("\n")}\n`;
            }
            return { course_name: packageData.basicDetails.display_name, course_subject_notes: notesStr };
        },
        async getSubjectDemoVideo(params: { source: number; phone: string; studentId: number; msgId: number; entities: { [key: string]: string } }) {
            const packageData = await this.actions.getPackageDetails({ source: params.source, phone: params.phone, studentId: params.studentId, courseId: params.entities.course_id });
            const subject = packageData.subjects[+params.entities.option - 1] ? packageData.subjects[+params.entities.option - 1].subject : "";
            const subjectDetails = packageData.basicDetails.demo_videos.find(x => x.subject_name === subject);
            const questionId = subjectDetails ? subjectDetails.question_id : null;
            if (!questionId) {
                return {
                    course_name: packageData.basicDetails.display_name,
                    subject,
                };
            }
            // const answers: any[] = await this.broker.call("$sync-answer.find", { query: { question_id: parseInt(questionId, 10) }, limit: 1 });
            // if (!answers.length) {
            //     return {
            //         course_name: packageData.basicDetails.display_name,
            //         subject,
            //     };
            // }
            // const answerResources: any[] = await this.broker.call("$sync-answer-video-resources.find", { query: { answer_id: answers[0].answer_id, resource_type: ["YOUTUBE"] } });
            // const ytRow = answerResources.find(x => x.resource_type === "YOUTUBE");
            const dl: { url: string }[] = await this.broker.call("$deeplink.createBulk", {
                studentId: params.studentId,
                campaign: "WHA_VDO",
                source: this.settings.accounts[params.source].fingerprint,
                data: [{
                    questionId,
                    resourceType: "video",
                }],
            });
            return {
                course_name: packageData.basicDetails.display_name,
                subject,
                course_subject_intro: dl[0].url,
                // course_subject_intro_yt: ytRow ? `https://www.youtube.com/watch?v=${ytRow.resource}` : null,
                // TODO fetch this from answer_video_resources currently data missing
            };
        },
    },
};

export = CoursePurchaseDialogueService;
