const axios = require("axios");
const { LRUCache } = require("lru-cache");
const tokenCache = new LRUCache({ max: 1, ttl: 3300 * 1000 });

const REGION = process.env.BLIZZ_REGION || "us";
const API_BASE = `https://${REGION}.api.blizzard.com`;
const TOKEN_URL = `https://oauth.battle.net/token`;



async function getAccessToken() {
    const cached = tokenCache.get("token");
    if (cached) return cached;
    const clientId = process.env.BLIZZ_CLIENT_ID;
    const clientSecret = process.env.BLIZZ_CLIENT_SECRET;
    const resp = await axios.post(
        TOKEN_URL,
        new URLSearchParams({ grant_type: "client_credentials" }),
        {
            auth: { username: clientId, password: clientSecret },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 10000,
        }
    );
    const token = resp.data.access_token;
    tokenCache.set("token", token);
    return token;
}


async function getGuildRoster() {
    const token = await getAccessToken();
    const namespace = `profile-classic1x-${REGION}`;
    const locale = process.env.BLIZZ_LOCALE || "en_US";
    const url = `${API_BASE}/data/wow/guild/nightslayer/c-r-a-s-h-o-u-t/roster`;
    const params = { namespace, locale };
    const headers = { Authorization: `Bearer ${token}` };
    const r = await axios.get(url, { params, headers, timeout: 10000 });
    return r.data;
}


async function getCharacterAppearance(characterName) {
    const token = await getAccessToken();
    const namespace = `profile-classic1x-${REGION}`;
    const locale = process.env.BLIZZ_LOCALE || "en_US";
    const url = `${API_BASE}/profile/wow/character/nightslayer/${characterName.toLowerCase()}/character-media`
    const params = { namespace, locale };
    const headers = { Authorization: `Bearer ${token}` };
    const r = await axios.get(url, { params, headers, timeout: 10000 });
    return r.data;
}


async function getCharacterGear(characterName) {
    const name = characterName.toLowerCase();
    const token = await getAccessToken();
    const namespace = `profile-classic1x-${REGION}`;
    const locale = process.env.BLIZZ_LOCALE || "en_US";
    const url = `${API_BASE}/profile/wow/character/nightslayer/${name}/equipment`
    const params = { namespace, locale };
    const headers = { Authorization: `Bearer ${token}` };
    const r = await axios.get(url, { params, headers, timeout: 10000 });
    return r.data;
}



async function fetchItemFromBlizzard(id) {
    const token = await getAccessToken();
    const namespace = `static-classic-${REGION}`;
    const locale = process.env.BLIZZ_LOCALE || "en_US";
    const url = `${API_BASE}/data/wow/item/${id}`;
    const params = { namespace, locale };
    const headers = { Authorization: `Bearer ${token}` };
    const r = await axios.get(url, { params, headers, timeout: 10000 });
    return r.data;
}

async function fetchItemMediaUrlFromBlizzard(id) {
    // Media for items is usually at /data/wow/media/item/{id}
    const token = await getAccessToken();
    const namespace = `static-classic-${REGION}`;
    const url = `${API_BASE}/data/wow/media/item/${id}`;
    const headers = { Authorization: `Bearer ${token}` };
    const params = { namespace };
    const r = await axios.get(url, { params, headers, timeout: 10000 });

    // Try to find the best asset url (type can vary by endpoint; often 'icon' or first asset)
    const assets = r?.data?.assets || [];
    const iconAsset =
        assets.find((a) => (a.key || a.type) === "icon") ||
        assets.find((a) => (a.key || a.type) === "image") ||
        assets[0];

    const imageUrl = iconAsset?.value;
    if (!imageUrl) throw new Error("media_url_not_found");
    return imageUrl;
}




module.exports = {
    getGuildRoster,
    fetchItemFromBlizzard,
    fetchItemMediaUrlFromBlizzard,
    getCharacterAppearance,
    getCharacterGear,
};
