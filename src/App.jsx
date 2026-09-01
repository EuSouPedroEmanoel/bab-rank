import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ArrowSquareOut, BookmarkSimple, CaretDown, ChartLineUp, Check, Circle, Crown, FunnelSimple, GameController, Info, MagnifyingGlass, Star, TrendUp, UsersThree, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useAverageColor } from "./hooks/useAverageColor.js";
import { getCoverProxyUrl } from "./lib/imageProxy.js";
import { generateFallbackCoverDataUrl } from "./lib/coverFallback.js";

const games = {
  elden: { id: "elden-ring-shadow-of-the-erdtree", slug: "elden-ring-shadow-of-the-erdtree", title: "ELDEN RING Shadow of the Erdtree", shortTitle: "Elden Ring: Shadow of the Erdtree", coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900_2x.jpg", heroUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_hero.jpg", score: 94.7, genres: ["RPG", "Ação", "Mundo aberto"], stores: ["steam"], trend: 5, summary: "O DLC que redefiniu as Terras Intermédias voltou ao topo. Picos de jogadores, avaliações excelentes e o hype da comunidade impulsionam Elden Ring como o destaque absoluto da semana.", metric: "18,4 mil jogadores simultâneos" },
  wukong: { id: "black-myth-wukong", slug: "black-myth-wukong", title: "Black Myth: Wukong", shortTitle: "Black Myth: Wukong", coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/library_600x900_2x.jpg", heroUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/library_hero.jpg", score: 90.1, genres: ["RPG", "Ação"], stores: ["steam", "epic"], trend: 2, summary: "Uma jornada mitológica de ação com combates intensos e cenários memoráveis.", metric: "12,1 mil jogadores simultâneos" },
  baldur: { id: "baldurs-gate-3", slug: "baldurs-gate-3", title: "Baldur's Gate 3", shortTitle: "Baldur's Gate 3", coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900_2x.jpg", heroUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_hero.jpg", score: 88.3, genres: ["RPG", "Estratégia"], stores: ["steam"], trend: -1, summary: "Escolhas profundas, personagens inesquecíveis e um mundo que reage a cada decisão.", metric: "9,8 mil jogadores simultâneos" },
  hades: { id: "hades-ii", slug: "hades-ii", title: "Hades II", shortTitle: "Hades II", coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/library_600x900_2x.jpg", heroUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/library_hero.jpg", score: 86.2, genres: ["Ação", "Roguelike"], stores: ["steam", "epic"], trend: 3, summary: "A nova descida ao submundo da Supergiant Games mantém a fórmula em alta.", metric: "8,2 mil jogadores simultâneos" },
  cyberpunk: { id: "cyberpunk-2077", slug: "cyberpunk-2077", title: "Cyberpunk 2077", shortTitle: "Cyberpunk 2077", coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900_2x.jpg", heroUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_hero.jpg", score: 83.6, genres: ["RPG", "Ação"], stores: ["steam", "epic"], trend: -2, summary: "Night City continua entre os mundos abertos mais visitados da atualidade.", metric: "7,5 mil jogadores simultâneos" },
  witcher: { id: "the-witcher-3-wild-hunt", slug: "the-witcher-3-wild-hunt", title: "The Witcher 3: Wild Hunt", shortTitle: "The Witcher 3: Wild Hunt", coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900_2x.jpg", heroUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_hero.jpg", score: 97, genres: ["RPG", "Mundo aberto"], stores: ["steam"], trend: 0, summary: "Uma aventura de fantasia que segue como referência para o gênero.", metric: "Popularidade histórica" },
  rdr2: { id: "red-dead-redemption-2", slug: "red-dead-redemption-2", title: "Red Dead Redemption 2", shortTitle: "Red Dead Redemption 2", coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900_2x.jpg", heroUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_hero.jpg", score: 96.2, genres: ["Ação", "Mundo aberto"], stores: ["steam"], trend: 0, summary: "O Velho Oeste em uma história densa, lenta e inesquecível.", metric: "Popularidade histórica" },
  portal: { id: "portal-2", slug: "portal-2", title: "Portal 2", shortTitle: "Portal 2", coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/620/library_600x900_2x.jpg", heroUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/620/library_hero.jpg", score: 95.8, genres: ["Puzzle", "Aventura"], stores: ["steam"], trend: 0, summary: "Puzzles criativos e humor afiado em um dos clássicos mais queridos da Steam.", metric: "Popularidade histórica" },
  god: { id: "god-of-war", slug: "god-of-war", title: "God of War", shortTitle: "God of War", coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/library_600x900_2x.jpg", heroUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/library_hero.jpg", score: 94.9, genres: ["Ação", "Aventura"], stores: ["steam"], trend: 0, summary: "Uma jornada nórdica sobre pais e filhos, com combate cinematográfico.", metric: "Popularidade histórica" }
};
const fallback = { hero: games.elden, topFive: [games.elden, games.wukong, games.baldur, games.hades, games.cyberpunk], week: [games.elden, games.wukong, games.baldur, games.hades, games.cyberpunk], allTime: [games.witcher, games.rdr2, games.portal, games.elden, games.god], records: [{ title: "The Witcher 3: Wild Hunt", value: "97,6", label: "Maior índice BAB-RANK", date: "24 de dez. de 2022", coverUrl: games.witcher.coverUrl }], updatedAt: "2026-08-31T18:00:00.000Z", sourceStatus: { steam: "available", epic: "available", igdb: "available" } };
const formatScore = (score) => typeof score === "number" ? score.toFixed(1).replace(".", ",") : score || "—";
const formatDate = (date) => { try { const d = new Date(date); if (Number.isNaN(d.getTime())) throw new Error("invalid"); return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(d); } catch { return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date()); } };
const formatWeek = (date) => { try { const d = new Date(date); if (Number.isNaN(d.getTime())) throw new Error("invalid"); return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d); } catch { return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()); } };
const storeLabel = (store) => store === "steam" ? "Steam" : store === "epic" ? "Epic Games" : "Todos";
const fallbackForSlug = (slug) => Object.values(games).find((game) => game.slug === slug);
const FAVORITES_KEY = "bab-rank:favorites";
const loadFavorites = () => {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const saveFavorites = (list) => {
  try { window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(list)); } catch {}
};
const storeKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.toLowerCase().replace(/\s+/g, "-");
  return storeKey(value.store || value.key || value.name || value.slug || value.label);
};
const normalizeGame = (raw = {}, base = {}) => {
  const stores = Array.isArray(raw.stores) ? raw.stores : (base.stores || []);
  const storeLinks = { ...(base.storeLinks || {}) };
  stores.forEach((entry) => {
    if (entry && typeof entry === "object") {
      const key = storeKey(entry);
      if (key && entry.url) storeLinks[key] = entry.url;
    }
  });
  const title = raw.title || raw.name || base.title || "Jogo sem título";
  return {
    ...base,
    ...raw,
    id: raw.id || base.id || raw.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    slug: raw.slug || base.slug || raw.id,
    title,
    shortTitle: raw.shortTitle || raw.short_title || title,
    summary: raw.summary || raw.description || base.summary || "",
    coverUrl: raw.coverUrl || raw.cover_url || raw.cover?.url || base.coverUrl || null,
    heroUrl: raw.heroUrl || raw.hero_url || raw.hero?.url || base.heroUrl || raw.coverUrl || null,
    genres: Array.isArray(raw.genres) ? raw.genres.map((genre) => typeof genre === "string" ? genre : genre.name).filter(Boolean) : (base.genres || []),
    stores: stores.map(storeKey).filter(Boolean).length ? stores.map(storeKey).filter(Boolean) : (base.stores || []),
    storeLinks,
  };
};
const normalizeRecord = (raw = {}) => {
  const recordGame = typeof raw.game === "object" ? normalizeGame(raw.game, fallbackForSlug(raw.game?.slug) || {}) : (fallbackForSlug(raw.slug) || games.witcher);
  return { ...raw, title: recordGame.shortTitle, label: raw.label || raw.type || "Recorde monitorado", value: raw.value ?? raw.score ?? "—", date: raw.achievedAt ? formatDate(raw.achievedAt) : (raw.date || "—"), coverUrl: raw.coverUrl || recordGame.coverUrl, game: recordGame };
};
const normalizeDashboard = (payload = {}, current = fallback) => ({
  ...current,
  ...payload,
  hero: payload.hero ? normalizeGame(payload.hero, current.hero) : current.hero,
  topFive: Array.isArray(payload.topFive) && payload.topFive.length ? payload.topFive.map((item) => normalizeGame(item, fallbackForSlug(item.slug) || {})) : current.topFive,
  week: Array.isArray(payload.week) && payload.week.length ? payload.week.map((item) => normalizeGame(item, fallbackForSlug(item.slug) || {})) : current.week,
  allTime: Array.isArray(payload.allTime) && payload.allTime.length ? payload.allTime.map((item) => normalizeGame(item, fallbackForSlug(item.slug) || {})) : current.allTime,
  records: Array.isArray(payload.records) && payload.records.length ? payload.records.map(normalizeRecord) : current.records,
});
const storeUrlForGame = (game) => game.storeLinks?.[game.stores?.[0]] || (game.stores?.[0] === "epic" ? `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(game.title)}` : `https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`);
function SafeImage({ src, alt, className = "", width = 320, priority = false, title, ...props }) {
  const proxied = useMemo(() => getCoverProxyUrl(src, width), [src, width]);
  const fallback = useMemo(() => generateFallbackCoverDataUrl(title || alt || "Jogo", width, Math.round((width * 3) / 2)), [title, alt, width]);
  const [url, setUrl] = useState(proxied || src || fallback);
  useEffect(() => { setUrl(proxied || src || fallback); }, [proxied, src, fallback]);
  return <img src={url} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" crossOrigin={proxied ? "anonymous" : undefined} className={className} onError={() => setUrl(fallback)} {...props} />;
}
function Trend({ value, compact = false }) { if (!value) return <span className="trend neutral">—</span>; const positive = value > 0; return <span className={`trend ${positive ? "positive" : "negative"}`}>{positive ? <ArrowUpRight size={compact ? 15 : 16} weight="bold" /> : <ArrowDownRight size={compact ? 15 : 16} weight="bold" />} {Math.abs(value)}</span>; }
function Header({ view, onNavigate, search, setSearch, onDetails, favoritesCount = 0 }) {
  const [input, setInput] = useState(search || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);
  const wrapRef = useRef(null);
  useEffect(() => { setInput(search || ""); }, [search]);
  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) { setSuggestions([]); setLoadingSug(false); return; }
    const t = setTimeout(async () => {
      setLoadingSug(true);
      try {
        const res = await fetch(`/api/games?q=${encodeURIComponent(q)}&limit=5`);
        if (!res.ok) throw new Error("busca falhou");
        const payload = await res.json();
        const list = Array.isArray(payload) ? payload : (payload.items || payload.games || payload.data || []);
        const normalized = list.slice(0, 5).map((it) => normalizeGame(it, fallbackForSlug(it.slug) || {}));
        setSuggestions(normalized);
        setShowSug(true);
      } catch { setSuggestions([]); } finally { setLoadingSug(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [input]);
  useEffect(() => {
    const handleClickOutside = (event) => { if (wrapRef.current && !wrapRef.current.contains(event.target)) setShowSug(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const submit = (q = input) => {
    const clean = q.trim();
    setSearch(clean);
    setShowSug(false);
    if (clean) {
      if (view === "busca") window.history.replaceState({}, "", `/busca?q=${encodeURIComponent(clean)}`);
      else window.history.pushState({}, "", `/busca?q=${encodeURIComponent(clean)}`);
      onNavigate("busca");
    } else {
      onNavigate("home");
    }
  };
  const selectSuggestion = (game) => {
    setInput(game.shortTitle || game.title);
    setShowSug(false);
    if (onDetails) onDetails(game);
    else submit(game.title);
  };
  return <header className={`site-header ${view === "home" ? "site-header-overlay" : ""}`}><button className="brand" onClick={() => onNavigate("home")} aria-label="BAB-RANK, início"><Crown size={26} weight="fill" style={{marginRight:8, color:'var(--blue)', verticalAlign:'middle'}} /><span>BAB</span><b>RANK</b></button><nav aria-label="Navegação principal"><button className={view === "home" ? "active" : ""} onClick={() => onNavigate("home")}>Início</button><button className={view === "catalog" ? "active" : ""} onClick={() => onNavigate("catalog")}>Catálogo</button><button className={view === "rankings" ? "active" : ""} onClick={() => onNavigate("rankings")}>Rankings</button><button className={view === "busca" ? "active" : ""} onClick={() => onNavigate("busca")}>Buscar</button><button className={view === "favoritos" ? "active" : ""} onClick={() => onNavigate("favoritos")} style={{position:'relative'}}>Favoritos{favoritesCount>0 && <span style={{marginLeft:6, background:'var(--blue)', color:'white', fontSize:10, padding:'1px 6px', borderRadius:10, fontWeight:700}}>{favoritesCount}</span>}</button></nav><div ref={wrapRef} style={{ marginLeft: 'auto', position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}><label className="search-box" style={{ width: 320, maxWidth: '34vw' }}><MagnifyingGlass size={18} /><input value={input} onChange={(event) => { setInput(event.target.value); setShowSug(true); }} onFocus={() => input.trim().length >= 2 && setShowSug(true)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); submit(); } if (event.key === 'Escape') setShowSug(false); }} placeholder="Pesquisar qualquer jogo..." aria-label="Pesquisar qualquer jogo" /></label><button onClick={() => submit()} aria-label="Buscar jogos" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}><MagnifyingGlass size={16} /> Buscar</button>{showSug && (suggestions.length > 0 || loadingSug) && <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#0e141b', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden', zIndex: 30, boxShadow: '0 12px 30px rgba(0,0,0,0.5)', minWidth: 320 }}><div style={{ maxHeight: 380, overflowY: 'auto' }}>{loadingSug ? <div style={{ padding: 12, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, border: '2px solid var(--muted)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Buscando...</div> : suggestions.map((game) => <button key={game.id} onClick={() => selectSuggestion(game)} style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '8px 10px', background: 'transparent', border: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'left' }}><SafeImage src={game.coverUrl} alt="" width={36} style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} title={game.title} /><span style={{ minWidth: 0, flex: 1 }}><b style={{ display: 'block', fontSize: 12, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.shortTitle}</b><small style={{ fontSize: 10, color: 'var(--muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.genres.slice(0, 2).join(' · ') || 'Jogo'}{game.isExternal ? ' · IGDB' : ''}</small></span><Score value={game.score} /></button>)}</div><button onClick={() => submit()} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.04)', border: 0, borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--blue-2)', cursor: 'pointer', textAlign: 'center' }}>Ver todos os resultados para "{input.trim()}" →</button></div>}</div></header>;
}
function Score({ value, large = false }) { return <span className={large ? "score score-large" : "score"}>{formatScore(value)}</span>; }
function Hero({ game, onDetails, onMethodology, isFavorite, onToggleFavorite }) {
  const [expanded, setExpanded] = useState(false);
  const titleParts = (game.shortTitle || game.title || "").split(":");
  const mainTitle = titleParts[0]?.trim() || game.title;
  const subTitle = titleParts.slice(1).join(":").trim();
  const fav = isFavorite ? isFavorite(game.slug) : false;
  return <section className="hero" style={{ "--hero-image": `url(${game.heroUrl})` }}><div className="hero-content"><div className="spotlight"><span>DATA SPOTLIGHT</span><Circle size={7} weight="fill" color="var(--blue)" /> <time>{formatWeek(game.updatedAt)}</time></div><div className="eyebrow">O JOGO DO MOMENTO</div><h1>{mainTitle.toUpperCase()} {subTitle && <small>{subTitle}</small>}</h1><p className={`hero-summary ${expanded ? "expanded" : "clamped"}`}>{game.summary}</p><button className="ver-mais" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>{expanded ? "Ver menos" : "Ver mais"}</button><div className="hero-actions"><button className="primary-button" onClick={onDetails}>Ver detalhes</button><button className="list-button" onClick={() => onToggleFavorite && onToggleFavorite(game)} aria-pressed={fav} style={fav?{color:'var(--blue)'}:{}}><BookmarkSimple size={19} weight={fav?"fill":"regular"} /> {fav?"Remover da lista":"Adicionar à lista"}</button></div></div><aside className="hero-score"><div className="score-heading"><h2>Índice BAB-RANK</h2><button onClick={onMethodology}>Como calculamos <Info size={15} /></button></div><div><Score value={game.score} large /> <span className="out-of">/100</span></div><p>Ranking combinado de Steam e Epic Games que considera tração recente, qualidade e engajamento da comunidade.</p><div className="score-lines"><span><TrendUp size={19} /> Tração (últ. 7 dias) <b>96</b></span><span><Star size={19} /> Qualidade (avaliações) <b>93</b></span><span><UsersThree size={19} /> Engajamento <b>95</b></span></div><small>Atualizado em {formatDate(game.updatedAt)}</small></aside></section>;
}
function TopStrip({ items, onDetails }) { return <section className="top-strip" aria-label="Top cinco da semana">{items.map((game, index) => <button className="top-item" key={game.id} onClick={() => onDetails(game)}><strong>{index + 1}</strong><SafeImage src={game.coverUrl} alt="" /><span><b>{game.shortTitle}</b><Score value={game.score} /><Trend value={game.trend} compact /></span></button>)}</section>; }
function StoreFilters({ value, onChange }) { return <div className="store-filter" role="tablist" aria-label="Filtrar por loja">{[["all", "Todos"], ["steam", "Steam"], ["epic", "Epic Games"]].map(([key, label]) => <button key={key} className={value === key ? "selected" : ""} onClick={() => onChange(key)} role="tab" aria-selected={value === key}>{label}</button>)}</div>; }
function WeekList({ items, onDetails }) { return <div className="week-list">{items.map((game, index) => <button className="week-row" key={game.id} onClick={() => onDetails(game)}><strong>{index + 1}</strong><SafeImage src={game.coverUrl} alt="" /><span className="week-title">{game.shortTitle}</span><Score value={game.score} /><Trend value={game.trend} /></button>)}</div>; }
function AllTime({ items, onDetails }) { return <div className="poster-grid">{items.slice(0, 5).map((game) => <button className="poster" key={game.id} onClick={() => onDetails(game)}><SafeImage src={game.coverUrl} alt={`Capa de ${game.shortTitle}`} /><span className="poster-score">{formatScore(game.score)}</span></button>)}</div>; }
function RecordCard({ record, onDetails }) { return <button className="record-card" onClick={() => onDetails(record.game || games.witcher)}><div className="section-kicker">RECORDE MONITORADO</div><p>{record.label}</p><Score value={record.value} /><SafeImage src={record.coverUrl} alt="" /><b>{record.title}</b><small>Alcançado em<br />{record.date}</small></button>; }
function Home({ data, onDetails, onMethodology, isFavorite, onToggleFavorite }) {
  const [store, setStore] = useState("all");
  const [weekOverride, setWeekOverride] = useState(null);
  useEffect(() => {
    if (store === "all") { setWeekOverride(null); return; }
    const controller = new AbortController();
    fetch(`/api/rankings?period=week&store=${store}&limit=5`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(payload => {
        const items = Array.isArray(payload.items) ? payload.items : [];
        if (!items.length) { setWeekOverride(null); return; }
        setWeekOverride(items.map(it => normalizeGame(it, fallbackForSlug(it.slug) || {})));
      })
      .catch(() => setWeekOverride(null));
    return () => controller.abort();
  }, [store]);
  const week = weekOverride ?? data.week;
  return <><Hero game={data.hero} onDetails={() => onDetails(data.hero)} onMethodology={onMethodology} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} /><TopStrip items={data.topFive} onDetails={onDetails} /><section className="dashboard-grid"><div className="week-panel"><div className="section-head"><div><h2>ÚLTIMA SEMANA</h2><p>Atualizado em {formatDate(data.updatedAt)}</p></div><StoreFilters value={store} onChange={setStore} /></div><WeekList items={week} onDetails={onDetails} /><button className="more-link" onClick={() => onDetails(null)}>Ver top 100 da semana <ArrowRight size={19} /></button></div><div className="alltime-panel"><div className="section-head"><div><h2>DE SEMPRE</h2><p>Os jogos com maior índice BAB-RANK de todos os tempos.</p></div></div><AllTime items={data.allTime} onDetails={onDetails} /><button className="more-link" onClick={() => onDetails(null)}>Ver todos os tempos <ArrowRight size={19} /></button></div><RecordCard record={data.records[0]} onDetails={onDetails} /></section></>;
}
function GameCard({ game, onDetails, isFavorite, onToggleFavorite }) {
  const fav = isFavorite ? isFavorite(game.slug) : false;
  return <div className="game-card" style={{ position: 'relative', cursor:'pointer' }} onClick={() => onDetails(game)} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' ') onDetails(game); }}><SafeImage src={game.coverUrl} alt={`Capa de ${game.shortTitle}`} title={game.title} /><div><span className="game-card-score" style={{ display:'flex', alignItems:'center', gap:6 }}><Score value={game.score} />{game.isExternal && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:10, background:'rgba(8,119,255,0.18)', border:'1px solid rgba(8,119,255,0.35)', color:'#9cc9ff' }}>IGDB</span>}</span><h3>{game.shortTitle}</h3><p>{game.genres.join(" · ") || (game.isExternal ? "Jogo externo · IGDB" : "Sem gênero")}</p><span className="card-stores">{game.stores.length ? game.stores.map(storeLabel).join(" · ") : (game.isExternal ? "Disponível via IGDB" : "Sem loja vinculada")}</span></div>{onToggleFavorite && <button onClick={(e)=>{e.stopPropagation(); onToggleFavorite(game);}} aria-label={fav?"Remover dos favoritos":"Adicionar aos favoritos"} aria-pressed={fav} title={fav?"Remover dos favoritos":"Adicionar aos favoritos"} style={{ position:'absolute', top:8, right:8, width:30, height:30, display:'grid', placeItems:'center', borderRadius:'50%', border:'1px solid '+(fav?'rgba(8,119,255,0.9)':'rgba(255,255,255,0.18)'), background: fav?'var(--blue)':'rgba(0,0,0,0.55)', color: fav?'white':'#d0d6dc', backdropFilter:'blur(6px)', cursor:'pointer' }}><BookmarkSimple size={14} weight={fav?"fill":"regular"} /></button>}</div>;
}
function Catalog({ data, query: initialQuery, onDetails, isFavorite, onToggleFavorite }) {
  const [store, setStore] = useState("all");
  const [genre, setGenre] = useState("all");
  const [searchInput, setSearchInput] = useState(initialQuery || "");
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery || "");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshingSlug, setRefreshingSlug] = useState(null);
  const fallbackGames = useMemo(() => [...data.topFive, ...data.allTime].filter((game, index, array) => array.findIndex((item) => item.id === game.id) === index), [data]);
  const genres = useMemo(() => [...new Set(fallbackGames.flatMap((g) => g.genres || []))], [fallbackGames]);
  const limit = 24;
  // debounce da pesquisa (300ms) — interface de pesquisa
  useEffect(() => { setSearchInput(initialQuery || ""); }, [initialQuery]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => { setPage(1); }, [debouncedQuery, store, genre]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setApiError(false);
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (store !== "all") params.set("store", store);
    if (genre !== "all") params.set("genre", genre);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const t0 = performance.now();
    fetch(`/api/games?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Catálogo indisponível")))
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : (payload.items || payload.games || payload.data || []);
        const normalized = list.map((it) => normalizeGame(it, fallbackForSlug(it.slug) || {}));
        setItems(normalized);
        const pagination = payload.pagination || { total: list.length, pages: 1 };
        setTotal(pagination.total ?? normalized.length);
        setTotalPages(pagination.pages ?? 1);
        setElapsed(Math.round(performance.now() - t0));
        const upd = normalized[0]?.updatedAt || payload.updatedAt || data.updatedAt;
        if (upd) setLastUpdate(upd);
      })
      .catch((err) => { if (err.name !== "AbortError") { setApiError(true); setItems([]); } })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debouncedQuery, store, genre, page, data.updatedAt]);
  const handleSelect = async (game) => {
    const isStale = !game.updatedAt || Date.now() - new Date(game.updatedAt).getTime() > 12 * 60 * 60 * 1000;
    if (!isStale) { onDetails(game); return; }
    setRefreshingSlug(game.slug);
    try {
      const res = await fetch(`/api/games/${encodeURIComponent(game.slug)}/refresh`, { method: "POST" });
      if (res.ok) {
        const payload = await res.json();
        onDetails(payload.game ?? game);
      } else {
        onDetails(game);
      }
    } catch {
      onDetails(game);
    } finally {
      setRefreshingSlug(null);
    }
  };
  const hasData = items.length > 0;
  const display = hasData ? items : fallbackGames.slice(0, limit);
  const effectiveTotal = hasData ? total : fallbackGames.length;
  const effectivePages = hasData ? totalPages : 1;
  return <section className="catalog-page"><div className="page-intro"><div><span className="eyebrow">BIBLIOTECA BAB-RANK</span><h1>Catálogo de jogos</h1><p>Explore jogos acompanhados pelas fontes Steam, Epic Games e IGDB.</p></div><GameController size={58} weight="thin" /></div><div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}><label className="search-box" style={{ flex: '1 1 280px', maxWidth: 420 }}><MagnifyingGlass size={18} /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Pesquisar jogos... (ex: Elden Ring)" aria-label="Pesquisar jogos" /></label><span style={{ alignSelf: 'center', fontSize: 12, color: 'var(--muted)' }}>{searchInput !== debouncedQuery ? "Digitando..." : ""}</span></div><div className="catalog-toolbar"><div className="filter-control"><FunnelSimple size={18} /><StoreFilters value={store} onChange={setStore} /></div><label className="select-control">Gênero <select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="all">Todos os gêneros</option>{genres.map((item) => <option value={item} key={item}>{item}</option>)}</select><CaretDown size={16} /></label></div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap', gap: 8 }}><span>{loading ? "Buscando..." : `${effectiveTotal} jogos encontrados em ${elapsed}ms`}</span><span>Última atualização: {formatDate(lastUpdate || data.updatedAt)}</span></div>{loading ? <div className="empty-state"><GameController size={34} /><h2>Carregando catálogo</h2><p>Buscando jogos nas fontes do BAB-RANK…</p></div> : display.length ? <><div className="catalog-grid">{display.map((game) => (<div key={game.id} style={{ position: 'relative' }}>{refreshingSlug === game.slug && (<div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 2, borderRadius: 5 }}><span style={{ color: 'white', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Atualizando...</span></div>)}<GameCard game={game} onDetails={handleSelect} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} /></div>))}</div><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}><button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--line)', background: page <= 1 ? 'transparent' : 'var(--blue)', color: page <= 1 ? 'var(--muted)' : 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>Anterior</button><span style={{ fontSize: 13, color: 'var(--muted)' }}>Página {page} de {totalPages} — {display.length} jogos</span><button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--line)', background: page >= totalPages ? 'transparent' : 'var(--blue)', color: page >= totalPages ? 'var(--muted)' : 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Próxima</button></div></> : <div className="empty-state"><GameController size={34} /><h2>{apiError ? "Catálogo temporariamente indisponível" : "Nenhum jogo encontrado"}</h2><p>{apiError ? "Exibindo os últimos jogos válidos." : "Tente outra busca ou remova algum filtro."}</p></div>}</section>;
}
function Rankings({ data, onDetails }) {
  const [period, setPeriod] = useState("week");
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/rankings?period=${period}&limit=100`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(payload => {
        const list = Array.isArray(payload.items) ? payload.items : (payload.data || []);
        setItems(list.map(it => normalizeGame(it, fallbackForSlug(it.slug) || {})));
      })
      .catch(() => setItems(data.topFive))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [period, data.topFive]);
  const display = items ?? data.topFive;
  return <section className="rankings-page"><div className="page-intro"><div><span className="eyebrow">RANKINGS</span><h1>Quem está no topo?</h1><p>Veja como os jogos evoluíram nos rankings monitorados pelo BAB-RANK.</p></div><ChartLineUp size={58} weight="thin" /></div><div className="store-filter" style={{margin:'0 30px 16px'}}><button className={period==="week"?"selected":""} onClick={()=>setPeriod("week")}>Última semana</button><button className={period==="now"?"selected":""} onClick={()=>setPeriod("now")}>Agora</button><button className={period==="all-time"?"selected":""} onClick={()=>setPeriod("all-time")}>De sempre</button></div>{loading ? <div className="empty-state"><GameController size={34} /><h2>Carregando rankings</h2><p>Buscando top 100...</p></div> : <div className="ranking-table"><div className="table-head"><span>#</span><span>Jogo</span><span>Índice BAB-RANK</span><span>Variação</span></div>{display.map((game, index) => <button className="table-row" key={game.id} onClick={() => onDetails(game)}><strong>{index + 1}</strong><span><SafeImage src={game.coverUrl} alt="" /><b>{game.shortTitle}</b></span><Score value={game.score ?? game.igdbPopularity ?? 0} /><Trend value={game.trend} /></button>)}</div>}</section>;
}
function Detail({ game, onBack, onMethodology, isFavorite, onToggleFavorite }) {
  const proxiedForAvg = useMemo(() => getCoverProxyUrl(game.heroUrl ?? game.coverUrl ?? null, 40), [game.heroUrl, game.coverUrl]);
  const { color: avgHex } = useAverageColor(proxiedForAvg ?? null, !!proxiedForAvg);
  const baseHue = useMemo(() => {
    if (avgHex) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(avgHex);
      if (m) {
        const r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max !== min) {
          const d = max - min;
          let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
          h *= 60; if (h < 0) h += 360; return Math.round(h);
        }
        return 0;
      }
    }
    const key = game.title ?? "fallback";
    let hash = 0; const s = (key ?? "").trim() || "fallback";
    for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
  }, [avgHex, game.title]);
  const pageBg = useMemo(() => `hsl(${baseHue}, 65%, 14%)`, [baseHue]);
  const pageBgGradient = useMemo(() => `linear-gradient(to bottom, #000 0%, #000 180px, hsl(${baseHue}, 65%, 14%) 420px, hsl(${baseHue}, 62%, 18%) 100%)`, [baseHue]);
  const cardBg = useMemo(() => `hsl(${baseHue}, 65%, 20%)`, [baseHue]);
  useEffect(() => {
    const main = document.getElementById("main-content") || document.querySelector("main");
    const footer = document.querySelector("footer");
    const prevMainBg = main?.style.background ?? "";
    const prevMainOpacity = main?.style.opacity ?? "";
    const prevFooterBg = footer?.style.background ?? "";
    const prevBodyBg = document.body.style.background;
    // cria camada de fundo com fade suave (opacity) para transição de cores entre páginas
    let bgLayer = document.getElementById("page-bg-fade");
    if (!bgLayer) {
      bgLayer = document.createElement("div");
      bgLayer.id = "page-bg-fade";
      bgLayer.style.position = "fixed";
      bgLayer.style.inset = "0";
      bgLayer.style.zIndex = "-1";
      bgLayer.style.pointerEvents = "none";
      bgLayer.style.transition = "opacity 0.6s ease, background 0.6s ease";
      document.body.appendChild(bgLayer);
    }
    bgLayer.style.background = pageBgGradient;
    bgLayer.style.opacity = "0";
    requestAnimationFrame(() => { if (bgLayer) bgLayer.style.opacity = "1"; });
    const transition = "background-color 0.6s ease";
    if (main) { main.style.transition = transition; main.style.backgroundColor = "transparent"; }
    if (footer) { footer.style.transition = transition; footer.style.background = `hsl(${baseHue}, 65%, 8%)`; footer.style.borderTopColor = "transparent"; }
    document.body.style.backgroundColor = "#000";
    document.body.style.transition = transition;
    return () => {
      if (main) { main.style.background = prevMainBg; main.style.opacity = prevMainOpacity; main.style.transition = ""; }
      if (footer) { footer.style.background = prevFooterBg; footer.style.borderTopColor = ""; footer.style.transition = ""; }
      document.body.style.background = prevBodyBg;
      document.body.style.transition = "";
      if (bgLayer) bgLayer.style.opacity = "0";
    };
  }, [pageBg, pageBgGradient, baseHue]);
  return <section className="detail-page detail-page--hero"><section className="hero" style={{ "--hero-image": `url(${game.heroUrl})`, backgroundColor: '#000' }}><button className="back-link back-link--over" onClick={onBack}><ArrowRight size={17} /> Voltar</button><div className="hero-content" style={{ background: `linear-gradient(to bottom, transparent, ${pageBg}15)` , borderRadius: 8, padding: 12 }}><span className="eyebrow">DETALHE DO JOGO</span><h1>{game.shortTitle}</h1><div className="detail-tags">{game.genres.map((genre) => <span key={genre}>{genre}</span>)}</div><div className="hero-actions" style={{ flexWrap: 'wrap' }}>{game.stores.length ? game.stores.map((s) => (<a key={s} className="primary-button" href={game.storeLinks?.[s] || storeUrlForGame({ ...game, stores: [s] })} target="_blank" rel="noreferrer">Abrir na {storeLabel(s)} <ArrowSquareOut size={17} /></a>)) : (<a className="primary-button" href={storeUrlForGame(game)} target="_blank" rel="noreferrer">Abrir na loja <ArrowSquareOut size={17} /></a>)}{(() => { const fav = isFavorite ? isFavorite(game.slug) : false; return <button className="list-button" onClick={() => onToggleFavorite && onToggleFavorite(game)} aria-pressed={fav} style={fav?{color:'var(--blue)'}:{}}><BookmarkSimple size={19} weight={fav?"fill":"regular"} /> {fav?"Remover da lista":"Adicionar à lista"}</button>; })()}</div></div><aside className="hero-score" style={{ background: `hsla(${baseHue}, 65%, 20%, 0.38)`, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.14)" }}><div className="score-heading"><h2>Índice BAB-RANK</h2><button onClick={onMethodology}>Como calculamos <Info size={14} /></button></div><div><Score value={game.score} large /> <span className="out-of">/100</span></div><p>Índice combinado de tração, qualidade e engajamento.</p><div className="score-lines"><span><TrendUp size={19} /> Tração <b>{game.trend ?? 0}</b></span><span><Star size={19} /> Gêneros <b>{game.genres.length}</b></span><span><UsersThree size={19} /> Loja <b>{storeLabel(game.stores[0] || "all")}</b></span></div><small>Última atualização: {formatDate(game.updatedAt)}</small></aside></section><div className="detail-columns"><div className="detail-main" style={{ display: 'grid', gap: 24 }}><article style={{ background: cardBg, padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}><h2>Sobre este jogo</h2><p>{game.summary} O índice combina tração, qualidade e engajamento para oferecer uma leitura comparável entre os títulos.</p></article><div style={{ background: cardBg, padding: '10px 14px', borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)" }}><h2 style={{ fontSize: 14, marginBottom: 6 }}>Fontes</h2><div className="source-pills" style={{ gap: 6 }}>{game.stores.map((store) => <span key={store} style={{ padding: '3px 8px', fontSize: 10 }}><Check size={12} /> {storeLabel(store)}</span>)}<span style={{ padding: '3px 8px', fontSize: 10 }}><Check size={12} /> IGDB</span></div><small style={{ fontSize: 10, marginTop: 6, display: 'block' }}>Última atualização: {formatDate(game.updatedAt)}</small></div></div><aside style={{ background: cardBg, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", alignSelf: 'start' }}><h2 style={{ fontFamily: 'var(--display)', fontSize: 16, marginBottom: 10 }}>Capa</h2><div className="group relative w-fit h-fit mx-auto aspect-[2/3] w-full max-w-[160px] border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.07] hover:shadow-xl hover:brightness-105"><SafeImage src={game.coverUrl} alt={`Capa de ${game.title}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 12 }} /></div></aside></div></section>;
}
function SearchPage({ initialQuery, onDetails, isFavorite, onToggleFavorite }) {
  const [q, setQ] = useState(initialQuery || "");
  const [debounced, setDebounced] = useState(initialQuery || "");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshingSlug, setRefreshingSlug] = useState(null);
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [debounced]);
  useEffect(() => {
    if (!debounced) { setItems([]); setTotal(0); setLastUpdate(null); return; }
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ q: debounced, page: String(page), limit: "24" });
    const t0 = performance.now();
    fetch(`/api/games?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : (payload.items || []);
        setItems(list.map((it) => normalizeGame(it, fallbackForSlug(it.slug) || {})));
        const p = payload.pagination || { total: list.length, pages: 1 };
        setTotal(p.total ?? list.length);
        setTotalPages(p.pages ?? 1);
        setElapsed(Math.round(performance.now() - t0));
        const upd = list[0]?.updatedAt || payload.updatedAt;
        if (upd) setLastUpdate(upd);
      })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debounced, page]);
  const handleSelect = async (game) => {
    const isStale = !game.updatedAt || Date.now() - new Date(game.updatedAt).getTime() > 12 * 60 * 60 * 1000;
    if (!isStale) { onDetails(game); return; }
    setRefreshingSlug(game.slug);
    try {
      const res = await fetch(`/api/games/${encodeURIComponent(game.slug)}/refresh`, { method: "POST" });
      if (res.ok) {
        const payload = await res.json();
        onDetails(payload.game ?? game);
      } else onDetails(game);
    } catch { onDetails(game); } finally { setRefreshingSlug(null); }
  };
  return (
    <section className="catalog-page">
      <div className="page-intro"><div><span className="eyebrow">BUSCA</span><h1>Pesquisar jogos</h1><p>Digite para buscar por título. Se o jogo estiver desatualizado há mais de 12h, atualizaremos automaticamente ao clicar.</p></div><GameController size={58} weight="thin" /></div>
      <label className="search-box" style={{ width: '100%', maxWidth: 640, marginBottom: 16 }}><MagnifyingGlass size={20} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar... ex: Cyberpunk, Elden Ring" aria-label="Pesquisar jogos" autoFocus /></label>
      {debounced && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}><span>{loading ? "Buscando..." : `${total} jogos encontrados em ${elapsed}ms`}</span><span>{lastUpdate ? `Última atualização: ${formatDate(lastUpdate)}` : ""}</span></div>}
      {!debounced ? <div className="empty-state"><MagnifyingGlass size={32} /><h2>Digite para pesquisar</h2><p>Resultados aparecem aqui com capa mesmo se não cadastrado (via IGDB).</p></div> : loading ? <div className="empty-state"><GameController size={32} /><h2>Buscando...</h2></div> : items.length ? <><div className="catalog-grid">{items.map((game) => (<div key={game.id} style={{ position: 'relative' }}>{refreshingSlug === game.slug && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 2, borderRadius: 5 }}><span style={{ color: 'white', fontSize: 12 }}>Atualizando...</span></div>}<GameCard game={game} onDetails={handleSelect} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} /></div>))}</div><div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}><button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--line)', background: page <= 1 ? 'transparent' : 'var(--blue)', color: 'white', opacity: page <= 1 ? 0.5 : 1 }}>Anterior</button><span style={{ fontSize: 13, color: 'var(--muted)', alignSelf: 'center' }}>Página {page} de {totalPages}</span><button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--line)', background: page >= totalPages ? 'transparent' : 'var(--blue)', color: 'white', opacity: page >= totalPages ? 0.5 : 1 }}>Próxima</button></div></> : <div className="empty-state"><GameController size={32} /><h2>Nenhum jogo encontrado</h2><p>Tente outro termo.</p></div>}
    </section>
  );
}

function Methodology({ onClose }) {
  const closeRef = useRef(null);
  const previousFocus = useRef(null);
  useEffect(() => {
    previousFocus.current = document.activeElement;
    closeRef.current?.focus();
    const handleKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); previousFocus.current?.focus?.(); };
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="methodology-modal" role="dialog" aria-modal="true" aria-labelledby="method-title"><button ref={closeRef} className="modal-close" aria-label="Fechar" onClick={onClose}><X size={20} /></button><span className="eyebrow">TRANSPARÊNCIA</span><h2 id="method-title">Como calculamos</h2><p>O Índice BAB-RANK combina sinais públicos de popularidade para destacar jogos em alta sem fingir que a plataforma recebe jogadores.</p><div className="method-grid"><div><strong>01</strong><h3>Tração recente</h3><p>Posição Steam e Epic normalizada por ranking. A semana é a média de sete snapshots válidos.</p></div><div><strong>02</strong><h3>Qualidade</h3><p>Avaliações e popularidade histórica são trazidas da IGDB, com atualização diária.</p></div><div><strong>03</strong><h3>Limitações</h3><p>A Epic publica posição, não contagem de jogadores. Quando uma fonte falha, mantemos o último snapshot válido.</p></div></div><small className="method-foot">Fontes: Steam, Epic Games e IGDB · dados atualizados em {formatDate(new Date().toISOString())}</small></section></div>;
}

function Favorites({ favorites, onDetails, onToggleFavorite, isFavorite }) {
  if (!favorites.length) {
    return <section className="catalog-page"><div className="page-intro"><div><span className="eyebrow">SUA COLEÇÃO</span><h1>Favoritos</h1><p>Você ainda não adicionou jogos à sua lista. Clique em “Adicionar à lista” em qualquer jogo para salvar aqui.</p></div><BookmarkSimple size={58} weight="thin" /></div><div className="empty-state"><BookmarkSimple size={34} /><h2>Nenhum favorito ainda</h2><p>Explore o catálogo ou a busca e adicione seus jogos preferidos. Eles ficarão salvos no seu navegador (localStorage).</p></div></section>;
  }
  return <section className="catalog-page"><div className="page-intro"><div><span className="eyebrow">SUA COLEÇÃO</span><h1>Favoritos</h1><p>{favorites.length} {favorites.length===1?"jogo salvo":"jogos salvos"} no seu navegador.</p></div><BookmarkSimple size={58} weight="thin" /></div><div className="catalog-grid">{favorites.map((game) => (<GameCard key={game.slug||game.id} game={game} onDetails={onDetails} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />))}</div></section>;
}

export function App() {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("home");
  const [selected, setSelected] = useState(null);
  const [methodology, setMethodology] = useState(false);
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [toast, setToast] = useState(null);

  useEffect(() => { saveFavorites(favorites); }, [favorites]);

  useEffect(() => {
    const onStorage = (e) => { if (e.key === FAVORITES_KEY) { try { setFavorites(e.newValue ? JSON.parse(e.newValue) : []); } catch {} } };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isFavorite = (slug) => favorites.some((f) => f.slug === slug);
  const toggleFavorite = (game) => {
    const normalized = normalizeGame(game, fallbackForSlug(game.slug) || {});
    const exists = favorites.some((f) => f.slug === normalized.slug);
    if (exists) {
      setFavorites((prev) => prev.filter((f) => f.slug !== normalized.slug));
      setToast(`"${normalized.shortTitle||normalized.title}" removido dos favoritos`);
    } else {
      setFavorites((prev) => [...prev, normalized]);
      setToast(`"${normalized.shortTitle||normalized.title}" adicionado aos favoritos`);
    }
    setTimeout(() => setToast(null), 2200);
  };

  const loadDetail = (slug, base) => {
    setLoading(true);
    fetch(`/api/games/${encodeURIComponent(slug)}`).then((response) => response.ok ? response.json() : Promise.reject(new Error("Detalhe indisponível"))).then((payload) => {
      const raw = payload.game || payload.data || payload;
      setSelected(normalizeGame(raw, base));
      setStale(false);
    }).catch(() => setStale(true)).finally(() => setLoading(false));
  };

  useEffect(() => {
    const applyLocation = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (path.startsWith("/catalogo")) { setSelected(null); setView("catalog"); }
      else if (path.startsWith("/rankings")) { setSelected(null); setView("rankings"); }
      else if (path.startsWith("/busca")) { setSelected(null); setView("busca"); const q = params.get("q") || ""; setSearch(q); }
      else if (path.startsWith("/favoritos")) { setSelected(null); setView("favoritos"); }
      else if (path.startsWith("/jogos/")) {
        const slug = decodeURIComponent(path.slice("/jogos/".length));
        const base = fallbackForSlug(slug) || normalizeGame({ slug, title: slug.replace(/-/g, " ") });
        setSelected(base);
        setView("home");
        loadDetail(slug, base);
      } else { setSelected(null); setView("home"); }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    applyLocation();
    window.addEventListener("popstate", applyLocation);
    return () => window.removeEventListener("popstate", applyLocation);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dashboard", { signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject(new Error("API indisponível"))).then((payload) => {
      setData((current) => normalizeDashboard(payload, current));
      setStale(false);
    }).catch((error) => { if (error.name !== "AbortError") setStale(true); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const navigate = (next) => {
    setSelected(null);
    setView(next);
    const path = next === "home" ? "/" : next === "catalog" ? "/catalogo" : next === "busca" ? `/busca${search ? `?q=${encodeURIComponent(search)}` : ""}` : next === "favoritos" ? "/favoritos" : "/rankings";
    window.history.pushState({}, "", path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    if (view === "busca") {
      const q = search ? `?q=${encodeURIComponent(search)}` : "";
      if (window.location.pathname !== "/busca" || window.location.search !== q) {
        window.history.replaceState({}, "", `/busca${q}`);
      }
    }
  }, [search, view]);
  const details = (game) => {
    if (!game) return navigate("rankings");
    const normalized = normalizeGame(game, fallbackForSlug(game.slug) || {});
    setSelected(normalized);
    window.history.pushState({}, "", `/jogos/${normalized.slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadDetail(normalized.slug, normalized);
  };
  const handleHeaderSearch = (value) => {
    setSearch(value);
    if (value.trim() && view !== "busca" && !selected) {
      setView("busca");
      window.history.pushState({}, "", `/busca?q=${encodeURIComponent(value.trim())}`);
    } else if (!value.trim() && view === "busca") {
      navigate("home");
    } else if (view === "busca") {
      window.history.replaceState({}, "", `/busca${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`);
    }
  };
  return <div className="app-shell"><Header view={selected ? "home" : view} onNavigate={navigate} search={search} setSearch={handleHeaderSearch} onDetails={details} favoritesCount={favorites.length} />{loading && <div className="loading-bar" aria-label="Carregando dados" />}<main>{selected ? <Detail game={selected} onBack={() => navigate("home")} onMethodology={() => setMethodology(true)} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} /> : view === "catalog" ? <Catalog data={data} query={search} onDetails={details} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} /> : view === "rankings" ? <Rankings data={data} onDetails={details} /> : view === "busca" ? <SearchPage initialQuery={search} onDetails={details} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} /> : view === "favoritos" ? <Favorites favorites={favorites} onDetails={details} onToggleFavorite={toggleFavorite} isFavorite={isFavorite} /> : <Home data={data} onDetails={details} onMethodology={() => setMethodology(true)} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />}</main><footer><span>BAB-RANK</span><span>Dados públicos, rankings transparentes.</span><button onClick={() => setMethodology(true)}>Metodologia</button>{stale && <small>Últimos dados válidos · {formatDate(data.updatedAt)}</small>}</footer>{methodology && <Methodology onClose={() => setMethodology(false)} />}{toast && <div role="status" aria-live="polite" style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#111820', color:'white', border:'1px solid rgba(255,255,255,0.15)', padding:'10px 16px', borderRadius:8, fontSize:13, zIndex:50, boxShadow:'0 12px 30px rgba(0,0,0,0.4)', display:'flex', alignItems:'center', gap:8 }}><BookmarkSimple size={16} weight="fill" color="var(--blue)" /> {toast}</div>}</div>;
}