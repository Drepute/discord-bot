require("dotenv").config();

const cors = require("cors");
const express = require("express");

const apm = require("./apm");
const client = require("./discordClient");

// routes
const mainRoute = require("./routes/main");
const adapterRoute = require("./routes/adapter");

const db = require("./db");
const { proxyContractVerifier } = require("./utils/events/verifierCall");

const ENV = process.env.NODE_ENV;
const PORT = ENV === "dev" ? 3002 : 5000;
const BASE_PATH = "/discord_bot";

const app = express();

// DB Init
// This will run .sync() only if database name ends with '_local'
db.sequelize.sync({
  alter: ENV === "dev",
  ...(ENV === "dev" && { match: /_local$/ }),
});

app.use(cors({ origin: "*" }));
app.use(BASE_PATH, mainRoute);
app.use(`${BASE_PATH}/adapter`, adapterRoute);

app.use(function (err, _req, res, _next) {
  res.json({ error: err.message ? err.message : err });
});

app.listen(PORT, async () => {
  await proxyContractVerifier();
  console.log(`Rep3 Discord Bot App listening on port ${PORT}`);
});
