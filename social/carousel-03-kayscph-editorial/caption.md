# Caption · Carousel 03 · KAYs editorial variant

**Status**: Klar til upload
**Format**: 6 slides, 1080×1350 portrait, editorial design
**Channels**: Instagram + LinkedIn
**Diseño**: Inspirado en hook-bait editorial style. Fraunces serif + paleta rotativa.

---

## Paleta por slide (variantes visuales)

| Slide | BG | Tinta | Rol narrativo |
|---|---|---|---|
| 1 | Naranja #FF5C33 | Negro | Hook (igual al reference) |
| 2 | Negro | Naranja | Score reveal (alto contraste) |
| 3 | Crema #F5EFE0 | Negro | Finding técnico (descanso visual) |
| 4 | Rojo #D9381C | Crema | Title typo (drama, llamada de atención) |
| 5 | Olive #7A9B5C | Negro | Quick wins (esperanza, acción) |
| 6 | Naranja | Negro | CTA bookend (cierra como abrió) |

---

## Instagram caption (DA)

KAYs i Ørestad har bedre køkken end de fleste i kvarteret. Brunch, vin, smagsmenuer i weekenden.

Hjemmesiden fortæller ikke noget af det videre til Google.

Verificeret eksternt:

· 0 H1-tags på forsiden af kayscph.dk
· Title-elementet siger "Købmand og kaf" (typo)
· Intet schema markup som Restaurant
· Kun dansk i et internationalt kvarter

Tre fixes inden fyraften:

1. Ret title-typoen og sæt H1 i Divi · 30 min
2. Alt-tekst på de syv tomme billeder · 60 min
3. Restaurant JSON-LD via Yoast Local · 90 min

Score: 38/100. Med disse tre: omkring 50. Inden i morgen.

Hele auditen på dibarret.dk/audit-kayscph

#lokalseo #cafebranding #wordpressdivi #kayscph #brunchørestad #kbh #brandstrategy

---

## LinkedIn caption (DA, professional tone)

KAYs Købmand & Madbodega i Ørestad har bedre køkken end de fleste i kvarteret. Brunch, vin i glas, smagsmenuer i weekenden.

Den digitale tilstedeværelse matcher ikke restauranten.

Verificeret eksternt med curl:

· 0 H1-tags på forsiden
· Title-elementet indeholder typoen "Købmand og kaf"
· Intet schema markup som Restaurant eller LocalBusiness
· Kun dansk i et af Københavns mest internationale kvarterer (DR, Aller Media, Microsoft, IT-Universitetet, Field's, konferencehoteller)

Det er ikke en re-platforming der mangler. Tre quick wins:

1. Ret title og marker hero som H1 i Divi (30 minutter)
2. Beskrivende alt-tekst på de 7 tomme billeder (60 minutter)
3. Restaurant JSON-LD via Yoast Local SEO (90 minutter)

Samlet effekt: score fra 38/100 til omkring 50, og synlige forbedringer i Googles lokale søgninger inden for en uge.

Hele auditen ligger på dibarret.dk/audit-kayscph med 14 verificerbare findings, customer journey, plan A/B/C og scoredel på 11 søjler.

Hvis nogen i jeres netværk har et site der ikke afspejler styrken i restauranten, send den videre.

---

## Slide breakdown (intern reference)

| # | Estilo | Headline | Color |
|---|---|---|---|
| 1 | Hook editorial | "Én ting fortæller Google at KAYs ikke findes →" | Naranja + negro |
| 2 | Mega stat | "38/100" + "Køkkenet leverer mere..." | Negro + naranja |
| 3 | Finding técnico | "Nul H1-tags på forsiden..." + curl evidence | Crema + negro |
| 4 | Title typo dramático | "Købmand og kaf." + "Kaf er ikke et dansk ord" | Rojo + crema |
| 5 | Quick wins list | 3 ítems con tiempo | Olive + negro |
| 6 | CTA con URL | dibarret.dk/audit-kayscph → | Naranja + negro |

---

## Rendering

Desde repo root:

```
node social/render-slides.js carousel-03-kayscph-editorial
```

Output: 6 JPEG a 2160×2700 (1080×1350 @ DPR 2x), JPEG quality 92.

## Notes

- Diseño basado en hook-bait editorial style (orange + serif)
- Variantes de color por slide para ritmo visual sin perder coherencia
- Frame interno con border-radius 32px + sutil inner ring (estilo screen)
- Top-mark: stacked "DI BARRET / AUDIT" + stamp italic en esquina opuesta
- Bottom: credit italic + counter mono
- Fraunces serif (display) + Geist Mono (labels)
