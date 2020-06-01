/*
Things to add:
- Come command to go to player
- Commands that only EC29 can run vs global/eternum commands
- Log when a bot is commanded
- List chests nearby
- Constatnly attack attacks
- Constantly mines what's in front of it (for cobble/obi farm)
- Turn on physics ot be able to push the bot around
*/

const mineflayer = require('mineflayer')
const express = require("express")
const app = express()
const chalk = require("chalk");
const v = require("vec3")

app.get("/", (req, res) => res.send(""))

console.log(chalk.green("Bot is starting")); //A heads-up that the bot is starting

function currentPlayers(action) {
	console.log(chalk.yellow("Someone " + action + ": " + Object.keys(bot.players)));
}

function quitGame() {
	bot.quit();
	console.log(chalk.red("Bot left the server")) // Making it clear that the bot left
}

const bot = mineflayer.createBot({
	host: process.env.HOST,
	port: parseInt(process.env.PORT),
	username: process.env.NAME ? process.env.NAME : 'index',
	password: process.env.PASSWORD,
})

// Initial things when bot joins the server
bot.on('spawn', () => {
	console.clear(); // Clears the console to make the chat easier to read
	console.log(chalk.green("Bot joined the server")) // Clearly able to tell in console if bot has logged on

	bot.chat('/nick Booomerr [BOT]') // Setting nickname to make it clear that it's a bot
	bot.chat('/afk') // Sets the bot to AFK

	bot.chat('hi'); // Bot's join message
})

// Commands that only EC29 can run
bot.on('whisper', function(username, message) {
	if (username == bot.username) return; // Checks to make sure that the bot isn't whispering to itself

	if(message.includes("leave")) {
		console.log(username);
		quitGame();
	}

})

// Logs all chat messages in the console
bot.on('chat', function(username, message) {
	console.log(username + ": " + message)
});

bot.on('playerJoined', function(player) {
	// Waits a second before checking to see who's online
	setTimeout(function() {
		currentPlayers("joined");
	}, 2000);
})

bot.on('playerLeft', function(player) {
	currentPlayers("left");
})

// Logs info when kicked
bot.on('kicked', function(reason, loggedIn) {
	console.log(chalk.cyan("Kicked for " + reason + "while " + loggedIn))
});

// Calls people out when bed is broken
bot.on('spawnReset', () => {
	bot.chat('Who broke my bed');
})

// Has some fun with people when killed
bot.on('death', () => {
	bot.chat('why u got to be like that');
})

app.listen(3000) // Keeping an open port for Uptime Robot