/* Blizzard Classic API proxy with item lookup by ID */
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const { LRUCache } = require('lru-cache');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const REGION = process.env.BLIZZ_REGION || 'us';
const API_BASE = `https://${REGION}.api.blizzard.com`;
const TOKEN_URL = `https://oauth.battle.net/token`;

const tokenCache = new LRUCache({ max: 1, ttl: 3300 * 1000 }); // ~55m
async function getAccessToken() {
  const cached = tokenCache.get('token');
  if (cached) return cached;
  const clientId = process.env.BLIZZ_CLIENT_ID;
  const clientSecret = process.env.BLIZZ_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing BLIZZ_CLIENT_ID/BLIZZ_CLIENT_SECRET');
  const resp = await axios.post(TOKEN_URL, new URLSearchParams({ grant_type: 'client_credentials' }), {
    auth: { username: clientId, password: clientSecret },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  const token = resp.data.access_token;
  tokenCache.set('token', token);
  return token;
}

// Optional: name search retained (not used by UI now)
app.get('/api/blizzard/item-search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit || '5', 10), 20);
    if (!q) return res.json([]);
    const token = await getAccessToken();
    const namespace = `static-classic-${REGION}`;
    const locale = process.env.BLIZZ_LOCALE || 'en_US';
    const url = `${API_BASE}/data/wow/search/item`;
    const params = {
      namespace,
      'name.en_US': q,
      orderby: 'id:_asc',
      _page: 1,
      _pageSize: limit
    };
    const headers = {
      Authorization: `Bearer ${token}`,
      'Battlenet-Namespace': namespace
    };
    const r = await axios.get(url, { params, headers });
    const items = (r.data?.results || []).map(ent => ({
      id: ent.data?.id,
      name: ent.data?.name?.[locale] || ent.data?.name?.en_US || ent.data?.name || `Item ${ent.data?.id}`
    }));
    res.json(items);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'blizzard_proxy_failed', detail: err.message });
  }
});

// Item by ID for Classic: GET /api/blizzard/item/:id
app.get('/api/blizzard/item/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!/^[0-9]+$/.test(id)) return res.status(400).json({ error: 'bad_id' });
    const token = await getAccessToken();
    const namespace = `static-classic-${REGION}`;
    const locale = process.env.BLIZZ_LOCALE || 'en_US';
    const url = `${API_BASE}/data/wow/item/${id}`;
    const params = { namespace, locale };
    const headers = { Authorization: `Bearer ${token}` };
    const r = await axios.get(url, { params, headers });
    const data = r.data || {};
    // Some responses return name as a string (localized by locale param), some as map; support both.
    const name = (typeof data.name === 'string') ? data.name : (data.name?.[locale] || data.name?.en_US || '');
    res.json({ id: data.id, name });
  } catch (err) {
    console.error(err.response?.data || err.message);
    const code = err.response?.status || 500;
    res.status(code).json({ error: 'blizzard_item_failed', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[blizzard-proxy] listening on http://localhost:${PORT}`);
});
