const { Pool } = require('pg');

// Instantiate a new client.
const client = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DB,
  password: process.env.PSQL_PASSWORD,
  port: process.env.PSQL_PORT,
});

// Helper function to perform a transaction.
const performTransaction = async (query) => {
  try {
    await client.query('BEGIN');
    const res = await client.query(query);
    await client.query('COMMIT');
    return res;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
};

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
      const start = Date.now();
      let end = start;
      if (months) end += months * 2629800000;
      if (days) end += days * 86400000;
      if (hours) end += hours * 3600000;
      if (minutes) end += minutes * 60000;

      // Perform a transaction.
      const query =
        'INSERT INTO reminders(member, start_time, end_time, description) ' +
        `VALUES(${user}, ${start}, ${end}, '${reminder}')`;
      await performTransaction(query);
    },

    // Returns a list of reminders for that user.
    remindersList: async (user) => {
      const query = `SELECT * FROM Reminders WHERE member = ${user} ORDER BY end_time`;
      const res = await client.query(query);
      return res.rows;
    },

    // Removes reminder from database for that user.
    removeReminder: async (user, rid) => {
      const listQuery = `SELECT * FROM Reminders WHERE member = ${user} ORDER BY end_time`;
      const list = await client.query(listQuery);
      if (list.rows.length === 0 || list.rows.length + 1 <= rid) return false;

      // Perform a transaction.
      const query =
        `DELETE FROM Reminders WHERE start_time = ${list.rows[rid - 1].start_time} and ` +
        `end_time = ${list.rows[rid - 1].end_time}`;
      const res = await performTransaction(query);
      return res.rowCount !== 0;
    },

    // Removes all reminders from database for that user.
    clearReminders: async (user) => {
      const query = `DELETE FROM Reminders WHERE member = ${user}`;
      const res = await performTransaction(query);
      return res.rowCount !== 0;
    },

    // Checks and removes reminders that should be removed.
    checkReminders: async () => {
      const remindersQuery = `SELECT * FROM Reminders WHERE end_time < ${Date.now()}`;
      const res = await client.query(remindersQuery);
      if (res.rows.length > 0) {
        const query = `DELETE FROM Reminders WHERE end_time < ${Date.now()}`;
        await performTransaction(query);
      }
      return res.rows;
    },
  };
};
