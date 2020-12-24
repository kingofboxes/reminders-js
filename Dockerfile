# Latest Ubuntu file.
FROM ubuntu:latest

# Install node and yarn.
RUN apt -yqq update
RUN apt install -yq curl gnupg2

# Install Node.
RUN curl -sL https://deb.nodesource.com/setup_14.x | sh -
RUN cat /etc/apt/sources.list.d/nodesource.list
RUN apt -yqq update
RUN apt -yqq install nodejs


# Install yarn.
RUN apt remove -yqq cmdtest 
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt -yqq update
RUN apt install -yqq yarn

# Copy code.
WORKDIR /opt/reminders-js 
COPY . .

# Fetch app specific dependencies.
RUN yarn 

# Run the command.
CMD ["yarn", "dev"]