# Lillestrøm Øyeklinikk – nettside

Statisk nettside uten Wix:
- Koden ligger i GitHub.
- Netlify publiserer mappen `site/` automatisk når hovedgrenen (`main`) endres.
- Domenet ligger hos Domeneshop.
- Endringer lages av en Grok-bot som pull requests. Det er alltid Rafaqat som godkjenner.

## Innhold

| Mappe / fil | Hva | Offentlig? |
|---|---|---|
| `site/` | Selve nettsiden: `index.html`, `styles.css`, `script.js`, `assets/`, `pdf/`, `_redirects`, `_headers`, `robots.txt`, `sitemap.xml` | Ja |
| `tester/` | Automatisk test som boten kjører før hver pull request | Nei |
| `grok/SKILL.md` | Instruksjonene til Grok-boten (kopi, den aktive versjonen ligger i Grok) | Nei |
| `netlify.toml` | Sier til Netlify at bare `site/` skal publiseres | – |

## Del 1: Flytt nettsiden fra Wix, uten nedetid

### 1. Hent PDF-ene fra Wix først
De ligger på Wix sin server og forsvinner når abonnementet sies opp. Last ned og lagre dem i `site/pdf/`:

| Last ned fra | Lagre som |
|---|---|
| https://www.lillestromoyeklinikk.no/_files/ugd/bc34f1_0f165ed5f4b74647bc49ed4d7588df5c.pdf | `site/pdf/lysglimt-flekker-synsfelt.pdf` |
| https://www.lillestromoyeklinikk.no/_files/ugd/bc34f1_7ea300e0a05e437fbf7af59c7a85a7d4.pdf | `site/pdf/varme-og-massasje-oyelokk.pdf` |

### 2. GitHub-repo
1. Lag repoet `lillestrom-oyeklinikk-nettside` på **din** konto.
2. Velg **offentlig** (public). Alt i `site/` er offentlig på nettet uansett, og repoet inneholder ingen hemmeligheter. Beskyttelse av hovedgrenen er bare gratis for offentlige repoer. Vil du ha det privat, trenger du GitHub Pro.
3. **Add file → Upload files**, og dra inn innholdet i denne pakken, ikke selve mappen. Last opp PDF-ene til `site/pdf/`.

### 3. Netlify
1. **Add new site → Import an existing project → GitHub**, og velg repoet. Bruk din egen konto.
2. Build command: tomt. Publish directory: settes automatisk til `site` fra `netlify.toml`.
3. Sjekk at **Deploy Previews** står på. Da får hver pull request sin egen forhåndsvisning.
4. Deploy, og sjekk siden på adressen som slutter på `.netlify.app`, på både mobil og PC.

### 4. Domenet
1. Netlify → **Domain management → Add a domain**: `www.lillestromoyeklinikk.no`. Sett den som **primary domain**.
2. Legg til `lillestromoyeklinikk.no` og `xn--lillestrmyeklinikk-n4bb.no` (det er lillestrømøyeklinikk.no). Begge sendes automatisk videre til hovedadressen.
3. Hos Domeneshop, sjekk først hvilke **navnetjenere** domenet bruker. Peker de til Wix, skriv av alle postene der, særlig MX (e-post) og TXT, før du bytter til Domeneshops navnetjenere.
4. DNS-poster hos Domeneshop, for begge domener:

| Vert | Type | Verdi |
|---|---|---|
| *(tom)* / `@` | A | `75.2.60.5` |
| `www` | CNAME | `<ditt-navn>.netlify.app` |

   Slett gamle A- og CNAME-poster som peker til Wix. **Ikke rør MX- eller TXT-poster.**

### 5. Avslutt
1. Vent til Netlify viser grønt og har laget HTTPS-sertifikat. Det tar vanligvis minutter, men kan ta opptil et døgn.
2. Google Search Console: verifiser på nytt med en TXT-post hos Domeneshop, og send inn `https://www.lillestromoyeklinikk.no/sitemap.xml`.
3. Når siden har virket i en uke: si opp Wix Premium. Domenene beholdes hos Domeneshop.

## Del 2: Sett opp Grok-boten trygt

**Hovedregel:** boten skal ha sin **egen** GitHub-konto, ikke din. Er Grok logget inn som deg, har den samme rettigheter som deg. Den kan da godkjenne og publisere sine egne endringer, og den kan fjerne sperrene. Med egen konto kan den bare foreslå endringer, fordi ingen kan godkjenne sin egen pull request på GitHub.

1. **Lag en bot-konto på GitHub**, for eksempel `lillestrom-nettside-bot`. Gi den en egen e-postadresse og slå på tofaktorinnlogging.
2. **Inviter bot-kontoen til repoet:** repoet → Settings → Collaborators → Add people. Logg inn som bot-kontoen og godta invitasjonen.
3. **Sperr hovedgrenen:** repoet → Settings → Branches → Add branch protection rule:
   - Branch name pattern: `main`
   - ✅ Require a pull request before merging
   - ✅ Require approvals: **1**
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - La «Do not allow bypassing the above settings» stå **av**. Da kan bare du, som administrator, rette noe direkte i en nødsituasjon.
4. **I Grok:** logg inn på GitHub i Groks nettleser og med `gh auth login` **som bot-kontoen**. Aldri som deg selv.
5. **Legg inn ferdigheten:** `grok/SKILL.md` legges inn som ferdighet i boten.
6. **Første test:** be boten om en liten endring, for eksempel å oppdatere «Sist oppdatert» i bunnen. Sjekk at den lager en gren og en pull request, at Netlify viser en forhåndsvisning, og at boten ikke klarer å slå sammen endringen selv.

## Slik godkjenner du en endring
1. Boten sier fra og sender lenke til pull requesten og forhåndsvisningen fra Netlify.
2. Åpne forhåndsvisningen på mobilen og se at alt er riktig.
3. GitHub → pull requesten → **Files changed** → **Review changes → Approve** → **Merge pull request**.
4. Netlify publiserer på et par minutter.

**Angre:** Be boten lage en pull request som reverserer endringen. I en nødsituasjon kan du også gå til Netlify → Deploys → forrige versjon → **Publish deploy**.

## Personvern
Siden har ingen informasjonskapsler eller sporing og henter ingenting fra andre nettsteder, så den trenger ikke samtykkebanner. Legger du senere inn analyseverktøy, chat, innebygd video eller kart, trengs samtykke. En kort personvernerklæring anbefales likevel.
