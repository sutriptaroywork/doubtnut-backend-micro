import {customBadWords, highlyRestrictedProfaneKeywords} from "./data/custom-bad-words";

export const wordProfanity = {

    isWordProfane(inputKeyword: string) {
        inputKeyword = inputKeyword.replace(RegExp("[~`!@#$%^&()_={}[\\]:;,.<>+\\/?-]", "gi"), "").trim().replace(/ +/g, " ").toLowerCase();
        for (const word of highlyRestrictedProfaneKeywords) {
            if (RegExp("^.*" + word + ".*$", "gi").test(inputKeyword)) {
                console.log("word => ", inputKeyword);
                return true;
            }
        }
        return false;
    },

    async editDistance(keyword1, keyword2) {
        keyword1 = keyword1.toLowerCase();
        keyword2 = keyword2.toLowerCase();

        const costs = [];
        for (let i = 0; i <= keyword1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= keyword2.length; j++) {
                if (i === 0)
                {costs[j] = j;}
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (keyword1.charAt(i - 1) !== keyword2.charAt(j - 1))
                        {newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;}
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0)
            {costs[keyword2.length] = lastValue;}
        }
        return costs[keyword2.length];
    },

    async isTextProfaned(text: string) {
        const splittedTextArr = text.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
        for (const s1 in splittedTextArr) {
            if (s1) {
                let longer = splittedTextArr[s1];
                for (const s2 in highlyRestrictedProfaneKeywords) {
                    if (s2) {
                        let shorter = highlyRestrictedProfaneKeywords[s2];
                        if (splittedTextArr[s1].length < highlyRestrictedProfaneKeywords[s2].length) {
                            longer = highlyRestrictedProfaneKeywords[s2];
                            shorter = splittedTextArr[s1];
                        }
                        const longerLength = longer.length;
                        if (longerLength === 0) {
                            return true;
                        }
                        console.log(await this.editDistance(longer, shorter), " edit dis resp");
                        console.log((longerLength - await this.editDistance(longer, shorter)), " ****", parseFloat(String(longerLength)));
                        const longerLengthDiff = (longerLength - await this.editDistance(longer, shorter)) / parseFloat(String(longerLength));
                        if (longerLengthDiff >= 0.6 ) {
                            console.log("longerLengthDiff bw ", splittedTextArr[s1], highlyRestrictedProfaneKeywords[s2], longerLengthDiff);
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    },
};
