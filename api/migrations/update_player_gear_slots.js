const fs = require("fs");
const { MongoClient } = require("mongodb");

// const uri = "mongodb://localhost:27017";
const uri = 'mongodb://127.0.0.1:27017/bischecker';
const dbName = "wow_gear";

const keyMap = {
  HeadSlot: "HEAD",
  NeckSlot: "NECK",
  ShoulderSlot: "SHOULDER",
  ShirtSlot: "SHIRT",
  ChestSlot: "CHEST",
  WaistSlot: "WAIST",
  LegsSlot: "LEGS",
  FeetSlot: "FEET",
  WristSlot: "WRIST",
  HandsSlot: "HANDS",
  Finger0Slot: "FINGER_1",
  Finger1Slot: "FINGER_2",
  Trinket0Slot: "TRINKET_1",
  Trinket1Slot: "TRINKET_2",
  BackSlot: "BACK",
  MainHandSlot: "MAIN_HAND",
  SecondaryHandSlot: "OFF_HAND",
  RangedSlot: "RANGED",
  TabardSlot: "TABARD",
};

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const players = db.collection("players"); // ⚡ update collection name if different

    const cursor = players.find({});
    while (await cursor.hasNext()) {
      const player = await cursor.next();

      if (!player.items) continue;

      const newItems = {};
      for (const [oldKey, newKey] of Object.entries(keyMap)) {
        if (player.items[oldKey]) {
          newItems[newKey] = player.items[oldKey];
        }
      }

      // overwrite items with new keys
      await players.updateOne(
        { _id: player._id },
        { $set: { items: newItems } }
      );

      console.log(`Updated player ${player.name}`);
    }

    console.log("✅ Migration complete");
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
