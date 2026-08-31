# BAB-STEAM-EPIC

> **Autor:** Pedro Emanoel da Silva de Oliveira — **RA:** __________ [INSERIR RA]  
> **Projeto Atribuído — Fatec** | Evolução de https://github.com/DavidSilvaProg/steamtwo  
> **Pasta local:** `dev/Fatec/bab-steam-epic` | **Repositório novo:** `https://github.com/<SEU-USUARIO>/bab-steam-epic`

Catálogo de jogos com dashboard de popularidade da Steam e Epic Games, interface em React/HTML/CSS/JS, API Node.js/Express e persistência PostgreSQL — **com Docker Compose completo e integração validada**.

## Funcionalidades

- dashboard com mais jogados agora, média da última semana, popularidade histórica e recorde monitorado;
- catálogo pesquisável e filtrável por loja e gênero;
- ranking combinado transparente;
- página de detalhes com link para a loja oficial;
- coleta da Steam, Epic Games e IGDB com snapshots imutáveis;
- fallback visual com dados realistas quando o PostgreSQL ainda não foi configurado.

## Como os rankings funcionam

Cada posição de uma fonte é normalizada por `100 × (N - posição + 1) / N`. O índice combinado é a média das fontes disponíveis. Ausência em uma coleta válida vale zero; se a fonte inteira estiver indisponível, ela é excluída do cálculo.

- **Agora:** último snapshot válido da Steam e Epic.
- **Última semana:** média de sete snapshots diários válidos.
- **De sempre:** proxy de popularidade histórica da IGDB; não representa horas jogadas.
- **Recorde monitorado:** maior índice registrado desde o início da coleta.

A Steam disponibiliza posição e jogadores simultâneos. A coleção oficial da Epic é tentada primeiro; quando bloqueia coleta automatizada com `403/429`, o job usa o ranking público do egdata e identifica explicitamente o provedor como `egdata-fallback`. A Epic não fornece contagem pública de jogadores nesse ranking.

## Execução local

Requisitos: Node.js 20+ (via `fnm`) e Docker 29+.

```bash
# 1. Instalar deps
fnm exec --using=lts-latest npm install

# 2. Configurar env (NÃO commitar .env)
cp .env.example .env
# Para host: DATABASE_URL=postgres://steamtwo:steamtwo@localhost:5433/steamtwo
# Para container: DATABASE_URL=postgres://steamtwo:steamtwo@postgres:5432/steamtwo

# 3. Subir tudo via Docker Compose (recomendado - integra postgres + api)
docker compose up -d --build
# O serviço migrate roda automaticamente: npm run db:migrate
# Ou manual:
fnm exec --using=lts-latest npm run db:migrate

# 4. Validar integração
curl http://127.0.0.1:3001/api/health
# {"status":"ok","database":{"status":"connected"}}

# 5. Dev local (sem Docker api)
fnm exec --using=lts-latest npm run dev:api  # :3001
fnm exec --using=lts-latest npm run dev      # :5173
```

**Docker Compose completo implementado (`docker-compose.yml:1`):**
- `postgres:17-alpine` em `5433:5432` (evita conflito com `postgres-db` em 5432) + healthcheck `pg_isready`
- `api` (build `Dockerfile:1`, Node 20, `npm run build` + `node server/index.js`, `DATABASE_URL` interno `@postgres:5432`)
- `migrate` (roda `npm run db:migrate` uma vez)

Frontend: `http://127.0.0.1:3001/` (Docker, serve `dist/client`) ou `http://127.0.0.1:5173/` (Vite dev)  
API: `http://127.0.0.1:3001/api/health` e `http://127.0.0.1:3001/api/games`

Para enriquecer o catálogo com a IGDB, preencha `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET` no `.env` e execute:

```bash
npm run sync:catalog
npm run sync:rankings
npm run sync:popularity
```

## Verificação e Testes

```bash
fnm exec --using=lts-latest npm test          # 23 passed (api/domain/integrations)
fnm exec --using=lts-latest npm run build     # vite + prepare-sites-build
fnm exec --using=lts-latest npm run test:sites # 4 passed (worker)
docker compose ps                             # postgres healthy + api healthy
curl http://127.0.0.1:3001/api/health         # {"status":"ok","database":{"status":"connected"}}
docker exec bab-steam-epic-postgres-1 psql -U steamtwo -d steamtwo -c "\dt" # 9 tabelas
```

O banco pode ser revertido uma migração por vez com `fnm exec --using=lts-latest npm run db:rollback`.

## Documentação ABNT

- PDF: `docs/ABNT.pdf` (gerado via `pandoc docs/ABNT.md -o docs/ABNT.pdf --pdf-engine=weasyprint`, HTML em `docs/ABNT.html`)
- Markdown fonte: `docs/ABNT.md` com capa, folha de rosto, sumário, integração, instruções, testes e evidências
- Evidências: `docs/evidencia-*.txt/json` (ps, health, games, dt, migrations)

## Integração Back-End + Banco

Ver `docs/ABNT.md` seção 3 e `server/index.js:14` (`createPool`), `server/config.js:6` (`DATABASE_URL`), `migrations/001_create_steamtwo_domain.js:1`.

