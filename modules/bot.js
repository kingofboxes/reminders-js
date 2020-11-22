// Defines the syntax of a command using regex.
const commandSyntax = /^\s*!([A-Za-z]+)((?: [^ ]+)+)?\s*$/;

// Command Handlers
// Test command.
const testHandler = (command) => {
  command.message.channel.send('Test!');
};

// Add reminder.
const addReminder = (command) => {
  command.message.channel.send('Add reminder.');
};

// Remove reminder.
const removeReminder = (command) => {
  command.message.channel.send('Remove reminder.');
};

module.exports = (client) => {
  // Map commands to their respective handlers.
  const commandHandlers = {
    rtest: testHandler,
    radd: addReminder,
    rremove: removeReminder,
  };

  // Ready
  function readyHandler() {
    console.log('Connected to Discord!');
  }

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
