#!/usr/bin/env node
/*
 * Dutch Venom — build-script (draait automatisch op Netlify bij elke deploy)
 *
 * Maakt uit content/products.json en content/site.json:
 *   - /product/<slug>/index.html   één pagina per product (met maatkeuze + bestelknop)
 *   - /bedankt/index.html          pagina waar Mollie na betaling naartoe stuurt (toont de status)
 *   - /sitemap.xml                 met de homepage én alle productpagina's
 *   - netlify/shared/catalog.mjs   prijzen/maten voor de Mollie-afrekenfunctie
 *
 * Geen extra pakketten nodig (alleen Node). Lokaal testen: `node scripts/build.js`.
 * De gegenereerde mappen staan in .gitignore; ze worden bij elke deploy opnieuw gemaakt.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_URL = "https://www.dutchvenom.nl";

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const site = readJson("content/site.json");
const products = (readJson("content/products.json").products || []).filter((p) => p && p.naam);

const shipping = {
  verzendkosten: Number(site.verzendkosten != null ? site.verzendkosten : 4.95),
  gratis_verzending_vanaf: Number(site.gratis_verzending_vanaf != null ? site.gratis_verzending_vanaf : 75),
  verzendlanden: Array.isArray(site.verzendlanden) && site.verzendlanden.length ? site.verzendlanden.map(String) : ["NL"],
};
const LANDEN = { NL: "Nederland", BE: "België", DE: "Duitsland", FR: "Frankrijk", LU: "Luxemburg" };
function shipCents(prijs) {
  const sub = Math.round(Number(prijs) * 100), drempel = Math.round(shipping.gratis_verzending_vanaf * 100);
  return drempel > 0 && sub >= drempel ? 0 : Math.round(shipping.verzendkosten * 100);
}

/* ---------- hulpfuncties ---------- */

// LET OP: deze functie staat ook in index.html (slugify) — houd ze gelijk.
function slugify(s) {
  return String(s || "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "product";
}
function assignSlugs(list) {
  const used = {};
  return list.map((p) => {
    let base = slugify(p.slug || p.naam), s = base, n = 2;
    while (used[s]) s = base + "-" + n++;
    used[s] = true;
    return s;
  });
}
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const euro = (n) => "€" + Number(n).toFixed(2).replace(".", ",");
const hasPrice = (n) => n !== null && n !== undefined && n !== "" && !isNaN(Number(n)) && Number(n) > 0;
const isRaster = (u) => /^\//.test(u || "") && !/\.svg(\?|$)/i.test(u);
const cdn = (u, w) => "/.netlify/images?url=" + encodeURIComponent(u) + "&w=" + w + "&q=75";
const abs = (u) => (/^https?:\/\//.test(u) ? u : SITE_URL + (u || ""));

// <img> die op Netlify via de Image CDN laadt en anders terugvalt op het origineel
function img(u, alt, sizes, extra) {
  extra = extra || "";
  if (!u) return "";
  if (!isRaster(u)) return `<img src="${esc(u)}" alt="${esc(alt)}" ${extra}>`;
  const srcset = [480, 800, 1200, 1600].map((w) => `${cdn(u, w)} ${w}w`).join(", ");
  return `<img src="${esc(cdn(u, 1000))}" srcset="${esc(srcset)}" sizes="${esc(sizes)}" alt="${esc(alt)}" ${extra}` +
    ` onerror="this.onerror=null;this.removeAttribute('srcset');this.src='${esc(u)}'">`;
}

const slugs = assignSlugs(products);
products.forEach((p, i) => { p._slug = slugs[i]; p._url = `/product/${slugs[i]}/`; });

/* ---------- gedeelde opmaak ---------- */

const LOGO_SVG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4l9 16L21 4h-4.5L12 13 7.5 4H3z" fill="#D9A441"/></svg>`;
const brand = esc(site.merk || "DUTCH VENOM");
const logoHtml = site.logo
  ? `<img src="${esc(site.logo)}" alt="${brand} logo" style="height:30px;width:auto">`
  : LOGO_SVG;

const CSS = `
:root{--nightscale:#0C1310;--serpent:#142019;--serpent-deep:#0F1914;--bone:#EAE6D9;--bone-dim:#B9B6A8;--moss:#77866F;--toxin:#D9A441;--line:#223129;--radius:14px;--wide:1200px}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--nightscale);color:var(--bone);font-family:"Instrument Sans",system-ui,sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
::selection{background:var(--toxin);color:var(--nightscale)}
img{max-width:100%;display:block}
a{color:inherit}
.wrap{max-width:var(--wide);margin:0 auto;padding:0 24px}
.announce{background:var(--toxin);color:var(--nightscale);font-family:"Space Mono",monospace;font-size:12.5px;font-weight:700;text-align:center;padding:9px 16px;letter-spacing:.04em}
header{position:sticky;top:0;z-index:50;background:rgba(12,19,16,.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;height:66px;gap:16px}
.logo{font-family:"Archivo",sans-serif;font-weight:900;font-stretch:118%;font-size:21px;letter-spacing:.06em;text-decoration:none;display:flex;align-items:center;gap:10px}
.logo svg{width:26px;height:26px}
.nav-back{font-family:"Space Mono",monospace;font-size:13px;font-weight:700;color:var(--bone-dim);text-decoration:none;padding:10px 0}
.nav-back:hover{color:var(--toxin)}
.crumbs{font-family:"Space Mono",monospace;font-size:12px;letter-spacing:.08em;color:var(--moss);padding:22px 0 0}
.crumbs a{text-decoration:none;color:var(--bone-dim)}
.crumbs a:hover{color:var(--toxin)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:12px;text-decoration:none;font-family:"Space Mono",monospace;font-weight:700;font-size:15px;background:var(--toxin);color:var(--nightscale);padding:17px 30px;border-radius:100px;border:1px solid var(--toxin);transition:transform .2s,box-shadow .2s,opacity .2s;cursor:pointer}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 34px rgba(217,164,65,.28)}
.btn[aria-disabled="true"]{opacity:.45;pointer-events:none;box-shadow:none;transform:none}
.btn.ghost{background:transparent;color:var(--bone);border-color:var(--line)}
.btn.ghost:hover{border-color:var(--toxin);color:var(--toxin);box-shadow:none}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--toxin);outline-offset:3px;border-radius:4px}
footer{border-top:1px solid var(--line);background:var(--serpent-deep);padding:40px 0;margin-top:90px}
.foot{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-family:"Space Mono",monospace;font-size:12.5px;color:var(--moss)}
.foot a{color:var(--bone-dim);text-decoration:none;margin-right:18px}
.foot a:hover{color:var(--toxin)}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
`;

const PRODUCT_CSS = `
.pdp{display:grid;grid-template-columns:1.15fr .85fr;gap:56px;padding:26px 0 0;align-items:start}
.gallery-main{position:relative;aspect-ratio:4/5;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line);background:#0a0f0d}
.gallery-main img{width:100%;height:100%;object-fit:cover}
.gallery-main .badge{position:absolute;top:16px;left:16px;z-index:2}
.thumbs{display:flex;gap:12px;margin-top:14px;flex-wrap:wrap}
.thumbs button{width:84px;aspect-ratio:4/5;border-radius:10px;overflow:hidden;border:1px solid var(--line);background:#0a0f0d;padding:0;cursor:pointer;opacity:.6;transition:opacity .2s,border-color .2s}
.thumbs button img{width:100%;height:100%;object-fit:cover}
.thumbs button[aria-current="true"],.thumbs button:hover{opacity:1;border-color:var(--toxin)}
.info{position:sticky;top:96px}
.cat{font-family:"Space Mono",monospace;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--toxin);margin-bottom:12px}
h1{font-family:"Archivo",sans-serif;font-weight:900;font-stretch:108%;font-size:clamp(30px,3.6vw,44px);line-height:1.02;text-transform:uppercase;margin-bottom:16px}
.price{font-family:"Space Mono",monospace;font-weight:700;font-size:26px;color:var(--toxin);margin-bottom:6px}
.price s{color:var(--moss);font-weight:400;font-size:17px;margin-right:12px}
.vat{font-size:13px;color:var(--moss);margin-bottom:22px}
.desc{color:var(--bone-dim);margin-bottom:28px}
.badge{font-family:"Space Mono",monospace;font-size:11px;font-weight:700;letter-spacing:.08em;background:var(--toxin);color:var(--nightscale);padding:5px 12px;border-radius:100px;text-transform:uppercase}
.badge.out{background:var(--bone-dim)}
.size-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}
.size-head span{font-family:"Space Mono",monospace;font-size:12.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.size-head small{font-size:13px;color:var(--moss)}
.sizes{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.sizes button{min-width:64px;padding:13px 16px;font-family:"Space Mono",monospace;font-size:14px;font-weight:700;background:transparent;color:var(--bone);border:1px solid var(--line);border-radius:10px;cursor:pointer;transition:all .15s}
.sizes button:hover{border-color:var(--bone-dim)}
.sizes button[aria-pressed="true"]{background:var(--bone);color:var(--nightscale);border-color:var(--bone)}
.fit{font-size:14px;color:var(--bone-dim);margin-bottom:24px}
.order .btn{width:100%}
.order-note{font-size:13.5px;color:var(--moss);margin-top:12px;min-height:1.6em;text-align:center}
.checkout{margin-top:26px;padding:24px;border:1px solid var(--line);border-radius:var(--radius);background:var(--serpent)}
.checkout h2{font-family:"Space Mono",monospace;font-size:12.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin-bottom:16px}
.f2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.f2 label{display:flex;flex-direction:column;gap:6px;font-size:13.5px;font-weight:500;color:var(--bone-dim)}
.f2 label.full{grid-column:1/-1}
.f2 em{font-style:normal;color:var(--moss)}
.f2 small{font-size:12px;color:var(--moss)}
.f2 input,.f2 select{font:inherit;font-size:16px;color:var(--bone);background:var(--nightscale);border:1px solid var(--line);border-radius:10px;padding:12px 13px;width:100%}
.f2 input:focus,.f2 select:focus{outline:none;border-color:var(--toxin)}
.f2 .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.sum{margin:22px 0 18px;border-top:1px solid var(--line)}
.sum div{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--line);font-size:14.5px}
.sum dt{color:var(--bone-dim)}
.sum dd{font-family:"Space Mono",monospace;font-weight:700}
.sum .tot dt,.sum .tot dd{color:var(--bone);font-size:16px}
.sum .tot dd{color:var(--toxin)}
.checkout .btn{width:100%}
.checkout .btn:disabled{opacity:.6;cursor:wait;transform:none;box-shadow:none}
.form-msg{color:#E8A08A;font-size:14px;margin-top:12px;min-height:1.2em;text-align:center}
.form-msg a{color:var(--toxin)}
.pay-note{font-size:12.5px;color:var(--moss);text-align:center;margin-top:4px}
.trust{list-style:none;margin:28px 0 0;border-top:1px solid var(--line)}
.trust li{display:flex;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid var(--line);font-size:14.5px}
.trust svg{width:20px;height:20px;flex:none;color:var(--toxin)}
details{border-bottom:1px solid var(--line)}
summary{cursor:pointer;list-style:none;padding:18px 0;font-family:"Archivo",sans-serif;font-weight:800;font-size:16px;display:flex;justify-content:space-between;align-items:center}
summary::-webkit-details-marker{display:none}
summary::after{content:"+";font-family:"Space Mono",monospace;color:var(--toxin);font-size:20px;transition:transform .25s}
details[open] summary::after{transform:rotate(45deg)}
details p{color:var(--bone-dim);font-size:15px;padding:0 0 18px}
.related{margin-top:110px}
.related h2{font-family:"Archivo",sans-serif;font-weight:900;font-stretch:112%;font-size:clamp(26px,3.4vw,40px);text-transform:uppercase;margin-bottom:30px}
.rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.rcard{text-decoration:none;background:var(--serpent);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;transition:transform .3s,border-color .3s}
.rcard:hover{transform:translateY(-5px);border-color:rgba(217,164,65,.5)}
.rcard .ri{aspect-ratio:4/5;overflow:hidden;background:#0a0f0d}
.rcard .ri img{width:100%;height:100%;object-fit:cover}
.rcard .rb{padding:16px 18px 18px}
.rcard .rn{font-family:"Archivo",sans-serif;font-weight:800;font-size:16px;line-height:1.25;margin-bottom:6px}
.rcard .rp{font-family:"Space Mono",monospace;font-weight:700;color:var(--toxin)}
.mobile-bar{display:none}
@media (max-width:900px){
  .pdp{grid-template-columns:1fr;gap:28px}
  .info{position:static}
  .f2{grid-template-columns:1fr}
  .rgrid{grid-template-columns:repeat(2,1fr)}
  .rgrid .rcard:nth-child(3){display:none}
  .mobile-bar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:60;gap:12px;align-items:center;justify-content:space-between;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:rgba(12,19,16,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid var(--line);transform:translateY(110%);transition:transform .25s}
  .mobile-bar.show{transform:none}
  .mobile-bar .mp{font-family:"Space Mono",monospace;font-weight:700;color:var(--toxin);font-size:16px;line-height:1.2}
  .mobile-bar .mp small{display:block;color:var(--bone-dim);font-size:12px;font-weight:400}
  .mobile-bar .btn{padding:13px 22px;font-size:14px}
  footer{padding-bottom:110px}
}
`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Instrument+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">`;

function shell({ title, description, canonical, ogImage, head, body, noindex }) {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(canonical)}">`}
<meta name="theme-color" content="#0C1310">
<meta property="og:site_name" content="Dutch Venom">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
${FONTS}
<style>${CSS}${head && head.css ? head.css : ""}</style>
${head && head.extra ? head.extra : ""}
</head>
<body>
${site.aankondiging ? `<div class="announce">${esc(site.aankondiging)}</div>` : ""}
<header><div class="wrap nav">
  <a class="logo" href="/" aria-label="${brand} home">${logoHtml}<span>${brand}</span></a>
  <a class="nav-back" href="/#collectie">← Collectie</a>
</div></header>
<main>
${body}
</main>
<footer><div class="wrap foot">
  <span>© ${new Date().getFullYear()} Dutch Venom</span>
  <span>${site.email ? `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : ""}${site.instagram ? `<a href="${esc(site.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ""}${site.tiktok ? `<a href="${esc(site.tiktok)}" target="_blank" rel="noopener">TikTok</a>` : ""}</span>
</div></footer>
</body>
</html>
`;
}

const ICON = {
  truck: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  ret: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2m0-6-2 2 2 2m-2-2h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
};

/* ---------- productpagina ---------- */

function productPage(p, i) {
  const photos = [p.afbeelding].concat(Array.isArray(p.extra_fotos) ? p.extra_fotos : [])
    .map((x) => (x && typeof x === "object" ? x.foto : x)).filter(Boolean);
  const sizes = (Array.isArray(p.maten) && p.maten.length ? p.maten : ["S", "M", "L", "XL"]).map(String);
  const sold = !!p.uitverkocht;
  const single = sizes.length === 1;
  const priceHtml = (hasPrice(p.oude_prijs) ? `<s>${euro(p.oude_prijs)}</s>` : "") + euro(p.prijs);
  const badge = sold ? `<span class="badge out">Uitverkocht</span>` : (p.badge ? `<span class="badge">${esc(p.badge)}</span>` : "");
  const alt = p.alt_tekst || p.naam;
  const title = `${p.naam} | Dutch Venom`;
  const description = (p.beschrijving || "").slice(0, 155) || `${p.naam} van Dutch Venom.`;
  const canonical = SITE_URL + p._url;
  const ogImage = photos[0] && isRaster(photos[0]) ? abs(photos[0]) : SITE_URL + "/images/og-image.jpg";

  const thumbs = photos.length > 1
    ? `<div class="thumbs" role="group" aria-label="Foto's">${photos.map((u, k) =>
        `<button type="button" data-src="${esc(u)}" aria-label="Foto ${k + 1}"${k === 0 ? ' aria-current="true"' : ""}>${img(u, "", "84px", 'loading="lazy"')}</button>`).join("")}</div>`
    : "";

  const sizeButtons = sizes.map((s) =>
    `<button type="button" data-size="${esc(s)}" aria-pressed="${single ? "true" : "false"}"${sold ? " disabled" : ""}>${esc(s)}</button>`).join("");

  const related = products.filter((q, k) => k !== i && !q.uitverkocht)
    .sort((a, b) => (b.categorie === p.categorie) - (a.categorie === p.categorie)).slice(0, 3);
  const relatedHtml = related.length ? `<section class="related"><h2>Ook iets voor jou</h2><div class="rgrid">${related.map((q) =>
    `<a class="rcard" href="${q._url}"><div class="ri">${img(q.afbeelding, q.alt_tekst || q.naam, "(max-width:900px) 46vw, 380px", 'loading="lazy"')}</div>` +
    `<div class="rb"><p class="rn">${esc(q.naam)}</p><p class="rp">${euro(q.prijs)}</p></div></a>`).join("")}</div></section>` : "";

  const ld = {
    "@context": "https://schema.org", "@type": "Product",
    name: p.naam, description: p.beschrijving || "", image: photos.filter(isRaster).map(abs),
    brand: { "@type": "Brand", name: "Dutch Venom" }, category: p.categorie || undefined,
    offers: { "@type": "Offer", url: canonical, priceCurrency: "EUR", price: Number(p.prijs).toFixed(2),
      availability: sold ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" },
  };

  const ship = shipCents(p.prijs);
  const cfg = { slug: p._slug, naam: p.naam, email: site.email || "", sold, single, prijs: euro(p.prijs),
    verzending: ship === 0 ? "Gratis" : euro(ship / 100), totaal: euro((Math.round(Number(p.prijs) * 100) + ship) / 100) };
  const landOptions = shipping.verzendlanden.map((c) => `<option value="${esc(c)}">${esc(LANDEN[c] || c)}</option>`).join("");

  const body = `
<div class="wrap">
  <nav class="crumbs" aria-label="Kruimelpad"><a href="/">Home</a> / <a href="/#collectie">${esc(p.categorie || "Collectie")}</a> / ${esc(p.naam)}</nav>
  <article class="pdp">
    <div>
      <div class="gallery-main">${badge}${img(photos[0], alt, "(max-width:900px) 100vw, 640px", 'id="mainImg" fetchpriority="high"')}</div>
      ${thumbs}
    </div>
    <div class="info">
      <p class="cat">${esc(p.categorie || "")}</p>
      <h1>${esc(p.naam)}</h1>
      <p class="price">${priceHtml}</p>
      <p class="vat">Incl. btw${site.aankondiging && /gratis verzending/i.test(site.aankondiging) ? " · " + esc(site.aankondiging.split("·")[0].trim()) : ""}</p>
      <p class="desc">${esc(p.beschrijving || "")}</p>

      <div class="size-head"><span>${single ? "Maat" : "Kies je maat"}</span><small>Oversized fit</small></div>
      <div class="sizes" role="group" aria-label="Maat">${sizeButtons}</div>
      <p class="fit">${single ? "Eén maat, verstelbaar." : "Tussen twee maten? Neem de kleinste voor een normale pasvorm, je gewone maat voor oversized."}</p>

      <div class="order">
        <a class="btn" id="orderBtn" aria-disabled="true" role="button" href="#bestellen">${sold ? "Uitverkocht" : single ? "Bestellen — " + euro(p.prijs) : "Kies eerst je maat"}</a>
        <p class="order-note" id="orderNote" aria-live="polite">${sold ? "Dit item komt niet terug. Volg ons op Instagram voor nieuwe drops." : "Veilig betalen met iDEAL via Mollie"}</p>
      </div>
      ${sold ? "" : `
      <form class="checkout" id="bestellen" hidden novalidate>
        <h2>Bezorggegevens</h2>
        <div class="f2">
          <label class="full">Naam<input name="naam" autocomplete="name" required maxlength="80"></label>
          <label class="full">E-mail<input name="email" type="email" autocomplete="email" required maxlength="120"><small>Voor je bevestiging en track &amp; trace</small></label>
          <label class="full">Straat en huisnummer<input name="adres" autocomplete="street-address" required maxlength="120"></label>
          <label>Postcode<input name="postcode" autocomplete="postal-code" required maxlength="12"></label>
          <label>Plaats<input name="plaats" autocomplete="address-level2" required maxlength="60"></label>
          <label>Land<select name="land" autocomplete="country">${landOptions}</select></label>
          <label><span>Telefoon <em>(optioneel)</em></span><input name="telefoon" type="tel" autocomplete="tel" maxlength="25"></label>
          <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
        </div>
        <dl class="sum">
          <div><dt id="sumProduct">${esc(p.naam)}</dt><dd>${euro(p.prijs)}</dd></div>
          <div><dt>Verzending</dt><dd>${cfg.verzending}</dd></div>
          <div class="tot"><dt>Totaal</dt><dd>${cfg.totaal}</dd></div>
        </dl>
        <button class="btn" type="submit" id="payBtn">Afrekenen — ${cfg.totaal}</button>
        <p class="form-msg" id="formMsg" role="alert"></p>
        <p class="pay-note">Je gaat naar de beveiligde betaalpagina van Mollie (o.a. iDEAL).</p>
      </form>`}

      <ul class="trust">
        <li>${ICON.truck}<span>${esc(site.usp_2 || "Snelle verzending")}</span></li>
        <li>${ICON.ret}<span>${esc(site.usp_3 || "14 dagen retourrecht")}</span></li>
        <li>${ICON.lock}<span>Veilig betalen via Mollie, o.a. met iDEAL</span></li>
      </ul>
      <details><summary>Maat &amp; pasvorm</summary><p>Onze tracksuits hebben een oversized fit. Wil je het strakker, bestel dan een maat kleiner. Twijfel je? Mail ons${site.email ? " op " + esc(site.email) : ""} en we helpen je kiezen.</p></details>
      <details><summary>Verzending &amp; retour</summary><p>${esc(site.aankondiging || "")}${site.aankondiging ? ". " : ""}${esc(site.usp_3 || "")}: items ongedragen en met labels terugsturen. Mail ons en we regelen het.</p></details>
    </div>
  </article>
  ${relatedHtml}
</div>
<div class="mobile-bar" id="mobileBar" aria-hidden="true"><p class="mp">${euro(p.prijs)}<small id="mbSize">${single ? esc(sizes[0]) : "Kies je maat"}</small></p><a class="btn" href="#" id="mbBtn">${sold ? "Uitverkocht" : "Bestellen"}</a></div>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<script>
(function(){
  "use strict";
  var C = ${JSON.stringify(cfg).replace(/</g, "\\u003c")};
  var btn = document.getElementById("orderBtn"), note = document.getElementById("orderNote");
  var main = document.getElementById("mainImg");
  var first = document.querySelector(".sizes button");
  var chosen = C.single && first ? first.getAttribute("data-size") : null;

  var form = document.getElementById("bestellen"), msg = document.getElementById("formMsg"), payBtn = document.getElementById("payBtn");

  function update(){
    if(C.sold) return;
    if(!chosen){ btn.setAttribute("aria-disabled","true"); btn.textContent = "Kies eerst je maat"; if(form) form.hidden = true; return; }
    btn.removeAttribute("aria-disabled");
    btn.textContent = "Bestellen — " + C.prijs;
    document.getElementById("sumProduct").textContent = C.naam + " · maat " + chosen;
    var mb = document.getElementById("mbSize"); if(mb) mb.textContent = "Maat " + chosen;
  }
  function openForm(){
    if(!form || !chosen) return;
    form.hidden = false;
    form.scrollIntoView({behavior:"smooth", block:"start"});
    setTimeout(function(){ var f = form.querySelector("input"); if(f) f.focus({preventScroll:true}); }, 350);
  }
  btn.addEventListener("click", function(e){ e.preventDefault(); openForm(); });

  function mailFallback(){
    return "mailto:" + C.email + "?subject=" + encodeURIComponent("Bestelling: " + C.naam + " — maat " + chosen) +
      "&body=" + encodeURIComponent("Hoi Dutch Venom,\\n\\nIk wil graag bestellen:\\n" + C.naam + "\\nMaat: " + chosen + "\\n\\nNaam:\\nAdres:\\nPostcode + plaats:\\n\\nGroet,");
  }
  if(form) form.addEventListener("input", function(){ if(msg.textContent && !payBtn.disabled) msg.textContent = ""; });
  if(form) form.addEventListener("submit", function(e){
    e.preventDefault();
    msg.textContent = "";
    var bad = Array.prototype.filter.call(form.querySelectorAll("[required]"), function(el){ return !el.value.trim(); });
    if(bad.length){ msg.textContent = "Vul alle verplichte velden in."; bad[0].focus(); return; }
    var data = { slug: C.slug, maat: chosen };
    Array.prototype.forEach.call(form.elements, function(el){ if(el.name) data[el.name] = el.value; });
    payBtn.disabled = true; var label = payBtn.textContent; payBtn.textContent = "Even geduld…";
    fetch("/.netlify/functions/checkout", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) })
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return {status: r.status, body: j}; }); })
      .then(function(res){
        if(res.body && res.body.checkoutUrl){ window.location.href = res.body.checkoutUrl; return; }
        payBtn.disabled = false; payBtn.textContent = label;
        if(res.status === 503 || res.status === 404){
          msg.innerHTML = "";
          msg.appendChild(document.createTextNode("Online betalen staat nog niet aan. "));
          var a = document.createElement("a"); a.href = mailFallback(); a.textContent = "Bestel via e-mail"; msg.appendChild(a);
        } else {
          msg.textContent = (res.body && res.body.error) || "Er ging iets mis. Probeer het opnieuw.";
        }
      })
      .catch(function(){ payBtn.disabled = false; payBtn.textContent = label; msg.textContent = "Geen verbinding. Probeer het opnieuw."; });
  });

  document.querySelectorAll(".sizes button").forEach(function(b){
    b.addEventListener("click", function(){
      document.querySelectorAll(".sizes button").forEach(function(x){ x.setAttribute("aria-pressed","false"); });
      b.setAttribute("aria-pressed","true");
      chosen = b.getAttribute("data-size");
      update();
    });
  });
  update();

  document.querySelectorAll(".thumbs button").forEach(function(t){
    t.addEventListener("click", function(){
      var im = t.querySelector("img"); if(!im || !main) return;
      main.removeAttribute("srcset");
      if(im.getAttribute("srcset")){ main.srcset = im.getAttribute("srcset"); main.sizes = "(max-width:900px) 100vw, 640px"; }
      main.src = im.currentSrc || im.src;
      document.querySelectorAll(".thumbs button").forEach(function(x){ x.removeAttribute("aria-current"); });
      t.setAttribute("aria-current","true");
    });
  });

  /* mobiel: vaste bestelbalk onderin zodra de bestelknop uit beeld is */
  var bar = document.getElementById("mobileBar"), mbBtn = document.getElementById("mbBtn");
  function toggleBar(){
    if(!bar) return;
    var formInView = form && !form.hidden && form.getBoundingClientRect().top < window.innerHeight && form.getBoundingClientRect().bottom > 0;
    var off = btn.getBoundingClientRect().bottom < 0 && !formInView;
    bar.classList.toggle("show", off); bar.setAttribute("aria-hidden", off ? "false" : "true");
  }
  window.addEventListener("scroll", toggleBar, {passive:true});
  toggleBar();
  if(mbBtn) mbBtn.addEventListener("click", function(e){
    e.preventDefault();
    if(C.sold) return;
    if(chosen){ openForm(); return; }
    document.querySelector(".size-head").scrollIntoView({behavior:"smooth", block:"center"});
  });
})();
</script>`;

  return shell({ title, description, canonical, ogImage, head: { css: PRODUCT_CSS }, body });
}

/* ---------- bedankpagina ---------- */

function thanksPage() {
  const formFields = ["bestelnummer", "product", "maat", "prijs", "verzending", "totaal", "naam", "email", "telefoon",
    "adres", "postcode", "plaats", "land", "mollie_id", "betaalmethode"];
  const body = `
<div class="wrap" style="max-width:720px;text-align:center;padding-top:110px">
  <p id="tCat" style="font-family:'Space Mono',monospace;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--toxin);margin-bottom:14px">Bestelling</p>
  <h1 id="tTitle" style="font-family:Archivo,sans-serif;font-weight:900;font-stretch:108%;font-size:clamp(34px,5vw,56px);line-height:1;text-transform:uppercase;margin-bottom:20px">Bedankt!</h1>
  <p id="tText" style="color:var(--bone-dim);margin-bottom:34px">We controleren je betaling…</p>
  <a class="btn" id="tBtn" href="/#collectie">Verder shoppen</a>
  <p style="color:var(--moss);font-size:14px;margin-top:28px">${site.email ? `Vragen? Mail <a href="mailto:${esc(site.email)}" style="color:var(--toxin)">${esc(site.email)}</a>` : ""}</p>
</div>
<!-- Netlify Forms: hier komen betaalde bestellingen binnen (ingevuld door de Mollie-webhook) -->
<form name="bestellingen" data-netlify="true" netlify-honeypot="bot-field" hidden>
  <input name="bot-field">
  ${formFields.map((f) => `<input name="${f}">`).join("\n  ")}
</form>
<script>
(function(){
  var id = new URLSearchParams(location.search).get("id");
  var cat = document.getElementById("tCat"), title = document.getElementById("tTitle"), text = document.getElementById("tText"), b = document.getElementById("tBtn");
  function show(c, t, x){ cat.textContent = c; title.textContent = t; text.textContent = x; }
  if(!id){ show("Bestelling", "Bedankt!", "Je ontvangt een bevestiging per e-mail zodra je betaling binnen is."); return; }
  var tries = 0;
  function check(){
    fetch("/.netlify/functions/order-status?id=" + encodeURIComponent(id)).then(function(r){ return r.json(); }).then(function(j){
      var ref = j.ref ? " (" + j.ref + ")" : "";
      if(j.status === "paid" || j.status === "authorized"){
        show("Bestelling ontvangen" + ref, "Bedankt — je venom is onderweg", "Je betaling is gelukt" + (j.product ? " voor " + j.product + (j.maat ? ", maat " + j.maat : "") : "") + ". Je krijgt een bevestiging per e-mail en we pakken je bestelling zo snel mogelijk in.");
      } else if(j.status === "open" || j.status === "pending"){
        if(tries++ < 6){ setTimeout(check, 2500); show("Even geduld" + ref, "Betaling wordt verwerkt", "We wachten op de bevestiging van je bank…"); return; }
        show("Bijna klaar" + ref, "Betaling wordt verwerkt", "Je bank heeft je betaling nog niet bevestigd. Zodra dat gebeurt krijg je een e-mail.");
      } else if(j.status === "canceled" || j.status === "expired" || j.status === "failed"){
        show("Niet betaald" + ref, "Betaling niet gelukt", "Er is niets afgeschreven. Wil je het opnieuw proberen?");
        b.textContent = "Opnieuw proberen"; b.href = j.slug ? "/product/" + j.slug + "/" : "/#collectie";
      } else {
        show("Bestelling", "Bedankt!", "Je ontvangt een bevestiging per e-mail zodra je betaling binnen is.");
      }
    }).catch(function(){ show("Bestelling", "Bedankt!", "Je ontvangt een bevestiging per e-mail zodra je betaling binnen is."); });
  }
  check();
})();
</script>`;
  return shell({ title: "Je bestelling | Dutch Venom", description: "Status van je bestelling bij Dutch Venom.",
    canonical: SITE_URL + "/bedankt/", ogImage: SITE_URL + "/images/og-image.jpg", body, noindex: true });
}

/* ---------- schrijven ---------- */

function write(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

fs.rmSync(path.join(ROOT, "product"), { recursive: true, force: true });
products.forEach((p, i) => write(`product/${p._slug}/index.html`, productPage(p, i)));
write("bedankt/index.html", thanksPage());

// Catalogus voor de Mollie-functies: prijzen komen hier vandaan, niet uit de browser.
const catalog = {
  site: shipping,
  products: products.map((p) => ({
    slug: p._slug, naam: p.naam, prijs: Number(p.prijs), uitverkocht: !!p.uitverkocht,
    maten: (Array.isArray(p.maten) && p.maten.length ? p.maten : ["S", "M", "L", "XL"]).map(String),
  })),
};
write("netlify/shared/catalog.mjs", "// Automatisch gemaakt door scripts/build.js — niet handmatig aanpassen.\nexport default " + JSON.stringify(catalog, null, 2) + ";\n");

const today = new Date().toISOString().slice(0, 10);
const urls = [SITE_URL + "/"].concat(products.map((p) => SITE_URL + p._url));
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);

console.log(`Gebouwd: ${products.length} productpagina's, /bedankt/, sitemap.xml, catalog.mjs`);
products.forEach((p) => console.log("  " + p._url));
