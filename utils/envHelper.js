const { getSecretValue } = require("../secrets");
require("dotenv").config();

const TOKEN = process.env.TOKEN;
const GUILDID = process.env.GUILDID;
const CLIENTID = process.env.CLIENTID;
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

let env;
const environment = process.env.NODE_ENV;

// todo: club discord token and client id into one
async function getDiscordToken() {
  if (environment == "dev") {
    return TOKEN;
  } else {
    const discordSecret = await getSecretValue(`${environment}_discord`);
    return discordSecret;
  }
}

async function getInternalToken() {
  if (environment == "dev") {
    return INTERNAL_TOKEN;
  } else {
    const internalTokenSecret = await getSecretValue(
      `${environment}_internal_token`
    );
    return internalTokenSecret["token"];
  }
}

async function getClientId() {
  if (environment == "dev") {
    return CLIENTID;
  } else {
    const clientId = await getSecretValue(`${environment}_client_id`);
    return clientId;
  }
}

async function getGuildId() {
  if (environment == "dev") {
    return GUILDID;
  } else {
    const guildId = await getSecretValue(`${environment}_guild_id`);
    return guildId;
  }
}

async function getEnv() {
  if (env) {
    return env;
  }
  const discordToken = await getDiscordToken();
  const internalToken = await getInternalToken();
  const guildId = await getGuildId();
  const clientId = await getClientId();
  env = {
    internalToken: internalToken,
    discordToken: discordToken,
    guildId: guildId,
    clientId: clientId,
  };
  return env;
}

module.exports = {
  getEnv,
};
