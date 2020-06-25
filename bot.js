const mineflayer = require("mineflayer");
const ipc = require("node-ipc");
const v = require("vec3");

const botId = process.argv[2];
const server = process.argv[3];
const port = process.argv[4];
const username = process.argv[5];
const password = process.argv[6];

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
        bot.placeBlock(bot.blockInSight(), v(0, 1, 0));
        break;
      case "attack":
        send("data", bot.controlState);
        break;
      case "move":
        move(data);
        break;
    }
  });
});

var lastEventTime = 0;

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
  var message = { action: "started", botId: botId };
  send("started", message);
}

function sendCoordinates() {
  if (bot != null) {
    var position = bot.entity.position;

    var data = { x: position.x, y: position.y, z: position.z };
    var json = { action: "coords", data: data, botId: botId };
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
  sendHealth();
  sendHunger();
}
function send(type, data) {
  parent.emit(type, data);
}
//bot.on("entityMoved", entityHandler);

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

function entityHandler(entity) {
  if (entity.type == "player") {
    var timeSince = Date.now() - lastEventTime;
    if (timeSince >= 500) {
      lastEventTime = Date.now();
      var pos = entity.position;
      var time = Date.now();
      var data = { x: pos.x, y: pos.y, z: pos.z };
      var json = {
        action: "playerMove",
        username: entity.username,
        time: time,
        timeSince: timeSince,
        data: data,
      };
      send(json);
    }
  }
}

function healthHandler() {
  sendHealth();
  sendHunger();
}

function move(data) {
  bot.setControlState(data.data.operation, data.data.state);
}

function stop() {
  bot.quit();
  process.exit();
}
