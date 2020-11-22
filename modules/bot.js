// Defines the syntax of a command using regex.
const commandSyntax = /^\s*!([A-Za-z]+)((?: [^ ]+)+)?\s*$/;

module.exports = (client, db) => {
  // Command Handlers
  // Test command.
  const testHandler = async (command) => {
    command.message.channel.send('Test!');
    await db.testFunction();
  };

  // Add reminder.
  const addReminder = (command) => {
    command.message.channel.send('Add reminder.');
    console.log(command);
  };

  // Remove reminder.
  const removeReminder = (command) => {
    command.message.channel.send('Remove reminder.');
  };

  // Ready
  function readyHandler() {
    console.log('Connected to Discord!');
  }

  // Map commands to their respective handlers.
  const commandHandlers = {
    rtest: testHandler,
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
