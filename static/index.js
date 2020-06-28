/// WebSocket And stuff
const url = "http://0.0.0.0";
let connected = false;
let keys = { w: false, a: false, s: false, d: false, space: false };

// listeners
document.getElementById("botSelected").onchange = function (event) {
  console.log(getCurrentBot());
};

document.addEventListener(
  "keydown",
  (event) => {
    let key = "";
    const keyName = event.code;
    switch (keyName) {
      case "KeyW":
        keys.w = true;
        key = "forward";
        break;
      case "KeyA":
        keys.a = true;
        key = "right";
        break;
      case "KeyS":
        keys.s = true;
        key = "back";
        break;
      case "KeyD":
        keys.d = true;
        key = "left";
        break;
      case "Space":
        keys.space = true;
        key = "jump";
        break;
    }
    if (key != "") {
      keylogger(keys);
      send({
        action: "move",
        botId: getCurrentBot(),
        data: { operation: key, state: true },
      });
    }
  },
  false
);

document.addEventListener(
  "keyup",
  (event) => {
    if (event.repeat) {
      return;
    }
    const keyName = event.code;
    switch (keyName) {
      case "KeyW":
        keys.w = false;
        key = "forward";
        break;
      case "KeyA":
        keys.a = false;
        key = "right";
        break;
      case "KeyS":
        keys.s = false;
        key = "back";
        break;
      case "KeyD":
        keys.d = false;
        key = "left";
        break;
      case "Space":
        keys.space = false;
        key = "jump";
        break;
    }
    if (key != "") {
      keylogger(keys);
      send({
        action: "move",
        botId: getCurrentBot(),
        data: { operation: key, state: false },
      });
    }
  },
  false
);

// looks like a function but is actually just to trigger the listeners after the server is online
function listenSocket() {
  socketserver.onopen = function (event) {
    console.log("connected");
    connected = true;
    serverOnline(true);
  };
  socketserver.onmessage = function (event) {
    console.log(event.data);
    let message = JSON.parse(event.data);
    switch (message.action) {
      case "coords":
        setCoords(message);
        break;
      case "health":
        setHealth(message);
        break;
      case "hunger":
        setHunger(message);
        break;
      case "started":
        botOnline(message.action);
        break;
    }
  };
  socketserver.onclose = function (event) {
    console.log("connection closed");
    serverOnline(false);
  };
}

// functions

function say(message) {
  send({
    action: "say",
    botId: getCurrentBot(),
    message: message,
  });
}
function kill() {
  send({
    action: "kill",
    botId: getCurrentBot(),
  });
}

function place() {
  send({
    action: "place",
    botId: getCurrentBot(),
  });
}
function attack() {
  send({
    action: "attack",
    botId: getCurrentBot(),
  });
}
function setServer(address, port) {
  let address = document.getElementById("server").value;
  let port = document.getElementById("port").value;
  let data = { address: address, port: port };

  send({
    action: "setServer",
    botId: getCurrentBot(),
    data: data,
  });
}
function stopBot() {
  send({
    action: "stop",
    botId: getCurrentBot(),
  });
}
function startBot() {
  send({
    action: "start",
    botId: getCurrentBot(),
  });
}
function getCoords() {
  if (connected) {
    send({
      action: "getCoords",
      botId: getCurrentBot(),
    });
  }
}
function getHealth() {
  if (connected) {
    send({
      action: "getHealth",
      botId: getCurrentBot(),
    });
  }
}
function getHunger() {
  if (connected) {
    send({
      action: "getHunger",
      botId: getCurrentBot(),
    });
  }
}

function setHunger(message) {
  document.getElementById("hunger").innerHTML = message.data;
}

function setCoords(message) {
  document.getElementById("coords").innerHTML =
    Math.round(message.data.x) +
    " " +
    Math.round(message.data.y) +
    " " +
    Math.round(message.data.z);
}
function setHealth(message) {
  document.getElementById("health").innerHTML = message.data;
}

function getCurrentBot() {
  return document.getElementById("botSelected").value;
}

/*
required headers
action:
botId:

*/
function send(message) {
  JSON.stringify(message);
  socketserver.send(JSON.stringify(message));
}

function closeWebSocket() {
  socketserver.close();
}
function startWebSocket() {
  socketserver = new WebSocket("ws://0.0.0.0:3000", "protocolOne");
  listenSocket();
}

function toggleTheme() {
  document.body.classList.toggle("dark-body");
  for (
    let index = 0;
    index < document.getElementsByClassName("card").length;
    index++
  ) {
    document
      .getElementsByClassName("card")
      .item(index)
      .classList.toggle("bg-dark");
  }
}

function serverOnline(state) {
  let status = document.getElementById("serverStatus");
  if (state) {
    status.setAttribute("class", "badge badge-success");
    status.innerHTML = "Online";
  } else {
    status.setAttribute("class", "badge badge-danger");
    status.innerHTML = "Offline";
  }
}
function botOnline(state) {
  let status = document.getElementById("botStatus");

  switch (state) {
    case "started":
      status.setAttribute("class", "badge badge-success");
      status.innerHTML = "Connected";
      break;
    case "stopped":
      status.setAttribute("class", "badge badge-danger");
      break;

    case "starting":
      status.setAttribute("class", "badge badge-primary");
      status.innerHTML = "starting";
  }
}

function keylogger(keys) {
  if (keys.w) document.getElementById("w").classList.add("keypressed");
  if (keys.a) document.getElementById("a").classList.add("keypressed");
  if (keys.s) document.getElementById("s").classList.add("keypressed");
  if (keys.d) document.getElementById("d").classList.add("keypressed");
  if (keys.space)
    document.getElementById("spacebar").classList.add("keypressed");
  if (!keys.w) document.getElementById("w").classList.remove("keypressed");
  if (!keys.a) document.getElementById("a").classList.remove("keypressed");
  if (!keys.s) document.getElementById("s").classList.remove("keypressed");
  if (!keys.d) document.getElementById("d").classList.remove("keypressed");
  if (!keys.space)
    document.getElementById("spacebar").classList.remove("keypressed");
}

setTimeout(() => startWebSocket(), 100);
