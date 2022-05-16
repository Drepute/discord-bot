const api = {
  BASE_URL:
    process.env.NODE_ENV !== "production"
      ? "https://staging.api.drepute.xyz/dao_tool_server"
      : "https://api.drepute.xyz/dao_tool_server",
  ROUTES: {
    createContribution: "/contrib",
    isDaoRegistered: "/discord/is_dao_registered",
    discordIdentifier: "/discord/identifier",
    isUserVerified: "/discord/is_user_verified",
    getAdminToken: "/auth/fetch_admin_token",
    getSigners: "/discord/signers",
  },
  DAO_TOOL_BASE_URL:
    process.env.NODE_ENV !== "production"
      ? "https://staging.app.drepute.xyz"
      : "https://app.drepute.xyz",
};

module.exports = api;
