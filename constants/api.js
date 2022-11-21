const api = {
  BASE_URL: process.env.BASE_URL,
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
    directMint: "/badge/direct_mint",
  },
  DAO_TOOL_BASE_URL: process.env.DAO_TOOL_BASE_URL,
  LAMBDA_URL: process.env.LAMBDA_URL,
  DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI,
  ARWEAVE_SERVER_URL: process.env.ARWEAVE_SERVER_URL,
};

module.exports = api;
