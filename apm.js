// Start the agent before any thing else in your app
const apm = require("elastic-apm-node").start();

module.exports = apm;
