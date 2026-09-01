# FACULDADE DE TECNOLOGIA DE OURINHOS — FATEC OURINHOS

**Curso:** Análise e Desenvolvimento de Sistemas  
**Disciplina:** Tópicos Especiais em Informática — Projeto Atribuído: Integração Front-End / Back-End / Banco de Dados  
**Professor:** David Silva

---

## BAB-RANK: Evolução do Projeto SteamTwo com Integração PostgreSQL, Docker Compose e APIs Externas

**Autor:** Pedro Emanoel da Silva de Oliveira  
**RA:** 0210482413036

**Ourinhos — 2026**

---

<div style="text-align: center; margin-top: 40px;">
<strong>BAB-RANK</strong><br/>
Evolução do Projeto SteamTwo com Integração PostgreSQL, Docker Compose e APIs Externas<br/><br/>
Pedro Emanoel da Silva de Oliveira<br/>
RA: 0210482413036<br/><br/>
Trabalho apresentado como requisito da disciplina Tópicos Especiais em Informática<br/>
FATEC Ourinhos — 2026<br/>
</div>

---

## FOLHA DE ROSTO

**BAB-RANK** — Catálogo de jogos com dashboard de popularidade da Steam e Epic Games, evoluído a partir de https://github.com/DavidSilvaProg/steamtwo

- **Novo repositório:** `https://github.com/EuSouPedroEmanoel/bab-rank` (privado, criado em 31/08/2026)
- **Pasta local:** `/home/pedro/dev/Fatec/bab-rank`
- **Integrante:** Pedro Emanoel da Silva de Oliveira — RA: 0210482413036
- **Disciplina:** Tópicos Especiais em Informática — FATEC Ourinhos

Trabalho desenvolvido individualmente conforme rubrica de 10 pontos (máximo 5 integrantes, entrega até 23:59). Pasta renomeada de `bab-steam-epic` para `bab-rank` em 31/08/2026, `package.json:2` e `index.html:8` atualizados para `BAB-RANK`.

---

## SUMÁRIO

1. Introdução
2. Referencial Teórico — SteamTwo
3. Metodologia e Integração Back-End / Banco de Dados
4. Melhorias Implementadas (8 itens autorais)
5. Instruções de Execução
6. Testes e Resultados
7. Evidências de Funcionamento (Prints)
8. Conclusão
9. Referências

---

## 1. INTRODUÇÃO

O projeto BAB-RANK evolui o projeto-base SteamTwo, consolidando a integração entre front-end (React/Vite), back-end (Node.js/Express) e banco de dados (PostgreSQL 17), conforme rubrica:

- 3,0 pts — back-end funcionando e integrado ao PostgreSQL
- 3,0 pts — melhorias relevantes autorais
- 2,0 pts — integração, testes e qualidade técnica
- 2,0 pts — PDF completo conforme ABNT (nomes, link, melhorias, prints, integração, instruções, testes)

Requisitos do assignment (24/08 — David Silva):

1. Criar novo repositório no GitHub a partir do projeto-base.
2. Fazer back-end funcionar com PostgreSQL, executar migrações e comprovar integração API/BD/interface.
3. Implementar melhorias autorais (filtros, buscas, dashboard, endpoints, validações, testes, a11y, usabilidade).
4. Testar e registrar evidências.
5. Entregar PDF único por grupo com: nomes + link + melhorias + prints + integração + instruções + testes.

O projeto foi desenvolvido solo, foco prioritário na integração via Docker Compose e população via APIs externas (IGDB, Steam, Epic). Nome alterado de `steamtwo` para `bab-rank` e logo refeita (`BAB RANK` com coroa `Crown weight=fill`).

---

## 2. REFERENCIAL — STEAMTWO

Funcionalidades originais:

- Dashboard com mais jogados agora, média da última semana, popularidade histórica e recorde monitorado
- Catálogo pesquisável e filtrável por loja e gênero
- Ranking combinado transparente: cada posição normalizada por `100 × (N - posição + 1) / N`, índice combinado é média das fontes
- Coleta Steam, Epic Games e IGDB com snapshots imutáveis
- Fallback visual quando PostgreSQL não configurado

Stack: `React 19 + Vite 6` (front em `src/`), `Express 5 + pg 8` (back em `server/`), `node-pg-migrate` (`migrations/001_create_steamtwo_domain.js`), `vitest + supertest`.

Problemas originais corrigidos: banco vazio sem seed; IGDB `popularity` removido da API (400), rankings com ranks duplicados e sem criação de jogos, cast `jsonb_build_object` e distinção Pool vs Client.

---

## 3. INTEGRAÇÃO BACK-END COM BANCO DE DADOS

### 3.1 Arquitetura

```
[Browser] -> [Vite/React em src/ | dist/client] 
          -> [Express server/index.js:14 em :3001 -> BAB-RANK API]
          -> [createPool(DATABASE_URL) server/db/pool.js:6]
          -> [PostgreSQL 17 - postgres:17-alpine]
          -> [Tabelas: games, genres, game_genres, store_listings, sync_runs, ranking_snapshots, ranking_entries, game_rankings]
```

- `server/config.js:6` lê `DATABASE_URL` do `.env`
- `server/index.js:14-27` cria pool e repository; se `DATABASE_URL` ausente, `healthCheck` retorna `{status:"not-configured", mode:"demo"}` (fallback)
- Com DB, `healthCheck` executa `SELECT 1` e `/api/health` retorna `{"status":"ok","database":{"status":"connected"}}` (validado em `curl http://127.0.0.1:3001/api/health` — `docs/evidencia-health.json`)
- **Correção 1 — `server/db/job-repository.js:118`:** `jsonb_build_object('records',$4::int)` — PG17 exigia cast, erro `could not determine data type of parameter $4`
- **Correção 2 — `server/db/job-repository.js:50`:** distinção Pool vs Client via `totalCount` — erro `Client has already been connected`
- **Correção 3 — `server/db/catalog-read-repository.js:32`:** adicionado `g.updated_at AS "updatedAt"` e `mapGame` com `updatedAt`, `GROUP BY` inclui `g.updated_at`
- **Correção 4 — `server/services/catalog-service.js:16`:** `rankingView` usa `game.updatedAt ?? mockUpdatedAt` e `dashboard` usa `latestUpdate` real do banco, não hardcoded `2026-08-24`

### 3.2 Migrações

- `migrations/001_create_steamtwo_domain.js` cria 9 tabelas + 4 enums (`store_name`, `sync_state`, `snapshot_status`, `ranking_period`) + função `steamtwo_prevent_snapshot_mutation()` (snapshots imutáveis, `BEFORE UPDATE OR DELETE`)
- Comandos: `npm run db:migrate` (up) e `npm run db:rollback` (down) — testado: `MIGRATION 001_create_steamtwo_domain (UP)` com `CREATE TABLE` e `Migrations complete!`
- Evidência 01/09/2026: `SELECT name, run_on FROM pgmigrations;` retorna `001_create_steamtwo_domain | 2026-08-31 17:43:54.569241`, `\dt` lista 9 relações, `SELECT count(*) FROM games` = **421** (atualizado, antes 239), `store_listings 333`, `ranking_snapshots 6`, `ranking_entries 172`, `sync_runs 36`

### 3.3 Docker Compose

**Antes (original):** apenas `postgres` em `docker-compose.yml:1` com `5432:5432`

**Depois (BAB-RANK):**

```yaml
services:
  postgres: # postgres:17-alpine, 5433:5432 (host 5433 para evitar conflito com postgres-db em 5432), healthcheck pg_isready, volume external bab-steam-epic_steamtwo_pgdata
  api: # build Dockerfile (node:20-alpine, npm ci + npm run build), 3001:3001, DATABASE_URL=postgres://steamtwo:steamtwo@postgres:5432/steamtwo (interno), depends_on postgres healthy, healthcheck wget /api/health
  migrate: # mesmo build, command npm run db:migrate, depende de postgres healthy
volumes:
  steamtwo_pgdata:
    external: true
    name: bab-steam-epic_steamtwo_pgdata # preserva dados após rename bab-steam-epic -> bab-rank
```

- `Dockerfile` multi-stage: `FROM node:20-alpine`, `npm ci`, `COPY .`, `RUN npm run build` (gera `dist/client/index.html`, `dist/server/index.js`), `EXPOSE 3001`, `HEALTHCHECK wget /api/health`, `CMD ["node","server/index.js"]`
- Host `DATABASE_URL=postgres://steamtwo:steamtwo@localhost:5433/steamtwo` (externo, `.env:3`), container `DATABASE_URL=postgres://steamtwo:steamtwo@postgres:5432/steamtwo` (interno)
- Validação 01/09: `docker compose ps` mostra `bab-rank-postgres-1 healthy` e `bab-rank-api-1 healthy`, `docker logs` mostra `BAB-RANK API disponível na porta 3001` (`docs/evidencia-ps.txt`, `evidencia-logs.txt`)

### 3.4 População via API Externa

Credenciais IGDB em `.env:4-5` com `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET` (não commitado, `.gitignore:4`).

- **Fix IGDB:** `server/integrations/igdb-client.js:44` trocou `popularity` (400 `Invalid field`) por `rating,aggregated_rating,total_rating,follows,hypes` e filtro `external_games.category=(1,26)` para garantir `store_listings`; `normalizers.js:22` fallback para `total_rating`
- **Syncs executados:**
  - `npm run sync:catalog` → 100 jogos (IGDB total_rating desc)
  - `npm run sync:popularity` → 100
  - `npm run sync:rankings` → 139+ (steam 119 + epic 20) com reindex `rank=index+1` (`server/jobs/rankings.js:28`) para evitar `duplicate key ranking_entries_uniq_snapshot_id_position` e auto-criação de `games` faltantes (`job-repository.js:142`)
- **DB atual (01/09/2026 01:53):** `games=421`, `store_listings=333`, `genres=23`, `ranking_snapshots=6`, `ranking_entries=172`, `sync_runs=36`, `game_rankings=0` (view materializada via `game_rankings` ainda vazia, rankings servidos via `ranking_entries`)

---

## 4. MELHORIAS IMPLEMENTADAS

| # | Melhoria | Arquivo:linha | Descrição autoral | Evidência |
|---|----------|---------------|-------------------|-----------|
| 1 | Docker Compose completo | `docker-compose.yml:1`, `Dockerfile:1` | Evoluiu compose de 1 para 3 serviços (postgres+api+migrate), volume external para preservar após rename, `docker compose up --build` reproduzível | `docker compose ps` healthy, `bab-rank-api:1` |
| 2 | Mapeamento porta 5433 + rename | `docker-compose.yml:9`, `.env:3`, `package.json:2` | Evita conflito `postgres-db` 5432, pasta `bab-rank`, `package.json` name `bab-rank`, `index.html:8` title `BAB-RANK` | `docker ps 0.0.0.0:5433->5432` |
| 3 | Logo BAB-RANK | `src/App.jsx:135`, `src/styles.css:12` | Brand `BAB RANK` com `<Crown weight=fill>` azul, `display:inline-flex`, footer `BAB-RANK` | Print `/` header `site-header-overlay` |
| 4 | IGDB fix + população externa | `igdb-client.js:44`, `normalizers.js:22`, `job-repository.js:142` | Corrigiu 400 popularity, filtro Steam/Epic, auto-cria jogos em rankings | `sync:catalog 100`, `games=421` |
| 5 | Top 100 Rankings | `src/App.jsx:249` | Reescrito `Rankings` para `GET /api/rankings?period=&limit=100` com 3 botões (Agora/Semana/De sempre), mostra 100 linhas (antes só 5) | `curl /api/rankings?limit=100` → 100 |
| 6 | Filtro quadro “Última Semana” | `src/App.jsx:153` | Home: `store` só afeta quadro `week` via `GET /api/rankings?period=week&store=...&limit=5`, hero/topFive permanecem `all` (pedido: não mudar tela toda) | Print filtro Steam/Epic no quadro |
| 7 | Banner “Ver mais” 3 linhas | `src/App.jsx:138`, `src/styles.css:32` | `Hero` com `useState expanded`, `.hero-summary.clamped { -webkit-line-clamp:3 }`, botão `Ver mais/Ver menos` | Print banner expandido |
| 8 | Data correta + IGDB global | `catalog-read-repository.js:32`, `catalog-service.js:16`, `src/App.jsx:198` | Backend retorna `updatedAt` real do banco (`g.updated_at`), frontend `Detail` usa `formatDate(game.updatedAt)` em vez de hardcoded `24 de ago. 2026`; busca global `/api/games?q=` com debounce 300ms e fallback IGDB quando desatualizado >12h | `curl /api/games/dcs-world-a-10c-warthog` → `2026-08-31T20:21:10.822Z`, detail `31 de agosto de 2026` |

**Extras (usabilidade/a11y/testes):**

- **Busca global com debounce:** `src/App.jsx:98` e `App.jsx:193` debounce 300ms, `Header` com `suggestions` e `AbortController`, click fora fecha `mousedown` listener
- **Favoritos localStorage:** `src/App.jsx:25` `FAVORITES_KEY="bab-rank:favorites"`, `loadFavorites/saveFavorites`, `toggleFavorite` com `toast` e `BookmarkSimple fill`
- **Acessibilidade:** `Methodology` `App.jsx:388` com `role="dialog"`, `aria-modal`, foco no close, `Esc` fecha e restaura foco anterior; `Header` `aria-label`, `table` rankings com `role="tablist"`
- **Catálogo 24pp + paginação:** `src/App.jsx:189` limit 24, `elapsed` ms, `totalPages`, botões Anterior/Próxima
- **Proxy de imagem + fallback:** `src/lib/imageProxy.js` e `coverFallback.js` com `SafeImage` `onError`

---

## 5. INSTRUÇÕES PARA EXECUTAR O PROJETO

Requisitos: Docker 29+, Node 20+ (via fnm), Git

```bash
# 1. Clonar (ou usar pasta local)
git clone https://github.com/EuSouPedroEmanoel/bab-rank.git
cd bab-rank

# 2. Instalar
fnm exec --using=lts-latest npm install

# 3. Configurar env (não commitar .env)
cp .env.example .env
# Editar: DATABASE_URL=postgres://steamtwo:steamtwo@localhost:5433/steamtwo
#         TWITCH_CLIENT_ID=seu_id
#         TWITCH_CLIENT_SECRET=seu_secret

# 4. Subir banco + api via Docker Compose (recomendado)
docker compose up -d --build
# ou apenas postgres para dev local:
# docker compose up -d postgres

# 5. Migrações
fnm exec --using=lts-latest npm run db:migrate
# Reverter se necessário: fnm exec --using=lts-latest npm run db:rollback

# 6. Popular via API externa
fnm exec --using=lts-latest npm run sync:catalog    # 100 IGDB
fnm exec --using=lts-latest npm run sync:popularity # 100
fnm exec --using=lts-latest npm run sync:rankings   # 139+ Steam/Epic

# 7. Validar integração
curl http://127.0.0.1:3001/api/health
# Esperado: {"status":"ok","database":{"status":"connected"}}

# 8. Dev local (sem Docker api)
fnm exec --using=lts-latest npm run dev:api  # :3001
fnm exec --using=lts-latest npm run dev      # :5173

# 9. Produção via Docker (api serve front)
# Após build, acessar http://127.0.0.1:3001/ e /jogos/dcs-world-a-10c-warthog
```

Frontend: `http://127.0.0.1:3001/` (Docker) ou `http://127.0.0.1:5173/` (Vite dev)  
API: `http://127.0.0.1:3001/api/health`, `/api/games`, `/api/rankings?limit=100`, `/api/dashboard?store=steam|epic`

> **Segurança:** `.env` com `TWITCH_CLIENT_SECRET` está em `.gitignore:4` e nunca commitado. Repositório público contém apenas `.env.example`.

---

## 6. TESTES REALIZADOS E RESULTADOS

| Teste | Comando | Resultado esperado | Resultado observado (01/09/2026 01:53) |
|-------|---------|-------------------|--------------------------------------|
| Migração UP | `npm run db:migrate` | `Migrations complete!` + 9 tabelas | OK — `CREATE TABLE games...` e `Migrations complete!` |
| Migração DOWN/UP | `db:rollback` + `db:migrate` | Reversível | OK — `DROP TABLE` e recriação |
| pgmigrations | `psql -c "SELECT name FROM pgmigrations"` | 1 linha | OK — `001_create_steamtwo_domain | 2026-08-31 17:43:54.569241` |
| \dt | `psql -c "\dt"` | 9 tabelas | OK — `games, genres, game_genres, store_listings, sync_runs, ranking_snapshots, ranking_entries, game_rankings, pgmigrations` |
| Counts | `psql -c "SELECT count(*) FROM games"` | >0 | OK — `games 421`, `store_listings 333`, `ranking_snapshots 6`, `ranking_entries 172` (`docs/evidencia-count.txt`) |
| /api/health | `curl :3001/api/health` | `connected` | OK — `{"status":"ok","database":{"status":"connected"},"timestamp":"2026-09-01T01:53:16.522Z"}` |
| /api/games | `curl :3001/api/games?limit=3` | 200 + pagination | OK — `items[0].slug 3d-starstrike`, `total 421`, `pages 141` |
| /api/games/:slug | `curl :3001/api/games/dcs-world-a-10c-warthog` | 200 + updatedAt | OK — `updatedAt 2026-08-31T20:21:10.822Z` (antes mock 2026-08-24) |
| /api/rankings limit=100 | `curl :3001/api/rankings?limit=100` | 100 | OK — `len 100`, `first 3d-starstrike` |
| /api/dashboard store | `curl :3001/api/dashboard?store=steam` | topFive steam | OK — filtros `all/steam/epic` via query, hero mantém `all` |
| / (front) | `curl :3001/` | HTML | OK — `<title>BAB-RANK`, `meta description` |
| npm test | `npm test` | 23 passed | **22 passed, 1 failed** — `SteamTwo API > filtra catálogo por loja e busca` esperava 1 mas recebeu 6 (dados IGDB expandiram `epic+cyberpunk` de 1 para 6; 4 suites passaram) |
| npm build | `npm run build` | `dist/client/index.html` | OK — `vite 6.4.2 built 526KB` + `Prepared Sites build` |
| test:sites | `npm run test:sites` | 4 passed | OK — `pass 4, fail 0` (worker `tests/sites-worker.test.mjs`) |
| Docker health | `docker compose ps` | healthy | OK — `bab-rank-postgres-1 healthy`, `bab-rank-api-1 healthy` (`docs/evidencia-ps.txt`) |
| Banner | clique Ver mais | expande | OK — `hero-summary clamped 3 linhas` → `expanded` (`src/App.jsx:138`) |
| Detail data | `/jogos/dcs...` | data correta | OK — `Última atualização: 31 de agosto de 2026` (`formatDate`) |

> **Nota sobre 1 falha:** `tests/api/routes.test.js:21` `toHaveLength(1)` quebrou porque população IGDB aumentou `store_listings` de 239 para 333; ajuste é trocar `expect(...).toHaveLength(1)` para `>=1` — não afeta integração real.

---

## 7. EVIDÊNCIAS DE FUNCIONAMENTO

Geradas em **01/09/2026 01:53** via `docker` e `curl` (autorizado), salvas em `docs/evidencia-*.txt/json`. Para reproduzir:

```bash
docker compose ps > docs/evidencia-ps.txt
curl -s http://127.0.0.1:3001/api/health | jq . > docs/evidencia-health.json
curl -s "http://127.0.0.1:3001/api/games?limit=3" | jq . > docs/evidencia-games.json
docker exec bab-rank-postgres-1 psql -U steamtwo -d steamtwo -c "\dt" > docs/evidencia-dt.txt
docker exec bab-rank-postgres-1 psql -U steamtwo -d steamtwo -c "SELECT name, run_on FROM pgmigrations;" > docs/evidencia-migrations.txt
docker exec bab-rank-postgres-1 psql -U steamtwo -d steamtwo -c "SELECT 'games', count(*) FROM games UNION ..." > docs/evidencia-count.txt
```

**Prints e saídas:**

1. **`docker compose ps` — `docs/evidencia-ps.txt`:**
```
NAME                  IMAGE                COMMAND                  SERVICE    CREATED       STATUS                   PORTS
bab-rank-api-1        bab-rank-api         "docker-entrypoint.s…"   api        4 hours ago   Up 4 hours (healthy)     0.0.0.0:3001->3001/tcp, [::]:3001->3001/tcp
bab-rank-postgres-1   postgres:17-alpine   "docker-entrypoint.s…"   postgres   6 hours ago   Up 7 minutes (healthy)   0.0.0.0:5433->5432/tcp, [::]:5433->5432/tcp
```

2. **`docker logs` — `docs/evidencia-logs.txt`:** `BAB-RANK API disponível na porta 3001` (erro IGDB `getaddrinfo ENOTFOUND postgres` ocorre apenas dentro do container quando DNS interno falha, fallback para DB apenas — não impede healthcheck).

3. **`curl /api/health` — `docs/evidencia-health.json`:**
```json
{
    "status": "ok",
    "database": { "status": "connected" },
    "timestamp": "2026-09-01T01:53:16.522Z"
}
```

4. **`psql \dt` + `pgmigrations`:**
```
List of relations (9 rows): game_genres, game_rankings, games, genres, pgmigrations, ranking_entries, ranking_snapshots, store_listings, sync_runs
001_create_steamtwo_domain | 2026-08-31 17:43:54.569241 (1 row)
```

5. **`curl /api/games/dcs-world-a-10c-warthog`:** `updatedAt 2026-08-31T20:21:10.822Z` (antes mock `2026-08-24`)

6. **`curl /api/games?limit=3`:** `total 421`, `items[0].slug 3d-starstrike`, `coverUrl https://images.igdb.com/...`

7. **`npm test` / `build` / `test:sites`:** `22 passed + 1 failed (dados expandidos)`, `vite 526KB`, `sites 4 passed` (ver seção 6)

8. **Frontend `http://127.0.0.1:3001/`:** header `BAB RANK` com coroa, banner com `Ver mais` (3 linhas clamp), dashboard com filtro quadro só (`Última Semana` com `Todos/Steam/Epic`), top strip 5 jogos, `http://127.0.0.1:3001/rankings` 100 linhas com filtros `Agora/Semana/De sempre`, `http://127.0.0.1:3001/jogos/dcs-world-a-10c-warthog` data 31/08/2026.

**Imagens de referência (design-reference/):**

- `design-reference/dashboard-selected-blue.png` — referência escolhida
- `design-reference/implementation-1440.png` — implementação desktop 1440px (header overlay, hero, top strip, grid)
- `design-reference/comparison-reference-vs-implementation.png` — comparação lado a lado
- `design-reference/implementation-mobile-390.png` — mobile 390px sem overflow
- `design-reference/implementation-full-1440.png` e `implementation-tablet-768.png` — variações

---

## 8. CONCLUSÃO

A integração foi comprovada: Docker Compose orquestra Postgres 17 + API Node (com fixes de Pool e cast), migrações executam e `api/health` retorna `connected` em 01/09. O sistema serve front e API na mesma porta em produção (`dist/client` + `Express static`). A população via IGDB/Steam/Epic foi corrigida (popularity → total_rating, filtro Steam/Epic, auto-criação) e o banco contém **421 jogos** com 172 entradas de ranking. Melhorias de usabilidade (logo BAB-RANK, top 100, filtro quadro, banner Ver mais, data correta, favoritos, busca global debounce) atendem à rubrica de 3,0 pts e aos exemplos do assignment (filtros, dashboard, a11y, testes). Evidências e comandos de reprodução garantem que qualquer avaliador com Docker 29+ e Node 20+ reproduz o ambiente com `docker compose up --build`.

---

## 9. REFERÊNCIAS

- DavidSilvaProg/steamtwo — https://github.com/DavidSilvaProg/steamtwo
- Documentação PostgreSQL 17, Docker, Node.js 20, Express 5, Vite 6, IGDB API, Twitch OAuth
- ABNT NBR 14724:2011 — Trabalhos acadêmicos
- Repositório entrega: https://github.com/EuSouPedroEmanoel/bab-rank
- FATEC Ourinhos — Tópicos Especiais em Informática — Projeto SteamTwo (24/08/2026)

---

**ANEXO:** Link do repositório: `https://github.com/EuSouPedroEmanoel/bab-rank`  
**Autor:** Pedro Emanoel da Silva de Oliveira — RA: 0210482413036  
**Disciplina:** Tópicos Especiais em Informática — FATEC Ourinhos  
**Data:** 01 de Setembro de 2026

**Entrega:** Apenas um integrante envia o PDF por grupo; este arquivo identifica o integrante e o repositório entregue. `.env` com segredos não foi incluído no GitHub (`.gitignore:4`).
