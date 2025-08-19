const express = require("express");
const router = express.Router();
const { connect } = require("../db/mongoClient");

function parseItemString(itemString) {
  const match = itemString.match(/\|Hitem:(\d+).*?\|h\[([^\]]+)\]/);
  if (!match) return null;
  return {
    id: parseInt(match[1], 10),
    name: match[2],
  };
}

function extractPlayersFromLua(luaText) {
  const players = [];

  const parseItemString = (itemString) => {
    const match = itemString.match(/\|Hitem:(\d+).*?\|h\[([^\]]+)\]/);
    return match ? { id: parseInt(match[1], 10), name: match[2] } : null;
  };

  const playerStartRegex = /\["Player-[^"]+"\] = \{/g;
  let match;

  while ((match = playerStartRegex.exec(luaText)) !== null) {
    const startIndex = match.index;
    let openBraces = 1;
    let endIndex = startIndex + match[0].length;

    while (endIndex < luaText.length && openBraces > 0) {
      const char = luaText[endIndex];
      if (char === "{") openBraces++;
      else if (char === "}") openBraces--;
      endIndex++;
    }

    const block = luaText.slice(startIndex, endIndex);
    const nameMatch = block.match(/\["name"\] = "([^"]+)"/);
    const classMatch = block.match(/\["class"\] = "([^"]+)"/);
    const lastSeenMatch = block.match(/\["lastSeen"\] = (\d+)/);
    const itemsBlockMatch = block.match(/\["items"\] = \{([\s\S]*?)^\s*}/m);

    if (!nameMatch || !classMatch || !lastSeenMatch || !itemsBlockMatch)
      continue;

    const name = nameMatch[1];
    const playerClass = classMatch[1];
    const lastSeen = new Date(Number(lastSeenMatch[1]) * 1000).toISOString();
    const itemsRaw = itemsBlockMatch[1];

    const items = {};
    const itemLineRegex = /\["([^"]+)"\] = "([^"]+)"/g;
    let itemMatch;
    while ((itemMatch = itemLineRegex.exec(itemsRaw)) !== null) {
      const [, slot, itemStr] = itemMatch;
      const parsed = parseItemString(itemStr);
      if (parsed) {
        if (!items[slot]) items[slot] = [];
        items[slot].push(parsed);
      }
    }

    players.push({ name, class: playerClass, lastSeen, items });
  }

  return players;
}

function mergeItemArrays(existing, incoming) {
  const merged = [...(existing || []), ...(incoming || [])];
  const seen = new Set();
  return merged.filter((item) => {
    const key = `${item.id}-${item.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function upsertPlayers(players) {
  const db = await connect();
  const collection = db.collection("players");

  for (const player of players) {
    const { name, class: playerClass, lastSeen, items } = player;

    const existing = await collection.findOne({ name });

    const update = {
      $setOnInsert: {
        name,
        class: playerClass,
        spec: "", // add default spec
        core: false, // add default core
      },
      $set: {},
    };

    if (existing) {
      // Compare lastSeen
      const updatedLastSeen =
        new Date(lastSeen) > new Date(existing.lastSeen)
          ? lastSeen
          : existing.lastSeen;

      // Merge items
      const updatedItems = { ...existing.items };
      for (const slot of Object.keys(items)) {
        updatedItems[slot] = mergeItemArrays(updatedItems[slot], items[slot]);
      }

      update.$set.items = updatedItems;
      update.$set.lastSeen = updatedLastSeen;
    } else {
      // New player
      update.$set.items = items;
      update.$set.lastSeen = lastSeen;
    }

    await collection.updateOne({ name }, update, { upsert: true });
  }
}

router.post(
  "/",
  express.text({ type: "*/*", limit: "2mb" }),
  async (req, res) => {
    const luaText = req.body;
    if (typeof luaText !== "string") {
      return res
        .status(400)
        .json({ error: "Expected raw Lua file text in the body" });
    }

    try {
      const players = extractPlayersFromLua(luaText);
      // res.json(players)
      await upsertPlayers(players);
      res.json({ message: "Players processed", count: players.length });
    } catch (error) {
      console.error("Error parsing Lua file:", error);
      res.status(500).json({ error: "Failed to parse players" });
    }
  }
);

router.get("/:className", async (req, res) => {
  const className = req.params.className.toUpperCase();

  try {
    const db = await connect();
    const collection = db.collection("players");
    const players = await collection
      .find({ class: { $regex: `^${className}$`, $options: "i" } })
      .sort({ name: 1 })
      .toArray();

    res.json(players);
  } catch (err) {
    console.error("Failed to fetch players by class:", err);
    res.status(500).json({ error: "Failed to retrieve players" });
  }
});

router.patch("/:name/spec", async (req, res) => {
  const playerName = req.params.name;
  const newSpec = req.body.spec;
  if (typeof newSpec !== "string" || newSpec.trim() === "") {
    return res.status(400).json({ error: "spec must be a non-empty string" });
  }

  try {
    const db = await connect();
    const collection = db.collection("players");

    const result = await collection.findOneAndUpdate(
      { name: playerName },
      { $set: { spec: newSpec.trim() } },
      { returnOriginal: false }
    );

    if (!result) {
      return res
        .status(404)
        .json({ error: `Player '${playerName}' not found` });
    }

    res.json(result);
  } catch (err) {
    console.error("Failed to update player spec:", err);
    res.status(500).json({ error: "Failed to update spec" });
  }
});

router.get("/", async (req, res) => {
  try {
    const db = await connect();
    const collection = db.collection("players");
    const players = await collection.find({}).sort({ name: 1 }).toArray();
    res.json(players);
  } catch (err) {
    console.error("Failed to fetch all players:", err);
    res.status(500).json({ error: "Failed to retrieve players" });
  }
});

router.patch("/:name/core", async (req, res) => {
  const playerName = req.params.name;
  const { core } = req.body;

  if (typeof core !== "boolean") {
    return res.status(400).json({ error: "`core` must be a boolean" });
  }

  try {
    const db = await connect();
    const collection = db.collection("players");

    const result = await collection.findOneAndUpdate(
      { name: playerName },
      { $set: { core } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res
        .status(404)
        .json({ error: `Player '${playerName}' not found` });
    }

    res.json(result);
  } catch (err) {
    console.error("Failed to update core status:", err);
    res.status(500).json({ error: "Failed to update core status" });
  }
});

router.get("/:name/details", async (req, res) => {
  const playerName = req.params.name;

  try {
    const db = await connect();
    const collection = db.collection("players");
    const player = await collection.findOne({ name: playerName });

    if (!player) {
      return res
        .status(404)
        .json({ error: `Player '${playerName}' not found` });
    }

    res.json(player);
  } catch (err) {
    console.error("Failed to fetch player details:", err);
    res.status(500).json({ error: "Failed to retrieve player details" });
  }
});

module.exports = router;
