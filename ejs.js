// load the things we need
const express = require("express");
const app = express();
var bots = {
  nickbot: {
    name: "nickbot",
    status: "Loading",
    health: 11,
    hunger: 15,
    coords: "0 1 0",
    server: {
      ip: "mc.hackclub.com",
      port: "25565",
    },
  },
  boomer: {
    name: "boomer",
    status: "inUse",
    health: 21,
    hunger: 45,
    coords: "0 3 0",
    server: {
      ip: "localhost",
      port: "12",
    },
  },
  bot1: {
    name: "bot1",
    status: "Online",
    health: 20,
    hunger: 20,
    coords: "0 0 0",
    server: {
      ip: "localhost",
      port: "121312",
    },
  },
  bot2: {
    name: "bot2",
    status: "Online",
    health: 20,
    hunger: 20,
    coords: "0 0 0",
    server: {
      ip: "mc.google.com",
      port: "122333",
    },
  },
  bot3: {
    name: "bot3",
    status: "Online",
    health: 20,
    hunger: 20,
    coords: "0 0 0",
    server: {
      ip: "google.hackclub.com",
      port: "25555565",
    },
  },
};
var botURLS = ["/nickbot", "/boomer"];

// set the view engine to ejs
app.set("view engine", "ejs");

// use res.render to load up an ejs view file

// index page

app.use(express.static("static"));
app.get("/", function (req, res) {
  res.render("index", {
    bots: bots,
  });
});

// about page
app.get("/login", function (req, res) {
  res.render("login");
});
app.get(botURLS, function (req, res) {
  res.render("bot", {
    bot: bots[req.url.substring(1)],
  });
});

app.listen(3000);
console.log("3000 is the magic port");
