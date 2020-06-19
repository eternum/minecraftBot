const http = require("http");
const fs = require("fs");
const child = require("child_process");
const ipc = require("node-ipc");
const WebSocket = require("ws");
// env constants

ipc.config.id = "parent";
ipc.config.retry = 1500;
ipc.config.silent = true;

const port = 3000;
const host = "127.0.0.1";
const socketPath = "/tmp/mineflayer.sock";

let bots = new Map();
let sockets = new Map();
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
server.listen(port, host, () => {
  console.log("[INFO]: http server listening at: " + host + ":" + port);
});

ipc.serve(socketPath, function () {
  ipc.server.on("connect", () => {
    console.log("Connected");
  });

  ipc.server.on("started", (data, socket) => {
    if (!sockets.has(data.botId)) {
      console.log("adding socket");
      sockets.set(data.botId, socket);
    }
    console.log(data);
    broadcast(data);
  });

  ipc.server.on("data", (data, socket) => {
    broadcast(data);
  });

  ipc.server.on("socket.disconnected", function (socket, destroyedSocketID) {
    ipc.log("client " + destroyedSocketID + " has disconnected!");
  });
});

function start(botId) {
  console.log("[INFO]: New Bot created and started");
  var botProcess = child.execFile(
    "node",
    ["bot.js", botId, mcAddress, mcPort],
    (error, stdout, stderr) => {
      if (error) {
        throw error;
      }
      console.log(stdout);
    }
  );
  bots.set(botId, botProcess);

  botProcess.on("exit", (code, signal) => {
    console.log("child process exited code: " + code);
  });

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

function stop(botId) {}

const wss = new WebSocket.Server({ server });

server.on("close", function () {
  console.log("Connection Closed");
});

wss.on("connection", function connection(ws, req) {
  console.log("[INFO]: New Connection From: " + req.socket.remoteAddress);
  ws.on("message", function incoming(message) {
    var data = JSON.parse(message);
    var action = data.action;
    var botId = data.botId;
    switch (action) {
      case "setServer":
        mcAddress = data.data.address;
        mcPort = data.data.port;
        console.log(mcAddress + ":" + mcPort);
        break;
      case "start":
        if (botId != 0) start(botId, mcAddress, mcPort);
        break;
      case "kill":
        bots.get(botId).kill("SIGHUP");
        break;
      default:
        if (sockets.has(botId)) {
          var socket = sockets.get(botId);
          sendToChild(socket, "data", data);
        }
    }
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

function ipcListen() {
  ipc.server.on("connect", () => {
    console.log("Connected");
  });

  ipc.server.on("started", (data, socket) => {
    sockets.set(data.botId, socket);
  });
  ipc.server.on("data", (data, socket) => {
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

function sendToChild(socket, event, data) {
  ipc.server.emit(socket, event, data);
}

ipc.server.start();
