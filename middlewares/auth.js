const { checkInternalToken } = require("../utils/auth");

const authMiddleware = (req, res, next) => {
  const success = checkInternalToken(req);
  if (success) {
    next();
  } else {
    res.status(401).send({ status: "Unauthorized" });
  }
};

module.exports = { authMiddleware };
