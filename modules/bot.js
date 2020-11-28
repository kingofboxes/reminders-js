// Defines the syntax of a command using regex.
const commandSyntax = /^\s*!([A-Za-z]+)((?: [^ ]+)+)?\s*$/;
const dateSyntax = /^\s*(?:(\d+)M)?\s*(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*$/;

module.exports = (client, db) => {
  // Command Handlers
  // Test command.
  const testHandler = async (command) => {
    command.message.channel.send('Test!');
    await db.testFunction();
  };

  // Add reminder.
  const addReminder = (command) => {
    // Usage message.
    const usage =
      '```Usage: !radd <time> [description]\n' +
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

    // Confirmation
    command.message.channel.send('Reminder added.');
  };

  // Remove reminder.
  const removeReminder = async (command) => {
    // Usage message.
    const usage = '```Usage: !rremove <reminder_id>```';

    // Check for arguments.
    if (command.arguments.length != 1 || isNaN(command.arguments[0])) {
      command.message.channel.send(usage);
      return;
    }

    // Attempt to remove reminder from database.
    const res = await db.removeReminder(command.message.author.id, command.arguments[0]);
    res
      ? command.message.channel.send('Reminder removed.')
      : command.message.channel.send('The provided reminder id was invalid.');
  };

  // Ready
  function readyHandler() {
    console.log('Connected to Discord!');
  }

  // Map commands to their respective handlers.
  const commandHandlers = {
    radd: addReminder,
    rremove: removeReminder,
  };

  // Parse the command and return an object.
  function parseCommand(cmdMessage) {
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
  }

  // Handles messages, ignoring messages from the bot itself.
  function messageHandler(message) {
    if (message.author.bot) return;
    const command = parseCommand(message);
    if (command != null) {
      commandHandlers[command.command](command);
    }
  }

  client.once('ready', readyHandler);
  client.on('message', messageHandler);
};
