/*
 * Gedeelde code voor de Mollie-functies (checkout, webhook, order-status).
 * De Mollie API-sleutel staat NOOIT in de code: zet hem in Netlify als
 * omgevingsvariabele MOLLIE_API_KEY (test_... om te testen, live_... voor echt).
 */
import catalog from "./catalog.mjs"; // wordt gemaakt door scripts/build.js

export { catalog };

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function mollie(path, { method = "GET", body } = {}) {
  const res = await fetch("https://api.mollie.com/v2" + path, {
    method,
    headers: {
      Authorization: "Bearer " + process.env.MOLLIE_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && (data.detail || data.title)) || "Mollie-fout " + res.status);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Bedragen in centen om afrondingsfouten te voorkomen. */
export function totals(prijs, site) {
  const sub = Math.round(Number(prijs) * 100);
  const drempel = Math.round(Number(site.gratis_verzending_vanaf || 0) * 100);
  const kosten = Math.round(Number(site.verzendkosten || 0) * 100);
  const verzending = drempel > 0 && sub >= drempel ? 0 : kosten;
  return { sub, verzending, totaal: sub + verzending };
}

export const eur = (cents) => (cents / 100).toFixed(2); // "89.95" (Mollie-formaat)

export function orderRef() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return "DV-" + s;
}

const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

/** Controleert het bestelformulier. Geeft { order } of { error } terug. */
export function validateOrder(b) {
  if (!b || typeof b !== "object") return { error: "Ongeldige aanvraag." };
  if (b.website) return { error: "Ongeldige aanvraag." }; // honeypot tegen spam-bots

  const p = catalog.products.find((x) => x.slug === b.slug);
  if (!p) return { error: "Dit product bestaat niet (meer)." };
  if (p.uitverkocht) return { error: "Dit product is uitverkocht." };
  const maat = clean(b.maat, 20);
  if (!p.maten.includes(maat)) return { error: "Kies een geldige maat." };

  const o = {
    product: p,
    maat,
    naam: clean(b.naam, 80),
    email: clean(b.email, 120),
    telefoon: clean(b.telefoon, 25),
    adres: clean(b.adres, 120),
    postcode: clean(b.postcode, 12).toUpperCase(),
    plaats: clean(b.plaats, 60),
    land: clean(b.land, 2).toUpperCase(),
  };
  if (o.naam.length < 2) return { error: "Vul je naam in." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(o.email)) return { error: "Vul een geldig e-mailadres in." };
  if (o.adres.length < 4) return { error: "Vul je straat en huisnummer in." };
  if (o.plaats.length < 2) return { error: "Vul je woonplaats in." };
  if (!catalog.site.verzendlanden.includes(o.land)) return { error: "We verzenden (nog) niet naar dit land." };
  if (o.land === "NL" && !/^\d{4}\s?[A-Z]{2}$/.test(o.postcode)) return { error: "Vul een geldige postcode in (bijv. 1234 AB)." };
  if (o.land === "BE" && !/^\d{4}$/.test(o.postcode)) return { error: "Vul een geldige Belgische postcode in (4 cijfers)." };
  if (o.postcode.length < 3) return { error: "Vul je postcode in." };
  return { order: o };
}
