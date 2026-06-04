# Caption · Carousel 04 · KAYs editorial EN

**Status**: Ready to upload
**Format**: 6 slides, 1080×1350 portrait, editorial design
**Channels**: LinkedIn (primary), Instagram (secondary)
**Design**: Same editorial system as carousel-03 (Fraunces serif + rotating palette), copy in English.

---

## Slide map

| # | Background | Headline |
|---|---|---|
| 01 | Orange #FF5C33 | "One small detail makes KAYs invisible to Google →" |
| 02 | Black | "38/100" + "The kitchen is better than the website lets on." |
| 03 | Cream #F5EFE0 | "Zero H1 tags on the homepage. Google sees no hierarchy." |
| 04 | Red #D9381C | "Købmand og kaf." + "Danish for 'Grocer and cof'. The word stops mid-letter." |
| 05 | Olive #7A9B5C | "Three fixes. Three hours." + list of 3 with times |
| 06 | Orange (bookend) | "Read the full audit. Pass it on." + dibarret.dk/audit-kayscph → |

---

## LinkedIn caption

KAYs in Ørestad has better food than most places in central Copenhagen. Google does not know that.

I ran an external audit yesterday.

Zero H1 tags on the homepage. Verified with curl. Divi builds pages from divs, so Google sees no hierarchy, just a stack of containers.

The page title says "Købmand og kaf." Kaf is not a word. It is the first thing Google shows in search and the first thing your browser tab shows.

No schema markup at all. No restaurant type, no opening hours, no menu, no address marked up. So when someone in Ørestad searches for brunch nearby, the local card on the right of Google's results belongs to whoever did the markup. Not KAYs.

The site is Danish only. Ørestad has DR, Microsoft, IT University, Field's, three conference hotels within five minutes. A good chunk of the brunch crowd reads English first.

Score: 38 out of 100.

Three quick fixes in WordPress admin move it to around 50 before tomorrow morning.

1. Fix the title typo and mark one H1 in Divi. Thirty minutes.
2. Add real alt text to the seven images with empty alt. One hour.
3. Add Restaurant schema with Yoast Local SEO. Ninety minutes.

Google's local pack starts noticing within a week. No re-platforming. No redesign. Three hours of work.

The kitchen already does the hard part. The website should not be the bottleneck.

Full audit at dibarret.dk/audit-kayscph. 14 findings, customer journey, plan A through C.

If you know somewhere the food beats the website, this might help.

---

## Instagram caption (shorter)

KAYs in Ørestad has better food than the website lets on.

Verified yesterday:

· 0 H1 tags on the homepage
· The page title still says "Købmand og kaf"
· No Restaurant schema
· Danish-only in one of Copenhagen's most international districts

Three quick fixes move the SEO score from 38 to about 50 before tomorrow morning.

1. Fix the title + mark one H1 in Divi · 30 min
2. Alt text on the seven empty images · 60 min
3. Restaurant JSON-LD via Yoast Local SEO · 90 min

No re-platforming. Three hours in WordPress admin.

Full audit at dibarret.dk/audit-kayscph

#localseo #cafebranding #wordpressdivi #copenhagen #brunchcopenhagen #brandstrategy

---

## Humanizer audit (verified)

| Check | Result |
|---|---|
| Em/en dashes | 0 |
| Curly quotes | 0 |
| AI vocab (vibrant, robust, leverage, foster, seamless, crucial, pivotal, tapestry, testament) | 0 |
| Filler phrases (in order to, it is important to note) | 0 |
| Emojis | 0 |
| Boldface in body | 0 |
| Rule-of-three padding | None (the 3 fixes reflect real recommendations) |
| First-person | Used sparingly ("I ran an external audit yesterday") |
| Specific details | DR, Microsoft, IT University, Field's, Yoast Local SEO, Divi, curl, exact times, exact score |
| Hook strong enough for "see more" | Yes (claim + counter-claim) |
| CTA | Soft, single line at end |

---

## Rendering

From repo root:

```
node social/render-slides.js carousel-04-kayscph-editorial-en
```

Output: 6 JPEG at 2160×2700 (1080×1350 @ DPR 2x), JPEG quality 92.

---

## Differences vs Danish version (carousel-03)

- Slide 4 keeps the Danish typo verbatim (it IS the actual evidence on KAYs's live site). The caption translates the typo so an English reader gets the joke.
- Slide 5 cadence stays the same. "Three fixes. Three hours." replaces "Tre fixes. Tre timer." which already worked because it was the closest English idiom.
- Slide 2 caption rewritten to read naturally in English instead of literal translation.
- Slide 1 hook tightened. The Danish version had to spell out "one thing tells Google KAYs doesn't exist". English uses "One small detail makes KAYs invisible to Google" which is shorter and stronger on a single line.
