const express = require("express");

const apm = require("../apm");

const { authMiddleware } = require("../middlewares/auth");

const router = express.Router();

router.get("/userGuilds", authMiddleware, async (req, res, next) => {
  let { accessToken } = req.query;
  try {
    console.log("accesstoken", accessToken);
    res.status(200).json({ accessToken: accessToken });
  } catch (err) {
    next(err);
    apm.captureError(err);
  }
});

module.exports = router;
