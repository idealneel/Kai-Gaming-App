# Kai Gaming — Design Guide

> **Style:** Dark gaming aesthetic with **neobrutalist bones** (chunky bordered cards, hard offset shadows, big tight type — recolored dark, not bright).
> **Status:** v2 — recolored to the Kai Gaming palette. The neobrutalist *structure* is kept; the bright flat palette from v1 is replaced by the dark Kai palette below.
> **Reference:** `/Ref` (Gumroad = neobrutalist structure; Next Level GG = dark esports look, used lightly; real cafe photos + Kai logo palette = colors/mood).

---

## 1. Style Philosophy

Neobrutalism is *confident, loud, and honest*. Nothing is hidden or softened. The look is built from a few hard rules applied relentlessly:

1. **Hard edges & solid borders** — everything meaningful sits inside a thick, dark outline.
2. **Solid offset shadows** — drop shadows are hard (no blur, no opacity fade), offset down-right, in a solid color. This gives the "sticker slapped on the page" feel.
3. **Flat, saturated color blocks** — no gradients, no soft glows. Big rectangles of pure color.
4. **Oversized, tight typography** — headings are huge, bold, and low-leading.
5. **Playful, intentional imperfection** — badges/stickers rotated a few degrees, characters, chunky arrows.
6. **High contrast everywhere** — dark sections against neon, black text on bright fills.

If a choice makes the page feel *softer, more subtle, or more "corporate clean,"* it's probably wrong for this style.

---

## 2. Color System

> ⚠️ Placeholder values — expect to swap these. What matters is the **roles**, not the exact hex.

### Core neutrals
| Role | Token | Placeholder | Usage |
|------|-------|-------------|-------|
| Ink / border | `--color-ink` | `#000000` | All borders, outlines, shadows, body text |
| Page dark | `--color-bg-dark` | `#0A0A0A` | Dark full-bleed sections |
| Page light | `--color-bg-light` | `#FFFFFF` | Light sections, cards |
| Surface | `--color-surface` | `#1A1A1A` | Cards on dark backgrounds |

### Accent palette (flat, saturated)
The Gumroad refs cycle through a small set of loud accents. Keep 4–6 hero colors and reuse them as full-bleed section backgrounds AND as fills for cards/badges.

| Token | Placeholder | Notes |
|-------|-------------|-------|
| `--color-accent-1` | `#FF90E8` (pink) | Primary highlight / CTA fills |
| `--color-accent-2` | `#FFC900` (yellow) | Callouts, sticker fills |
| `--color-accent-3` | `#23A094` (teal) | Section blocks |
| `--color-accent-4` | `#5B4BFF` (violet) | Buttons, links, section blocks |
| `--color-accent-5` | `#8C3FBF` (purple) | Section blocks |
| `--color-accent-6` | `#3B82F6` (blue) | Auth / provider buttons |

**Rules**
- Accents are used at **full saturation** — never tinted or faded.
- Text on an accent block is **black** (`--color-ink`), not gray.
- Never place two accents adjacent without a black border or gap between them.
- Full-bleed color sections alternate with dark sections down the page for rhythm.

---

## 3. Typography

**Feel:** big, bold, geometric grotesque. Gumroad uses a tight, heavy sans. Good stand-ins: **Inter**, **Space Grotesk**, **Archivo**, or **Neue Haas Grotesk**. Pick one heavy family; the whole personality lives in headings.

| Style | Size (desktop) | Weight | Leading | Notes |
|-------|----------------|--------|---------|-------|
| Display / Hero | `clamp(3rem, 6vw, 5.5rem)` | 800–900 | 1.0–1.05 | Very tight leading, may wrap 2–3 lines on purpose |
| H1 | `2.5–3.5rem` | 800 | 1.1 | |
| H2 (section) | `2–2.75rem` | 700–800 | 1.15 | Often centered above a section |
| H3 (card title) | `1.1–1.35rem` | 700 | 1.2 | |
| Body | `1rem–1.125rem` | 400–500 | 1.5 | |
| Small / meta | `0.8125rem` | 500 | 1.4 | Uppercase eyebrows, tags |
| Eyebrow label | `0.75rem` | 700 | — | UPPERCASE, letter-spacing `0.08em` |

**Rules**
- Headings are **tight** (leading ≈ 1.0–1.15). Don't let them breathe like editorial type.
- One font family for the whole site is fine and on-brand. Vary weight, not family.
- Keep body copy readable — high contrast, generous line length limit (~65ch).

---

## 4. The Neobrutalist Primitives

These three tokens define the look. Apply them consistently.

### Border
```css
--border-width: 3px;          /* 2px small elements, 3–4px cards, up to 6px hero */
--border: var(--border-width) solid var(--color-ink);
--radius: 0px;                /* mostly square. Optional soft radius: 6–10px */
--radius-pill: 999px;         /* for tags/badges only */
```
- Default corners are **square or barely rounded** (0–10px). Big soft radii break the style.
- Pills (`999px`) are reserved for tags, small badges, and highlight "marker" shapes.

### Solid offset shadow (the signature move)
```css
--shadow-sm: 3px 3px 0 0 var(--color-ink);
--shadow:    5px 5px 0 0 var(--color-ink);
--shadow-lg: 8px 8px 0 0 var(--color-ink);
```
- **No blur. No spread fade. No transparency.** Always a solid color offset down-right.
- Shadow color is usually `--color-ink` (black), occasionally an accent for extra pop.
- On hover, the element *presses in*: translate toward the shadow and shrink the shadow (see Motion).

### Spacing
```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;
--space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;
--space-24: 96px;                 /* section vertical padding */
```
- Sections get generous vertical padding (`64–96px`).
- Cards use `16–24px` internal padding.
- Gaps in grids: `16–24px`.

---

## 5. Components

### Buttons
```
[ Primary ]  — accent fill · black border · solid shadow · black bold label
[ Ghost ]    — white/dark fill · black border · solid shadow
[ Provider ] — full-width, solid accent, icon + label (see login ref)
```
```css
.btn {
  font-weight: 700;
  padding: 12px 20px;
  border: var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  background: var(--color-accent-1);
  color: var(--color-ink);
  transition: transform .06s ease, box-shadow .06s ease;
}
.btn:hover  { transform: translate(2px, 2px); box-shadow: var(--shadow-sm); }
.btn:active { transform: translate(5px, 5px); box-shadow: 0 0 0 0 var(--color-ink); }
```

### Cards
- Solid border + solid shadow, square-ish corners.
- On dark sections: `--color-surface` fill, sometimes borderless with just spacing (see discover grid); on light sections: white fill with full border + shadow.
- Card grids are dense and uniform — a strong, obvious grid (see discover/features refs).

### Tags / Badges / Stickers
- Small pill or square chips with border. Accent fills.
- **Stickers**: rotated `-4°` to `+6°`, solid shadow, often overlapping a corner of a card or hero. Used sparingly for playfulness.

### Highlight "marker" shape
- The rounded solid-color blob behind a phrase (yellow pill behind text in the home ref). Use `--radius-pill` fill behind key words in headings.

### Inputs (see login ref)
```css
.input {
  width: 100%;
  padding: 12px 14px;
  border: var(--border);
  border-radius: var(--radius);
  background: var(--color-bg-dark);   /* or white on light sections */
  color: var(--color-bg-light);
}
.input:focus { outline: none; box-shadow: var(--shadow-sm); }
```
- Full-width, tall, hard border. Labels sit above, bold, small.

### Navbar
- Slim top bar, dark. Bold wordmark left, text links, one accent CTA button right (see gumclaw ref).
- Links plain; the single filled accent button anchors the right side.

### Footer
- Dark, generous. A bright accent "subscribe" panel above or inside it, bordered input + arrow button. Multi-column link lists, social icons row.

---

## 6. Layout & Page Rhythm

- **Max content width:** ~1200px, centered, with comfortable side gutters.
- **Section rhythm:** alternate dark sections and full-bleed accent-color sections down the page. This alternation *is* the layout personality (see home + features refs).
- **Full-bleed color panels:** a whole section is one flat accent color, edge to edge, with black-outlined content inside.
- **Grids:** obvious, uniform, dense (2–4 cols). Don't stagger or offset — brutalism likes the visible grid.
- **Illustrations/characters:** flat, bold-outlined, sit in colored panels or as spot art. (For a gaming cafe: controllers, arcade shapes, pixel/character motifs in the same flat-outline style.)

---

## 7. Motion

Keep it **snappy and physical**, never smooth-and-slow.

- **Hover press:** button/card translates `+2–5px` down-right and its shadow shrinks to match — like physically pressing a stamp.
- Durations short: `60–120ms`, `ease` or `ease-out`.
- Optional: slight sticker wobble/rotate on hover for playful elements.
- Avoid fades, parallax drift, and long easing. Motion should feel clicky, not silky.

---

## 8. Do / Don't

**Do**
- Outline everything meaningful in solid black.
- Use hard, solid, offset shadows.
- Go big and tight on headings.
- Alternate dark and vivid full-bleed sections.
- Keep the grid visible and uniform.
- Add a few rotated stickers/badges for character.

**Don't**
- Use gradients, blurred/soft shadows, or glassmorphism.
- Use large soft border-radii on cards.
- Use gray text on color — go black.
- Over-animate or use slow fades.
- Let the layout get timid or "clean-corporate."

---

## 9. Token Quick-Reference (CSS variables)

```css
:root {
  /* Kai dark palette (v2) */
  --color-bg:      #1A1E24;  /* Shark — page background */
  --color-bg-deep: #14171C;  /* deeper sections */
  --color-surface: #22272F;  /* cards on dark */
  --color-line:    #313842;  /* subtle light border on dark */
  --color-ink:     #0C0E12;  /* near-black — hard shadows */
  --color-text:    #F2F3F5;  /* near-white body text */
  --color-muted:   #A9ADB4;  /* secondary text */

  /* accent (from logo) */
  --color-red:      #C0392B;  /* logo red — primary CTA/accent */
  --color-red-soft: #C38684;  /* Old Rose — hover tints */
  --color-gray-1:   #787A7C;  /* Rolling Stone */
  --color-gray-2:   #84847C;  /* Friar Gray */

  /* primitives */
  --border-width: 3px;
  --border: var(--border-width) solid var(--color-ink);
  --radius: 0px;
  --radius-pill: 999px;

  --shadow-sm: 3px 3px 0 0 var(--color-ink);
  --shadow:    5px 5px 0 0 var(--color-ink);
  --shadow-lg: 8px 8px 0 0 var(--color-ink);

  /* spacing */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;
  --space-24: 96px;
}
```
