const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
  host: process.env.HOST,
  port: parseInt(process.env.PORT),
  username: process.env.NAME ? process.env.NAME : 'index',
  password: process.env.PASSWORD
})