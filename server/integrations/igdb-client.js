import { requestJson } from "./http.js";
import { normalizeIgdbGame } from "./normalizers.js";

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const API_URL = "https://api.igdb.com/v4";

export function createIgdbClient({ clientId, clientSecret, fetchImpl, now = () => Date.now() } = {}) {
  let token = null;
  let tokenExpiresAt = 0;

  async function accessToken() {
    if (token && now() < tokenExpiresAt - 60_000) return token;
    if (!clientId || !clientSecret) throw new Error("TWITCH_CLIENT_ID e TWITCH_CLIENT_SECRET são obrigatórios para IGDB");
    const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" });
    const response = await requestJson(TOKEN_URL, {
      service: "twitch",
      fetchImpl,
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      retries: 1,
    });
    token = response.access_token;
    tokenExpiresAt = now() + Number(response.expires_in ?? 0) * 1000;
    if (!token) throw new Error("Twitch não retornou access_token");
    return token;
  }

  async function query(endpoint, query) {
    const bearerToken = await accessToken();
    return requestJson(`${API_URL}/${endpoint}`, {
      service: "igdb",
      fetchImpl,
      method: "POST",
      headers: { "Client-ID": clientId, Authorization: `Bearer ${bearerToken}`, Accept: "application/json" },
      body: query,
    });
  }

  return {
    query,
    async listCatalog({ limit = 100, offset = 0, updatedAfter } = {}) {
      const filter = updatedAfter ? ` & updated_at > ${Math.floor(new Date(updatedAfter).getTime() / 1000)}` : "";
      // busca jogos principais populares (hypes) para garantir overlap com Steam/Epic, sem filtrar mods via external_games (tratado no normalizer)
      const result = await query("games", `fields id,name,slug,summary,storyline,first_release_date,rating,aggregated_rating,total_rating,follows,hypes,cover.image_id,screenshots.image_id,genres.id,genres.name,external_games.category,external_games.external_game_source,external_games.uid,game_type; where game_type = 0 & parent_game = null & version_parent = null & hypes > 5${filter}; sort hypes desc; limit ${limit}; offset ${offset};`);
      return result.map(normalizeIgdbGame);
    },
    async listHistoricalPopularity({ limit = 100, offset = 0 } = {}) {
      const result = await query("games", `fields id,name,slug,rating,aggregated_rating,total_rating,follows,hypes,cover.image_id,genres.id,genres.name,external_games.category,external_games.uid; where version_parent = null; sort total_rating desc; limit ${limit}; offset ${offset};`);
      return result.map(normalizeIgdbGame);
    },
    async getGameBySlug(slug) {
      const result = await query("games", `fields id,name,slug,summary,storyline,first_release_date,rating,aggregated_rating,total_rating,follows,hypes,cover.image_id,screenshots.image_id,genres.id,genres.name,external_games.category,external_games.external_game_source,external_games.uid; where slug = "${String(slug).replace(/"/g, '\\"')}" & version_parent = null; limit 1;`);
      return result[0] ? normalizeIgdbGame(result[0]) : null;
    },
    async searchGames(q, { limit = 10 } = {}) {
      const clean = String(q).replace(/"/g, '\\"').trim();
      if (!clean) return [];
      const result = await query("games", `fields id,name,slug,summary,cover.image_id,screenshots.image_id,genres.id,genres.name,external_games.category,external_games.external_game_source,external_games.uid,rating,total_rating; search "${clean}"; limit ${limit};`);
      if (!result.length) {
        const alt = await query("games", `fields id,name,slug,summary,cover.image_id,genres.id,genres.name,external_games.category,external_games.external_game_source,external_games.uid,rating,total_rating; where name ~ "${clean}"* & version_parent = null; limit ${limit};`);
        return alt.map(normalizeIgdbGame);
      }
      return result.map(normalizeIgdbGame);
    },
  };
}
