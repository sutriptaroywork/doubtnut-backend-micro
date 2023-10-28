import moment from "moment";

export const liveClassUtil = {


    numberMap: {
        opt_1: "1",
        opt_2: "2",
        opt_3: "3",
        opt_4: "4",
    },
    defaultExpiry: 30,
    stringMap: {
        opt_1: "A",
        opt_2: "B",
        opt_3: "C",
        opt_4: "D",
    },

    handleOptions(str: string) {
        return str.replace(/'/g, "").replace(/"/g, '\\"').trim();
    },


    async checkIfDuplicateComment(params: any, db: any) {
        let prevComment = await db.collection("liveclass_comments").find({ entity_id: params.entity_id, student_id: params.student_id, message: params.message }).sort({ _id: -1 }).limit(1).toArray();

        if (prevComment.length) {
            prevComment = prevComment[0];
            // eslint-disable-next-line no-underscore-dangle
            const commentTimestamp = prevComment._id.toString().substring(0, 8);
            const commentDate = moment(new Date(parseInt(commentTimestamp, 16) * 1000));

            const nowDate = moment(new Date());

            const minutes = nowDate.diff(commentDate, "minutes");
            if (minutes < 2) { return true; }
            return false;

        }

        return false;


    },

    modifyObj(result: string | any[]) {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < result.length; i++) {
            if (result[i].answer.trim().includes("::")) {
                result[i].type = 1;
            }
            if (/\d/g.test(result[i].answer.trim())) {
                // contain numberic
                result[i].opt_1 = { key: this.numberMap.opt_1, value: this.handleOptions(result[i].opt_1) };
                result[i].opt_2 = { key: this.numberMap.opt_2, value: this.handleOptions(result[i].opt_2) };
                result[i].opt_3 = { key: this.numberMap.opt_3, value: this.handleOptions(result[i].opt_3) };
                result[i].opt_4 = { key: this.numberMap.opt_4, value: this.handleOptions(result[i].opt_4) };
            } else {
                result[i].opt_1 = { key: this.stringMap.opt_1, value: this.handleOptions(result[i].opt_1) };
                result[i].opt_2 = { key: this.stringMap.opt_2, value: this.handleOptions(result[i].opt_2) };
                result[i].opt_3 = { key: this.stringMap.opt_3, value: this.handleOptions(result[i].opt_3) };
                result[i].opt_4 = { key: this.stringMap.opt_4, value: this.handleOptions(result[i].opt_4) };
            }
        }
        return result;
    },

    quotesEscape(str: string) {
        return str.replace(/'/g, "\\'").replace(/"/g, '\\"').trim();
    },

};


