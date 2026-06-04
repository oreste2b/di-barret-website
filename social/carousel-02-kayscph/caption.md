# Caption · Carousel 02 · KAYs CPH audit

**Status**: Klar til upload
**Format**: 6 slides, 1080×1350 portrait
**Channels**: Instagram + LinkedIn
**Hashtag-fokus**: lokal SEO, kafé branding, Ørestad, Divi WordPress

---

## Instagram caption (DA)

KAYs i Ørestad har et bedre køkken end de fleste i kvarteret. Brunch, vin i glas, smagsmenuer i weekenden. Lokal favorit.

Hjemmesiden fortæller ikke noget af det videre til Google.

Verificeret med curl:

· 0 H1-tags på forsiden
· 0 H2-tags
· Title-elementet siger "Købmand og kaf" (typo)
· Intet schema markup som Restaurant
· Kun dansk i et internationalt kvarter

Det er ikke en re-build der mangler. Det er tre quick wins inden fyraften:

1. Ret title-typoen + sæt H1 i Divi · 30 min
2. Alt-tekst på de 7 tomme billeder · 60 min  
3. Restaurant JSON-LD via Yoast Local · 90 min

Score: 38/100. Med disse tre fixes: omkring 50. Inden i morgen.

Hele auditen på dibarret.dk/audit-kayscph

#lokalseoørestad #cafébranding #wordpressdivi #flexleasing #brandsystem #digitalstrategi #kbh #københavn #kayscph #brunchørestad

---

## LinkedIn caption (DA, ingen hashtags i flow)

KAYs Købmand & Madbodega i Ørestad har et bedre køkken end de fleste i kvarteret. Brunch, vin, smagsmenuer i weekenden.

Den digitale tilstedeværelse holder ikke samme niveau som restauranten.

Verificeret eksternt med curl:

· 0 H1-tags på forsiden af kayscph.dk
· 0 H2-tags
· Title-elementet indeholder typoen "Købmand og kaf"
· Intet schema markup som Restaurant eller LocalBusiness
· Kun dansk i et af Københavns mest internationale kvarterer (DR, Aller Media, Microsoft, IT-Universitetet, Field's, konferencehoteller)

Det er ikke en re-platforming der skal til. Tre quick wins:

1. Ret title-typoen og marker hero som H1 i Divi (30 minutter)
2. Beskrivende alt-tekst på de 7 tomme billeder (60 minutter)
3. Restaurant JSON-LD via Yoast Local SEO (90 minutter)

Samlet effekt: score fra 38/100 til omkring 50, og synlige forbedringer i Googles lokale søgninger inden for en uge.

Hele auditen ligger på dibarret.dk/audit-kayscph . 14 verificerbare findings, customer journey, plan A/B/C, scoredel på 11 søjler.

Audits er en del af det vi tilbyder hos Di Barret i København. Hvis nogen i jeres netværk har et site, der ikke afspejler styrken i restauranten, send det til mig.

---

## Slide-by-slide (intern reference)

| # | Type | Hovedindhold | Counter |
|---|---|---|---|
| 1 | Hook | "Godt produkt. Usynlig web." + sub | 01/06 |
| 2 | Score | 38/100 amber + KAYs context | 02/06 |
| 3 | Finding 01 | 0 H1-tags + curl-evidence | 03/06 |
| 4 | Finding 02 | Title typo "Købmand og kaf" + mockup | 04/06 |
| 5 | Quick wins | 3-up liste + score-effekt | 05/06 |
| 6 | CTA | URL + 3 meta felter | 06/06 |

---

## Rendering

Fra repo-rod:

```
node social/render-slides.js carousel-02-kayscph
```

Output: 6 JPEG'er på 2160×2700 (1080×1350 ved DPR 2x), klar til IG upload i rækkefølge.

Eller manuelt via Chrome DevTools (1080×1350, DPR 2, Capture screenshot).
