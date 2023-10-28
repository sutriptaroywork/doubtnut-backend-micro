import { ServiceSchema } from "moleculer";
import _ from "lodash";
import request from "request-promise";
import hyphenize from "hyphenize";

const rp = request.defaults({ forever: true, pool: { maxSockets: 100 } });

const WhatsappWebHandlingService: ServiceSchema = {
    name: "$whatsapp-web-handling",
    settings: {
        ampHost: "https://whatsapp.doubtnut.com/",
        ampHostNew: "https://whatsapp1.doubtnut.com/",
    },
    methods: {
        hyphenize(str: string) {
            const dict = [
                { find: "I'm", repl: "I am" },
                { find: "thier", repl: "their" },
            ];
            const array = [
                { find: "[\\s-]+", repl: "-" },
                { find: "[^A-Za-z0-9-]+", repl: "" },
            ];
            dict.forEach(s => {
                str = str.replace(new RegExp(s.find, "g"), s.repl);
            });
            str = this.cleanString(str);
            array.forEach(s => {
                str = str.replace(new RegExp(s.find, "g"), s.repl);
            });
            str = decodeURI(str);
            return str;
        },
        cleanString(str: string) {
            const arr = [
                { find: "[áàâãªä]", repl: "a" },
                { find: "[ÁÀÂÃÄ]", repl: "A" },
                { find: "[ÍÌÎÏ]", repl: "I" },
                { find: "[íìîï]", repl: "i" },
                { find: "[éèêë]", repl: "e" },
                { find: "[ÉÈÊË]", repl: "E" },
                { find: "[óòôõºö]", repl: "o" },
                { find: "[ÓÒÔÕÖ]", repl: "O" },
                { find: "[úùûü]", repl: "u" },
                { find: "[ÚÙÛÜ]", repl: "U" },
                { find: "ç", repl: "c" },
                { find: "Ç", repl: "C" },
                { find: "ñ", repl: "n" },
                { find: "Ñ", repl: "N" },
                { find: "–", repl: "-" },
                { find: "[’‘‹›‚]", repl: " " },
                { find: "[“”«»„]", repl: " " },
                { find: " ", repl: " " },
                { find: "[–°“”‘’×—©ºð@Â€˜™¬]", repl: "" },
            ];
            arr.forEach(s => {
                str = str.replace(new RegExp(s.find, "ug"), s.repl);
            });
            return str;
        },
        escapeRegExp(str: string) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        },
        replaceAll(str, term, replacement) {
            return str.replace(new RegExp(this.escapeRegExp(term), "g"), replacement);
        },
        ocrToUrl(ocrText: string) {
            ocrText = this.replaceAll(ocrText, "`", "");
            ocrText = ocrText.replace(/<img[^>]+>/i, "");
            ocrText = this.replaceAll(ocrText, "<br>", "");
            ocrText = this.replaceAll(ocrText, '"', "");
            ocrText = this.replaceAll(ocrText, "&", " and ");
            ocrText = this.replaceAll(ocrText, "<=", " le ");
            ocrText = this.replaceAll(ocrText, ">=", " ge ");
            ocrText = this.replaceAll(ocrText, "->", " rarr ");
            ocrText = this.replaceAll(ocrText, ">", " gt ");
            ocrText = this.replaceAll(ocrText, "<", " lt ");
            ocrText = this.replaceAll(ocrText, " dot ", " ");
            ocrText = this.replaceAll(ocrText, "+", "-");
            ocrText = ocrText.replace(/[\n\r]/g, " ");
            ocrText = ocrText.replace(/\s+/g, " ");
            ocrText = ocrText.trim();
            ocrText = ocrText.replace(/[ ]{2,}|[\t]/g, " ");
            ocrText = ocrText.replace(/!\s+!/g, " ");
            ocrText = this.replaceAll(ocrText, "\xc2\xa0", " ");
            ocrText = ocrText.replace(/\xc2\xa0/g, " ");
            ocrText = ocrText.replace(/[[:^print:]]/g, "");
            ocrText = this.cleanString(ocrText);
            let urlText = ocrText.toLowerCase();
            urlText = this.replaceAll(urlText, " ", "-");
            urlText = this.replaceAll(urlText, "/", "-");
            urlText = this.replaceAll(urlText, "&", "and");
            urlText = this.replaceAll(urlText, ".", "");
            urlText = this.hyphenize(urlText);
            urlText = this.replaceAll(urlText, "--", "-");
            urlText = urlText.substring(0, 100);
            return urlText;
        },
        async getWebUrl(fingerprint: string, question, studentId, questionId, params?: any ) {
            const webPageHost = _.get(params, "webHost", this.settings.ampHost);
            // const webPageHost = params.is_lf ? "https://whatsapp-staging.doubtnut.com/" : this.settings.ampHost;
            const path = params.is_lf ? "question-wa/" : "question/";
            const s_id = params.is_lf ? `x_sid=${studentId}` : `sid=${parseInt(studentId, 10).toString(13).toUpperCase()}`;
            return `${webPageHost}${path}${question.question_id}?utm_source=whatsapp_amp&utm_medium=whatsapp_bot&utm_campaign=questioncount&${s_id}&qid=${parseInt(questionId, 10).toString(13).toUpperCase()}&source=${fingerprint}`;
        },
        getSubjectLink(sub: string) {
            // TODO refactor this
            if (!sub) {
                return "";
            }
            const subject = sub.toLowerCase();
            if (subject.includes("phy")) {
                return "-physics";
            }
            if (subject.includes("chem")) {
                return "-chemistry";
            }
            if (subject.includes("bio")) {
                return "-biology";
            }
            if (subject.includes("general knowledge")) {
                return "-general-knowledge";
            }
            if (subject.includes("geogra")) {
                return "-geography";
            }
            if (subject.includes("engl")) {
                return "-english";
            }
            if (subject.includes("business studies")) {
                return "-business-studies";
            }
            if (subject.includes("hist")) {
                return "-history";
            }
            if (subject.includes("accoun")) {
                return "-accounts";
            }
            if (subject.includes("econo")) {
                return "-economics";
            }
            if (subject.includes("reas")) {
                return "-reasoning";
            }
            if (subject.includes("toppers talk")) {
                return "-toppers-talk";
            }
            if (subject.includes("motivational videos")) {
                return "-motivational-videos";
            }
            if (subject.includes("social science")) {
                return "-social-science";
            }
            if (subject.includes("political science")) {
                return "-political-science";
            }
            if (subject.includes("science")) {
                return "-science";
            }
            if (subject.includes("maths")) {
                return "";
            }
            return hyphenize(sub);
        },
        async getNewWebpage(studentId: number) {
            // New webpage redirect flagr check 
            try {
                let data;
                data = await this.broker.cacher.get(`flagr:wa_new_webpage:${studentId}`);
                if (data) {
                    this.logger.debug("Flagr-response from cache: ", data);
                    return data.enabled;
                }
                const flagrResponse = await this.broker.call("$app-config.get-flagr", {
                    capabilities: {"wa_new_webpage": {}},
                    entityId: `${studentId}`,
                });
                const newPage =  _.get(flagrResponse, 'wa_new_webpage.payload', { enabled: false });
                if(newPage){
                    this.broker.cacher.set(`flagr:wa_new_webpage:${studentId}`, newPage, 30*60);
                    this.logger.debug('Flagr-response stored in cache: ', newPage);
                }
                return newPage.enabled ? newPage.enabled : null;
            } catch (e) {
                this.logger.error(e);
            }
        },
    },
};

export = WhatsappWebHandlingService;
