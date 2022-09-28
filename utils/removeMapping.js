require("dotenv").config();
const api = require("../constants/api");
const apiClient = require("./apiClient");

const removeMapping = async (GUILDID) => {
  try {
    const res = await apiClient.post(
      `${api.BASE_URL}${api.ROUTES.isUserVerified}?guild_id=${guildId}&discord_user_id=${userId}`,
      {
        guild_id: GUILDID,
      }
    );
    console.log("Successfully removed mapping");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports = removeMapping;
