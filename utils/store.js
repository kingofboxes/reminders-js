const { Pool } = require('pg');

// Initialise with Redis credentials.
module.exports = () => {
  // Instantiate a new client.
  const client = new Pool({
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
    // Adds reminder to the database.
    addReminder: async (user, months, days, hours, minutes, reminder) => {
      // Calculate the ending time.
      const start = Date.now();
      let end = start;
      if (months) end += months * 2629800000;
      if (days) end += days * 86400000;
      if (hours) end += hours * 3600000;
      if (minutes) end += minutes * 60000;

      // Insert into DB.
      try {
        await client.query('BEGIN');
        const query =
          'INSERT INTO reminders(member, start_time, end_time, description) VALUES($1, $2, $3, $4) RETURNING id';
        await client.query(query, [Number(user), start, end, reminder]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    },

    // Removes reminder from database.
    removeReminder: async (user, rid) => {
      try {
        await client.query('BEGIN');
        const query = `DELETE FROM Reminders WHERE id = ${rid} and member = ${user}`;
        const res = await client.query(query);
        await client.query('COMMIT');
        return res.rowCount !== 0;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    },
  };
};
