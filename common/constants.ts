export const flagrHost = {
    baseUrl: process.env.FLAGR_HOST,
    evaluation: "/api/v1/evaluation",
};

export const questionImagesBucket = "doubtnut-static";
export const staticBucket = "doubtnut-static";
export const teslaBucket = "doubtnut-static/images";

export const videoCDN = "https://d3cvwyf9ksu0h5.cloudfront.net/";
export const staticCDN = "https://d10lpgp6xz60nq.cloudfront.net/";
export const staticCloudfrontCDN = "https://d10lpgp6xz60nq.cloudfront.net/";
export const apiUrl = process.env.NODE_ENV === "production" ? "https://api.doubtnut.com/" : "https://dev8.doubtnut.com/";

export const newtonHost = {
    baseUrl: process.env.NEWTON_HOST,
    url: "/notification/send",
};

export const searchServiceHost = process.env.SEARCH_SERVICE_HOST;
