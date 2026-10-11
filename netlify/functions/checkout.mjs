/*
 * POST /.netlify/functions/checkout
 * Maakt één Mollie-betaling aan voor de hele winkelmand en stuurt de betaal-URL
 * terug. Prijzen en verzendkosten komen uit de catalogus (niet uit de browser),
 * zodat niemand zelf een lagere prijs kan meesturen.
 */
import { catalog, json, mollie, totals, eur, orderRef, validateOrder, packItems } from "../shared/shop.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Methode niet toegestaan." }, 405);
  if (!process.env.MOLLIE_API_KEY) return json({ error: "not_configured" }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Ongeldige aanvraag." }, 400); }

  const { order, error } = validateOrder(body);
  if (error) return json({ error }, 400);

  const subCents = order.lines.reduce((n, l) => n + Math.round(l.product.prijs * 100) * l.aantal, 0);
  const t = totals(subCents, catalog.site);
  const ref = orderRef();
  const origin = new URL(req.url).origin; // werkt op dutchvenom.nl én op previews

  const aantal = order.lines.reduce((n, l) => n + l.aantal, 0);
  const summary = order.lines.map((l) => `${l.aantal}× ${l.product.naam} (${l.maat})`).join(", ");
  const metadata = {
    ref,
    items: packItems(order.lines),
    subtotaal: eur(t.sub),
    verzending: eur(t.verzending),
    totaal: eur(t.totaal),
    naam: order.naam,
    email: order.email,
    telefoon: order.telefoon,
    adres: order.adres,
    postcode: order.postcode,
    plaats: order.plaats,
    land: order.land,
  };
  if (Buffer.byteLength(JSON.stringify(metadata)) > 1000) {
    return json({ error: "Je bestelling is te groot voor één betaling. Splits hem in twee bestellingen." }, 400);
  }

  try {
    const payment = await mollie("/payments", {
      method: "POST",
      body: {
        amount: { currency: "EUR", value: eur(t.totaal) },
        description: `${ref} · ${aantal === 1 ? "" : aantal + " artikelen: "}${summary}`.slice(0, 255),
        redirectUrl: `${origin}/bedankt/`,
        webhookUrl: `${origin}/.netlify/functions/mollie-webhook`,
        locale: "nl_NL",
        metadata,
      },
    });

    // Betaal-ID in de terugkeer-URL zetten, zodat /bedankt/ de status kan tonen.
    try {
      await mollie(`/payments/${payment.id}`, {
        method: "PATCH",
        body: { redirectUrl: `${origin}/bedankt/?id=${encodeURIComponent(payment.id)}` },
      });
    } catch (e) {
      console.warn("redirectUrl bijwerken mislukt:", e.message); // niet erg: /bedankt/ toont dan een algemene tekst
    }

    const checkoutUrl = payment._links && payment._links.checkout && payment._links.checkout.href;
    if (!checkoutUrl) throw new Error("Geen betaal-URL ontvangen van Mollie.");
    return json({ checkoutUrl, ref });
  } catch (e) {
    console.error("Mollie checkout mislukt:", e.status, e.message);
    return json({ error: "Afrekenen lukt nu even niet. Probeer het zo nog eens of mail ons." }, 502);
  }
};
