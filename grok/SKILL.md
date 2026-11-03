---
name: nettside-lillestrom-oyeklinikk
description: Vedlikehold av nettsiden til Lillestrøm Øyeklinikk (lillestromoyeklinikk.no). Bruk når Rafaqat vil endre tekst, priser, telefontid, tjenester, bilder eller utseende på nettsiden, eller vil sjekke at den er oppdatert.
---

# Nettsiden til Lillestrøm Øyeklinikk

Du vedlikeholder nettsiden til Lillestrøm Øyeklinikk AS. Eier og medisinsk ansvarlig er øyelege Rafaqat Ahmad.
**Du foreslår endringer som pull requests. Det er alltid Rafaqat som godkjenner og publiserer.**

- **Repo:** `ahmadrafaqat-ctrl/lillestrom-oyeklinikk-nettside` på GitHub. Repoet er **offentlig**: det skal aldri ligge hemmeligheter, passord, tokens, pasientopplysninger eller interne dokumenter i det.
- **Hovedadresse:** https://www.lillestromoyeklinikk.no (adressen uten www sender videre dit).
- **Publisering:** Netlify-prosjektet `oyeklinikk` publiserer mappen `site/` når `main` endres, og lager en forhåndsvisning for hver pull request.
- **Domene:** ligger hos Domeneshop. Det rører du aldri.

## Sikkerhetsregler (absolutte)

1. Før hver økt, kjør `gh api user --jq .login`. Svaret skal være `lillestrom-nettside-bot`. Viser det noe annet, uansett hvilken konto, skal du stoppe og si fra.
2. Push aldri til `main`. Bruk aldri `--admin`, force push eller merge. Endre aldri innstillinger, sperrer eller samarbeidspartnere i repoet.
3. Ingen endring går til GitHub før Rafaqat har sagt ja i chatten.
4. Endre aldri DNS, Netlify-innstillinger eller andre repoer. Når du forbereder DNS-instruksjoner til Rafaqat, skal e-postpostene for Microsoft 365 (autodiscover, enterpriseenrollment, enterpriseregistration, MX og TXT) og TXT-posten `google-site-verification=…` hos Domeneshop alltid stå uendret og nevnes som «ikke rør».
5. Ingen pasientopplysninger i chat, commit-meldinger eller pull request-tekst. Får du slike, ikke gjengi dem; si fra til Rafaqat.
6. Faste fakta om klinikken hentes fra repoet og denne ferdigheten, ikke fra minnet ditt. Hvis minnet ditt sier noe annet enn repoet, gjelder repoet. Spør Rafaqat om det ser feil ut.

## Arbeidsflyt for hver endring

1. Forstå ønsket. Er noe uklart, still ett spørsmål.
2. `git checkout main && git pull`. Lag en ny gren: `endring/kort-beskrivelse`, for eksempel `endring/egenandel-2027`.
3. Gjør minst mulig, målrettet endring. Skriv aldri om hele filer.
4. Kjør `python tester/test_nettside.py`. Alt skal være grønt. Retter du noe, kjør testen på nytt.
5. Vis Rafaqat:
   - hver endring som **Før** og **Etter**, med fil og seksjon
   - testresultatet
   - skjermbildene `tester/skjermbilder/mobil-lys-forste-skjerm.png` og `pc-lys-forste-skjerm.png`, eller utsnitt av delen som er endret
6. Spør: «Skal jeg lage pull request?»
7. Etter ja:
   - commit med kort norsk melding
   - `git push -u origin <gren>`
   - `gh pr create --base main` med tittel og en beskrivelse som inneholder Før og Etter, kilde for fakta og testresultatet
8. Send lenken til pull requesten. Forhåndsvisningen fra Netlify dukker opp i pull requesten etter et par minutter. Minn Rafaqat om å se på den på mobilen før han godkjenner.
9. **Angre en publisert endring:** lag en ny gren med `git revert <commit>` og en ny pull request. Rafaqat godkjenner den på vanlig måte.

## Filene

| Fil | Innhold | Regler |
|---|---|---|
| `site/index.html` | All tekst | Seksjoner med id: `akutt`, `besok`, `pris`, `undersokelser`, `rad`, `henvisere`, `om-oss`, `sporsmal`, `english`, `kontakt`. Én `h1`. Overskrifter i rekkefølge. |
| `site/styles.css` | Utseende | Farger kun som tokens i `:root`. Hver farge finnes i **tre** blokker: lys (`:root`), mørk etter systeminnstilling (`@media (prefers-color-scheme: dark)`) og mørk valgt manuelt (`:root[data-theme="dark"]`). Endre alle tre. |
| `site/script.js` | Telefontid, hastegradsveileder, tekststørrelse | `SLOTS` er telefontiden i minutter fra midnatt, norsk tid (510 = 08.30). `ADVICE` er medisinske råd og endres bare når Rafaqat som lege har godkjent ordlyden. |
| `site/assets/` | Fonter og bilder | Nye bilder: WebP under 200 KB, alltid med alt-tekst. Bildefiler fra Rafaqat legges inn med `git add`. |
| `site/pdf/` | Pasientveiledninger | Lenkes fra «Råd fra øyelegen». |
| `site/_headers` | Sikkerhetsregler (CSP) | Tillater bare egne filer. Derfor: ingen `style="..."` i HTML, ingen `<script>` med kode i HTML, ingen eksterne skript, fonter, bilder eller innebygde videoer og kart. Bruk CSS-klasser og lenker ut. Testen stopper brudd på dette. |
| `site/_redirects`, `netlify.toml` | Omdirigering og publisering | Ikke endre uten at Rafaqat ber om det. |
| `site/sitemap.xml` | For Google | Oppdater `lastmod` ved hver endring. |
| `tester/` | Automatisk test | `pakrevd.json` lister fakta som må stå på siden. Oppdater den i samme pull request når et faktum endres. |

## Faste fakta, bekreftet av Rafaqat 1. november 2026

**Klinikken**
- Lillestrøm Øyeklinikk AS, org.nr. 927 025 663.
- Vestbygata 55, 2003 Lillestrøm, i Elverkets gamle lokaler like ved flystripen.
- Avtalespesialist med driftsavtale med Helse Sør-Øst.
- Henvisning kreves fra fastlege, optiker eller annen lege. Pasienter kan ikke bestille selv. Siden har ingen timebestilling.
- Ingen kirurgi ved klinikken. Trenger pasienten operasjon, henviser klinikken videre. Rafaqat har lang erfaring fra okuloplastikk.
- Utstyr: OCT, Optos vidvinkel netthinnefoto, synsfeltmåler, iCare trykkmåler og spaltelampe.
- Behandling: SLT-laser (glaukom) og YAG-laser (etterstær).
- Etter besøket får fastlegen og den som henviste svar.

**Kontakt**
- Telefon 33 99 40 90.
- Telefontid: mandag–torsdag 08.30–09.30 og 14.00–14.30, fredag 08.30–09.30.
- Klinikken stenger kl. 13.00 på fredager.
- SMS: LØYE + melding til 2097. Pasienter skal ikke skrive personnummer eller detaljerte helseopplysninger i SMS.
- Parkering: gratis i 90 minutter for besøkende. Buss 100 og 340 stopper ca. 200 meter unna.
- Sosiale medier: Instagram og Facebook `dr.rafaqat.ahmad`, YouTube `@DrRafaqatAhmadOyelege`, TikTok `@dr.ahmad.oye`. Klinikken har ikke Twitter eller LinkedIn.

**Pris og praktisk**
- Egenandel 443 kr per konsultasjon hos spesialist (2026).
- Gratis for barn og unge under 18 år (fra 1. august 2026) og for pasienter med frikort.
- Egenandelstak 3 278 kr (2026). Betaling med kort.
- Ta med: legitimasjon, briller eller linser som brukes daglig, og ved diabetes siste HbA1c (langtidsblodsukker).
- Barn under 16 år må ha med en foresatt. Denne grensen handler om samtykke og skal ikke endres sammen med egenandelsgrensen.
- Pupillutvidende dråper brukes sjelden. Brukes de, skal pasienten ikke kjøre bil på 4–6 timer.
- Avbestilling: så tidlig som mulig, helst minst 24 timer før.
- Tolk: «Trenger du tolk, gi beskjed i god tid før timen.» Rafaqat har valgt å ikke skrive at tolk er gratis.
- Brilleresept: ikke til voksne. Barn får resept når briller er en del av behandlingen.
- Legeundersøkelsen tar ca. 10–15 minutter, i tillegg kommer forundersøkelser. Undersøkelsen er målrettet mot det pasienten er henvist for.
- Ventetid: oppgi aldri tall. Henvis til https://www.helsenorge.no/velg-behandlingssted/.

**Hastegradsveilederen** er godkjent av Rafaqat som lege. Ikke endre råd, symptomer eller nødnumre (113, 116 117) uten hans uttrykkelige godkjenning.

## Steder der samme fakta står flere ganger

Søk i hele `site/index.html` og endre alle forekomster. Oppdater også `tester/pakrevd.json` når et fast faktum endres.
- **Egenandel og frikort:** toppen (rad 0,8), Pris og praktisk, engelsk tekst, `<meta name="description">`, `og:description` og bunnen («gjelder for 2026»).
- **Telefontid:** «Ring oss»-kortet, bunnen, engelsk tekst, `SLOTS` i `site/script.js` og testtilfellene `TELEFONTID` i `tester/test_nettside.py`.
- **Telefonnummer:** toppen, «Ring oss»-kortet, akutt-seksjonen, bunnen, engelsk tekst og JSON-LD.

## Regler for innhold

- **Språk:** norsk bokmål, du-form, korte setninger, vanlige ord. Fagord forklares første gang, for eksempel «etterstær, en uklarhet som kan komme bak den nye linsen».
- **Medisinsk innhold:** legg aldri til eller endre påstander om sykdom, behandling, symptomer eller priser uten at Rafaqat har bekreftet det. Offentlige tall som egenandel og frikort skal sjekkes mot helsenorge.no, og kilden skal oppgis når endringen foreslås.
- **Markedsføring av helsetjenester (helsepersonelloven § 13):** saklig og nøktern. Ikke «best», ingen garantier, ingen sitater fra pasienter. Det er greit å lenke til Legelisten.
- **Personvern:** ingen sporing, informasjonskapsler, analyseverktøy eller innebygd innhold fra andre. Foreslås noe slikt, si tydelig at det krever samtykkeløsning og personvernerklæring.
- **Universell utforming (WCAG 2.1 AA, lovpålagt):**
  - alt-tekst på bilder
  - kontrast minst 4,5:1
  - trykkflater minst 44 px
  - én `h1` og overskrifter i rekkefølge
  - ingen tekst inne i bilder
  - tidsrom og telefonnummer holdes samlet med `class="nw"` der de kan brytes

## Designregler

- **Skrift:** Schibsted Grotesk til overskrifter og alle tall. Atkinson Hyperlegible til brødtekst, men aldri til tall: Atkinsons null har skråstrek og ligner Ø. Fonten «Klinikk Tekst» i `styles.css` ordner dette automatisk.
- **Toppen skal være rolig og ryddig:** én tydelig overskrift, kort ingress og en kort faktaliste. Den skal ikke etterligne en synstavle (ingen synkende linjestørrelser, ingen visus-tall i margen). Bestemt av Rafaqat 1. november 2026.
- **Farger:**
  - Aksent er petrolblå fra logoen: `#11657C` lys, `#6FC8DF` mørk.
  - Limegrønt (`--fluo`) brukes bare som markering bak mørk tekst, for eksempel prisen.
  - Rødt brukes bare i akutt-seksjonen.
  - Legg ikke til nye farger uten grunn.
- **Logo:** `logo-lys.webp` og `logo-mork.webp` ligger i ett `<picture>` med `prefers-color-scheme`, så bare den aktive logoen lastes.

## Personvernerklæring

Finnes ikke ennå. Lag utkast bare når Rafaqat ber om det, som pull request etter vanlig arbeidsflyt. Bygg bare på fakta han oppgir (for eksempel hvem som leverer SMS-tjenesten 2097, e-post via Microsoft 365 og Netlify som vertskap). Spør om det som mangler, i stedet for å anta.

## Fast kalender

- **2. januar (fast rutine):** sjekk egenandel for spesialist og egenandelstaket på helsenorge.no og helfo.no. Send Rafaqat funn med kilde. Lag ikke gren eller pull request før han har sagt ja.
  - Foreslå **alltid** oppdatering av årstallene, også om beløpene er uendret: «gjelder for [år]» i bunnen, «(år)» ved egenandel og frikort i Pris og praktisk, den engelske teksten og `tester/pakrevd.json`.
- **1. juli:** sjekk på samme måte om Helfo har endret egenandeler eller regler midt i året. Bare melding med funn og kilde, ingen gren før ja.
- **Hvert halvår:** gå gjennom tjenester, telefontid og ansatte med Rafaqat.

## Sjekkliste før du ber om godkjenning

- [ ] `gh api user` viser bot-kontoen.
- [ ] Endringen er gjort på alle steder teksten står (se listen over), og `tester/pakrevd.json` er oppdatert ved faktaendring.
- [ ] `python tester/test_nettside.py` er grønn i alle sju visningene.
- [ ] Skjermbildene viser endringen riktig på mobil og PC, i lys og mørk modus.
- [ ] «Sist oppdatert» i bunnen og `lastmod` i `sitemap.xml` er oppdatert.
- [ ] Offentlige tall har kilde fra helsenorge.no eller helfo.no i beskrivelsen av pull requesten.
