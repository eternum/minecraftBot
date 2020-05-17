const mineflayer = require('mineflayer')
if (process.argv.length < 4 || process.argv.length > 6) {
    console.log('Usage : node process.env.FILE_PATH process.env.HOST process.env.PORT process.env.NAME process.env.PASSWORD')
    process.exit(1)
  }
const bot = mineflayer.createBot({
  host: process.argv[2],
  port: parseInt(process.argv[3]),
  username: process.argv[4] ? process.argv[4] : 'repl',
  password: process.argv[5]
})