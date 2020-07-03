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
const crypto = require("crypto");
// CONFIG SETUP
const dataManager = require("./dataManager");
var config = dataManager.loadConfig();
console.log(config);
var botFile = config.botFile;

// ENV VARS
const users = process.env.USERS.split("|");
const botLogins = process.env.BOT_LOGINS.split("|");
const botPasswords = process.env.BOT_PASSWORDS.split("|");
const sessionSecret = process.env.SESSION_SECRET;

const initializePassport = require("./passport-config");

initializePassport(passport, users);

// ipc socket config
ipc.config.id = "parent";
ipc.config.retry = 1500;
ipc.config.silent = true;

const PORT = config.port;
const HOST = config.host;
const SOCKET_PATH = config.ipc.socketPath;

var botProcesses = new Map();
var sockets = new Map();
var tickets = new Map();
var MC_ADDRESS = process.env.MC_ADDRESS;
var MC_PORT = process.env.MC_PORT;

// EXPRESS STUFF
app.set("trust proxy", 1); // trust first proxy
app.set("view engine", "ejs");
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

app.get("/ws", checkAuthenticated, function (request, response) {
  let ticket = generateTicket(request);
  response.status(200);
  response.set({
    "Access-Control-Allow-Headers": "*", // for getting around cors rules
    "Access-Control-Allow-Origin": "*",
  });
  response.send(ticket);
  response.end();
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

function generateTicket(request) {
  let ticket = crypto.randomBytes(128).toString("hex");
  let ticketHash = getHash(ticket, "hex");
  let expiryDate = 5000 + Date.now();
  let data = {
    ticket: ticket,
    agent: request.headers["user-agent"],
    session: request.session,
    auth: request.isAuthenticated(),
    expires: expiryDate,
  };
  tickets.set(ticketHash, data);
  setTimeout(() => {
    tickets.delete(ticketHash);
  }, 50000);
  return ticket;
}

function verifyTicket(ticket, request) {
  let ticketHash = getHash(ticket);
  if (!tickets.has(ticketHash)) return false;
  let info = tickets.get(ticketHash);
  let ticketMatch = ticket == info.ticket;
  let userMatch = request.headers["user-agent"] == info.agent;
  let auth = info.auth;
  let validDate = Date.now() < info.expires;
  return ticketMatch && userMatch && auth && validDate;
}
function getHash(string) {
  let hash = crypto.createHash("sha1");
  hash.update(string);
  return hash.digest("hex");
}

// initialize http server
console.log("starting server");
const server = http.createServer(app);

// set http server listen ports

server.listen(PORT, HOST, () => {
  console.log("[INFO]: https server listening at: " + HOST + ":" + PORT);
});
server.on("close", function () {
  console.log("Connection Closed");
});

// setup ipc server
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

// start new bot with bot id
function start(botId) {
  console.log("[INFO]: New Bot created and started");
  var username = botLogins[botId];
  var password = botPasswords[botId];
  var botProcess = child.execFile(
    "node",
    [botFile, botId, MC_ADDRESS, MC_PORT, username, password],
    (error, stdout, stderr) => {
      if (error) {
        throw error;
      }
      console.log(stdout);
    }
  );
  bots.set(botId, new bot(botId, botProcess));
  botProcesses.set(botId, botProcess);

  botProcess.on("exit", (code, signal) => {
    console.log("child process exited code: " + code);
  });
}

function stop(botId) {}

// create new websocket server
const wss = new WebSocket.Server({ noServer: true });

// this authenticates the websocket
server.on("upgrade", function upgrade(request, socket, head) {
  let ticket = request.url.slice(request.url.indexOf("=") + 1);
  if (verifyTicket(ticket, request)) {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
  }
});

wss.on("connection", function connection(ws, req) {
  console.log("[INFO]: New Connection From: " + req.socket.remoteAddress);

  ws.on("message", function incoming(message) {
    var data = JSON.parse(message);
    console.log(data);
    if (!data.ticket) {
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
