const mineflayer = require("mineflayer");
const net = require("net")

const botName;
const botId;
const parent = net.connect("/tmp/mineflayer.sock");

const server = "localhost";
const port =  61012;


parent.write({hi:"Hi"})


/*
  bot = mineflayer.createBot({
    host: server,
    port: port,
    username: username,
    password: password,
  });


setTimeout(() => {
  bot.quit()

}, 300);

*/
