import { readFileSync } from "fs";
import { ServiceSchema, Context } from "moleculer";

const CourseCertificateService: ServiceSchema = {
    name: "courseCertificate",
    settings: {
        rest: "/certificate",
        templates: {
            "course-certificate": {
                pdf: readFileSync("./services/course-certificates/template/course-certificate/certificate.html", "utf8"),
                certificateBackground: readFileSync("./services/course-certificates/template/course-certificate/certificate-background.png", "base64"),
                dnLogo: readFileSync("./services/course-certificates/template/course-certificate/doubtnut-logo.png", "base64"),
            },
        },
    },
    dependencies: [],
    actions: {
        generateCourseCertificate: {
            rest: {
                method: "POST",
                path: "/generate",
            },
            params: {
                studentId: { type: "string" },
                studentName: { type: "string" },
                courseId: { type: "string" },
                courseName: { type: "string" },
            },
            async handler(ctx: Context<{ studentId: string; studentName: string; courseId: string; courseName: string }>) {
                const { studentId, studentName, courseId, courseName } = ctx.params;
                try {

                    let displayName = studentName.replace(/\s{2,}/g, " ").trim();
                    const givenName = displayName.split(" ");

                    if (displayName.length > 35 && givenName.length > 2) {
                        displayName = " ";
                        for (let i = 0; i < givenName.length - 1; i++) {
                            displayName += givenName[i][0] + ".";
                        }
                        displayName += " " + givenName[givenName.length - 1];
                    }
                    displayName = displayName.toUpperCase();
                    const currYear = new Date().getFullYear();
                    const pdfData = { studentName: displayName, courseName, year: currYear };
                    const html = this.buildCertificate(this.settings.templates["course-certificate"], pdfData);
                    await ctx.call("$CourseCertificate.generatePdf", { html, studentId, courseId });

                    return true;
                } catch (e) {
                    this.logger.error(e);
                    return false;
                }
            },
        },
    },
    methods: {
        buildCertificate(template, data: { studentName: string; courseName: string; year: number }) {
            const html = template.pdf
                .replace("###CERTIFICATE_BACKGROUND###", template.certificateBackground)
                .replace("###DOUBTNUT_LOGO###", template.dnLogo)
                .replace("###STUDENT_NAME###", data.studentName)
                .replace("###COURSE_NAME###", data.courseName)
                .replace("###CERTIFICATE_YEAR###", data.year);

            return html;
        },
    },
};

export = CourseCertificateService;
