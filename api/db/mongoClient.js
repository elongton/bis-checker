const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bischecker';
const dbName = "wow_gear";

let client;
let db;

async function connect() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

module.exports = { connect };