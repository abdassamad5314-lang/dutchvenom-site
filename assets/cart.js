/*
 * Dutch Venom — winkelmandje
 * Bewaart het mandje in de browser van de klant (localStorage), toont de teller
 * in de menubalk en geeft een melding bij "In winkelmand".
 * Prijzen staan hier bewust NIET in: die rekent de server (checkout-functie) zelf uit.
 */
(function () {
  "use strict";
  var KEY = "dv_cart_v1";
  var MAX_LINES = 10, MAX_QTY = 10;

  function valid(x) {
    return x && typeof x.slug === "string" && x.slug && typeof x.maat === "string" && x.maat &&
      typeof x.aantal === "number" && x.aantal >= 1 && x.aantal <= MAX_QTY && Math.floor(x.aantal) === x.aantal;
  }
  function read() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(a) ? a.filter(valid).slice(0, MAX_LINES) : [];
    } catch (e) { return []; }
  }
  function write(a) {
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { /* privé-venster: mandje werkt dan alleen deze pagina */ memory = a; }
    emit();
  }
  var memory = null;
  function items() { return memory || read(); }

  function count() {
    return items().reduce(function (n, x) { return n + x.aantal; }, 0);
  }
  function emit() {
    var n = count();
    var els = document.querySelectorAll("[data-cart-count]");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = n > 9 ? "9+" : String(n);
      els[i].hidden = n === 0;
    }
    var links = document.querySelectorAll(".cart-link");
    for (var j = 0; j < links.length; j++) {
      links[j].setAttribute("aria-label", n ? "Winkelmand, " + n + (n === 1 ? " artikel" : " artikelen") : "Winkelmand, leeg");
    }
    try { document.dispatchEvent(new CustomEvent("dvcart", { detail: { count: n } })); } catch (e) {}
  }

  function add(slug, maat, aantal) {
    aantal = aantal || 1;
    var a = items(), found = null;
    for (var i = 0; i < a.length; i++) if (a[i].slug === slug && a[i].maat === maat) found = a[i];
    if (found) {
      found.aantal = Math.min(MAX_QTY, found.aantal + aantal);
    } else {
      if (a.length >= MAX_LINES) return { ok: false, error: "Je winkelmand zit vol (max. " + MAX_LINES + " verschillende artikelen)." };
      a.push({ slug: slug, maat: maat, aantal: Math.min(MAX_QTY, aantal) });
    }
    write(a);
    return { ok: true };
  }
  function setQty(slug, maat, aantal) {
    var a = items().map(function (x) {
      if (x.slug === slug && x.maat === maat) x.aantal = Math.max(1, Math.min(MAX_QTY, aantal));
      return x;
    });
    write(a);
  }
  function remove(slug, maat) {
    write(items().filter(function (x) { return !(x.slug === slug && x.maat === maat); }));
  }
  function clear() { write([]); }

  /* melding rechtsonder (of onderaan op mobiel) */
  var toastEl, toastTimer;
  function toast(text, linkText, linkHref) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "dv-toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = "";
    var p = document.createElement("p"); p.textContent = text; toastEl.appendChild(p);
    if (linkText) {
      var row = document.createElement("div"); row.className = "dv-toast-actions";
      var a = document.createElement("a"); a.href = linkHref; a.textContent = linkText; a.className = "dv-toast-go";
      var b = document.createElement("button"); b.type = "button"; b.textContent = "Verder shoppen";
      b.addEventListener("click", function () { toastEl.classList.remove("show"); });
      row.appendChild(a); row.appendChild(b); toastEl.appendChild(row);
    }
    // eslint-disable-next-line no-unused-expressions
    toastEl.offsetWidth;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 6000);
  }

  window.addEventListener("storage", function (e) { if (e.key === KEY) emit(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", emit); else emit();

  window.DVCart = { items: items, count: count, add: add, setQty: setQty, remove: remove, clear: clear, toast: toast, MAX_QTY: MAX_QTY };
})();
