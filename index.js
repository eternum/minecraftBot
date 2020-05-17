const mineflayer = require('mineflayer')
const express = require("express")
const app = express()

app.get("/",(req,res) => res.send("I'm awake bro."))

const bot = mineflayer.createBot({
  host: process.env.HOST,
  port: parseInt(process.env.PORT),
  username: process.env.NAME ? process.env.NAME : 'index',
  password: process.env.PASSWORD
})

bot.on('login', () => {
    bot.chat('/nick [Bot] Booomerr')
    bot.chat('/afk')
    bot.chat('Heyo, i’m Saharsh’s bot! i’ll be AFKing here for a bit.')
})

bot.on('error', err => {
    console.log(err)
})

app.listen(3000, () => console.log("I'm on 3000"))