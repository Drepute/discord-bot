require("dotenv").config();

const axios = require("axios");
const api = require("../constants/api");
const apm = require("../apm");

const updateIdentity = async (uuid, body) => {
  const response = { success: false, error: null };
  const headers = { "X-Authentication": api.INTERNAL_TOKEN };
  try {
    const res = await axios.put(
      `${api.BASE_URL_V2}/user/identity/${uuid}`,
      body,
      { headers: headers }
    );
    response["success"] = true;
    console.log("RES_DATA", JSON.stringify(res.data));
    console.log(
      `[identity: ${uuid}] Successfully udpated with new tokens! [body: ${JSON.stringify(
        body
      )}]`
    );
  } catch (error) {
    let err;
    if (error.response) {
      // Request made and server responded
      err = `${JSON.stringify(error.response.data)}, status:${
        error.response.status
      }`;
    } else if (error.request) {
      // The request was made but no response was received
      err = `error.request: ${error.request}`;
    } else {
      // Something happened in setting up the request that triggered an Error
      err = `error.message: ${error.message}`;
    }
    console.error(err);
    response["error"] = new Error(err);
    apm.captureError(error, {
      custom: { uuid: uuid, body: JSON.stringify(body) },
    });
  }

  return response;
};

module.exports = { updateIdentity };
