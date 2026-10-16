/*
 * Dutch Venom — teksten voor de juridische pagina's (contact, retourneren,
 * algemene voorwaarden, privacyverklaring).
 *
 * CONCEPT: opgesteld als nette basis voor een kleine Nederlandse webshop, maar
 * geen juridisch advies. Laat dit nakijken (bijv. door een jurist of via een
 * branchevereniging) voordat je erop vertrouwt.
 *
 * Bedrijfsgegevens komen uit content/site.json (aan te passen via /admin).
 */
"use strict";

const BIJGEWERKT = "11 oktober 2026";

module.exports = function legal(site, h) {
  const { esc, euro, shipping, landenTekst } = h;
  const naam = esc(site.bedrijfsnaam || "Dutch Venom");
  const vorm = site.rechtsvorm ? " " + esc(site.rechtsvorm) : "";
  const email = esc(site.email || "");
  const mail = email ? `<a href="mailto:${email}">${email}</a>` : "";
  const adres = site.adres ? esc(site.adres).replace(/\n/g, "<br>") : `op aanvraag via ${mail}`;
  const landen = esc(landenTekst(shipping.verzendlanden));
  const verzend = shipping.verzendkosten > 0
    ? `${euro(shipping.verzendkosten)}${shipping.gratis_verzending_vanaf > 0 ? `, gratis vanaf ${euro(shipping.gratis_verzending_vanaf)}` : ""}`
    : "gratis";

  const gegevens = `<dl class="ids">
  <div><dt>Handelsnaam</dt><dd>${naam}${vorm}</dd></div>
  ${site.kvk ? `<div><dt>KvK-nummer</dt><dd>${esc(site.kvk)}</dd></div>` : ""}
  ${site.btw ? `<div><dt>Btw-identificatienummer</dt><dd>${esc(site.btw)}</dd></div>` : ""}
  <div><dt>E-mail</dt><dd>${mail}</dd></div>
  <div><dt>Adres</dt><dd>${adres}</dd></div>
  ${site.instagram ? `<div><dt>Instagram</dt><dd><a href="${esc(site.instagram)}" target="_blank" rel="noopener">${esc(site.instagram.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a></dd></div>` : ""}
</dl>`;

  const pages = {};

  pages.contact = {
    title: "Contact",
    lead: "Vragen over je bestelling, een maat of een retour? Mail ons, we helpen je graag.",
    body: `${gegevens}
<p>Vermeld bij vragen over een bestelling altijd je bestelnummer (begint met <strong>DV-</strong>). Dat staat in je bevestigingsmail.</p>`,
  };

  pages.retourneren = {
    title: "Retourneren & ruilen",
    lead: "Niet goed? Je hebt 14 dagen bedenktijd na ontvangst van je bestelling.",
    body: `
<h2>Bedenktijd</h2>
<p>Je hebt het recht om je aankoop binnen 14 dagen zonder opgave van redenen te herroepen. Die termijn gaat in op de dag nadat jij (of iemand namens jou) het product hebt ontvangen.</p>

<h2>Zo retourneer je</h2>
<ol>
  <li>Laat ons binnen 14 dagen na ontvangst weten dat je wilt retourneren: mail ${mail} met je bestelnummer en welk artikel het gaat. Je mag ook het modelformulier hieronder gebruiken.</li>
  <li>Je ontvangt van ons het retouradres.</li>
  <li>Stuur het artikel binnen 14 dagen na je melding terug, goed verpakt en het liefst in de originele verpakking.</li>
</ol>

<h2>Staat van het artikel</h2>
<p>Je mag het artikel passen zoals je dat in een winkel zou doen. Stuur het ongedragen terug, met de labels er nog aan. Is het artikel gedragen, gewassen of beschadigd, of zijn de labels verwijderd, dan kunnen we een bedrag inhouden voor de waardevermindering.</p>

<h2>Kosten</h2>
<p>De kosten voor het terugsturen zijn voor eigen rekening. Bewaar je verzendbewijs tot je je geld terug hebt.</p>

<h2>Terugbetaling</h2>
<p>We betalen het aankoopbedrag terug, inclusief de verzendkosten die je bij je bestelling hebt betaald, uiterlijk binnen 14 dagen nadat je de retour hebt gemeld. We mogen wachten met terugbetalen tot we het artikel hebben ontvangen of tot je aantoont dat je het hebt teruggestuurd. We betalen terug via dezelfde betaalmethode die je hebt gebruikt.</p>

<h2>Ruilen</h2>
<p>Liever een andere maat? Mail ons binnen 14 dagen na ontvangst. Ruilen kan als het artikel ongedragen is en de labels er nog aan zitten, en zolang de gewenste maat op voorraad is.</p>

<h2>Modelformulier voor herroeping</h2>
<div class="formbox">
<p>(Dit formulier alleen invullen en terugsturen als je de overeenkomst wilt herroepen.)</p>
<p>Aan: ${naam}${vorm}, ${mail}${site.adres ? ", " + esc(site.adres).replace(/\n/g, ", ") : ""}</p>
<p>Ik deel u hierbij mede dat ik onze overeenkomst betreffende de verkoop van de volgende producten herroep:</p>
<p>Bestelnummer: ………………………<br>
Product(en) en maat: ………………………<br>
Besteld op / ontvangen op: ………………………<br>
Naam: ………………………<br>
Adres: ………………………<br>
IBAN (voor terugbetaling, indien nodig): ………………………<br>
Datum: ………………………<br>
Handtekening (alleen bij een papieren formulier): ………………………</p>
</div>`,
  };

  pages.voorwaarden = {
    title: "Algemene voorwaarden",
    lead: `Deze voorwaarden gelden voor alle bestellingen bij ${naam} via deze website.`,
    body: `
<h2>1. Wie wij zijn</h2>
${gegevens}

<h2>2. Toepasselijkheid</h2>
<p>Deze algemene voorwaarden zijn van toepassing op ieder aanbod van ${naam} en op iedere overeenkomst die via deze website tot stand komt. Je kunt ze op deze pagina lezen en opslaan voordat je bestelt. Dwingende wettelijke rechten die je als consument hebt, gaan altijd voor.</p>

<h2>3. Aanbod</h2>
<p>We beschrijven onze producten zo nauwkeurig mogelijk. Kleuren op foto's kunnen door schermverschillen iets afwijken. Kennelijke vergissingen of fouten in het aanbod (zoals een duidelijk verkeerde prijs) binden ons niet. Producten worden aangeboden zolang de voorraad strekt.</p>

<h2>4. De overeenkomst</h2>
<p>De overeenkomst komt tot stand zodra je de bestelling hebt afgerond en betaald. Je ontvangt een bevestiging per e-mail. Als een product onverwacht toch niet leverbaar is, laten we dat zo snel mogelijk weten en betalen we het betaalde bedrag binnen 14 dagen terug.</p>

<h2>5. Prijzen en betaling</h2>
<p>Alle prijzen zijn in euro en inclusief btw. Verzendkosten worden vóór het afrekenen getoond: ${esc(verzend)}. Je betaalt vooraf via onze betaalpartner Mollie, onder andere met iDEAL. We verzenden pas als je betaling is ontvangen.</p>

<h2>6. Levering</h2>
<p>We verzenden naar ${landen}. We leveren zo snel mogelijk, uiterlijk binnen 30 dagen na je bestelling, tenzij we samen iets anders afspreken. Lukt dat niet, dan mag je de bestelling kosteloos annuleren en krijg je je geld binnen 14 dagen terug. Het risico van verlies of beschadiging gaat op jou over op het moment dat je het pakket ontvangt.</p>

<h2>7. Herroepingsrecht (bedenktijd)</h2>
<p>Je hebt 14 dagen bedenktijd na ontvangst. Hoe dat werkt, wat het kost en wanneer je je geld terugkrijgt, staat op de pagina <a href="/retourneren/">Retourneren &amp; ruilen</a>. Die pagina hoort bij deze voorwaarden.</p>

<h2>8. Garantie en klachten</h2>
<p>Onze producten moeten voldoen aan wat je er redelijkerwijs van mag verwachten. Is er iets mis met je bestelling, dan heb je recht op wettelijke garantie (herstel, vervanging of geld terug). Meld een gebrek zo snel mogelijk nadat je het hebt ontdekt, het liefst binnen 2 maanden, via ${mail}, met een omschrijving en foto's. We reageren zo snel mogelijk en uiterlijk binnen 14 dagen inhoudelijk.</p>

<h2>9. Aansprakelijkheid</h2>
<p>We zijn niet aansprakelijk voor schade door verkeerd gebruik of onderhoud van een product, of door normale slijtage. Dit laat je wettelijke rechten als consument onverlet.</p>

<h2>10. Privacy</h2>
<p>We gaan zorgvuldig om met je gegevens. Lees onze <a href="/privacy/">privacyverklaring</a>.</p>

<h2>11. Toepasselijk recht en geschillen</h2>
<p>Op alle overeenkomsten is Nederlands recht van toepassing. Kom je er met ons niet uit, dan kun je het geschil voorleggen aan de bevoegde rechter. Als consument behoud je daarbij de bescherming van de dwingende regels van het land waar je woont.</p>

<h2>12. Wijzigingen</h2>
<p>We kunnen deze voorwaarden aanpassen. Op je bestelling zijn altijd de voorwaarden van toepassing die golden op het moment dat je bestelde.</p>

<p class="upd">Laatst bijgewerkt: ${BIJGEWERKT}</p>`,
  };

  pages.privacy = {
    title: "Privacyverklaring",
    lead: `In deze verklaring lees je welke gegevens ${naam} verwerkt, waarom, en welke rechten je hebt.`,
    body: `
<h2>Wie is verantwoordelijk?</h2>
${gegevens}

<h2>Welke gegevens en waarvoor?</h2>
<ul>
  <li><strong>Bestellen:</strong> naam, e-mailadres, bezorgadres, eventueel telefoonnummer, de producten die je bestelt en het bestelnummer. Nodig om je bestelling te verwerken, te verzenden en je op de hoogte te houden (uitvoering van de overeenkomst).</li>
  <li><strong>Betalen:</strong> je betaling loopt via Mollie. Wij zien alleen of de betaling gelukt is en met welke methode, niet je volledige bankgegevens.</li>
  <li><strong>Administratie:</strong> bestel- en betaalgegevens bewaren we 7 jaar, omdat de wet (fiscale bewaarplicht) dat verplicht.</li>
  <li><strong>Nieuwsbrief:</strong> alleen als je je inschrijft bewaren we je e-mailadres om je te informeren over nieuwe drops (toestemming). Uitschrijven kan altijd via ${mail}; we verwijderen je adres dan.</li>
  <li><strong>Contact:</strong> als je ons mailt, gebruiken we je bericht en e-mailadres om je te antwoorden.</li>
</ul>

<h2>Met wie delen we gegevens?</h2>
<p>We verkopen je gegevens nooit. We delen ze alleen met partijen die nodig zijn om onze webshop te laten werken:</p>
<ul>
  <li><strong>Mollie</strong> (betalingen, Nederland);</li>
  <li><strong>Netlify</strong> (hosting van de website en verwerking van bestel- en inschrijfformulieren). Netlify is een Amerikaans bedrijf; gegevens kunnen daardoor buiten de EU worden verwerkt, met de wettelijk vereiste waarborgen;</li>
  <li><strong>de vervoerder</strong> die je pakket bezorgt (naam en bezorgadres);</li>
  <li>overheidsinstanties als de wet ons daartoe verplicht.</li>
</ul>

<h2>Cookies en opslag in je browser</h2>
<p>We gebruiken geen tracking- of advertentiecookies. Je winkelmandje wordt alleen in je eigen browser bewaard (lokale opslag), zodat het niet leeg is als je later terugkomt. Die gegevens blijven op je eigen apparaat.</p>
<p>Voor de lettertypes van de website gebruiken we Google Fonts. Bij het laden van een pagina maakt je browser daarvoor verbinding met servers van Google, waarbij je IP-adres wordt doorgegeven. We zijn van plan de lettertypes binnenkort op onze eigen server te zetten; deze verklaring passen we dan aan.</p>

<h2>Hoe lang bewaren we je gegevens?</h2>
<p>Niet langer dan nodig: bestel- en betaalgegevens 7 jaar (wettelijke plicht), nieuwsbriefgegevens tot je je uitschrijft, e-mailcontact zolang nodig om je vraag af te handelen.</p>

<h2>Beveiliging</h2>
<p>De website gebruikt een beveiligde verbinding (https). Betalingen lopen via de beveiligde omgeving van Mollie. Toegang tot bestelgegevens is beperkt tot wie ze nodig heeft om je bestelling af te handelen.</p>

<h2>Jouw rechten</h2>
<p>Je hebt het recht om je gegevens in te zien, te laten corrigeren of verwijderen, de verwerking te beperken, bezwaar te maken en je gegevens over te laten dragen. Mail je verzoek naar ${mail}; we reageren binnen een maand. Ben je niet tevreden over hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.</p>

<p class="upd">Laatst bijgewerkt: ${BIJGEWERKT}</p>`,
  };

  return pages;
};
