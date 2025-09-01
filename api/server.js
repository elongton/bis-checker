const express = require("express");
const dotenv = require("dotenv");
const gearRoutes = require("./routes/gear");
const blizzardRoutes = require("./routes/blizzard");
const playerRoutes = require("./routes/player");


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

console.log("Client Secret:");
console.log(process.env.DISCORD_CLIENT_SECRET);

const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const { getGuildAttendance } = require("./controllers/warcraftLogsController");
const { fourWeeksAgoMs, findClassNameById } = require("./utility");
const { upsertLatestItems, fetchAndUpdatePlayers } = require("./controllers/playerController");

// Discord OAuth config
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: `${process.env.APP_URL}/api/auth/discord/callback`,
  scope: ['identify']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use("/api/gear", gearRoutes);
app.use("/api/blizzard", blizzardRoutes);
app.use("/api/player", playerRoutes);
require("./scheduler"); // Import to start the cron job

// Discord auth routes
app.get('/api/auth/discord', passport.authenticate('discord'));
app.get('/api/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(`${process.env.APP_URL}?user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

//Routes that require multiple services
app.get('/api/refresh-players', async (req, res) => {
  try {
    const playerLibrary = await fetchAndUpdatePlayers()
    res.json(`Players refreshed: ${Object.keys(playerLibrary).length}`);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error', detail: e.message });
  }
})





// Serve Angular build
app.use(express.static(path.join(__dirname, '../dist/classic-bis-browser')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/classic-bis-browser/index.html'));
});



app.listen(PORT, () => {
  console.log(`[server] Listening at http://localhost:${PORT}`);
});