import { ServiceSchema } from "moleculer";
import * as _ from "lodash";
import { ObjectId } from "mongodb";

import { staticCDN } from "../../../common";

const FeedService: ServiceSchema = {
    name: "feed",
    settings: {
        rest: "/feed",
        defaultCategories: ["t20_cricket", "memes"],

    },
    actions: {
        onBoarding: {
            rest: "GET /onboarding",
            async handler(ctx) {

                const categoriesList: [{ id: number; name: string; category: string; is_selected: boolean; connections: [] }] = await ctx.call("$feed-categories.getCategories");

                categoriesList.map(eachCategory => {
                    if (this.settings.defaultCategories.includes(eachCategory.category)) {
                        eachCategory.is_selected = true;
                    }
                    return eachCategory;
                });
                const data = this.onBoardingData(categoriesList);
                return { data };
            },
        },
        getSuggestionsList: {
            rest: "POST /get-friends-suggestions",
            params: {
                categories: { type: "array" },
            },
            async handler(ctx) {
                const { user } = ctx.meta;
                const { categories } = ctx.params;
                const validCategories = [];
                const categoriesList: [{ id: number; name: string; category: string; is_selected: boolean; connections: [] }] = await ctx.call("$feed-categories.getCategories");
                categoriesList.map(ec => {
                    if (categories.includes(ec.category)) {
                        validCategories.push(ec);
                    }
                });
                await Promise.all(validCategories.map(async eachCategory => {
                    const al: [] = await ctx.call("$friend-suggestion.find", {
                        query: {
                            category: eachCategory.category,
                            student_id: user.student_id,
                        },
                    });
                    if (al.length < 1) {
                        ctx.call("$friend-suggestion.create", { category: eachCategory.category, studentId: user.student_id, isActive: 1 });
                    }
                }));

                const suggestedConnections = await Promise.all(validCategories
                    .map(async eachCategory => {
                        const connectionsList: [] = await ctx.call("$friend-suggestion.getFollowers", { category: eachCategory.category });
                        return {
                            ...eachCategory,
                            connections: connectionsList,
                        };
                    }));
                return {
                    data: suggestedConnections,
                };
            },
        },
        getCategories: {
            rest: "GET /get-categories",
            async handler(ctx) {
                const { user } = ctx.meta;
                const categoriesList: { category }[] = await ctx.call("$feed-categories.getCategories");
                const followedCategories: { category }[] = await ctx.call("$friend-suggestion.find", {
                    query: {
                        student_id: user.student_id,
                    },
                });
                const categoriesFollowedByUser = followedCategories.map(ec => ec.category);

                const categoriesListByUser = [];
                categoriesList.forEach(eachCategory => {
                    if (eachCategory.category === "popular") {
                        categoriesListByUser.splice(0, 0, eachCategory);
                    }
                    else if (categoriesFollowedByUser.includes(eachCategory.category)) {
                        categoriesListByUser.splice(1, 0, eachCategory);
                    } else {
                        categoriesListByUser.push(eachCategory);
                    }
                });
                return {
                    data: categoriesListByUser,
                };
            },
        },
        // /api/feed/post-answer?post_type=mcq-feed&post_id=<post_id>&answer=answer
        postOnPollMcq: {
            rest: "POST /post-answer",
            params: {
                post_type: { type: "string", required: true },
                post_id: { type: "string", required: true },
                user_id: { type: "string", required: true },
                answer: { type: "string", required: true },
            },
            async handler(ctx) {
                const { student_id } = ctx.meta.user;
                const { post_type, post_id, answer } = ctx.params;
                const alreadyPosted: [] = await ctx.call("$feed-reply.find", {
                    query: {
                        post_id,
                        student_id,
                    },
                });

                if (alreadyPosted.length < 1) {
                    await ctx.call("$feed-reply.create", { post_id, student_id, answer });
                }
                if (post_type === "poll_feed") {
                    const poll: { _id; poll_item }[] = await ctx.call("$feed-post.find", { query: { _id: new ObjectId(post_id), type: "poll_feed" } });

                    if (poll.length) {
                        const pollAnswersOptions = poll[0].poll_item.poll_options;
                        const pollAnswersCount: { _id; count }[] = await ctx.call("$feed-reply.getRepliesByPollId", { post_id });

                        const totalCount = pollAnswersCount.reduce((prev, eachOpt) => prev + eachOpt.count, 0);
                        const updatedPollAnswerOptions = pollAnswersOptions.map(eachAns => {
                            // eslint-disable-next-line no-underscore-dangle
                            const ansPollCount: {}[] = pollAnswersCount.filter(e => eachAns.title === e._id);
                            const ansCount = _.get(ansPollCount, "[0].count", 0);
                            eachAns.percentage = Math.floor((ansCount * 100) / totalCount);
                            return eachAns;
                        });
                        const updatedPollItem = { ...poll[0].poll_item, poll_options: updatedPollAnswerOptions };
                        // eslint-disable-next-line no-underscore-dangle
                        await ctx.call("$feed-post.update", { id: poll[0]._id, poll_item: updatedPollItem });

                        return {
                            poll_item: {
                                ...updatedPollItem,
                            },
                        };

                    }
                }
                return true;
            },
        },
    },
    events: {},
    methods: {
        onBoardingData(categoriesList) {
            return {
                header_icon: `${staticCDN}images/feed_onboard_135355353.png`,
                header_bg_color: "#ffe6e0",
                header_title: "Introducing New Doubtnut Feed",
                onboarding_page_list: [
                    {
                        widget_type: "feed_onboarding_introduction",
                        widget_data: {
                            image_url: `${staticCDN}images/feed_onboarding_intro_124243.png`,
                            title: "Create better posts by adding Polls, MCQs and many more things",
                            description: "Doubtnut feed par aap posts apne choice ke background ke sath create kar doston se share kar sakte hain!",
                            cta_text: "Next",
                            can_skip: false,
                        },
                    },
                    {
                        widget_type: "feed_category_prefernce",
                        widget_data: {
                            title: "Choose your interest and personalise your feed!",
                            subtitle: "Aap apni pasand ke saare topics choose kar sakte hain!",
                            cta_text: "Next",
                            can_skip: false,
                            categories: categoriesList,
                        },
                    },
                    {
                        widget_type: "feed_onboarding_connection",
                        widget_data: {
                            title: "Follow most popular students based on your interest",
                            cta_text: "Next",
                            can_skip: true,
                            // suggested_connections: suggestedConnections,
                        },
                    },
                    {
                        widget_type: "feed_onboarding_comfirmation",
                        widget_data: {
                            image_url: "",
                            title: "Congratulations !",
                            description: "We have personalized your feed based on your interests.",
                            cta_text: "Done",
                            can_skip: false,
                        },
                    },
                ],
            };
        },
    },
};

export = FeedService;
