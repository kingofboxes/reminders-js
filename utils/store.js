const { Pool } = require('pg');

// Instantiate a new client.
const client = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DB,
  password: process.env.PSQL_PASSWORD,
  port: process.env.PSQL_PORT,
});

// Initialise with PSQL credentials.
module.exports = () => {
  // Connect to the PSQL DB.
  (async () => {
    await client.connect();
    console.log('Connected to PSQL server!');
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
          'INSERT INTO reminders(member, start_time, end_time, description) VALUES($1, $2, $3, $4)';
        await client.query(query, [Number(user), start, end, reminder]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    },

    // Returns a list of reminders for that user.
    remindersList: async (user) => {
      try {
        const query = `SELECT * FROM Reminders WHERE member = ${user} ORDER BY end_time`;
        const res = await client.query(query);
        return res.rows;
      } catch (e) {
        throw e;
      }
    },

    // Removes reminder from database for that user.
    removeReminder: async (user, rid) => {
      try {
        const listQuery = `SELECT * FROM Reminders WHERE member = ${user} ORDER BY end_time`;
        const list = await client.query(listQuery);
        if (list.rows.length === 0 || list.rows.length + 1 < rid) return false;
        await client.query('BEGIN');
        const query =
          `DELETE FROM Reminders WHERE start_time = ${list.rows[rid - 1].start_time} and ` +
          `end_time = ${list.rows[rid - 1].end_time}`;
        const res = await client.query(query);
        await client.query('COMMIT');
        return res.rowCount !== 0;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    },

    // Removes all reminders from database for that user.
    clearReminders: async (user) => {
      try {
        await client.query('BEGIN');
        const query = `DELETE FROM Reminders WHERE member = ${user}`;
        const res = await client.query(query);
        await client.query('COMMIT');
        return res.rowCount !== 0;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    },

    // Checks and removes reminders that should be removed.
    checkReminders: async () => {
      try {
        const remindersQuery = `SELECT * FROM Reminders WHERE end_time < ${Date.now()}`;
        const res = await client.query(remindersQuery);
        if (res.rows.length > 0) {
          await client.query('BEGIN');
          const query = `DELETE FROM Reminders WHERE end_time < ${Date.now()}`;
          await client.query(query);
          await client.query('COMMIT');
        }
        return res.rows;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    },
  };
};
