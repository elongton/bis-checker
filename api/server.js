const express = require("express");
const dotenv = require("dotenv");
const gearRoutes = require("./routes/gear");
const blizzardRoutes = require("./routes/blizzard");
const discordRoutes = require("./routes/discord");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;


const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');

// Discord OAuth config
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: "1406045095207370872",
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: "/auth/discord/callback",
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
app.use("/api/auth", discordRoutes);

// Serve Angular build
app.use(express.static(path.join(__dirname, '../dist/classic-bis-browser')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/classic-bis-browser/index.html'));
});



app.listen(PORT, () => {
  console.log(`[server] Listening at http://localhost:${PORT}`);
});