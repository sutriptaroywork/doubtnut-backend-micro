import http from "http";
import https from "https";
import mongoose from "mongoose";
import MongooseAdapter from "moleculer-db-adapter-mongoose";
import DbService from "dn-moleculer-db";
import axios from "axios";
import {Context} from "moleculer";
import _ from "lodash";
import {staticCDN} from "../../../common";
import {WordDetails} from "./data.interfaces";

const WordSchema = new mongoose.Schema({
    text: {type: mongoose.Schema.Types.String, index: true, required: true},
    phonetic: {type: mongoose.Schema.Types.String},
    audio_url: {type: mongoose.Schema.Types.String},
    hi: {type: mongoose.Schema.Types.String},
    bn: {type: mongoose.Schema.Types.String},
    gu: {type: mongoose.Schema.Types.String},
    ta: {type: mongoose.Schema.Types.String},
    te: {type: mongoose.Schema.Types.String},
    kn: {type: mongoose.Schema.Types.String},
    mr: {type: mongoose.Schema.Types.String},
    ne: {type: mongoose.Schema.Types.String},
    pa: {type: mongoose.Schema.Types.String},
    ml: {type: mongoose.Schema.Types.String},
    ur: {type: mongoose.Schema.Types.String},
}, {_id: false});

const DictionaryWordSchema = new mongoose.Schema({
    word: WordSchema,
    meanings: {type: mongoose.Schema.Types.Mixed, required: true},
    additional_words: {type: mongoose.Schema.Types.String},
}, {collection: "dictionary"});

module.exports = {
    name: "$dictionary",
    mixins: [DbService],
    adapter: new MongooseAdapter(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DBNAME,
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }),
    model: mongoose.model("dictionary", DictionaryWordSchema),
    settings: {
        rest: "/dictionary",
        CDN_URL: staticCDN,
        axiosInstanceDictionary: axios.create({
            httpAgent: new http.Agent({keepAlive: true, maxSockets: 50}),
            httpsAgent: new https.Agent({keepAlive: true, maxSockets: 50}),
            baseURL: "https://api.dictionaryapi.dev/",
        }),
        localeArr: ["hi", "bn", "gu", "kn", "ml", "mr", "ne", "pa", "ta", "te", "ur"],
        languageArr: ["हिंदी", "বাংলা", "ગુજરાતી", "ಕನ್ನಡ", "മലയാളം", "मराठी", "नेपाली", "ਪੰਜਾਬੀ", "தமிழ்", "తెలుగు", "اردو"],
    },
    dependencies: [],
    actions: {
        meaning: {
            rest: "GET /meaning/:word_text/:target_locale?",
            params: {
                word_text: "string",
            },
            // eslint-disable-next-line max-lines-per-function
            async handler(ctx: Context<{ word_text: string; target_locale?: string }, { user: { id: string; locale: string } }>) {
                let word = ctx.params.word_text;
                const exactWord = this.extractingExactWord(word);
                if (exactWord.length > 1) {
                    return {
                        meta: {
                            code: 200,
                            success: true,
                            message: "SUCCESS",
                        },
                        data: {
                            message: "Please Enter Single Word",
                        },
                    };
                }
                word = exactWord[0].toLowerCase();
                const {locale} = ctx.meta.user;
                let targetLocale = locale === "en" ? "hi" : locale;
                if (ctx.params.target_locale) {
                    targetLocale = ctx.params.target_locale;
                }
                this.logger.info("word > ", word);
                this.logger.info("targetLocale > ", targetLocale);

                const langArr = [];
                this.settings.localeArr.forEach((item, index) => {
                    const obj = {
                        locale: item,
                        text: this.settings.languageArr[index],
                        is_selected: false,
                    };
                    if (item === targetLocale) {
                        obj.is_selected = true;
                    }
                    langArr.push(obj);
                });

                try {
                    const findInDb = await this.adapter.db.collection("dictionary").find({"word.text": word}).sort({_id: -1}).toArray();
                    if (findInDb.length === 0) {
                        const wordResponseData = await this.settings.axiosInstanceDictionary({
                            method: "GET",
                            url: `api/v2/entries/en/${word}`,
                            timeout: 2500,
                            json: true,
                        });

                        const wordDetailsArr = [];
                        if (wordResponseData.data.length > 0) {
                            const wordFinalResponseData = wordResponseData.data;
                            const additionalWords = [];
                            for (let i = wordFinalResponseData.length - 1; i >= 0; i--) {
                                const x = wordFinalResponseData[i];
                                const obj: WordDetails = {
                                    word: {
                                        text: x.word,
                                    },
                                    meanings: x.meanings,
                                    additional_words: "",
                                };
                                if (i === 0) {
                                    obj.additional_words = additionalWords.join();
                                    if (x.phonetics.length > 0 && x.phonetics[0].text && x.phonetics[0].audio) {
                                        obj.word.phonetic = x.phonetics[0].text;
                                        obj.word.audio_url = `https:${x.phonetics[0].audio}`;
                                    }
                                    obj.word[targetLocale] = await ctx.call("$translate.to", {
                                        text: x.word,
                                        to: targetLocale,
                                    });
                                    for (const y of x.meanings) {
                                        for (const z of y.definitions) {
                                            z[targetLocale] = await ctx.call("$translate.to", {
                                                text: z.definition,
                                                to: targetLocale,
                                            });
                                        }
                                    }
                                } else {
                                    additionalWords.push(x.word);
                                }
                                await this.actions.create(obj);
                                wordDetailsArr.push({
                                    word: obj.word,
                                    meanings: obj.meanings,
                                });
                            }

                            for (const item of wordDetailsArr) {
                                item.word.localized = item.word[targetLocale];
                                delete item.word[targetLocale];
                                for (const y of item.meanings) {
                                    for (const z of y.definitions) {
                                        z.localized_text = z[targetLocale];
                                        delete z[targetLocale];
                                    }
                                }
                            }
                            wordDetailsArr.reverse();

                            return {
                                meta: {
                                    code: 200,
                                    success: true,
                                    message: "SUCCESS",
                                },
                                data: {
                                    message: "Word Found",
                                    language_array: langArr,
                                    word_details: wordDetailsArr,
                                },
                            };
                        } else {
                            return {
                                meta: {
                                    code: 200,
                                    success: true,
                                    message: "SUCCESS",
                                },
                                data: {
                                    message: "Word Not Found",
                                },
                            };
                        }
                    } else {
                        // making for DB
                        const dbWord = findInDb[0].word;
                        const dbMeanings = findInDb[0].meanings;

                        const wordResponseData = await this.settings.axiosInstanceDictionary({
                            method: "GET",
                            url: `api/v2/entries/en/${word}`,
                            timeout: 2500,
                            json: true,
                        });

                        if (wordResponseData.data.length > 0 && !findInDb[0].word.phonetic) {
                            const wordFinalResponseData = wordResponseData.data;
                            if (!_.isEmpty(wordFinalResponseData[0].phonetics)) {
                                dbWord.phonetic = wordFinalResponseData[0].phonetics[0].text;
                                dbWord.audio_url = `https:${wordFinalResponseData[0].phonetics[0].audio}`;
                            }
                        }

                        if (!dbWord[targetLocale]) {
                            dbWord[targetLocale] = await ctx.call("$translate.to", {text: word, to: targetLocale});
                            for (const y of dbMeanings) {
                                for (const z of y.definitions) {
                                    z[targetLocale] = await ctx.call("$translate.to", {
                                        text: z.definition,
                                        to: targetLocale,
                                    });
                                }
                            }
                            await this.adapter.model.updateOne({"word.text": word}, {
                                word: dbWord,
                                meanings: dbMeanings,
                            });
                        }

                        // response making
                        const wordObj: WordDetails = {
                            word: {
                                text: dbWord.text,
                                phonetic: dbWord.phonetic,
                                audio_url: dbWord.audio_url,
                                localized: dbWord[targetLocale],
                            },
                            meanings: dbMeanings,
                        };

                        for (const y of wordObj.meanings) {
                            y.definitions.forEach((z, i) => {
                                const obj = {
                                    definition: z.definition,
                                    example: z.example,
                                    synonyms: z.synonyms,
                                    antonyms: z.antonyms,
                                    localized_text: z[targetLocale],
                                };
                                y.definitions[i] = obj;
                            });
                        }
                        const wordDetailsArr = [wordObj];

                        if (findInDb[0].additional_words !== "") {
                            const additionalWord = findInDb[0].additional_words;
                            if (additionalWord.indexOf(",") !== -1) {
                                const additionalWords = additionalWord.split(",");

                                for (const w of additionalWords) {
                                    const additionalWordDetails = await this.adapter.db.collection("dictionary").find({"word.text": additionalWord}).toArray();
                                    if (additionalWordDetails.length > 0) {
                                        wordDetailsArr.push(this.additionaDataAddition(additionalWordDetails, targetLocale));
                                    }
                                }
                            } else {
                                const additionalWordDetails = await this.adapter.db.collection("dictionary").find({"word.text": additionalWord}).toArray();
                                if (additionalWordDetails.length > 0) {
                                    wordDetailsArr.push(this.additionaDataAddition(additionalWordDetails, targetLocale));
                                }
                            }
                        } else if (wordResponseData.data.length > 1) {
                            const wordFinalResponseData = wordResponseData.data;
                            const additionalWords = [];
                            for (let i = wordFinalResponseData.length - 1; i >= 0; i--) {
                                if (i > 0) {
                                    const x = wordFinalResponseData[i];
                                    const obj = {
                                        word: {
                                            text: x.word,
                                        },
                                        meanings: x.meanings,
                                        additional_words: "",
                                    };
                                    additionalWords.push(x.word);
                                    await this.actions.create(obj);
                                    delete obj.additional_words;
                                    wordDetailsArr.push(obj);
                                }
                                if (i === 0) {
                                    this.adapter.model.updateOne({"word.text": word}, {additional_words: additionalWords.join()});
                                }
                            }

                            for (const item of wordDetailsArr) {
                                item.word.localized = item.word[targetLocale];
                                delete item.word[targetLocale];
                                for (const y of item.meanings) {
                                    for (const z of y.definitions) {
                                        z.localized_text = z[targetLocale];
                                        delete z[targetLocale];
                                    }
                                }
                            }
                        }

                        return {
                            meta: {
                                code: 200,
                                success: true,
                                message: "SUCCESS",
                            },
                            data: {
                                message: "Word Found",
                                language_array: langArr,
                                word_details: wordDetailsArr,
                            },
                        };
                    }
                } catch (e) {
                    return {
                        meta: {
                            code: 200,
                            success: true,
                            message: "SUCCESS",
                        },
                        data: {
                            message: "Word Not Found",
                        },
                    };
                }
            }
            ,
        },
    },
    methods: {
        additionaDataAddition(additionalWordDetails, targetLocale) {
            let additionalWordObj = {
                word: {
                    text: additionalWordDetails[0].word.text,
                },
                meanings: additionalWordDetails[0].meanings,
            };

            additionalWordObj = this.removingExtraData(additionalWordObj, targetLocale);
            return additionalWordObj;
        },
        removingExtraData(additionalWordObj, targetLocale) {
            for (const y of additionalWordObj.meanings) {
                y.definitions.forEach((z, i) => {
                    const obj = {
                        definition: z.definition,
                        example: z.example,
                        synonyms: z.synonyms,
                        antonyms: z.antonyms,
                    };
                    y.definitions[i] = obj;
                });
            }
            return additionalWordObj;
        },
        extractingExactWord(word) {
            const resultArr = [];
            const x = word.split(" ");
            for (const i of x) {
                if (i !== "") {
                    resultArr.push(i);
                }
            }
            return resultArr;

        },
    },
    events: {},
};
