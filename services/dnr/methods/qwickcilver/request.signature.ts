import {ServiceSchema} from "dn-moleculer";
import cryptoJS from "crypto-js";
import Settings from "../settings";

const qwickCilverRequestSignature: ServiceSchema = {
    name: "$requestSignature",
    mixins: [Settings],
    methods: {

        /**
         * Sorts the parameters according to the ASCII table.
         */
        sortObject(object) {
            let sortedObj;
            let keys;
            if (object instanceof Array) {
                sortedObj = [];
                keys = Object.keys(object);
            } else {
                sortedObj = {};
                keys = Object.keys(object);
            }

            keys.sort(function(key1, key2) {
                if (key1 < key2) {
                    return -1;
                }
                if (key1 > key2) {
                    return 1;
                }
                return 0;
            });

            for (const index in keys) {
                if (Object.prototype.hasOwnProperty.call(keys, index)) {
                    const key = keys[index];
                    if (typeof object[key] == "object") {
                        if ((object[key] instanceof Array)) {
                            sortedObj[key] = this.sortObject(object[key]);
                        }
                        sortedObj[key] = this.sortObject(object[key]);
                    } else {
                        sortedObj[key] = object[key];
                    }
                }
            }
            return sortedObj;
        },

        /**
         * Sort all query parameters in the request according to the parameter name in ASCII table.
         */
        sortQueryParams(absApiUrl: string) {
            const url = absApiUrl.split("?");
            const baseUrl = url[0];
            const queryParam = url[1].split("&");

            absApiUrl = baseUrl + "?" + queryParam.sort().join("&");

            return this.fixedEncodeURIComponent(absApiUrl);
        },

        /**
         * @returns {String} encodeURIComponent of string
         */
        fixedEncodeURIComponent(str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
                return "%" + c.charCodeAt(0).toString(16);
            });
        },

        /**
         * Creates signature by concatenating the (request method(upper case), request host, request URL), encoded request parameters and encoded query parameters using & as the separator.
         * @returns {String} Encoded SHA512 value
         */
        generateRequestSignature(requestMethod: string, hostURL: string, requestBody?: any) {
            console.log("hostURL ", hostURL);
            const method = requestMethod.toUpperCase();

            let url = null;
            if (hostURL.indexOf("?") >= 0) {
                url = this.sortQueryParams(hostURL);
            } else {
                url = this.fixedEncodeURIComponent(hostURL);
            }
            let baseString = method + "&" + url;
            if (requestBody) {
                const requestData = this.fixedEncodeURIComponent(JSON.stringify(this.sortObject(requestBody)));
                baseString = method + "&" + url + "&" + requestData;
            }

            return cryptoJS.HmacSHA512(baseString, this.settings.qwickCilver.ConsumerSecret).toString();
        },
    },
};

export = qwickCilverRequestSignature;
