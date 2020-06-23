require('dotenv').config()

const { readFileSync: readFile } = require('fs')
const mineflayer = require('mineflayer')
const path = require('path');

const users = JSON.parse(readFile(path.join(__dirname, 'users.json').toString()))

const createBot = () =>
	mineflayer.createBot({
		host: process.env.HOST,
		port: parseInt(process.env.PORT),
		username: process.env.NAME || 'index',
		password: process.env.PASSWORD,
	})

const listen = bot => {
	// Initial things when bot joins the server
	bot.on('spawn', () => {
		console.clear() // Clears the console to make the chat easier to read
		console.log(chalk.green('Bot joined the server'))
		
		bot.chat('/nick Booomerr [BOT]')
		bot.chat('/afk') // Sets the bot to AFK
	})
	
	// Commands that only EC29 can run
	bot.on('whisper', (username, message) => {
		if (username === bot.username)
			return // If the bot is whispering to itself
		
		if (users.includes(username) && message.includes('leave')) {
			console.log(chalk.red(`${username} said to leave`))
			leave(bot)
		}
	})
	
	// Logs all chat messages in the console
	bot.on('chat', (username, message) =>
		console.log(`${username}: ${message}`)
	)
	
	bot.on('playerJoined', () =>
		setTimeout(() => logPlayers('joined', bot), 2000)
	)
	
	bot.on('playerLeft', () => logPlayers('left', bot))
	
	bot.on('kicked', (reason, loggedIn) =>
		console.log(chalk.cyan(`Kicked for ${reason} while ${loggedIn}`))
	)
	
	// Calls people out when bed is broken
	bot.on('spawnReset', () => bot.chat('Who broke my bed'))
	
	// Has some fun with people when killed
	bot.on('death', () => bot.chat('why u got to be like that'))
}

const logPlayers = (action, bot) => {
	console.log(chalk.yellow(
		`Someone ${action}: ${Object.keys(bot.players).join(', ')}`
	))
}

const leave = bot => {
	bot.quit()
	console.log(chalk.red('Bot left the server'))
}

exports.createBot = createBot
exports.listen = listen
exports.logPlayers = logPlayers
exports.leave = leave
