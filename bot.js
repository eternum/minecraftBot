const mineflayer = require("mineflayer");
const ipc = require("node-ipc");
const v = require("vec3");
const dataManager = require("./dataManager");
var config = dataManager.loadConfig();

const botId = process.argv[2];
const server = process.argv[3];
const port = process.argv[4];
const username = process.argv[5] ? process.argv[5] : "bot_" + botId;
const password = process.argv[6] ? process.argv[6] : null;

var socketPath = config.ipc.socketPath;

ipc.config.id = "parent";
ipc.config.appspace = "";
ipc.config.silent = true;
ipc.connectTo("parent", socketPath, function () {
  parent = ipc.of.parent;
  ipc.log("## connected to parent ##".rainbow, ipc.config.delay);

  parent.on("data", function (data) {
    switch (data.action) {
      case "stop":
        stop();
        break;
      case "status":
        sendStatus();
        break;
      case "move":
        move(data);
        break;
    }
  });
});

const bot = mineflayer.createBot({
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
  var message = { action: "started", botId: botId };
  send("started", message);
}

function sendCoordinates() {
  if (bot != null) {
    var position = bot.entity.position;

    var json = {
      action: "coords",
      data: { x: position.x, y: position.y, z: position.z },
      botId: botId,
    };
    send("data", json);
  }
}

function sendHealth() {
  if (bot != null) {
    var health = bot.health;

    var json = { action: "health", data: health, botId: botId };
    send("data", json);
  }
}

function sendHunger() {
  if (bot != null) {
    var hunger = bot.food;

    var json = { action: "hunger", data: hunger, botId: botId };
    send("data", json);
  }
}
function sendStatus() {
  sendCoordinates();
  healthHandler();
}
function send(type, data) {
  parent.emit(type, data);
}
bot.on("health", healthHandler);

bot.on("login", () => {
  intitiateConnection(botId);
  setTimeout(() => {
    sendStatus();
    bot.chat("/a");
  }, 1000);
});

bot.on("move", () => {
  sendCoordinates();
});

function healthHandler() {
  sendHealth();
  sendHunger();
}

function move(data) {
  if (data == null) bot.clearControlStates();
  bot.setControlState(data.data.operation, data.data.state);
}

function stop() {
  bot.quit();
  bot.on("end", () => process.exit());
}
