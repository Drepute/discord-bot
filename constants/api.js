const api = {
  // BASE_URL: process.env.BASE_URL,
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
    createBadgeVoucher: "/badge/create_badge_voucher",
  },
  // DAO_TOOL_BASE_URL: process.env.DAO_TOOL_BASE_URL,
  // LAMBDA_URL: process.env.LAMBDA_URL,
  // DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI,
  ALCHEMY_MATIC_MAINNET:
    "https://polygon-mainnet.g.alchemy.com/v2/gBoo6ihGnSUa3ObT49K36yHG6BdtyuVo",
};

module.exports = api;
