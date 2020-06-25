if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const http = require("http");
const express = require("express");
const fs = require("fs");
const child = require("child_process");
const ipc = require("node-ipc");
const WebSocket = require("ws");
const app = express();
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");

// ENV VARS
const users = process.env.USERS.split("|");
const botLogins = process.env.BOT_LOGINS.split("|");
const botPasswords = process.env.BOT_PASSWORDS.split("|");
const sessionSecret = process.env.SESSION_SECRET;

const initializePassport = require("./passport-config");
initializePassport(passport, users);

ipc.config.id = "parent";
ipc.config.retry = 1500;
ipc.config.silent = true;

const PORT = 3000;
const HOST = "0.0.0.0";
const SOCKET_PATH = "/tmp/mineflayer.sock";

var botProcesses = new Map();
var sockets = new Map();
var MC_ADDRESS = process.env.MC_ADDRESS;
var MC_PORT = process.env.MC_PORT;

// EXPRESS STUFF
app.set("trust proxy", 1); // trust first proxy
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// EXPRESS ROUTES

app.get("/", checkAuthenticated, function (request, response) {
  file = "index.html";
  fileType = "text/html";
  sendResponse(response, file, fileType);
});

app.get("/login", checkNotAuthenticated, function (request, response) {
  file = "login.html";
  fileType = "text/html";
  sendResponse(response, file, fileType);
});

app.get("/auth/github", passport.authenticate("github"), function (req, res) {
  // The request will be redirected to GitHub for authentication, so this
  // function will not be called.
});

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get(/.*.(js)/, checkAuthenticated, function (request, response) {
  file = request.url.substring(1); // here we remove the firs character in the request string which is a "/". this is done because fs gets mad if you dont
  fileType = "application/javascript"; // this sets the fileType to javascript
  sendResponse(response, file, fileType);
});
app.get(/.*.(css)/, function (request, response) {
  file = request.url.substring(1); // look at comment above
  fileType = "text/css"; // sets fileType to css for headers
  sendResponse(response, file, fileType);
});

function sendResponse(response, file, fileType) {
  if (file != "") {
    fs.readFile(file, (err, data) => {
      // error handler
      if (err) {
        var message = "[ERROR]: " + err;
        console.log(message); // logs error message to console
        return404(response); // sends a 404 resource not found to the client
      } else {
        // writes a success header
        response.status(200);
        response.set({
          "Content-Type": fileType, // adds content type
          "Access-Control-Allow-Headers": "*", // for getting around cors rules
          "Access-Control-Allow-Origin": "*",
        });
        response.send(data); // ends the response and sends the data from the file
        response.end();
      }
    });
  } else {
    return404();
  }
}

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}
// initialize http server
console.log("starting server");
const server = http.createServer(app);

function return404(response) {
  response.status(404);
  response.set({
    "Content-Type": "text/html",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Origin": "*",
  });
  response.send("resource not found");
  response.end();
}

// set http server listen ports
server.listen(PORT, HOST, () => {
  console.log("[INFO]: http server listening at: " + host + ":" + port);
});

ipc.serve(SOCKET_PATH, function () {
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
  var username = bots[botId].username;
  var password = bots[botId].password;
  var botProcess = child.execFile(
    "node",
    ["bot.js", botId, MC_ADDRESS, MC_PORT, username, password],
    (error, stdout, stderr) => {
      if (error) {
        throw error;
      }
      console.log(stdout);
    }
  );
  botProcesses.set(botId, botProcess);

  botProcess.on("exit", (code, signal) => {
    console.log("child process exited code: " + code);
  });
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
        MC_ADDRESS = data.data.address;
        MC_PORT = data.data.port;
        console.log(mcAddress + ":" + mcPort);
        break;
      case "start":
        if (botId != 0) start(botId, mcAddress, mcPort);
        break;
      case "kill":
        botProcesses.get(botId).kill("SIGHUP");
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
