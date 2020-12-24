#!/bin/bash

# Build the container for the bot.
docker build -t reminders/reminders-js .

# Build the database container.
docker build -t reminders/reminders-db ./database

# Destroy the network if it already exists.
docker network rm reminders-js

# Create the network.
docker network create reminders-js 

# Start the PSQL container.
docker run --rm --net reminders-js --name reminders-db -d reminders/reminders-db

# Start the bot.
docker run --rm --net reminders-js --name reminders-js -d reminders/reminders-js

# Echo script completion.
echo "Containers have been started!"