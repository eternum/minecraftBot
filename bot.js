const mineflayer = require("mineflayer");
const net = require("net");

const botId = process.argv[2];
const server = process.env.SERVER_ADDRESS;
const port = process.env.SERVER_PORT;
const username = process.env.USERNAME[botId]
  ? process.env.USERNAME[botId]
  : "chest";
const password = process.env.PASSWORD[botId];

const parent = net.connect("/tmp/mineflayer.sock");

const server = "localhost";
const port = 61012;

bot = mineflayer.createBot({
  host: server,
  port: port,
  username: username,
  password: password,
});

let mcData;
bot.once("inject_allowed", () => {
  mcData = require("minecraft-data")(bot.version);
});

function intitiateConnection(botId) {
  var message = { action: "started", botId: botId, data: "started" };
  parent.write(JSON.stringify(message));
}

parent.on("data", (data) => {
  var message = JSON.parse(data);
  switch (message.action) {
    case "stop":
      bot.chat("/a");
      bot.quit();
      process.exit();
    case "status":
      sendCoordinates();
      sendStatus();
      break;
    case "getCoords":
      sendCoordinates();
      break;
    case "say":
      console.log("[INFO]: " + data.message);
      bot.chat(data.message);
      break;
    case "getHealth":
      sendHealth();
      break;
    case "getHunger":
      sendHunger;
      break;
  }
});

function sendCoordinates() {
  if (bot != null) {
    var position = bot.entity.position;

    var data = { x: position.x, y: position.y, z: position.z };
    var json = { action: "coords", data: data };
    send(json);
  }
}
function sendHealth() {
  if (bot != null) {
    var health = bot.health;

    var json = { action: "health", data: health };
    send(json);
  }
}

function sendHunger() {
  if (bot != null) {
    var hunger = bot.hunger;

    var json = { action: "hunger", data: hunger };
    send(json);
  }
}
function sendStatus() {
  sendHunger();
  sendHealth();
  sendCoordinates();
}
function send(data) {
  parent.write(JSON.stringify(data));
}

intitiateConnection(botId);

bot.on("entityMoved", entityHandler);
bot.on("health", healthHandler);

bot.on("login", () => {
  console.log("[INFO]: Bot Logged in to server");
  bot.chat("/nick nickbot [BOT]");
  bot.chat("/a");
});

function entityHandler(entity) {
  if (entity.type == "player") {
    var pos = entity.position;
    var data = { x: pos.x, y: pos.y, z: pos.z };
    var json = { action: "playerMove", username: entity.username, data: data };
    send(json);
  }
}

function healthHandler() {
  sendHealth();
  sendHealth();
}
