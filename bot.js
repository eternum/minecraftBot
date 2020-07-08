const mineflayer = require('mineflayer');
const ipc = require('node-ipc');
const v = require('vec3');
const dataManager = require('./modules/dataManager');

const config = dataManager.loadConfig();

const botId = process.argv[2];
const server = process.argv[3];
const port = process.argv[4];
const username = process.argv[5] ? process.argv[5] : `bot_${botId}`;
const password = process.argv[6] ? process.argv[6] : null;

const { socketPath } = config.ipc;

ipc.config.id = 'parent';
ipc.config.appspace = '';
ipc.config.silent = true;
ipc.connectTo('parent', socketPath, function () {
  parent = ipc.of.parent;
  ipc.log('## connected to parent ##'.rainbow, ipc.config.delay);

  parent.on('data', function (data) {
    switch (data.action) {
      case 'stop':
        stop();
        break;
      case 'status':
        sendStatus();
        break;
      case 'move':
        move(data);
        break;
    }
  });
  parent.on('error', function () {
    stop();
  });
  parent.on('disconnect', function () {
    stop();
  });
  parent.on('destroy', function () {
    stop();
  });
});

const bot = mineflayer.createBot({
  host: server,
  port,
  username,
  password,
});

let mcData;
bot.once('inject_allowed', () => {
  mcData = require('minecraft-data')(bot.version);
});

function intitiateConnection(botId) {
  const message = { action: 'started', botId };
  send('started', message);
}

function sendCoordinates() {
  if (bot != null) {
    const { position } = bot.entity;

    const json = {
      action: 'coords',
      data: { x: position.x, y: position.y, z: position.z },
      botId,
    };
    send('data', json);
  }
}

function sendHealth() {
  if (bot != null) {
    const { health } = bot;

    const json = { action: 'health', data: health, botId };
    send('data', json);
  }
}

function sendHunger() {
  if (bot != null) {
    const hunger = bot.food;

    const json = { action: 'hunger', data: hunger, botId };
    send('data', json);
  }
}
function sendStatus() {
  sendCoordinates();
  healthHandler();
}
function send(type, data) {
  parent.emit(type, data);
}
bot.on('health', healthHandler);

bot.on('login', () => {
  intitiateConnection(botId);
  setTimeout(() => {
    sendStatus();
    bot.chat('/a');
  }, 1000);
});

bot.on('move', () => {
  sendCoordinates();
});

function healthHandler() {
  sendHealth();
  sendHunger();
}

function move(data) {
  if (data == null) bot.clearControlStates();
  bot.setControlState(data.data.operation, data.data.state);
}

function stop() {
  bot.quit();
  bot.on('end', () => process.exit());
}
