const axios = require("axios");
// const querystring = require("querystring");
// const accessToken = "zp9cjX98tC5FxyklggyagWIXThGJhL";
// const refreshToken = "KXPsfqePXSUqnT0hyb5diuNPvKK94C";
const guildId = "938906933732212846";
// const role_id = 974858706300846101;
//

// const API_ENDPOINT = "https://discord.com/api/oauth2/token";
// const CLIENT_ID = "950635095465795615";
// const CLIENT_SECRET = "X6HWPPo5aGQMShDng9EjWOmkiw5QgLI9";

const CLIENT_ID = "976409482533961769";
const CLIENT_SECRET = "CZN7fMG39PGvEt9f5tMSdxsrilgt0Hy4";

const discordCode = "RPnOXnR0qH0wX3MrvmPmxKoMoCLL8H";
const accessToken = "kM6pER8FK2ToP0zSOjZHS9MotWztc4";
const refreshToken = "JPD1PBRyZTZlguqJ0SjHiSeMuuiDeN";

// RES {"data":{"token_type":"Bearer","access_token":"9InWx3eQjYrCGrxPsL3UVR3111mBQp","expires_in":604800,"refresh_token":"Soc7EFmSF4ObBoxLu9lquQ3cVqGo1I","scope":"email guilds.join connections identify guilds guilds.members.read"},"error":null}0

const getAccessToken = async (
  discord_code,
  redirect_uri = "http://localhost:3002/discord_bot/discordRedirect"
) => {
  const response = { data: null, error: null };

  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", discord_code);
  params.append("redirect_uri", redirect_uri);
  params.append("scope", "identify");

  try {
    const url = "https://discord.com/api/oauth2/token";
    const res = await axios.post(url, params);
    // console.log("[getAccessToken]", res);
    response["data"] = res.data;
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
    return response;
  }

  console.log("RES", JSON.stringify(response));
  return response;
};

// (async () => await getAccessToken(discordCode))();

const refreshAccessToken = async (refreshToken) => {
  const response = { data: null, error: null };

  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  try {
    const url = "https://discord.com/api/oauth2/token";
    const res = await axios.post(url, params);
    response["data"] = res.data;
  } catch (error) {
    console.log(error);
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
    return response;
  }

  console.log("RES", JSON.stringify(response));
  return response;
};

(async () => await refreshAccessToken(refreshToken))();

const getUserGuildMember = async (accessToken, GUILD_ID) => {
  const response = { member: null, error: null, status: null };
  const headers = { Authorization: `Bearer ${accessToken}` };
  try {
    const url = `https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`;
    const res = await axios.get(url, { headers: headers });
    response["member"] = res.data;
    response["status"] = res.status;
  } catch (error) {
    let err;
    if (error.response) {
      console.log("RES_HEADERS", JSON.stringify(error.response.headers));
      // Request made and server responded
      err = `${JSON.stringify(error.response.data)}, status:${
        error.response.status
      }`;
      response["status"] = error.response.status;
    } else if (error.request) {
      // The request was made but no response was received
      err = `error.request: ${error.request}`;
    } else {
      // Something happened in setting up the request that triggered an Error
      err = `error.message: ${error.message}`;
    }
    console.error(err);
    response["error"] = new Error(err);
    return response;
  }

  console.log("RES", JSON.stringify(response));
  return response;
};

// (async () => await getUserGuildMember(accessToken, guildId))();
