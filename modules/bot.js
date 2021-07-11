const Discord = require('discord.js');

let poll;
let subscription;
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

// Checks calendars in db once an hour.
const subscriptionPoll = async (client, db) => {
  await db.checkCalendarForReminders();
};

// Command Handlers
module.exports = (client, db) => {
  const addReminder = (command) => {
    const usage =
      '```Usage: !radd <time> <description>\n' +
      'time = #M#d#h#m (e.g. 1d1h1m = 0 months, 1 day, 1 hour, 1 minute)```\n';
    if (command.arguments.length < 2 || !dateSyntax.test(command.arguments[0])) {
      command.message.channel.send(usage);
      return;
    }
    const time = command.arguments.shift();
    const timeframe = time.match(dateSyntax);
    const reminder = command.arguments.join(' ');
    db.addReminder(
      command.message.author.id,
      timeframe[1],
      timeframe[2],
      timeframe[3],
      timeframe[4],
      reminder
    );
    command.message.channel.send('Reminder set.');
  };

  const removeReminder = async (command) => {
    const usage = '```Usage: !rremove <reminder>```';
    if (command.arguments.length != 1 || isNaN(command.arguments[0])) {
      command.message.channel.send(usage);
      return;
    }
    const res = await db.removeReminder(command.message.author.id, command.arguments[0]);
    res
      ? command.message.channel.send('Reminder removed.')
      : command.message.channel.send('Invalid reminder number.');
  };

  const remindersList = async (command) => {
    const usage = '```Usage: !rlist```';
    if (command.arguments.length != 0) {
      command.message.channel.send(usage);
      return;
    }
    const res = await db.remindersList(command.message.author.id);
    if (res.length === 0) {
      command.message.channel.send('You have no reminders.');
      return;
    }
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

  const clearReminders = async (command) => {
    const usage = '```Usage: !rclear```';
    if (command.arguments.length != 0) {
      command.message.channel.send(usage);
      return;
    }
    const res = await db.clearReminders(command.message.author.id);
    res
      ? command.message.channel.send('All reminders cleared.')
      : command.message.channel.send('There are no reminders to be cleared.');
  };

  const stopReminders = async (command) => {
    const usage = '```Usage: !rstop```';
    if (command.arguments.length != 0) {
      command.message.channel.send(usage);
      return;
    }
    if (command.message.author.id != adminUser) {
      command.message.channel.send('Only the owner of this bot can use this command.');
      return;
    }
    clearInterval(poll);
    clearInterval(subscription);
    command.message.channel.send('Shutting down...');
    setTimeout(async () => {
      await client.destroy();
      process.kill(process.pid, 'SIGTERM');
    }, 500);
  };

  const subscribeToCalendarForReminders = async (command) => {
    const usage = '```Usage: !rsub <url>```';
    if (command.arguments.length != 1) {
      command.message.channel.send(usage);
      return;
    }
    const res = await db.subscribeToCalendarForReminders(
      command.message.author.id,
      command.arguments[0]
    );
    res
      ? command.message.channel.send(
          'You are now subscribed to this calendar. Events will be added as reminders once an hour.'
        )
      : command.message.channel.send(
          'Subscription was not added. Either you are already subscribed to this calendar, or the URL/iCalendar file is invalid.'
        );
  };

  const remindersHelp = async (command) => {
    const usage =
      '```Welcome to RemindersJS! Below is a quick summary to get started:\n\n' +
      '• !radd <time> <description>   -   Adds a reminder.\n' +
      '• !rremove <reminder_id>       -   Removes a reminder.\n' +
      '• !rclear                      -   Clears all reminders.\n' +
      '• !rlist                       -   Lists all reminders.\n' +
      "• !rstop                       -   Ends the bot's misery.\n" +
      '• !rhelp                       -   This help manual.\n```' +
      '• !rsub                        -   Subscribes to events from an iCalendar file.\n```';
    command.message.channel.send(usage);
  };

  const readyHandler = async () => {
    console.log('Connected to Discord! Commencing polling for reminders.');
    await client.user.setActivity('discord.js');
    await client.user.setStatus('dnd');
    poll = client.setInterval(() => remindersPoll(client, db), 5000);
    subscription = client.setInterval(() => subscriptionPoll(client, db), 600000);
  };

  const commandHandlers = {
    radd: addReminder,
    rremove: removeReminder,
    rlist: remindersList,
    rclear: clearReminders,
    rhelp: remindersHelp,
    rstop: stopReminders,
    rsub: subscribeToCalendarForReminders,
  };

  const parseCommand = (cmdMessage) => {
    const matchObj = cmdMessage.content.match(commandSyntax);
    if (matchObj == null || !(matchObj[1] in commandHandlers)) {
      return null;
    }
    return {
      message: cmdMessage,
      command: matchObj[1],
      arguments: matchObj[2] ? matchObj[2].trim().split(' ') : [],
    };
  };

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
