const express = require('express');
const passport = require("passport");
const router = express.Router();

// Discord auth routes
router.get('/discord', passport.authenticate('discord'));
router.get('/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(`/auth-success?user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

module.exports = router;
