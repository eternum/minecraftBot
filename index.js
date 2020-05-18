const mineflayer = require('mineflayer')
const express = require("express")
const app = express()

console.log("starting bot"); //A heads-up that the bot is starting up

app.get("/", (req, res) => res.send("I'm awake."))

const bot = mineflayer.createBot({
	host: process.env.HOST,
	port: parseInt(process.env.PORT),
	username: process.env.NAME ? process.env.NAME : 'index',
	password: process.env.PASSWORD,
})

// Initial things when bot joins the server
bot.on('login', () => {
	bot.chat('Hey, I’m Saharsh’s bot! I’ll be AFKing for a bit.') 	// Message to let players to about the bot
	bot.chat('/nick Booomerr (bot)') // Setting nickname to make it clear that it's a bot
	bot.chat('/afk') // Sets the bot to AFK
})

// Bot will quit when whispered to
bot.on('whisper', function(username, message) {
	if (username === bot.username) return;
	bot.quit();
});

app.listen(3000, () => console.log("I'm on 3000"))