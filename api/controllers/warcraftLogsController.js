const axios = require("axios");
const qs = require("querystring");

const WCL_OAUTH_URL = "https://www.warcraftlogs.com/oauth/token";
const WCL_API_URL = "https://www.warcraftlogs.com/api/v2/client";
// Warcraft Logs GraphQL endpoint
const CLIENT_ID = process.env.WCL_CLIENT_ID;
const CLIENT_SECRET = process.env.WCL_CLIENT_SECRET;

// In-memory cache
let cachedToken = null;      // string
let tokenExpiresAt = 0;      // ms epoch
let inflight = null;         // Promise<string> for deduping concurrent callers

// Refresh 60s before actual expiry (buffer)
const SKEW_BUFFER_MS = 60 * 1000;

function isTokenValid() {
    return cachedToken && Date.now() < (tokenExpiresAt - SKEW_BUFFER_MS);
}

async function fetchToken() {
    const response = await axios.post(
        WCL_OAUTH_URL,
        qs.stringify({ grant_type: "client_credentials" }),
        {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            auth: {
                username: CLIENT_ID,
                password: CLIENT_SECRET,
            },
            timeout: 10_000,
        }
    );

    const { access_token, expires_in } = response.data; // expires_in is seconds
    cachedToken = access_token;
    tokenExpiresAt = Date.now() + (Number(expires_in) * 1000);
    return cachedToken;
}

/**
 * Get a valid WCL access token, using an in-memory cache.
 * Ensures only one network request is made if multiple callers arrive simultaneously.
 */
async function getWclToken() {
    if (isTokenValid()) return cachedToken;

    // If a refresh is already happening, await it
    if (inflight) return inflight;

    // Start a fresh fetch; ensure we clear inflight no matter what
    inflight = (async () => {
        try {
            return await fetchToken();
        } finally {
            inflight = null;
        }
    })();

    return inflight;
}

// You’ll need a client access token from WCL OAuth
// Generate via client_id + client_secret and store in .env

async function getGuildAttendance(guildId, page = 1) {
    const WCL_TOKEN = await getWclToken();
    const query = `
    query GuildAttendance($guildId: Int!, $page: Int!) {
      guildData {
        guild(id: $guildId) {
          name
          attendance(page: $page) {
            has_more_pages
            data {
              zone {
                name
              }
              code
              startTime
              players {
                name
                presence
              }
            }
          }
        }
      }
    }
  `;

    try {
        const response = await axios.post(
            WCL_API_URL,
            {
                query,
                variables: { guildId, page },
            },
            {
                headers: {
                    Authorization: `Bearer ${WCL_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data.data;
    } catch (error) {
        console.error("Error fetching guild attendance:", error.response?.data || error.message);
        throw error;
    }
}

module.exports = { getGuildAttendance };
