const Discord = require('discord.js');

// Constants for maintaining bot operation.
let poll;
const adminUser = process.env.DISCORD_ADMINUSER;
const commandSyntax = /^\s*!([A-Za-z]+)((?: [^ ]+)+)?\s*$/;
const dateSyntax = /^\s*(?:(\d+)M)?\s*(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*$/;

// Function which is called when polling.
const remindersPoll = async (client, db) => {
  const res = await db.checkReminders();
  res.forEach(async (reminder) => {
    const date = new Date(Number(reminder.start_time));
    const user = await client.users.fetch(reminder.member);
    const reminderEmbed = new Discord.MessageEmbed()
      .setColor('#FF015B')
      .setTitle(`${reminder.description}`)
      .setAuthor(user.username, user.avatarURL())
      .setTimestamp(date);
    user.send(reminderEmbed);
  });
};

module.exports = (client, db) => {
  // Command Handlers
  // Add reminder.
  const addReminder = (command) => {
    // Usage message.
    const usage =
      '```Usage: !radd <time> <description>\n' +
      'time = #M#d#h#m (e.g. 1d1h1m = 0 months, 1 day, 1 hour, 1 minute)```\n';

    // Check for arguments.
    if (command.arguments.length < 2 || !dateSyntax.test(command.arguments[0])) {
      command.message.channel.send(usage);
      return;
    }

    // Get input for the reminder date.
    const time = command.arguments.shift();
    const timeframe = time.match(dateSyntax);
    const reminder = command.arguments.join(' ');

    // Pass to DB to add.
    db.addReminder(
      command.message.author.id,
      timeframe[1],
      timeframe[2],
      timeframe[3],
      timeframe[4],
      reminder
    );

    // Confirmation message.
    command.message.channel.send('Reminder set.');
  };

  // Remove reminder.
  const removeReminder = async (command) => {
    // Usage message.
    const usage = '```Usage: !rremove <reminder>```';

    // Check for arguments.
    if (command.arguments.length != 1 || isNaN(command.arguments[0])) {
      command.message.channel.send(usage);
      return;
    }

    // Confirmation message.
    const res = await db.removeReminder(command.message.author.id, command.arguments[0]);
    res
      ? command.message.channel.send('Reminder removed.')
      : command.message.channel.send('Invalid reminder number.');
  };

  // Get a list of reminders.
  const remindersList = async (command) => {
    // Usage message.
    const usage = '```Usage: !rlist```';

    // Check for arguments.
    if (command.arguments.length != 0) {
      command.message.channel.send(usage);
      return;
    }

    // Get a list of reminders.
    const res = await db.remindersList(command.message.author.id);
    if (res.length === 0) {
      command.message.channel.send('You have no reminders.');
      return;
    }

    // Write out the reminder and set as an embed.
    let reminders = '';
    res.forEach((reminder, idx) => {
      const date = new Date(Number(reminder.end_time));
      const options = { timeZoneName: 'short' };
      const time = date
        .toLocaleString('en-AU', options)
        .toUpperCase()
        .replace(/:\d{2} /, ' ');
      reminders += `• **[#${idx + 1}]** - ${reminder.description} ` + `(${time})\n`;
    });

    const user = await client.users.fetch(command.message.author.id);
    const reminderEmbed = new Discord.MessageEmbed()
      .setColor('#FF015B')
      .setTitle('Reminders List')
      .setDescription(reminders)
      .setAuthor(user.username, user.avatarURL());

    command.message.channel.send(reminderEmbed);
  };

  // Clears all reminders.
  const clearReminders = async (command) => {
    // Usage message.
    const usage = '```Usage: !rclear```';

    // Check for arguments.
    if (command.arguments.length != 0) {
      command.message.channel.send(usage);
      return;
    }

    // Attempt to remove reminder from database.
    const res = await db.clearReminders(command.message.author.id);
    res
      ? command.message.channel.send('All reminders cleared.')
      : command.message.channel.send('There are no reminders to be cleared.');
  };

  // Stops the bot.
  const stopReminders = async (command) => {
    // Usage message.
    const usage = '```Usage: !rstop```';

    // Check for arguments.
    if (command.arguments.length != 0) {
      command.message.channel.send(usage);
      return;
    }

    // Check if admin user.
    if (command.message.author.id != adminUser) {
      command.message.channel.send('Only the owner of this bot can use this command.');
      return;
    }

    // Stop polling and end the client.
    clearInterval(poll);
    command.message.channel.send('Shutting down...');
    setTimeout(async () => {
      await client.destroy();
      process.kill(process.pid, 'SIGTERM');
    }, 500);
  };

  // Clears all reminders.
  const remindersHelp = async (command) => {
    const usage =
      '```Welcome to RemindersJS! Below is a quick summary to get started:\n\n' +
      '• !radd <time> <description>   -   Adds a reminder.\n' +
      '• !rremove <reminder_id>       -   Removes a reminder.\n' +
      '• !rclear                      -   Clears all reminders.\n' +
      '• !rlist                       -   Lists all reminders.\n' +
      "• !rstop                       -   Ends the bot's misery.\n" +
      '• !rhelp                       -   This help manual.\n```';
    command.message.channel.send(usage);
  };

  // Polling function when bot connects to Discord.
  const readyHandler = async () => {
    console.log('Connected to Discord! Commencing polling for reminders.');
    await client.user.setActivity('discord.js');
    await client.user.setStatus('dnd');
    poll = client.setInterval(() => remindersPoll(client, db), 5000);
  };

  // Map commands to their respective handlers.
  const commandHandlers = {
    radd: addReminder,
    rremove: removeReminder,
    rlist: remindersList,
    rclear: clearReminders,
    rhelp: remindersHelp,
    rstop: stopReminders,
  };

  // Parse the command and return an object.
  const parseCommand = (cmdMessage) => {
    // Compare against command syntax and check if command is valid.
    const matchObj = cmdMessage.content.match(commandSyntax);
    if (matchObj == null || !(matchObj[1] in commandHandlers)) {
      return null;
    }

    // Return an object with command and arguments.
    return {
      message: cmdMessage,
      command: matchObj[1],
      arguments: matchObj[2] ? matchObj[2].trim().split(' ') : [],
    };
  };

  // Handles messages, ignoring messages from the bot itself.
  const messageHandler = (message) => {
    if (message.author.bot) return;
    const command = parseCommand(message);
    if (command != null) {
      commandHandlers[command.command](command);
    }
  };

  client.once('ready', readyHandler);
  client.on('message', messageHandler);
};
