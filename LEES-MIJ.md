# Dutch Venom — Website template

Complete website voor dutchvenom.nl met admin-paneel om zelf producten, prijzen, bundels, foto's en video's aan te passen. Geen code nodig na installatie.

## Wat zit erin

- `index.html` — de complete website (SEO-geoptimaliseerd, mobiel-vriendelijk, scroll-animaties, bundel-scenes)
- `content/products.json` — je losse producten
- `content/bundles.json` — je bundels/aanbiedingen (bijv. pak + tas)
- `content/site.json` — alle teksten, logo en hero-video van de site
- `admin/` — het beheerpaneel (bereikbaar op jouwsite.nl/admin na installatie)
- `images/` — placeholder productfoto's (vervang deze via het admin-paneel)
- `netlify.toml`, `robots.txt`, `sitemap.xml` — hosting- en SEO-instellingen
- `scripts/build.js` — maakt bij elke publicatie de productpagina's, de bedankpagina en de sitemap
- `netlify/functions/` — afrekenen via Mollie (checkout, webhook, betaalstatus)

## ⚠️ Belangrijkste valkuil bij het uploaden

Zorg dat je **de inhoud** van deze map naar GitHub/Netlify sleept, niet de map "dutchvenom" zelf. Ga eerst in de map staan (dubbelklikken totdat je `index.html`, `admin`, `content`, `images` etc. rechtstreeks ziet), selecteer die 8 items met Ctrl/Cmd+A, en sleep pas dán. 

Controle achteraf: kijk in GitHub of Netlify's deploy file browser — je moet daar direct `index.html`, `admin`, `content`, `images` zien staan. Zie je bovenaan nog een map "dutchvenom /" waar je eerst op moet klikken? Dan staat alles één laag te diep en werkt de site niet (producten/bundels laden dan niet, `/content/bundles.json` geeft "not found").

## Installatie (eenmalig, ±15 minuten)

Het admin-paneel werkt via GitHub + Netlify. Volg deze stappen één keer:

1. **GitHub**: maak een gratis account op github.com en maak een nieuwe repository (bijv. "dutchvenom-site"). Klik "uploading an existing file" en sleep de **inhoud** van deze map erin (zie waarschuwing hierboven).
2. **Netlify**: maak een gratis account op netlify.com → "Add new site" → "Import an existing project" → kies je GitHub-repository. Build command en publish directory worden automatisch uit `netlify.toml` gehaald. Klik Deploy. Je site staat nu live op een netlify.app-adres.
3. **Admin activeren**: in Netlify ga je naar Site configuration → Identity → klik "Enable Identity". Daarna: Identity → Services → klik "Enable Git Gateway".
4. **Jezelf uitnodigen**: Identity → "Invite users" → vul je eigen e-mailadres in. Open de mail en stel een wachtwoord in.
5. **Klaar**: ga naar `jouwsite.netlify.app/admin` en log in. Je ziet nu "Bundels", "Producten" en "Site-instellingen".

### Eigen domein (dutchvenom.nl)

In Netlify: Domain management → Add custom domain → volg de stappen om dutchvenom.nl te koppelen (DNS aanpassen bij je domeinregistrar, bijv. STRATO). SSL (https) wordt automatisch geregeld. Kan tot 24-48 uur duren om overal door te werken.

## Producten & bundels beheren (daarna, altijd)

1. Ga naar jouwsite.nl/admin en log in
2. **Producten**: toevoegen, prijs wijzigen, foto/video uploaden, uitverkocht aanzetten
3. **Bundels**: bundelprijs, doorgestreepte prijs, beide foto's, badge-tekst, knoptekst en link. "Actief" uitzetten = bundel verbergen zonder te verwijderen
4. Klik "Publish" — binnen ±1 minuut staat het live

Foto's/video's upload je direct in het paneel; ze komen automatisch in `images/uploads/` terecht.

## Productpagina's & bestellen (Mollie / iDEAL)

Elk product heeft een eigen pagina op `/product/<naam-van-het-product>/`, met foto's, maatkeuze en een bestelformulier. Die pagina's worden bij elke publicatie automatisch opnieuw gemaakt (door `scripts/build.js`), dus een nieuw product in het admin-paneel krijgt vanzelf een pagina.

**Hoe bestellen werkt**
1. Klant kiest een maat → "In winkelmand". Rechtsboven in de menubalk telt het mandje mee.
2. In de winkelmand (`/winkelmand/`) past de klant aantallen aan of haalt artikelen weg, ziet subtotaal, verzendkosten en totaal, en vult naam, e-mail en bezorgadres in.
3. De site maakt via Mollie één betaling aan voor de hele winkelmand. De prijzen en verzendkosten komen uit het admin-paneel, niet uit de browser.
4. Klant betaalt bij Mollie en komt terug op `/bedankt/`, die laat zien of de betaling gelukt is. Na een geslaagde betaling wordt het mandje leeggemaakt; bij een mislukte betaling blijft het staan.
5. Zodra Mollie meldt dat er betaald is, komt de bestelling (alle artikelen met maat en aantal, adres, bedragen, bestelnummer) binnen in Netlify bij **Forms → bestellingen**, met een e-mail als je dat hebt ingesteld.

Het mandje wordt in de browser van de klant bewaard (ook als die de site sluit en later terugkomt). Maximaal 10 verschillende artikelen en 10 stuks per artikel per bestelling.

In het Mollie-dashboard zie je bij elke betaling ook het bestelnummer en de artikelen in de omschrijving, en alle klantgegevens bij de metadata.

**Eenmalig instellen**
1. **Mollie**: Dashboard → Developers → API keys. Kopieer eerst de **Test API key** (`test_...`).
2. **Netlify**: Site configuration → Environment variables → Add a variable:
   - Key: `MOLLIE_API_KEY`
   - Value: de test-sleutel
   Daarna: Deploys → Trigger deploy → Deploy site.
3. **Netlify Forms aanzetten**: Forms → *Enable form detection*. Deploy daarna nog één keer (Trigger deploy).
4. **Mail bij elke bestelling**: Site configuration → Notifications → Emails and webhooks → Form submission notifications → *Add notification* → e-mail → formulier `bestellingen`.
5. **Test**: doe een bestelling op de site. In testmodus kies je bij Mollie zelf de uitkomst (betaald / mislukt). Controleer of `/bedankt/` klopt en of de bestelling in Netlify Forms staat.
6. **Live gaan**: vervang in Netlify de waarde van `MOLLIE_API_KEY` door je **Live API key** (`live_...`) en deploy opnieuw. Je Mollie-account moet daarvoor volledig geactiveerd zijn.

Zet de API-sleutel nooit in een bestand of in het admin-paneel: alleen in de omgevingsvariabelen van Netlify.

**Verzendkosten en verzendlanden** stel je in via admin → Site-instellingen.

Zolang `MOLLIE_API_KEY` niet is ingesteld, toont het formulier "Online betalen staat nog niet aan" met een link om via e-mail te bestellen.

## Video's (Higgsfield-workflow)

De site ondersteunt video op twee plekken, beide via het admin-paneel:

1. **Hero-video**: Site-instellingen → "Hero video" → upload een mp4. Speelt fullscreen achter de titel (automatisch, zonder geluid, in loop). Leeg laten = standaard achtergrond.
2. **Productvideo**: bij elk product optioneel een mp4 uploaden. De kaart toont dan de video i.p.v. de foto; de foto blijft als voorvertoning.

Workflow: maak je clip in Higgsfield → download als mp4 → upload in het paneel → Publish. Tips: exporteer productvideo's in 4:5 of 9:16, de hero in 16:9, en houd bestanden klein (hero <15MB, product <8MB) voor snelle laadtijd.

## Belangrijk om te weten

- **Snelste route zonder admin**: de map direct naar Netlify slepen (drag & drop op app.netlify.com/drop) laat de site werken, maar dan werkt het admin-paneel niet — dat vereist de GitHub-route hierboven.
- **Bestellingen/afrekenen**: zie "Productpagina's & bestellen" hierboven. De bundels hebben nog een eigen link-veld; afrekenen voor bundels via Mollie volgt nog.
- **OG-afbeelding**: `images/og-image.jpg` (1200×630px) is het deel-plaatje op social media. Vervang het bestand om het te wijzigen.
- **Google Search Console**: meld je site aan op search.google.com/search-console en dien `sitemap.xml` in voor snellere indexering.
