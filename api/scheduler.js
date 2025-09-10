// scheduler.js
const cron = require("node-cron");
const { fetchAndUpdatePlayers } = require("./controllers/playerController");
// replace with the actual path and method that calls the APIs and updates the DB

// Schedule: every 2 hours (12 times per day)
if (process.env.SCHEDULED_INGESTION === 'TRUE'){
  cron.schedule("0 */2 * * *", async () => {
    try {
      console.log(`[${new Date().toISOString()}] Running scheduled update...`);
      await fetchAndUpdatePlayers();
      console.log("Update completed.");
    } catch (err) {
      console.error("Scheduled update failed:", err);
    }
  });
}
