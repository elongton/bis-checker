const express = require("express");
const dotenv = require("dotenv");
const gearRoutes = require("./routes/gear");
const blizzardRoutes = require("./routes/blizzard");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/gear", gearRoutes);
app.use("/api/blizzard", blizzardRoutes);

app.listen(PORT, () => {
  console.log(`[server] Listening at http://localhost:${PORT}`);
});