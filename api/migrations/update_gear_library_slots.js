// migrate-gearLibrary-slots-bis.js
// Usage:
//   MONGO_URI="mongodb://localhost:27017" DB_NAME="yourDb" node migrate-gearLibrary-slots-bis.js
// Optional:
//   COLLECTION_NAME=gearLibrary
//   DRY_RUN=true         # print changes only
//   BACKUP_ORIGINAL=true # keep slots_legacy copy on first run

const { MongoClient } = require("mongodb");

const {
  MONGO_URI = 'mongodb://127.0.0.1:27017/bischecker',
  DB_NAME = "wow_gear",
  COLLECTION_NAME = "gearLibrary",
  DRY_RUN = "false",
  BACKUP_ORIGINAL = "false",
} = process.env;

const TARGET_KEYS = [
  "HEAD","NECK","SHOULDER","SHIRT","CHEST","WAIST","LEGS","FEET","WRIST","HANDS",
  "FINGER_1","FINGER_2","TRINKET_1","TRINKET_2","BACK","MAIN_HAND","OFF_HAND","RANGED","TABARD"
];

const oldToNew = {
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
  TwoHandSlot: "MAIN_HAND",       // merged into MAIN_HAND
  SecondaryHandSlot: "OFF_HAND",
  RangedSlot: "RANGED",
  TabardSlot: "TABARD",
};

function ensureBisObject(v) {
  // Accepts:
  // - undefined / missing -> {HARD_BIS:[], SOFT_BIS:[]}
  // - array -> SOFT_BIS=array, HARD_BIS=[]
  // - object with HARD_BIS/SOFT_BIS arrays -> normalized
  const empty = { HARD_BIS: [], SOFT_BIS: [] };
  if (!v) return empty;

  // already in final shape?
  if (typeof v === "object" && !Array.isArray(v) &&
      Array.isArray(v.HARD_BIS) && Array.isArray(v.SOFT_BIS)) {
    return { HARD_BIS: dedupeById(v.HARD_BIS), SOFT_BIS: dedupeById(v.SOFT_BIS) };
  }

  // legacy array -> place into SOFT_BIS
  if (Array.isArray(v)) return { HARD_BIS: [], SOFT_BIS: dedupeById(v) };

  // unknown object shape: try to read arrays or default
  const HARD_BIS = Array.isArray(v.HARD_BIS) ? v.HARD_BIS : [];
  const SOFT_BIS = Array.isArray(v.SOFT_BIS) ? v.SOFT_BIS : [];
  if (HARD_BIS.length || SOFT_BIS.length) {
    return { HARD_BIS: dedupeById(HARD_BIS), SOFT_BIS: dedupeById(SOFT_BIS) };
  }
  return empty;
}

function dedupeById(arr = []) {
  const seen = new Set();
  const out = [];
  for (const it of arr) {
    const key = it && typeof it === "object" ? it.id : JSON.stringify(it);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}

function mergeBisObjects(a, b) {
  // Merge two {HARD_BIS, SOFT_BIS} objects (concat + dedupe)
  return {
    HARD_BIS: dedupeById([...(a?.HARD_BIS || []), ...(b?.HARD_BIS || [])]),
    SOFT_BIS: dedupeById([...(a?.SOFT_BIS || []), ...(b?.SOFT_BIS || [])]),
  };
}

async function run() {
  const client = new MongoClient(MONGO_URI);
  const dryRun = DRY_RUN.toLowerCase() === "true";
  const backup = BACKUP_ORIGINAL.toLowerCase() === "true";

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION_NAME);

    const cursor = col.find({});
    let examined = 0;
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      examined++;

      const originalSlots = doc.slots || {};

      // Start with empty BIS objects for all target keys
      const newSlots = Object.fromEntries(
        TARGET_KEYS.map(k => [k, { HARD_BIS: [], SOFT_BIS: [] }])
      );

      // First pass: map legacy keys → new keys (arrays become SOFT_BIS)
      for (const [legacyKey, value] of Object.entries(originalSlots)) {
        const mapped = oldToNew[legacyKey];
        if (!mapped) continue; // drop unknowns

        const asBis = ensureBisObject(value);
        // MAIN_HAND special handling will merge TwoHandSlot+MainHandSlot naturally via merge
        newSlots[mapped] = mergeBisObjects(newSlots[mapped], asBis);
      }

      // Guarantee all keys exist in final shape
      for (const k of TARGET_KEYS) {
        newSlots[k] = ensureBisObject(newSlots[k]);
      }

      if (dryRun) {
        const counts = Object.fromEntries(
          Object.entries(newSlots).map(([k, v]) => [
            k, { HARD: v.HARD_BIS.length, SOFT: v.SOFT_BIS.length }
          ])
        );
        console.log(`-- DRY RUN would update _id=${doc._id} class=${doc.class} spec=${doc.spec}`);
        console.log(counts);
        continue;
      }

      const update = { $set: { slots: newSlots } };
      if (backup && !doc.slots_legacy) update.$set.slots_legacy = originalSlots;

      await col.updateOne({ _id: doc._id }, update);
      updated++;
    }

    console.log(`Examined: ${examined}`);
    if (!dryRun) console.log(`Updated:  ${updated}`);
    else console.log(`No writes performed (dry run).`);
  } catch (e) {
    console.error("Migration failed:", e);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
