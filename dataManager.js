require("dotenv").config();

const yaml = require("js-yaml");
const fs = require("fs");

const configFileLocation = process.env.CONFIG_FILE
  ? process.env.CONFIG_FILE
  : "example.yml";

function loadConfig() {
  try {
    config = yaml.safeLoad(fs.readFileSync(configFileLocation, "utf8"));
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  loadConfig,
};
