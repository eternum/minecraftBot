const mineflayer = require('mineflayer')
const express = require("express")
const app = express()

console.log("starting bot"); //A heads-up when the bot is starting up

app.get("/", (req, res) => res.send("I'm awake."))

const bot = mineflayer.createBot({
	host: process.env.HOST,
	port: parseInt(process.env.PORT),
	username: process.env.NAME ? process.env.NAME : 'index',
	password: process.env.PASSWORD,
})

// Initial things when bot joins the server
bot.on('login', () => {
	bot.chat('/nick Booomerr Bot') // Setting nickname to make it clear that it's a bot
	bot.chat('sup') // Bot makes itself known
	bot.chat('/afk') // Sets the bot to AFK
})

// Bot will quit when whispered to
bot.on('whisper', function(username, message) {
	if (username === bot.username) return;

	// Bot messes with people when whispered to before leaving
	bot.chat('I see that all of you do not like me. I will leave then.')
	bot.chat('meanies')
	bot.chat('I want a courtcase')
	bot.quit();
});

// Logs all chat messages in the console
bot.on('chat', function(username, message) {
	console.log(username + ": " + message)
});

app.listen(3000) // Keeping an open port for Uptime Robot