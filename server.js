const mineflayer = require("mineflayer");
const http = require("http");
const WebSocket = require("ws");

// env constants
const port = 3000;
const host = "192.168.7.235";

const username = "noybzero@gmail.com";
const password = "jdxWW6ZQ!iZWYXm9g8*G";

var json = null;
var wsConnection = null;
var bot = null;
var mcAddress = "mc.hackclub.com";
var mcPort = 25565;

// initialize server
console.log("starting server");
const server = http.createServer(function (request, response) {
  switch (request.method) {
    case "POST":
      console.log("POST");
      var body = "";
      request.on("data", function (data) {
        body += data;
        if (body == "start") {
          console.log("starting");

          start(json.address, json.port);
        } else if (body == "stop") {
          console.log("stopping");

          stop();
        } else {
          json = JSON.parse(data);

          console.log(JSON.parse(data));
        }
      });
      request.on("end", function () {
        response.writeHead(200, {
          "Content-Type": "text/html",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Origin": "*",
        });
        response.end("post received");
      });
      break;
    case "OPTIONS":
      response.writeHead(200, {
        "Access-Control-Allow-Headers": "*",

        "Access-Control-Allow-Origin": "*",
      });
      response.end();
      break;
    case "GET":
      response.writeHead(200, {
        "Content-Type": "text/html",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
      });
      response.end("Hi There.");
      break;
    default:
      response.writeHead(404, {
        "Content-Type": "text/html",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
      });
      response.end("resource not found");
  }
});
// set server listen ports
server.listen(port, host);
console.log("[INFO]: server listening at: " + host + "\r\n at: " + port);

function start(host, port) {
  console.log("[INFO]: New Bot created and started");
  bot = mineflayer.createBot({
    host: host,
    port: parseInt(port),
    username: username,
    password: password,
  });
  listen();
}

function stop() {
  bot.chat("/a");
  bot.chat("/nick nickbot");
  bot.quit();
}

const wss = new WebSocket.Server({ server });

server.on("close", function () {
  console.log("Connection Closed");
});

wss.on("connection", function connection(ws, req) {
  console.log("[INFO]: New Connection From: " + req.socket.remoteAddress);
  wsConnection = ws;
  ws.on("message", function incoming(message) {
    var data = JSON.parse(message);
    var action = data.action;
    switch (action) {
      case "status":
        sendCoordinates(ws);
        sendStatus(ws);
      case "getCoords":
        sendCoordinates(ws);
        break;
      case "say":
        console.log("[INFO]: " + data.message);
        bot.chat(data.message);
        break;
      case "start":
        start(mcAddress, mcPort);
        break;
      case "stop":
        start(mcAddress, mcPort);
        break;
      case "setServer":
        mcAddress = data.data.address;
        mcPort = data.data.port;
    }

    console.log("[INFO]: received: %s", message);
  });

  ws.on("close", function incoming(code, reason) {
    console.log(
      "[INFO]: Connection Closed By: " +
        req.socket.remoteAddress +
        " Code: " +
        code +
        " " +
        reason
    );
  });
});

function sendCoordinates(ws) {
  if (bot != null) {
    var position = bot.entity.position;

    json = { x: position.x, y: position.y, z: position.z };
    ws.send(JSON.stringify(json));
  }
}

function sendStatus(ws)

// this is where the bot listeners go

function listen() {
  bot.on("login", () => {
    console.log("[INFO]: Bot Logged in to server");
    bot.chat("/nick nickbot [BOT]");
    bot.chat("/a");
  });

  bot.on("chat", (username, message) => {
    var data = {
      action: "chat",
      botId: null,
      message: username + " >> " + message,
    };
    broadcast(data);
  });
}

function broadcast(message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
