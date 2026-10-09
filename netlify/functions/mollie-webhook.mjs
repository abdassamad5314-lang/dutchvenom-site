/*
 * POST /.netlify/functions/mollie-webhook   (wordt aangeroepen door Mollie)
 * Mollie stuurt alleen een betaal-ID; we halen de betaling zelf op bij Mollie
 * (zo kan niemand een nep-melding sturen). Is hij betaald, dan wordt de
 * bestelling als formulier "bestellingen" in Netlify Forms gezet → jij krijgt
 * een e-mail met product, maat en adres.
 */
import { mollie } from "../shared/shop.mjs";

const ok = () => new Response("", { status: 200 });

export default async (req) => {
  if (req.method !== "POST" || !process.env.MOLLIE_API_KEY) return ok();

  const id = new URLSearchParams(await req.text()).get("id") || "";
  if (!/^tr_[A-Za-z0-9]+$/.test(id)) return ok();

  let payment;
  try {
    payment = await mollie(`/payments/${id}`);
  } catch (e) {
    console.error("Betaling ophalen mislukt:", e.status, e.message);
    return new Response("", { status: 500 }); // Mollie probeert het later opnieuw
  }

  const m = payment.metadata || {};
  if (payment.status !== "paid" || m.gemeld) return ok();

  const origin = new URL(req.url).origin;
  const fields = {
    "form-name": "bestellingen",
    bestelnummer: m.ref || "",
    product: m.product || payment.description || "",
    maat: m.maat || "",
    prijs: m.prijs || "",
    verzending: m.verzending || "",
    totaal: (payment.amount && payment.amount.value) || m.totaal || "",
    naam: m.naam || "",
    email: m.email || "",
    telefoon: m.telefoon || "",
    adres: m.adres || "",
    postcode: m.postcode || "",
    plaats: m.plaats || "",
    land: m.land || "",
    mollie_id: payment.id,
    betaalmethode: payment.method || "",
  };

  try {
    const res = await fetch(`${origin}/bedankt/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString(),
    });
    if (!res.ok) throw new Error("Netlify Forms antwoordde " + res.status);
  } catch (e) {
    console.error("Bestelling doorsturen mislukt:", e.message);
    return new Response("", { status: 500 }); // opnieuw proberen
  }

  // Markeren als gemeld, zodat je bij latere meldingen (bijv. terugbetaling) geen dubbele mail krijgt.
  try {
    await mollie(`/payments/${id}`, { method: "PATCH", body: { metadata: { ...m, gemeld: true } } });
  } catch (e) {
    console.warn("Markeren als gemeld mislukt:", e.message);
  }
  return ok();
};
