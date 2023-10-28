import Redis = require("ioredis");
import camelCase = require("camelcase");
import _ = require("lodash");
import { ServiceSchema } from "moleculer";


const GraphService: ServiceSchema =   {
        name: "graph-service",
        mixins: [],
        methods: {
            query(theQuery: string, values: { [s: string]: any }) {
                let query: any;
                {
                    if (values) {
                        for (const [key, value] of Object.entries(values)) {
                            const theKey = `$${key}`;
                            if (typeof value === "object") {
                                const stringifiedObject = JSON.stringify(value).replace(/"([^"]+)":/g, "$1:");
                                theQuery = theQuery.split(theKey).join(`${stringifiedObject}`);
                            } else if (typeof value === "number") {
                                theQuery = theQuery.split(theKey).join(`${value}`);
                            } else {
                                theQuery = theQuery.split(theKey).join(`"${value}"`);
                            }
                        }
                    } else {
                        query = theQuery;
                    }
                    query = theQuery;
                }
                return this.broker.cacher.client.call("GRAPH.QUERY", this.settings.graphName, `${query}`);
            },
            delete() {
                return this.broker.cacher.client.call("GRAPH.DELETE", this.settings.graphName);
            },

            explain(command: any) {
                return this.broker.cacher.client.call("GRAPH.EXPLAIN", this.settings.graphName, `${command}`);
            },
        },
    /**
     * Service started lifecycle event handler
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async started() {
        function parseMetaInformation(array: any) {
            const meta = {};
            for (const prop of array) {
                let [name, value] = prop.split(": ");
                if (value) {
                    value = value.trim();
                    name = camelCase(name);
                    meta[name] = value;
                }
            }
            return meta;
        }

        // a single result will consist of an array with one element for each returned object in the original QUERY
        // for example: "... RETURN n, l, p" <- will return multiple rows/records, each of which will have n, l, and p.
        function parseResult(columnHeaders: any[], singleResult: { [x: string]: any }) {
            const columns = columnHeaders.map((columnHeader: any, index: string | number) => {
                const name = columnHeader;
                let value = singleResult[index];

                if (Array.isArray(value)) {
                    value = _.fromPairs(value);
                }

                if (value && value.properties) {
                    _.defaults(value, _.fromPairs(value.properties));
                    delete value.properties;
                }

                try {
                    return [name, JSON.parse(value)];
                } catch (error) {
                    return [name, value];
                }
            });

            return _.fromPairs(columns);
        }
        Redis.Command.setReplyTransformer("GRAPH.QUERY", function(result: any) {
            const metaInformation = parseMetaInformation(result.pop());
            let parsedResults: { [k: string]: any } = {};
            parsedResults.meta = metaInformation;
            if (result.length > 1) { // if there are results to parse
                const columnHeaders = result[0];
                const resultSet = result[1];
                parsedResults = resultSet.map((item: any) => parseResult(columnHeaders, item));
            }
            return parsedResults;
        });
    },
    };
export = GraphService;

