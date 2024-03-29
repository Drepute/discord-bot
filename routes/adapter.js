const express = require("express");

const apm = require("../apm");

const {
  getUserGuilds,
  getUserGuildMember,
  refreshAccessToken,
  getAccessToken,
  getDiscordUserFromToken,
} = require("../utils/discordApi");

const { updateIdentity } = require("../utils/v2Apis");

const { authMiddleware } = require("../middlewares/auth");

const router = express.Router();

router.get("/userAccessToken", authMiddleware, async (req, res, next) => {
  const { grant_code, redirect_uri } = req.query;
  try {
    const tokenRes = await getAccessToken(grant_code, redirect_uri);
    if (tokenRes.error) {
      return res.status(400).send({ message: tokenRes.error.message });
    }

    const userRes = await getDiscordUserFromToken(tokenRes.data?.access_token);
    if (userRes.error) {
      return res.status(400).send({ message: userRes.error.message });
    }

    return res.status(200).send({ ...tokenRes.data, ...userRes.data });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

router.get("/isGuildMember", authMiddleware, async (req, res, next) => {
  const { uuid, accessToken, refreshToken, guild_id } = req.query;
  let newAccessToken,
    newRefreshToken,
    member = false;

  console.log("accessToken", accessToken);
  console.log("refreshToken", refreshToken);

  try {
    // const user = await getUserFromDb(user_id);
    // if (!user) {
    //   return res.status(404).send({ message: "User not found!" });
    // }

    let userGuildsRes = await getUserGuilds(accessToken, false);

    if (userGuildsRes.error) {
      if (userGuildsRes.status == 401) {
        const refreshRes = await refreshAccessToken(refreshToken);
        if (refreshRes.error) {
          return res.status(400).send({ message: refreshRes.error.message });
        }
        newAccessToken = refreshRes.data.access_token;
        newRefreshToken = refreshRes.data.refresh_token;
        const updateIdentityBody = {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        };
        const updateIdentityRes = await updateIdentity(
          uuid,
          updateIdentityBody
        );
        userGuildsRes = await getUserGuilds(newAccessToken, false);
      } else {
        return res
          .status(userGuildsRes.status)
          .send({ message: userGuildsRes.error.message });
      }
    }

    const guilds = userGuildsRes.guilds;
    const desiredGuild = guilds.find((item) => item.id === guild_id);
    member = desiredGuild ? true : member;
    return res.status(200).json({
      member: member,
      guild: desiredGuild,
      newAccessToken: newAccessToken,
      newRefreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

router.get("/checkRole", authMiddleware, async (req, res, next) => {
  const { uuid, accessToken, refreshToken, guild_id, role_id } = req.query;
  let newAccessToken,
    newRefreshToken,
    role = false;

  console.log("accessToken", accessToken);
  console.log("refreshToken", refreshToken);

  try {
    // const user = await getUserFromDb(user_id);
    // if (!user) {
    //   return res.status(404).send({ message: "User not found!" });
    // }

    let userGuildMemberRes = await getUserGuildMember(accessToken, guild_id);

    if (userGuildMemberRes.error) {
      if (userGuildMemberRes.status == 401) {
        const refreshRes = await refreshAccessToken(refreshToken);
        if (refreshRes.error) {
          return res.status(400).send({ message: refreshRes.error.message });
        }
        newAccessToken = refreshRes.data.access_token;
        newRefreshToken = refreshRes.data.refresh_token;
        const updateIdentityBody = {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        };
        const updateIdentityRes = await updateIdentity(
          uuid,
          updateIdentityBody
        );
        userGuildMemberRes = await getUserGuildMember(newAccessToken, guild_id);
      } else {
        return res
          .status(userGuildMemberRes.status)
          .send({ message: userGuildMemberRes.error.message });
      }
    }

    const member = userGuildMemberRes.member;
    const role_idx = member.roles?.indexOf(role_id);
    role = role_idx !== -1 && role_idx !== undefined ? true : role;
    return res.status(200).json({
      role: role,
      newAccessToken: newAccessToken,
      newRefreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

module.exports = router;
