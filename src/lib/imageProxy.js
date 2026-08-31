export function getCoverProxyUrl(url, w = 400) {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  let effW = w;
  if (trimmed.includes("picsum.photos")) effW = 800;
  const h = Math.round((effW * 3) / 2);
  return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}&w=${effW}&h=${h}&output=webp&q=80&fit=cover`;
}
