import _ from "lodash";
import { ServiceSchema, Context } from "moleculer";
import Chance from "chance";
import randomstring from "randomstring";
import moment from "moment";

const WhatsappStudent: ServiceSchema = {
    name: "$whatsapp-student",
    settings: {
        chance: new Chance(),
    },
    dependencies: [],
    actions: {
        createAndGet: {
            params: {
                source: "string",
                fingerprint: "string",
                phone: "string",
            },
            async handler(ctx: Context<{ source: number; fingerprint: string; phone: string; campaignText?: string; name?: string }>) {
                const mobile = ctx.params.phone.length > 10 ? ctx.params.phone.substr(-10) : ctx.params.phone;
                let student = await ctx.call("$sync-student.find", { query: { mobile }, limit: 1 }).then(res => res[0]); // TODO change this later move to $student
                if (!student) {
                    const campaigns: { fingerprint: string }[] = ctx.params.campaignText ? await this.broker.call("$whatsapp-campaign.find", {
                        query: { source: ctx.params.source.toString(), campaign: ctx.params.campaignText },
                        fields: ["fingerprint"],
                        limit: 1,
                    }) : [];
                    const fingerprint = campaigns.length ? campaigns[0].fingerprint : ctx.params.fingerprint;
                    this.logger.warn("No student with phone, creating student", mobile);
                    student = await this.createStudent(fingerprint, mobile, ctx.params.name);
                    await this.createWhatsappStudent(fingerprint, student.student_id, mobile);
                    return { ...student, id: student.student_id.toString(), class: parseInt(student.student_class, 10), ccmIdList: [] };
                }
                const whatsappStudent = await ctx.call("$sync-whatsappStudent.find", { query: { student_id: student.student_id }, limit: 1 }).then(res => res[0]);
                if (!whatsappStudent) {
                    const campaigns: { fingerprint: string }[] = ctx.params.campaignText ? await this.broker.call("$whatsapp-campaign.find", {
                        query: { source: ctx.params.source.toString(), campaign: ctx.params.campaignText },
                        fields: ["fingerprint"],
                        limit: 1,
                    }) : [];
                    const fingerprint = campaigns.length ? campaigns[0].fingerprint : ctx.params.fingerprint;
                    await this.createWhatsappStudent(fingerprint, student.student_id, mobile);
                } else {
                    if (!whatsappStudent.fingerprints) {
                        this.updateWhatsappStudent(student.student_id, ctx.params.fingerprint);
                    } else {
                        const fp: string[] = whatsappStudent.fingerprints.split(",");
                        if (!fp.includes(ctx.params.fingerprint)) {
                            fp.push(ctx.params.fingerprint);
                            this.updateWhatsappStudent(whatsappStudent.id, fp.join());
                        }
                    }
                }
                if (!student.fingerprints) {
                    this.updateStudent(student.student_id, ctx.params.fingerprint);
                }
                const studentCcmIdList = await ctx.call("$sync-studentCourseMapping.find", { fields: ["ccm_id"], query: { student_id: student.student_id } }).then((res: any[]) => res.map(obj => obj.ccm_id));
                return { ...student, id: student.student_id.toString(), class: parseInt(student.student_class, 10), ccmIdList: studentCcmIdList };
            },
        },
    },
    events: {
    },
    methods: {
        generateUsername() {
            const random1 = randomstring.generate({
                length: 3,
                charset: "alphabetic",
            });
            const random2 = Math.floor(Math.random() * 1000) + 1000;
            const fname = this.settings.chance.name().substr(0, 3);
            const lname = random2 + random1;
            return fname + lname;
        },
        createStudent(fingerprint: string, mobile: string, name?: string) {
            const obj: any = {
                mobile,
                is_web: 4,
                student_username: this.generateUsername(),
                fingerprints: fingerprint,
                student_class: 20,
                updated_at: new Date().toISOString(),
            };
            if (name) {
                obj.student_fname = name;
            }
            return this.broker.call("$sync-student.create", obj);
        },
        updateStudent(id: string, fingerprint: string) {
            const obj = { id, fingerprints: fingerprint };
            return this.broker.call("$sync-student.update", obj);
        },
        createWhatsappStudent(fingerprint: string, id: number, mobile: string) {
            const obj = {
                mobile,
                student_id: id,
                fingerprints: fingerprint,
                student_class: 20,
            };
            return this.broker.call("$sync-whatsappStudent.create", obj);
        },
        updateWhatsappStudent(id: number, fingerprint: string) {
            const obj = { id, fingerprints: fingerprint };
            return this.broker.call("$sync-whatsappStudent.update", obj);
        },
    },
};

export = WhatsappStudent;
