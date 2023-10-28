"use strict";
import dbMixin from "../config/db.mixin";
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "games",

    mixins: [dbMixin("games_score")],
	settings: {
		fields: ["_id", "game_id", "studentID", "score_meta", "vendor_meta"],
		entityValidator: {
            game_id : {type: "string"},
            student_id: {type: "number" },
            // score_meta : {type: },
            // vendor_meta : {},
		},
	},
	// adapter: new MongoDBAdapter(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }),
	// collection: "game_score",
	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		getScoreList: {
			rest: {
				method: "GET",
				path: "/scores/:gameID",
			},
			params: {
			},
			async handler(ctx: any ) {
        // page = parseInt(page) ? parseInt(page) : 0;
          let responseData = {};
          try {
              // eslint-disable-next-line radix
              const game_id: string = ctx.params.gameID;
              const pageSize: number = 50;
              // eslint-disable-next-line radix
              const page = ctx.params.page ? ctx.params.page - 1 : 0 ;
              const scores: any[] = await this.adapter.db.collection("games_score")
                  .find({
                      game_id,
                  })
                  .sort({
                      _id: -1,
                  })
                  .skip(page * pageSize)
                  .limit(pageSize)
                  .toArray();
              const count: number = await this.adapter.db.collection("games_score")
                  .countDocuments({
                      game_id,
                  });
              responseData = {
                  meta: {
                      code: 200,
                      success: true,
                      message: "Success",
                  },
                  data: {
                      scores,
                      count,
                  },
              };
          } catch (error) {
            responseData = {
              meta: {
                  code: 404,
                  success: false,
                  message: "Something Went Wrong",
              },
          };
              console.log(error);
          }
          return responseData;

			},
    },
    processScore: {
        rest: {
            method: "POST",
            path: "/v1/score",
        },
        params: {
        },
        async handler(ctx) {
            try {
            // : { params: {game_id: string;score_meta: any;vendor_meta: any}; meta: any }
            const game_id: string = ctx.params.game_id;
            const score_meta: any = ctx.params.score_meta;
            score_meta.type = ["level", "Level"].includes(score_meta.type) ? "levelup" : score_meta.type;
            const vendor_meta: any = ctx.params.vendor_meta;
            const student_id: number = ctx.meta.user.id;
            let responseData = {};
            if (!game_id){
                responseData = {
                meta: {
                    code: 400,
                    success: false,
                    message: "Error",
                },
                data: {
                    msg: "game_id is missing",
                },
            };
            } else if (!score_meta) {
                responseData = {
                    meta: {
                        code: 400,
                        success: false,
                        message: "Error",
                    },
                    data: {
                        msg: "score_meta is missing",
                    },
                };
                // Add one more check for "Something is Missing"
            } else {
                try {
                    await this.adapter.db.collection("games_score").save({
                        game_id,
                        student_id,
                        ...score_meta,
                        ...vendor_meta,
                    });
                    responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: "Success",
                        },
                        data: {
                            msg: "Score Updated",
                        },
                    };
                } catch (err){
                    responseData = {
                        meta: {
                            code: 400,
                            success: false,
                            message: "Error",
                        },
                        data: {
                            msg: "Something Went Wrong",
                        },
                    };
                }
            }
            return responseData;
            }
            catch (err) {
                console.log(err);
            }

        },
     },
    processScoreV2: {
			rest: {
				method: "POST",
				path: "/v2/score",
			},
			params: {
			},
			// eslint-disable-next-line max-lines-per-function
			async handler(ctx) {
                try {
                const GAMEZOP_GAMEID_MAP = {
                    "4ykgM_yzbcg" : {
                        name: "Rescue Juliet",
                        id: "121",
                    },
                    "SJghvtd2_" : {
                        name: "Drop Me",
                        id: "122",
                    },
                    "SJX7TGkDq1X" : {
                        name: "Pop Soap",
                        id: "123",
                    },
                };
                const gameCode: string = ctx.params.gameCode;
                let game_id: string;
                let student_id: number;
                let type: string;
                let score: number;
                let game_name: string;
                let vendor_id: string;
                let vendor_name: string;
                if (gameCode){
                    // is a gameZop Game
                    game_id = GAMEZOP_GAMEID_MAP[gameCode].id;
                    // eslint-disable-next-line radix
                    student_id = parseInt(ctx.params.subId);
                    type = ctx.params.gamestate;
                    score = ctx.params.score;
                    game_name = GAMEZOP_GAMEID_MAP[gameCode].name;
                    vendor_id = "gamezop-rental";
                    vendor_name = "Gamezop";
                } else {
                    // is a Saurabh Game
                    game_id = ctx.params.game_id;
                    // eslint-disable-next-line radix
                    student_id = parseInt(ctx.params.student_id);
                    type = ["level", "Level"].includes(ctx.params.type) ? "levelup" : ctx.params.type;
                    score = ctx.params.score;
                    game_name = ctx.params.game_name;
                    vendor_id = ctx.params.vendor_id;
                    vendor_name = ctx.params.vendor_name;
                }
                let responseData = {};
                if (!game_id){
                    responseData = {
                    meta: {
                        code: 400,
                        success: false,
                        message: "Error",
                    },
                    data: {
                        msg: "game_id or gameCode is missing",
                    },
                };
                } else if (!score && !type) {
                    responseData = {
                        meta: {
                            code: 400,
                            success: false,
                            message: "Error",
                        },
                        data: {
                            msg: "score or type or gameState is missing",
                        },
                    };
                    // Add one more check for "Something is Missing"
                } else {
                    try {
                        await this.adapter.db.collection("games_score").save({
                            game_id,
                            student_id,
                            type,
                            score,
                            game_name,
                            vendor_id,
                            vendor_name,
                        });
                        responseData = {
                            meta: {
                                code: 200,
                                success: true,
                                message: "Success",
                            },
                            data: {
                                msg: "Score Updated",
                            },
                        };
                    } catch (err){
                        responseData = {
                            meta: {
                                code: 400,
                                success: false,
                                message: "Error",
                            },
                            data: {
                                msg: "Something Went Wrong",
                            },
                        };
                    }
                }
                return responseData;
                }
                catch (err) {
                    console.log(err);
                }

            },
         },

	},
	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	created() {


	},

	/**
	 * Service started lifecycle event handler
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	async started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	async stopped() {

	},
};
