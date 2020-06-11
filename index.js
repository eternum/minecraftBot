/*
Things to add:
- Come command to go to player (Gonna be tough)
- Constatnly attacks
- Constantly mines what's in front of it (for cobble/obi farm)
- Turn on physics ot be able to push the bot around
*/

const mineflayer = require('mineflayer')
const express = require("express")
const app = express()
const chalk = require("chalk");

app.get("/", (req, res) => res.send(""))

console.log(chalk.green("Bot is starting")); //A heads-up that the bot is starting

const bot = mineflayer.createBot({
	host: process.env.HOST,
	port: parseInt(process.env.PORT),
	username: process.env.NAME ? process.env.NAME : 'index',
	password: process.env.PASSWORD,
})

var eternumMembers = ['ExpressCow29', 'ExpressCow30', 'NotACreativeName', 'Jdawgst8fire', 'nice6599'];

// Initial things when bot joins the server
bot.on('spawn', () => {
	console.clear(); // Clears the console to make the chat easier to read
	console.log(chalk.green("Bot joined the server")) // Clearly able to tell in console if bot has logged on

	bot.chat('/nick Booomerr [BOT]') // Setting nickname to make it clear that it's a bot
	bot.chat('/afk') // Sets the bot to AFK


	setTimeout(function() {
		bot.chat('hi ken');
	}, 1000);
	bot.chat('hi ken'); // Bot's join message

	setTimeout(function() {
		bot.chat('bye ken');
	}, 3000);

	setTimeout(function() {
		bot.quit();
	}, 1000);
})

// Commands that only EC29 can run
bot.on('whisper', function(username, message) {
	if (username == bot.username) return; // Checks to make sure that the bot isn't whispering to itself
	
	if (eternumMembers.includes(username)) {
		if(message.includes("leave")) {
			console.log(chalk.red(username + "said to leave"));
			quitGame();
		}	
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

function currentPlayers(action) {
	console.log(chalk.yellow("Someone " + action + ": " + Object.keys(bot.players)));
}

function quitGame() {
	bot.quit();
	console.log(chalk.red("Bot left the server")) // Making it clear that the bot left
}

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
