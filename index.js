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

app.listen(3000, () => console.log("I'm on 3000"))