// blizzard.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const { connect } = require("../db/mongoClient");
const { getGuildRoster, fetchItemFromBlizzard, fetchItemMediaUrlFromBlizzard, getCharacterAppearance } = require("../controllers/blizzardController");





router.get("/character-appearance/:name", async (req, res) => {
  try {
    const characterName = (req.params.name || "").toString().trim(); 
    if (!characterName) return res.status(400).json({ error: "bad_name" });
    const data = await getCharacterAppearance(characterName);
    res.json(data);
  } catch (err) {
    console.error(err);
    const code = err.response?.status || 500; 
    res.status(code).json({ error: "blizzard_proxy_failed", detail: err.message });
  }
});

//unused in this file, but might be useful later
router.get("/guild-roster", async (req, res) => {
  try {
    const data = await getGuildRoster();  
    res.json(data);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "blizzard_proxy_failed", detail: err.message });
  }
});


router.get("/item-search", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const limit = Math.min(parseInt(req.query.limit || "5", 10), 20);
    if (!q) return res.json([]);
    const token = await getAccessToken();
    const namespace = `static-classic-${REGION}`;
    const locale = process.env.BLIZZ_LOCALE || "en_US";
    const url = `${API_BASE}/data/wow/search/item`;
    const params = {
      namespace,
      "name.en_US": q,
      orderby: "id:_asc",
      _page: 1,
      _pageSize: limit,
    };
    const headers = { Authorization: `Bearer ${token}` };
    const r = await axios.get(url, { params, headers, timeout: 10000 });
    const items = (r.data?.results || []).map((ent) => ({
      id: ent.data?.id,
      name:
        ent.data?.name?.[locale] ||
        ent.data?.name?.en_US ||
        ent.data?.name ||
        `Item ${ent.data?.id}`,
    }));
    res.json(items);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "blizzard_proxy_failed", detail: err.message });
  }
});

router.get("/item/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!/^[0-9]+$/.test(id)) return res.status(400).json({ error: "bad_id" });
    const data = await fetchItemFromBlizzard(id);
    const locale = process.env.BLIZZ_LOCALE || "en_US";
    const name =
      typeof data.name === "string"
        ? data.name
        : data.name?.[locale] || data.name?.en_US || "";
    res.json({ id: data.id, name });
  } catch (err) {
    console.error(err);
    const code = err.response?.status || 500;
    res
      .status(code)
      .json({ error: "blizzard_item_failed", detail: err.message });
  }
});
// ----------------------------------------

// ---------- NEW: GET /item-image?gearId=12345 ----------
/**
 * Response shape:
 *   { gearId: number, imageUrl: string, source: 'mongo' | 'blizzard' }
 */
router.get("/item-image/:id", async (req, res) => {
  try {
    const gearIdRaw = (req.params.id || "").toString().trim();
    if (!/^[0-9]+$/.test(gearIdRaw)) {
      return res
        .status(400)
        .json({ error: "bad_gearId", detail: "gearId must be a number" });
    }
    const gearId = Number(gearIdRaw);

    const db = await connect();
    const col = db.collection("gearData");

    // You might already store docs with different shape.
    // This code expects something like:
    // { gearId: <number>, imageUrl: <string>, ... }
    let doc = await col.findOne({ gearId });

    if (doc?.imageUrl) {
      return res.json({ gearId, imageUrl: doc.imageUrl, source: "mongo" });
    }

    // 2) Fetch from Blizzard (item + media)
    // (Borrowing logic from /item/:id)
    // We don't really need the item "name" here, but fetching item first mirrors your flow.
    await fetchItemFromBlizzard(gearId); // will throw if not found

    // 3) Pull static image URL from media endpoint
    const imageUrl = await fetchItemMediaUrlFromBlizzard(gearId);

    // 4) Upsert into Mongo
    const now = new Date();
    await col.updateOne(
      { gearId },
      {
        $set: {
          gearId,
          imageUrl,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    // 5) Return the static image url
    return res.json({ gearId, imageUrl, source: "blizzard" });
  } catch (err) {
    console.error(err);
    const code = err.response?.status || 500;
    res.status(code).json({ error: "item_image_failed", detail: err.message });
  }
});
// -------------------------------------------------------

module.exports = router;
