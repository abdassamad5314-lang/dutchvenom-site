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

## Productpagina's & bestellen (Stripe / iDEAL)

Elk product heeft een eigen pagina op `/product/<naam-van-het-product>/`, met foto's, maatkeuze en een bestelknop. Die pagina's worden bij elke publicatie automatisch opnieuw gemaakt (door `scripts/build.js`), dus een nieuw product in het admin-paneel krijgt vanzelf een pagina.

**Hoe de bestelknop werkt**
- Klant kiest een maat → knop "Bestellen" → betaalpagina van Stripe (iDEAL, creditcard, Apple Pay).
- Heeft een maat (nog) geen betaallink, dan wordt de knop "Bestel via e-mail" en opent er een mail met product en maat.
- Uitverkocht aangevinkt = knop uitgeschakeld.

**Eenmalig instellen in Stripe**
1. Maak een account op stripe.com en rond de verificatie af (bedrijfsgegevens, KvK, bankrekening).
2. Settings → Payment methods → zet **iDEAL** aan (en eventueel Bancontact voor België).
3. Settings → Notifications → zet e-mail aan bij geslaagde betalingen, zodat je elke bestelling meteen ziet.

**Per product en per maat een betaallink maken**
1. Stripe-dashboard → **Payment Links** → **New**.
2. Product toevoegen met de maat in de naam, bijv. *DV Signature Tracksuit — Black — M*, prijs €89,95.
3. Bij de opties: **Collect customers' addresses** → verzendadres, landen Nederland (en België).
4. Verzendkosten: voeg een verzendtarief toe als het product onder de gratis-verzendgrens valt (bijv. de tas).
5. Tabblad **After payment** → kies doorsturen naar je eigen pagina: `https://www.dutchvenom.nl/bedankt/`.
6. Optioneel bij limited drops: beperk het aantal betalingen per link (= je voorraad voor die maat).
7. Kopieer de link (`https://buy.stripe.com/...`).

**Link invullen**: admin-paneel → Producten → product → *Betaallinks per maat (Stripe)* → maat kiezen + link plakken → Publish.

In Stripe zie je bij elke betaling ook een *client reference ID* zoals `dv-men-signature-tracksuit-black-M` (product + maat) als extra controle.

## Video's (Higgsfield-workflow)

De site ondersteunt video op twee plekken, beide via het admin-paneel:

1. **Hero-video**: Site-instellingen → "Hero video" → upload een mp4. Speelt fullscreen achter de titel (automatisch, zonder geluid, in loop). Leeg laten = standaard achtergrond.
2. **Productvideo**: bij elk product optioneel een mp4 uploaden. De kaart toont dan de video i.p.v. de foto; de foto blijft als voorvertoning.

Workflow: maak je clip in Higgsfield → download als mp4 → upload in het paneel → Publish. Tips: exporteer productvideo's in 4:5 of 9:16, de hero in 16:9, en houd bestanden klein (hero <15MB, product <8MB) voor snelle laadtijd.

## Belangrijk om te weten

- **Snelste route zonder admin**: de map direct naar Netlify slepen (drag & drop op app.netlify.com/drop) laat de site werken, maar dan werkt het admin-paneel niet — dat vereist de GitHub-route hierboven.
- **Bestellingen/afrekenen**: zie "Productpagina's & bestellen" hierboven. De bundels hebben nog een eigen link-veld (bijv. ook een Stripe-betaallink).
- **OG-afbeelding**: `images/og-image.jpg` (1200×630px) is het deel-plaatje op social media. Vervang het bestand om het te wijzigen.
- **Google Search Console**: meld je site aan op search.google.com/search-console en dien `sitemap.xml` in voor snellere indexering.
