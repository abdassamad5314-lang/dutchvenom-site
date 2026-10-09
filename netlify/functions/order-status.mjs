/*
 * GET /.netlify/functions/order-status?id=tr_...
 * Voor de bedankpagina: geeft alleen de status, het bestelnummer en het product
 * terug (geen naam/adres).
 */
import { json, mollie } from "../shared/shop.mjs";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^tr_[A-Za-z0-9]+$/.test(id)) return json({ error: "Ongeldig ID." }, 400);
  if (!process.env.MOLLIE_API_KEY) return json({ error: "not_configured" }, 503);
  try {
    const p = await mollie(`/payments/${id}`);
    const m = p.metadata || {};
    return json({ status: p.status, ref: m.ref || "", product: m.product || "", maat: m.maat || "", slug: m.slug || "" });
  } catch (e) {
    return json({ error: "Niet gevonden." }, e.status === 404 ? 404 : 502);
  }
};
