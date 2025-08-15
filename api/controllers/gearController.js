const { connect } = require("../db/mongoClient");

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
    res.status(500).json({ error: "Failed to retrieve gear library.", detail: err.message });
  }
}

async function getAllDocuments(req, res) {
  try {
    const db = await connect();
    const docs = await db.collection("gearLibrary").find().toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve all gear entries.", detail: err.message });
  }
}

async function updateSlot(req, res) {
  const { class: className, spec, slot } = req.params;
  const newItemsArray = req.body;
  if (!Array.isArray(newItemsArray)) {
    return res.status(400).json({ error: "Body must be an array of items." });
  }

  try {
    const db = await connect();
    const result = await db.collection("gearLibrary").updateOne(
      { class: className, spec: spec },
      { $set: { [`slots.${slot}`]: newItemsArray } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Class/spec combination not found." });
    }
    res.json({ message: "Slot updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update slot.", detail: err.message });
  }
}

async function replaceGearLibrary(req, res) {
  const fullGearData = req.body;
  if (typeof fullGearData !== "object" || Array.isArray(fullGearData)) {
    return res.status(400).json({ error: "Body must be an object with class/spec structure." });
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
          slots: specs[specName]
        });
      }
    }

    await db.collection("gearLibrary").deleteMany({});
    await db.collection("gearLibrary").insertMany(bulkDocs);
    res.json({ message: `Replaced gear library with ${bulkDocs.length} entries.` });
  } catch (err) {
    res.status(500).json({ error: "Failed to replace gear library.", detail: err.message });
  }
}

module.exports = {
  getFullGearJSON,
  getAllDocuments,
  updateSlot,
  replaceGearLibrary,
};
