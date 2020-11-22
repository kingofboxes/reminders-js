const { Client } = require('pg');

// Initialise with Redis credentials.
module.exports = () => {
  // Instantiate a new client.
  const client = new Client({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DB,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
  });

  // Connect to the PSQL DB.
  (async () => {
    await client.connect();
    console.log('Connected to PSQL server!'); // Hello world!
  })();

  // Functions returned for DB manipulation.
  return {
    testFunction: async () => {
      await client.query('select * from reminders', (err, res) => {
        err ? console.log(err) : console.log(res.rows);
      });
    },
  };
};
