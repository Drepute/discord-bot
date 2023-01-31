require("dotenv").config();
const fs = require("node:fs");
const axios = require("axios");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const path = require("path");

const { convertPerms } = require("./discordPermission");
const api = require("../constants/api");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const IGNORE_CMDS = ["addContribution", "register", "verify"];

const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN);

const deployCommands = async (GUILD_ID) => {
  const commands = [];
  const commandFiles = fs
    .readdirSync(path.resolve(__dirname, "../commands"))
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    if (IGNORE_CMDS.includes(file.slice(0, -3))) {
      console.log(`Command ignored: ${file}`);
      continue;
    }
    const command = require(`../commands/${file}`);
    commands.push(command.data.toJSON());
  }

  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("Successfully registered application commands.");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const deployCommandsToConnectedGuilds = async (client) => {
  const guilds = await client.guilds.fetch();
  const guildsPromise = guilds.map((guild) => guild.fetch());
  const guildsResolved = await Promise.all(guildsPromise);
  for await (let guild of guildsResolved) {
    console.log(
      `\n----------------------------\nDeploying commands to guild: ${guild.name} [${guild.id}]\n----------------------------`
    );
    await deployCommands(guild.id);
  }
};

const deployGlobalCommandsToAllServers = async () => {
  const commands = [];
  const commandFiles = fs
    .readdirSync(path.resolve(__dirname, "../commands"))
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    if (IGNORE_CMDS.includes(file.slice(0, -3))) {
      console.log(`Command ignored: ${file}`);
      continue;
    }
    const command = require(`../commands/${file}`);
    commands.push(command.data.toJSON());
  }

  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("Successfully registered application commands.");
  } catch (err) {
    console.error(err);
  }
};

const clearCommandsInGuild = async (GUILD_ID) => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: [],
    });
    console.log(
      "Successfully cleared application commands for guild with guildID: ",
      GUILD_ID
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const getAccessToken = async (
  discord_code,
  redirect_uri = api.DISCORD_REDIRECT_URI
) => {
  const response = { token: null, user: null, error: null };
  // const headers = { "Content-Type": "application/x-www-form-urlencoded" };
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
    response["token"] = res.data.access_token;
  } catch (error) {
    let err;
    if (error.response) {
      // Request made and server responded
      err = `data:${JSON.stringify(error.response.data)}, status:${
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

  try {
    const headers = { Authorization: `Bearer ${response.token}` };
    const url = "https://discord.com/api/users/@me";
    const res = await axios.get(url, { headers: headers });
    response["user"] = res.data;
  } catch (error) {
    let err;
    if (error.response) {
      // Request made and server responded
      err = `data:${JSON.stringify(error.response.data)}, status:${
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
  }

  return response;
};

const getUserGuilds = async (accessToken, guildIds) => {
  const response = { guilds: null, error: null };
  const headers = { Authorization: `Bearer ${accessToken}` };
  const IMAGE_BASE_URL = "https://cdn.discordapp.com";
  try {
    const url = "https://discord.com/api/users/@me/guilds";
    const guildRes = await axios.get(url, { headers: headers });

    // for (let item of guildRes.data) {
    //   console.log(item.id, item.name, convertPerms(item.permissions));
    // }

    const guilds = guildRes.data
      .filter(
        (item) =>
          (item.owner || convertPerms(item.permissions).ADMINISTRATOR) &&
          guildIds.indexOf(item.id) < 0
      )
      .map((item) =>
        item.icon
          ? {
              ...item,
              icon: `${IMAGE_BASE_URL}/icons/${item.id}/${item.icon}.webp`,
            }
          : item
      );
    // console.info("[/getUserGuilds] Guilds", guilds);
    response["guilds"] = guilds;
  } catch (err) {
    console.error(err);
    response["error"] = err;
  }

  return response;
};

const getGuildRoles = async (GUILD_ID) => {
  const response = { roles: null, error: null };
  try {
    const res = await rest.get(Routes.guildRoles(GUILD_ID));
    // console.log("[getGuildRoles] res:", JSON.stringify(res));
    response.roles = res.filter((item) => !item.managed);
  } catch (error) {
    console.error("[getGuildRoles]", error);
    response.error = error;
  }

  return response;
};

const getGuildMember = async (GUILD_ID, USER_ID) => {
  const response = { member: null, error: null };
  try {
    const res = await rest.get(Routes.guildMember(GUILD_ID, USER_ID));
    // console.log("[getGuildRoles] res:", JSON.stringify(res));
    response.member = res;
  } catch (error) {
    console.error("[getGuildMember]", error);
    response.error = error;
  }

  return response;
};

const removeBotFromGuild = async (client, guildId) => {
  try {
    const guild = await client.guilds.fetch(guildId);
    console.log("[removeBotFromGuild]", guild.id, guild.name);
    await guild.leave();
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};

const getUser = async (userId) => {
  try {
    const user = await rest.get(Routes.user(userId));
    return { success: true, user: user };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  deployCommands,
  deployCommandsToConnectedGuilds,
  deployGlobalCommandsToAllServers,
  clearCommandsInGuild,
  getGuildRoles,
  getAccessToken,
  getUserGuilds,
  getGuildMember,
  removeBotFromGuild,
  getUser,
};
