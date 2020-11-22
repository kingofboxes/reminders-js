// Get required variables.
require('dotenv').config();
const Discord = require('discord.js');

// Create a Discord client.
const client = new Discord.Client();
require('./modules/bot')(client);

// Get the token and log in.
const token = process.env.DISCORD_TOKEN;
client.login(token);
