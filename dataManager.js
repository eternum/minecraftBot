require("dotenv").config();

const yaml = require("js-yaml");
const fs = require("fs");
var config;

const configFileLocation = process.env.CONFIG_FILE
  ? process.env.CONFIG_FILE
  : "example.yml";

function loadConfig() {
  try {
    config = yaml.safeLoad(fs.readFileSync("example.yml", "utf8"));
    return config;
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  loadConfig,
  config,
};
