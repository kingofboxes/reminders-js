# reminders-js
Discord bot which allows you to add/remove/list reminders. Written in JS.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need Node.js, yarn, PostgresQL 12 (running latest versions, but should be compatible with older versions too).

### Installing

Below is a step-by-step guide on setting up the program to get a development environment running (assuming PSQL server is set up).

1. Clone this repo.

```
git clone git@github.com:kingofboxes/reminders-js.git
```

2. Install dependencies.

```
yarn
```

3. Create a new file called '.env' as follows.

```
touch .env
```

6. Add the following lines and fill it in:

```
DISCORD_TOKEN = 
PSQL_HOST = 
PSQL_PORT = 
PSQL_DB = 
PSQL_USER = 
PSQL_PASSWORD = 
DISCORD_ADMINUSER = 
```

7. Run the bot.

```
yarn start
```