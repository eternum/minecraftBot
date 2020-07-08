const ipc = require('node-ipc');
const fs = require('fs');
const { broadcast } = require('../server');
const dataManager = require('./dataManager');

const config = dataManager.loadConfig();

module.exports = {
  initializeIPC,
  sendToChild,
};
