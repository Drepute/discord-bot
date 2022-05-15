const api = {
  BASE_URL: "https://staging.api.drepute.xyz/dao_tool_server",
  ROUTES: {
    createContribution: "/contrib",
    isDaoRegistered: "/discord/is_dao_registered",
    discordIdentifier: "/discord/identifier",
    isUserVerified: "/discord/is_user_verified",
    getAdminToken: "/auth/fetch_admin_token",
    getSigners: "/discord/signers",
  },
};

// export default api;

module.exports = api;
