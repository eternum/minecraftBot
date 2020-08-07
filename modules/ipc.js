const broadcast = require("../server").broadcast;
const ipc = require("node-ipc");
const dataManager = require("./dataManager");
const fs = require("fs");
const config = dataManager.loadConfig();

module.exports = {
  initializeIPC,
  sendToChild,
};
