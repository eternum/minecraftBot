const http = require("http");
const fs = require("fs");
const child = require("child_process");
const path = require("path");
const net = require("net");
const WebSocket = require("ws");
const mineflayer = require("mineflayer");
// env constants

const port = 3000;
const host = "127.0.0.1";
const program = path.resolve("bot.js");

let bots = new Map();
var json = null;
var wsConnection = null;
var bot = null;
var mcAddress = "mc.hackclub.com";
var mcPort = 25565;

// initialize http server
console.log("starting server");
const server = http.createServer(function (request, response) {
  switch (request.method) {
    case "GET": // this entire section serves the static website
      var file = ""; // blanks file path for each request
      var fileType = ""; // blanks file type for each request

      // "/" is the request for the root file. in this case it is html
      if (request.url == "/") {
        file = "index.html";
        fileType = "text/html";

        // checks against regex for .js extension
      } else if (request.url.match(".*.(js)")) {
        file = request.url.substring(1); // here we remove the firs character in the request string which is a "/". this is done because fs gets mad if you dont
        fileType = "application/javascript"; // this sets the fileType to javascript

        // checks against regex for .css extension
      } else if (request.url.match(".*.(css)")) {
        file = request.url.substring(1); // look at comment above
        fileType = "text/css"; // sets fileType to css for headers
      }

      // makes sure file isnt blank and doesnt throw errors
      if (file != "") {
        fs.readFile(file, (err, data) => {
          // error handler
          if (err) {
            var message = "[ERROR]: " + err;
            console.log(message); // logs error message to console
            return404(response); // sends a 404 resource not found to the client
          } else {
            // writes a success header
            response.writeHead(200, {
              "Content-Type": fileType, // adds content type
              "Access-Control-Allow-Headers": "*", // for getting around cors rules
              "Access-Control-Allow-Origin": "*",
            });
            response.end(data); // ends the response and sends the data from the file
          }
        });

        break;
      }

    default:
      return404(response);
  }
});

function return404(response) {
  response.writeHead(404, {
    "Content-Type": "text/html",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Origin": "*",
  });
  response.end("resource not found");
}

// set http server listen ports
server.listen(port, host);
console.log("[INFO]: http server listening at: " + host + "\r\n at: " + port);

netServer = net.createServer((c) => {
  // 'connection' listener.
  console.log("client connected");
  c.on("end", () => {
    console.log("client disconnected");
  });
});

// set net server listen ports
netServer.listen("/tmp/mineflayer.sock", () => {
  console.log("server bound");
});

function start(botId, host, port, username, password) {
  console.log("[INFO]: New Bot created and started");
  const test = child.execFile(program);
  bots.set(botId, test);

  /*
  bot = mineflayer.createBot({
    host: host,
    port: port,
    username: username,
    password: password,
  });
  listen();
  */
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
    netServer.close().then(process.exit());
  });
});

netServer.on("connection", (socket) => {
  socket.on("data", (data) => {
    console.log(data);
    //var message = JSON.parse(data);
  });
});

function sendCoordinates(ws) {
  if (bot != null) {
    var position = bot.entity.position;

    json = { x: position.x, y: position.y, z: position.z };
    ws.send(JSON.stringify(json));
  }
}

function sendStatus(ws) {}

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
