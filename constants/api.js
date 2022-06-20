const api = {
  BASE_URL:
    process.env.NODE_ENV === "production"
      ? "https://api.drepute.xyz/dao_tool_server"
      : process.env.NODE_ENV === "staging"
      ? "https://test-staging.api.drepute.xyz/dao_tool_server"
      : "https://test-staging.api.drepute.xyz/dao_tool_server",
  ROUTES: {
    createContribution: "/contrib",
    isDaoRegistered: "/discord/is_dao_registered",
    discordIdentifier: "/discord/identifier",
    isUserVerified: "/discord/is_user_verified",
    getAdminToken: "/auth/fetch_admin_token",
    getSigners: "/discord/signers",
  },
  DAO_TOOL_BASE_URL:
    process.env.NODE_ENV === "production"
      ? "https://app.rep3.gg"
      : process.env.NODE_ENV === "staging"
      ? "https://staging.app.rep3.gg"
      : "http://localhost:3000",
};

module.exports = api;
