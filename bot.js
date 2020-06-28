const mineflayer = require("mineflayer");
const ipc = require("node-ipc");
const v = require("vec3");

const botId = process.argv[2];
const server = process.argv[3];
const port = process.argv[4];
const username = process.argv[5] ? process.argv[5] : "bot_" + botId;
const password = process.argv[6] ? process.argv[6] : null;

ipc.config.id = "parent";
ipc.config.appspace = "";
ipc.config.silent = true;
ipc.connectTo("parent", "/tmp/mineflayer.sock", function () {
  parent = ipc.of.parent;
  ipc.log("## connected to parent ##".rainbow, ipc.config.delay);

  parent.on("data", function (data) {
    switch (data.action) {
      case "stop":
        stop();
        break;
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
      case "place":
        break;
      case "attack":
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
  let message = { action: "started", botId: botId };
  send("started", message);
}

function sendCoordinates() {
  if (bot != null) {
    let position = bot.entity.position;

    let json = {
      action: "coords",
      data: { x: position.x, y: position.y, z: position.z },
      botId: botId,
    };
    send("data", json);
  }
}

function sendHealth() {
  if (bot != null) {
    let health = bot.health;

    let json = { action: "health", data: health, botId: botId };
    send("data", json);
  }
}

function sendHunger() {
  if (bot != null) {
    let hunger = bot.food;

    let json = { action: "hunger", data: hunger, botId: botId };
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
