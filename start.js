require('dotenv').config();
const Discord = require('discord.js');

const db = require('./utils/store')();

const client = new Discord.Client();
require('./modules/bot')(client, db);

const token = process.env.DISCORD_TOKEN;
client.login(token);
