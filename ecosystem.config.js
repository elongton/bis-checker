module.exports = {
  apps: [{
    name: 'crashout-app',
    script: './api/server.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
