const { connect } = require("../db/mongoClient");
const express = require("express");

async function getFullGearJSON(req, res) {
  try {
    const db = await connect();
    const docs = await db.collection("gearLibrary").find().toArray();
    const output = {};
    for (const doc of docs) {
      if (!output[doc.class]) output[doc.class] = {};
      output[doc.class][doc.spec] = doc.slots || {};
    }
    res.json(output);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to retrieve gear library.", detail: err.message });
  }
}

async function getAllDocuments(req, res) {
  try {
    const db = await connect();
    const docs = await db.collection("gearLibrary").find().toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).json({
      error: "Failed to retrieve all gear entries.",
      detail: err.message,
    });
  }
}

async function updateSlot(req, res) {
  const username = req.headers["x-discord-username"] || "unknown";
  const timestamp = new Date().toISOString();

  const { class: className, spec, slot } = req.params;
  const newItemsArray = req.body;
  const db = await connect();
  const collection = db.collection("gearLibrary");

  const previous = await collection.findOne({ class: className, spec });

  await db.collection("gearLogs").insertOne({
    timestamp,
    username,
    class: className,
    spec,
    previousSlots: previous?.slots || {},
    updatedSlots: { [slot]: newItemsArray },
  });

  if (!Array.isArray(newItemsArray)) {
    return res.status(400).json({ error: "Body must be an array of items." });
  }

  try {
    const db = await connect();
    const result = await db
      .collection("gearLibrary")
      .updateOne(
        { class: className, spec: spec },
        { $set: { [`slots.${slot}`]: newItemsArray } }
      );
    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ error: "Class/spec combination not found." });
    }
    res.json({ message: "Slot updated successfully." });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update slot.", detail: err.message });
  }
}

async function replaceGearLibrary(req, res) {
  const fullGearData = req.body;
  if (typeof fullGearData !== "object" || Array.isArray(fullGearData)) {
    return res
      .status(400)
      .json({ error: "Body must be an object with class/spec structure." });
  }

  try {
    const db = await connect();
    const bulkDocs = [];
    for (const className of Object.keys(fullGearData)) {
      const specs = fullGearData[className];
      for (const specName of Object.keys(specs)) {
        bulkDocs.push({
          class: className,
          spec: specName,
          slots: specs[specName],
        });
      }
    }

    await db.collection("gearLibrary").deleteMany({});
    await db.collection("gearLibrary").insertMany(bulkDocs);
    res.json({
      message: `Replaced gear library with ${bulkDocs.length} entries.`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to replace gear library.", detail: err.message });
  }
}

async function logAndUpdateSpec(req, res) {
  const username = req.headers["x-discord-username"] || "unknown";
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
  });
  const gear = req.body;
  if (typeof gear !== "object" || Array.isArray(gear)) {
    return res
      .status(400)
      .json({ error: "Body must be an object with class/spec structure." });
  }

  const db = await connect();
  const collection = db.collection("gearLibrary");
  const previousGear = await collection.find().toArray();

  const updatedGear = [];
  for (const className of Object.keys(gear)) {
    const specs = gear[className];
    for (const specName of Object.keys(specs)) {
      updatedGear.push({
        class: className,
        spec: specName,
        slots: specs[specName],
      });
    }
  }

  console.log("Previous Gear:", previousGear[0]);
  console.log("Updated Gear:", updatedGear[0]);

  // Save full updated gear
  await collection.deleteMany({});
  await collection.insertMany(updatedGear);

  // Compare previous and current to find diffs
  const changes = [];

  function findDifferences(prev, curr, path = "") {
    if (Array.isArray(prev) && Array.isArray(curr)) {
      for (let i = 0; i < Math.max(prev.length, curr.length); i++) {
        if ((prev[i]?._id ?? prev[i]?.id) !== (curr[i]?._id ?? curr[i]?.id)) {
          changes.push({
            path,
            before: prev[i]?._id ?? prev[i]?.id ?? null,
            after: curr[i]?._id ?? curr[i]?.id ?? null,
          });
        }
      }
    } else if (typeof prev === "object" && typeof curr === "object") {
      for (const key in prev) {
        if (curr.hasOwnProperty(key)) {
          findDifferences(prev[key], curr[key], path ? `${path}.${key}` : key);
        }
      }
    }
  }

  for (const prevClass of previousGear) {
    const currClass = updatedGear.find(
      (c) => c.class === prevClass.class && c.spec === prevClass.spec
    );
    if (!currClass) continue;

    const prevSlots = prevClass.slots;
    const currSlots = currClass.slots;

    for (const slot in prevSlots) {
      findDifferences(
        prevSlots[slot],
        currSlots[slot],
        `${prevClass.class}.${prevClass.spec}.${slot}`
      );
    }
  }
  // // Log changes
  await db.collection("gearLogs").insertOne({
    timestamp,
    username,
    changes,
  });

  res.status(200).json({ message: "Gear updated and changes logged." });
}

module.exports = {
  logAndUpdateSpec,
  getFullGearJSON,
  getAllDocuments,
  updateSlot,
  replaceGearLibrary,
};
