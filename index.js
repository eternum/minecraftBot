const mineflayer = require('mineflayer')
const express = require("express")
const app = express()
const chalk = require("chalk");

console.log(chalk.green("Bot is starting")); //A heads-up when the bot is starting up

app.get("/", (req, res) => res.send(""))

const bot = mineflayer.createBot({
	host: process.env.HOST,
	port: parseInt(process.env.PORT),
	username: process.env.NAME ? process.env.NAME : 'index',
	password: process.env.PASSWORD,
})

// Initial things when bot joins the server
bot.on('login', () => {
	console.clear(); // Clears the console to make the chat easier to read

	bot.chat('/nick Booomerr Bot') // Setting nickname to make it clear that it's a bot
	bot.chat('/afk') // Sets the bot to AFK

	console.log(chalk.green("Logged in to the server")) // Clearly able to tell in console if bot has logged on
})

// Bot will quit when whispered to
bot.on('whisper', function(username, message) {
	if (username === bot.username) return; // Checks to make sure that the bot isn't whispering to itself

	bot.quit();

	console.log(chalk.bgRedBright.bold("Bot left the server")) // Making it clear that the bot left
});

// Logs all chat messages in the console
bot.on('chat', function(username, message) {
	console.log(username + ": " + message)
});

function currentPlayers(action) {
	console.log(chalk.bgYellow("Someone " + action));
	console.log(chalk.bgYellow("Players online: " + Object.keys(bot.players)));
}

bot.on('playerJoined', function(player) {
	currentPlayers("joined");
})

bot.on('playerLeft', function(player) {
	currentPlayers("left");
})

// Logs info when kicked
bot.on('kicked', function(reason, loggedIn) {
	console.log(chalk.bgCyanBright("Reason for kick: " + reason));
	console.log(chalk.bgCyanBright("Logged In? " + loggedIn))
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