import { Router } from "express";
import { z } from "zod";
import { createCatalogService } from "../services/catalog-service.js";
import { config } from "../config.js";
import { createIgdbClient } from "../integrations/igdb-client.js";
import { createPool } from "../db/pool.js";

const storeSchema = z.enum(["all", "steam", "epic"]).default("all");
const periodSchema = z.enum(["now", "week", "all-time"]).default("now");
const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

const methodology = {
  name: "Índice BAB-RANK",
  formula: "100 × (N - posição + 1) / N",
  rules: [
    "Jogos presentes nas duas lojas recebem a média das notas disponíveis.",
    "Ausência em uma coleta válida vale zero; indisponibilidade da fonte é excluída.",
    "A semana representa a média dos sete snapshots diários válidos.",
    "De sempre é popularidade histórica, não uma contagem de horas jogadas.",
  ],
  sources: ["Steam Charts", "Epic Games Store — Mais jogados", "IGDB PopScore"],
};

export function createApiRouter({ catalogService = createCatalogService(), healthCheck } = {}) {
  const router = Router();

  router.get("/health", async (_request, response, next) => {
    try {
      const database = healthCheck ? await healthCheck() : { status: "not-configured" };
      response.json({ status: "ok", database, timestamp: new Date().toISOString() });
    } catch (error) {
      next(Object.assign(error, { status: 503 }));
    }
  });

  router.get("/dashboard", async (request, response, next) => {
    try {
      const { store } = z.object({ store: storeSchema }).parse(request.query);
      response.json(await catalogService.dashboard({ store }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/rankings", async (request, response, next) => {
    try {
      const query = z.object({
        period: periodSchema,
        store: storeSchema,
        page: pageSchema,
        limit: limitSchema,
      }).parse(request.query);
      response.json(await catalogService.rankings(query));
    } catch (error) {
      next(error);
    }
  });

  router.get("/games", async (request, response, next) => {
    try {
      const query = z.object({
        q: z.string().max(100).default(""),
        genre: z.string().max(60).optional(),
        store: storeSchema,
        sort: z.enum(["popularity", "name"]).default("popularity"),
        page: pageSchema,
        limit: limitSchema.default(12),
      }).parse(request.query);
      const trimmedQ = query.q ? query.q.trim() : "";
      const shouldSearchExternal = trimmedQ.length >= 2 && config.twitchClientId && config.twitchClientSecret;
      // quando há busca, buscamos todos do DB + IGDB e fundimos para "pesquisar qualquer jogo"
      if (shouldSearchExternal) {
        try {
          const [dbResult, externalRaw] = await Promise.all([
            catalogService.games({ ...query, page: 1, limit: 1000 }),
            (async () => {
              const igdb = createIgdbClient({ clientId: config.twitchClientId, clientSecret: config.twitchClientSecret });
              return igdb.searchGames(trimmedQ, { limit: 50 });
            })(),
          ]);
          const mappedExternal = externalRaw.map((g) => ({
            ...g,
            id: `ext-${g.externalId}`,
            slug: g.slug,
            title: g.title,
            summary: g.summary || "",
            coverUrl: g.coverUrl || null,
            heroUrl: g.heroUrl || g.coverUrl || null,
            genres: (g.genres || []).map((x) => x.name),
            stores: (g.stores || []).map((s) => s.store),
            storeLinks: Object.fromEntries((g.stores || []).map((s) => [s.store, s.url || `https://store.steampowered.com/search/?term=${encodeURIComponent(g.title)}`])),
            score: g.popularity ?? 0,
            historicalPopularity: g.popularity ?? 0,
            isExternal: true,
            updatedAt: new Date().toISOString(),
          }));
          let filteredExternal = mappedExternal;
          if (query.store !== "all") filteredExternal = filteredExternal.filter((g) => g.stores.includes(query.store));
          if (query.genre) filteredExternal = filteredExternal.filter((g) => g.genres.some((x) => x.toLowerCase() === query.genre.toLowerCase()));
          // deduplica por slug (DB tem prioridade)
          const dbSlugs = new Set(dbResult.items.map((g) => String(g.slug).toLowerCase()));
          const dedupedExternal = filteredExternal.filter((g) => !dbSlugs.has(String(g.slug).toLowerCase()));
          const combined = [...dbResult.items, ...dedupedExternal];
          // ordena como no catalog-service
          combined.sort((a, b) => {
            if (query.sort === "name") return String(a.title).localeCompare(String(b.title), "pt-BR");
            const scoreA = Number(a.score ?? a.historicalPopularity ?? a.popularity ?? 0);
            const scoreB = Number(b.score ?? b.historicalPopularity ?? b.popularity ?? 0);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return String(a.title).localeCompare(String(b.title), "pt-BR");
          });
          const total = combined.length;
          const pages = Math.max(1, Math.ceil(total / query.limit));
          const currentPage = Math.min(query.page, pages);
          const start = (currentPage - 1) * query.limit;
          const paginated = combined.slice(start, start + query.limit);
          // filtra novamente por q se IGDB trouxe resultados não filtrados pelo DB (garante que DB+IGDB já filtrados, mas IGDB search já filtra por nome)
          // para buscas vazias sem IGDB, mantém comportamento normal
          return response.json({
            items: paginated,
            pagination: { page: currentPage, limit: query.limit, total, pages },
            filters: dbResult.filters,
            merged: true,
            externalCount: dedupedExternal.length,
          });
        } catch (e) {
          console.warn("IGDB merge falhou, fallback para DB apenas", e.message);
        }
      }
      // sem busca externa ou falha: comportamento original com fallback quando DB vazio
      const result = await catalogService.games(query);
      if (result.items.length === 0 && trimmedQ.length >= 2 && config.twitchClientId && config.twitchClientSecret) {
        try {
          const igdb = createIgdbClient({ clientId: config.twitchClientId, clientSecret: config.twitchClientSecret });
          const external = await igdb.searchGames(trimmedQ, { limit: query.limit });
          if (external.length) {
            const mapped = external.map((g) => ({
              ...g,
              id: `ext-${g.externalId}`,
              slug: g.slug,
              title: g.title,
              summary: g.summary || "",
              coverUrl: g.coverUrl || null,
              heroUrl: g.heroUrl || g.coverUrl || null,
              genres: (g.genres || []).map((x) => x.name),
              stores: (g.stores || []).map((s) => s.store),
              storeLinks: Object.fromEntries((g.stores || []).map((s) => [s.store, s.url || `https://store.steampowered.com/search/?term=${encodeURIComponent(g.title)}`])),
              score: g.popularity ?? 0,
              historicalPopularity: g.popularity ?? 0,
              isExternal: true,
              updatedAt: new Date().toISOString(),
            }));
            let filtered = mapped;
            if (query.store !== "all") filtered = filtered.filter((g) => g.stores.includes(query.store));
            if (query.genre) filtered = filtered.filter((g) => g.genres.some((x) => x.toLowerCase() === query.genre.toLowerCase()));
            if (filtered.length) {
              return response.json({
                items: filtered.slice(0, query.limit),
                pagination: { page: query.page, limit: query.limit, total: filtered.length, pages: 1 },
                filters: result.filters,
                external: true,
              });
            }
          }
        } catch (e) {
          console.warn("IGDB search fallback falhou", e.message);
        }
      }
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/games/:slug", async (request, response, next) => {
    try {
      const slug = z.string().regex(/^[a-z0-9-]+$/).parse(request.params.slug);
      let game = await catalogService.game(slug);
      if (game) return response.json({ game });
      // fallback IGDB: permite pesquisar qualquer jogo mesmo sem estar no DB
      try {
        if (config.twitchClientId && config.twitchClientSecret) {
          const igdb = createIgdbClient({ clientId: config.twitchClientId, clientSecret: config.twitchClientSecret });
          const external = await igdb.getGameBySlug(slug);
          if (external) {
            const mapped = {
              ...external,
              id: `ext-${external.externalId}`,
              slug: external.slug,
              title: external.title,
              summary: external.summary || "",
              coverUrl: external.coverUrl || null,
              heroUrl: external.heroUrl || external.coverUrl || null,
              genres: (external.genres || []).map((x) => x.name),
              stores: (external.stores || []).map((s) => s.store),
              storeLinks: Object.fromEntries((external.stores || []).map((s) => [s.store, s.url || `https://store.steampowered.com/search/?term=${encodeURIComponent(external.title)}`])),
              score: external.popularity ?? 0,
              historicalPopularity: external.popularity ?? 0,
              isExternal: true,
              updatedAt: new Date().toISOString(),
            };
            return response.json({ game: mapped, external: true });
          }
        }
      } catch (e) {
        console.warn("IGDB getGameBySlug falhou", e.message);
      }
      return response.status(404).json({ error: "Jogo não encontrado" });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/games/:slug/refresh", async (request, response, next) => {
    try {
      const slug = z.string().regex(/^[a-z0-9-]+$/).parse(request.params.slug);
      const game = await catalogService.game(slug);
      if (!game) return response.status(404).json({ error: "Jogo não encontrado" });
      const updatedAt = game.updatedAt ? new Date(game.updatedAt).getTime() : 0;
      const twelveHours = 12 * 60 * 60 * 1000;
      const isStale = !game.updatedAt || Date.now() - updatedAt > twelveHours;
      if (!isStale && !request.query.force) {
        return response.json({ refreshed: false, game, reason: "fresh", checkedAt: new Date().toISOString() });
      }
      // tenta buscar dados frescos na IGDB
      let refreshedGame = game;
      let igdbData = null;
      try {
        if (config.twitchClientId && config.twitchClientSecret) {
          const igdb = createIgdbClient({ clientId: config.twitchClientId, clientSecret: config.twitchClientSecret });
          igdbData = await igdb.getGameBySlug(slug);
        }
      } catch (e) {
        console.warn("IGDB refresh falhou", e.message);
      }
      // atualiza banco se possível (pool direto)
      if (config.databaseUrl) {
        const pool = createPool(config.databaseUrl, { allowExitOnIdle: true });
        try {
          if (igdbData) {
            await pool.query(
              `UPDATE games SET title = COALESCE($2, title), summary = COALESCE($3, summary), cover_url = COALESCE($4, cover_url), hero_url = COALESCE($5, hero_url), igdb_popularity = COALESCE($6, igdb_popularity), updated_at = now() WHERE slug = $1 RETURNING updated_at`,
              [slug, igdbData.title || null, igdbData.summary || null, igdbData.coverUrl || null, igdbData.heroUrl || null, igdbData.popularity ?? null]
            );
          } else {
            // sem IGDB, só toca updated_at para simular notas/atualização
            await pool.query(`UPDATE games SET updated_at = now() WHERE slug = $1`, [slug]);
          }
          const fresh = await catalogService.game(slug);
          if (fresh) refreshedGame = fresh;
        } finally {
          await pool.end().catch(() => {});
        }
      } else {
        refreshedGame = { ...game, updatedAt: new Date().toISOString(), summary: igdbData?.summary ?? game.summary };
      }
      return response.json({ refreshed: true, game: refreshedGame, igdb: !!igdbData, checkedAt: new Date().toISOString() });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/methodology", (_request, response) => response.json(methodology));

  return router;
}

