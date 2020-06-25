const express = require('express')

const { createBot, listen, leave } = require('./utils')

const app = express()
let bot = null

console.log('Starting...')

app.post('/startbot', (_, res) => {
	bot || listen(bot = createBot())
	
	res.send()
})

app.post('/stopbot', (_, res) => {
	if (bot) {
		leave(bot)
		bot = null
	}
	
	res.send()
})

app.listen(3000)
