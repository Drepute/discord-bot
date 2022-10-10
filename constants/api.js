const LOCAL_IP = "192.168.1.243";
const api = {
  BASE_URL:
    process.env.NODE_ENV === "production"
      ? "https://api.drepute.xyz/dao_tool_server"
      : process.env.NODE_ENV === "staging"
      ? "https://test-staging.api.drepute.xyz/dao_tool_server"
      : `http://${LOCAL_IP}:5000/dao_tool_server`,
  ROUTES: {
    createContribution: "/contrib",
    isDaoRegistered: "/discord/is_dao_registered",
    discordIdentifier: "/discord/identifier",
    isUserVerified: "/discord/is_user_verified",
    getAdminToken: "/auth/fetch_admin_token",
    getSigners: "/discord/signers",
    getBadgeTypes: "/badge/badge_types",
    daoWithGuild: "/dao/daoWithGuild",
    badgeVoucherCreationInfo: "/discord/badge_voucher_creation_info",
    discord: "/discord",
  },
  DAO_TOOL_BASE_URL:
    process.env.NODE_ENV === "production"
      ? "https://app.rep3.gg"
      : process.env.NODE_ENV === "staging"
      ? "https://staging.app.rep3.gg"
      : `http://${LOCAL_IP}:4000`,
  LAMBDA_URL:
    process.env.NODE_ENV === "production"
      ? "https://kjb6q8pwh1.execute-api.us-east-1.amazonaws.com/Prod"
      : process.env.NODE_ENV === "staging"
      ? "https://kjb6q8pwh1.execute-api.us-east-1.amazonaws.com/Prod"
      : `http://${LOCAL_IP}:3001`,
  DISCORD_REDIRECT_URI:
    process.env.NODE_ENV === "production"
      ? "https://api.drepute.xyz/discord_bot/discordRedirect"
      : process.env.NODE_ENV === "staging"
      ? "https://test-staging.api.drepute.xyz/discord_bot/discordRedirect"
      : `http://${LOCAL_IP}:3000/discord_bot/discordRedirect`,
};

module.exports = api;
