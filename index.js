const mineflayer = require('mineflayer')
const express = require("express")
const app = express()

app.get("/",(req,res) => res.send("I'm awake."))

const bot = mineflayer.createBot({
  host: process.env.HOST,
  port: parseInt(process.env.PORT),
  username: process.env.NAME ? process.env.NAME : 'index',
  password: process.env.PASSWORD,
	
	keepAlive: true,
	checkTimeoutInterval: 30*1000
})

bot.on('login', () => {
    bot.chat('Hey, I’m Saharsh’s bot! I’ll be AFKing for a bit.')
		bot.chat('/nick Booomerr (bot)')
    bot.chat('/afk')
		
})

bot.on('error', err => {
    console.log(err)
})

app.listen(3000, () => console.log("I'm on 3000"))