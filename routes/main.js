const express = require("express");

const apm = require("../apm");
const client = require("../discordClient");

const { authMiddleware } = require("../middlewares/auth");

const {
  deployCommands,
  clearCommandsInGuild,
  getGuildRoles,
  getAccessToken,
  refreshAccessToken,
  getUserGuilds,
  getGuildMember,
  removeBotFromGuild,
  addUserToDb,
  getUserFromDb,
  getDiscordUserFromId,
  getDiscordUserFromToken,
} = require("../utils/discordApi");

const router = express.Router();

router.get("/ping", (_req, res) => {
  res.status(200).send({ status: "success" });
});

router.post("/toggleBot", authMiddleware, async (req, res, next) => {
  try {
    const guildId = req.body.guild_id;
    // const commands = req.body.commands;
    const disableBot = req.body.disable_bot;
    console.log("in toggle bot", guildId, disableBot);
    let updateCommandResponse;

    if (disableBot) {
      updateCommandResponse = await clearCommandsInGuild(guildId);
    } else {
      updateCommandResponse = await deployCommands(guildId);
    }

    res.json({
      success: updateCommandResponse,
      data: {},
    });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

router.get("/details/:guild_id", authMiddleware, async (req, res, next) => {
  try {
    const guildId = req.params.guild_id;
    try {
      const guild = await client.guilds.fetch(guildId);
      console.log(`Guild with ID: ${guildId} found!`);
      const guildName = guild.name;
      const guildIconUrl = guild.iconURL();
      return res.json({
        success: true,
        data: {
          guild_name: guildName,
          guild_icon_url: guildIconUrl,
        },
      });
    } catch (error) {
      console.error(error);
      return res.json({ success: false, message: error.message });
    }
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

router.post("/removeBot", authMiddleware, async (req, res, next) => {
  try {
    const guildId = req.body.guild_id;
    const response = await removeBotFromGuild(client, guildId);
    res.json(response);
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

router.get("/guildRoles/:guildId", authMiddleware, async (req, res, next) => {
  try {
    const { roles, error } = await getGuildRoles(req.params.guildId);
    if (error) throw error;
    res.status(200).send({ roles });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

router.post("/addUser", authMiddleware, async (req, res, next) => {
  try {
    const { discord_code, redirect_uri, guilds } = req.body;
    if (discord_code == undefined || redirect_uri == undefined) {
      return res
        .status(400)
        .send({ message: "discord_code or redirect_uri not provided!" });
    }

    const tokenRes = await getAccessToken(discord_code, redirect_uri);
    if (tokenRes.error) {
      return res.status(400).send({ message: tokenRes.error.message });
    }

    const userRes = await getDiscordUserFromToken(tokenRes.data.access_token);
    if (userRes.error) {
      return res.status(400).send({ message: userRes.error.message });
    }

    const user = await addUserToDb(
      userRes.data.id,
      tokenRes.data.access_token,
      tokenRes.data.refresh_token
    );

    let userGuildsRes;
    if (guilds) {
      userGuildsRes = await getUserGuilds(user.accessToken);
      if (userGuildsRes.error) {
        return res.status(400).send({ message: userGuildsRes.error.message });
      }
    }

    res.status(200).send({
      user: { id: user.userId },
      ...(guilds && userGuildsRes.guilds && { guilds: userGuildsRes.guilds }),
    });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

router.get("/userGuilds", authMiddleware, async (req, res, next) => {
  try {
    const { user_id } = req.query;
    if (user_id == undefined) {
      return res.status(400).send({ message: "user_id not provided!" });
    }

    const user = await getUserFromDb(user_id);
    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    let userGuildsRes = await getUserGuilds(user.accessToken);
    if (userGuildsRes.error && userGuildsRes.status == 401) {
      const refreshRes = await refreshAccessToken(user.refreshToken);
      if (refreshRes.error) {
        return res.status(400).send({ message: refreshRes.error.message });
      }

      user.accessToken = refreshRes.data.access_token;
      user.refreshToken = refreshRes.data.refresh_token;
      await user.save();

      userGuildsRes = await getUserGuilds(user.accessToken);
    }

    userGuildsRes.guilds
      ? res.status(200).send({ guilds: userGuildsRes.guilds })
      : res.status(400).send({ message: userGuildsRes.error.message });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

router.get("/guildMember", authMiddleware, async (req, res, next) => {
  try {
    const { guild_id, user_discord_id } = req.query;
    if (guild_id == undefined || user_discord_id == undefined) {
      return res.status(400).send();
    }

    const guildMemberRes = await getGuildMember(guild_id, user_discord_id);
    if (guildMemberRes.error) throw guildMemberRes.error;

    res.status(200).send({ guildMember: guildMemberRes.member });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

router.get("/userDetail", authMiddleware, async (req, res, next) => {
  try {
    const { error, user } = await getDiscordUserFromId(req.query.user_id);
    if (error) {
      return res.status(400).send({ error });
    }

    res.status(200).send({ user });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

router.get("/discordRedirect", async (req, res, next) => {
  try {
    console.log("[discordRedirect]", req.query);
    res.status(200).send({ data: req.query });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

module.exports = router;
