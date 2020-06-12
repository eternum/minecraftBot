/// WebSocket And stuff
const url = "http://bots.nswanson.com";
var connected = false;

function say(botId, message) {
  send({
    action: "say",
    botId: botId,
    message: message,
  });
}
function setServer(botId, address, port) {
  var address = document.getElementById("server").value;
  var port = document.getElementById("port").value;
  var data = { address: address, port: port };

  send({
    action: "setServer",
    botId: botId,
    data: data,
  });
}
function stopBot(botId) {
  document.getElementById("botStatus").class = "label label-danger";
  document.getElementById("botStatus").innerHTML = "Disconnected";
  send({
    action: "stop",
    botId: botId,
  });
}
function startBot(botId) {
  document.getElementById("botStatus").class = "label label-info";
  document.getElementById("botStatus").innerHTML = "loading";
  send({
    action: "start",
    botId: botId,
  });
}
function getCoords(botId) {
  if (connected) {
    send({
      action: "getCoords",
      botId: botId,
    });
  }
}

function listenSocket() {
  socketserver.onopen = function (event) {
    document.getElementById("serverStatus").class = "label label-success";
    document.getElementById("serverStatus").innerHTML = "Online";
    console.log("connected");
    connected = true;
  };
  socketserver.onmessage = function (event) {
    var data = JSON.parse(event.data);
    switch (data.action) {
      case "chat":
        term.writeln(data.message);
        prompt(term);
      case "coords":
        document.getElementById("coords").innerHTML = event.data;
    }
    console.log(event.data);
  };
  socketserver.onclose = function (event) {
    document.getElementById("serverStatus").class = "label label-danger";
    document.getElementById("serverStatus").style.backgroundColor = "#CA3C3C";
    document.getElementById("serverStatus").innerHTML = "Offline";
    connected = false;
  };
}

/*
required headers
action:
botId:

*/
function send(message) {
  console.log(message);
  socketserver.send(JSON.stringify(message));
}

function closeWebSocket() {
  document.getElementById("serverStatus").class = "label label-danger";
  document.getElementById("serverStatus").innerHTML = "Offline";

  socketserver.close();
}
function startWebSocket() {
  socketserver = new WebSocket("ws://192.168.7.235:3000", "protocolOne");
  listenSocket();
}

/// Terminal
var term = new Terminal();
var line = "";
term.open(document.getElementById("terminal"));
term.write("Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ");

function runFakeTerminal() {
  if (term._initialized) {
    return;
  }

  term._initialized = true;

  term.prompt = () => {
    term.write("\r\n$ ");
  };

  term.writeln("Welcome to xterm.js");
  term.writeln(
    "This is a local terminal emulation, without a real terminal in the back-end."
  );
  term.writeln("Type some keys and commands to play around.");
  term.writeln("");
  prompt(term);

  term.onData((e) => {
    switch (e) {
      case "\r": // Enter
        console.log(line);
        say(null, line);
      case "\u0003": // Ctrl+C
        line = "";
        prompt(term);
        break;
      case "\u007F": // Backspace (DEL)
        // Do not delete the prompt
        if (line.length > 0) {
          line = line.substring(0, line.length - 1);
        }
        if (term._core.buffer.x > 2) {
          term.write("\b \b");
        }
        break;
      default:
        line += e;

        // Print all other characters for demo

        term.write(e);
    }
  });
}

function prompt(term) {
  term.write("\r\n> ");
}

runFakeTerminal();
startWebSocket();
