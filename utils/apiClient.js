const axios = require("axios");
const createAuthRefreshInterceptor = require("axios-auth-refresh");
const { updateToken, getToken } = require("./token");
const api = require("../constants/api");
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
const BASE_URL = process.env.BASE_URL;

function addAuthToken(config) {
  return !config.doNotAddAuthToken;
}

// adds auth token in each request. to disable this add a doNotAddAuthToken property in config
axios.interceptors.request.use(
  (request) => {
    console.log("request", getToken());
    request.headers["Authorization"] = `Bearer ${getToken()}`;
    return request;
  },
  null,
  { runWhen: addAuthToken }
);

console.log(
  "createAuthRefreshInterceptor",
  createAuthRefreshInterceptor.default
);

// Function that will be called to refresh authorization
const refreshAuthLogic = (failedRequest) =>
  axios
    .get(`${BASE_URL}${api.ROUTES.getAdminToken}`, {
      headers: {
        "X-Authentication": INTERNAL_TOKEN,
      },
      doNotAddAuthToken: true,
    })
    .then((tokenRefreshResponse) => {
      updateToken(tokenRefreshResponse.data.token);
      failedRequest.response.config.headers["Authorization"] =
        "Bearer " + tokenRefreshResponse.data.data.token;
      return Promise.resolve();
    });

// Instantiate the interceptor
createAuthRefreshInterceptor.default(axios, refreshAuthLogic);

module.exports = axios;
