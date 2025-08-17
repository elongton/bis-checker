const fs = require("fs");
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const dbName = "wow_gear";
const collectionName = "gearLibrary";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);
  const col = db.collection(collectionName);

  // Optional: Clean up previous entries
  await col.deleteMany({});

  // Load and transform the JSON
  const rawData = fs.readFileSync("gear_library.json");
  const data = JSON.parse(rawData);

  const docs = [];

  for (const className of Object.keys(data)) {
    const specs = data[className];
    for (const specName of Object.keys(specs)) {
      const slots = specs[specName];
      docs.push({
        class: className,
        spec: specName,
        slots: slots || {}  // Empty object if no slots yet
      });
    }
  }

  // Insert into MongoDB
  await col.insertMany(docs);
  console.log(`Inserted ${docs.length} documents.`);

  await client.close();
}

run().catch(console.error);