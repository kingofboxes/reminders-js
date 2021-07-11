const { Pool } = require('pg');
const ical = require('node-ical');

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

// Functions for iCalendar subscription.
const filterOutdatedEvents = (calendar) => {
  const calendarObject = Object.values(calendar);
  const eventArray = Array.from(calendarObject);
  const filteredEvents = eventArray.filter((e) => e.summary && e.start.getTime() > Date.now());
  return filteredEvents;
};

const noDuplicateReminder = async (user, event) => {
  const startTime = event.start.getTime();
  const description = event.summary;
  const duplicateQuery = `SELECT * FROM Reminders WHERE member = '${user}' AND end_time = '${startTime}' AND description = '${description}'`;
  const res = await client.query(duplicateQuery);
  return res.rowCount === 0;
};

// Initialise with PSQL credentials.
module.exports = () => {
  (async () => {
    await client.connect();
    console.log('Connected to PSQL server!');
  })();

  return {
    addReminder: async (user, months, days, hours, minutes, reminder) => {
      const start = Date.now();
      let end = start;
      if (months) end += months * 2629800000;
      if (days) end += days * 86400000;
      if (hours) end += hours * 3600000;
      if (minutes) end += minutes * 60000;

      const query =
        'INSERT INTO reminders(member, start_time, end_time, description) ' +
        `VALUES(${user}, ${start}, ${end}, '${reminder}')`;
      await performTransaction(query);
    },

    remindersList: async (user) => {
      const query = `SELECT * FROM Reminders WHERE member = ${user} ORDER BY end_time`;
      const res = await client.query(query);
      return res.rows;
    },

    removeReminder: async (user, rid) => {
      const listQuery = `SELECT * FROM Reminders WHERE member = ${user} ORDER BY end_time`;
      const list = await client.query(listQuery);
      if (list.rows.length === 0 || list.rows.length + 1 <= rid) return false;
      const query =
        `DELETE FROM Reminders WHERE start_time = ${list.rows[rid - 1].start_time} and ` +
        `end_time = ${list.rows[rid - 1].end_time}`;
      const res = await performTransaction(query);
      return res.rowCount !== 0;
    },

    clearReminders: async (user) => {
      const query = `DELETE FROM Reminders WHERE member = ${user}`;
      const res = await performTransaction(query);
      return res.rowCount !== 0;
    },

    checkReminders: async () => {
      const remindersQuery = `SELECT * FROM Reminders WHERE end_time < ${Date.now()}`;
      const res = await client.query(remindersQuery);
      if (res.rows.length > 0) {
        const query = `DELETE FROM Reminders WHERE end_time < ${Date.now()}`;
        await performTransaction(query);
      }
      return res.rows;
    },

    subscribeToCalendarForReminders: async (user, url) => {
      const regex = new RegExp('^https?:\/\/.*.ics$');
      if (regex.test(url)) {
        try {
          await ical.async.fromURL(url);
          const query =
            'INSERT INTO subscriptions(member, ics_url) ' + `VALUES('${user}', '${url}')`;
          await performTransaction(query);
          return true;
        } catch (e) {
          return false;
        }
      }
    },

    checkCalendarForReminders: async () => {
      const calendarQuery = `SELECT * FROM subscriptions`;
      const res = await client.query(calendarQuery);
      res.rows.forEach(async (r) => {
        const user = r.member;
        const url = r.ics_url;
        try {
          const calendar = await ical.async.fromURL(url);
          const filteredEvents = filterOutdatedEvents(calendar);
          await filteredEvents.forEach(async (e) => {
            if (await noDuplicateReminder(user, e)) {
              const query =
                'INSERT INTO reminders(member, start_time, end_time, description) ' +
                `VALUES(${user}, ${Date.now()}, ${e.start.getTime()}, '${e.summary}')`;
              await performTransaction(query);
            }
          });
        } catch (e) {
          console.error(e); // don't have a logger to output error to
        }
      });
    },
  };
};
