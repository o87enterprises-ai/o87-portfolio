# o87 Brand Guidelines 2026

## Brand Identity System

### Brand Positioning

**"Precision-engineered digital universes"**

o87 is a futuristic technology brand that merges cosmic aesthetics with big-tech minimalism. We build systems, not just interfaces.

---

## 1. Logo System

### Primary Logo

The o87 logo is a geometric monogram featuring interconnected "o87" characters with a cyan-to-purple gradient outline.

**Usage:**
- Website header (32px height)
- Hero section (min 280px width)
- Marketing materials
- App icons

**File:** `/Gemini_Generated_Image_riqg8xriqg8xriqg.png`

### Logo Variants

| Variant | Use Case | Minimum Size |
|---------|----------|--------------|
| Full color | Primary branding, hero, headers | 32px height |
| Icon only | Favicon, app icon, social | 16px |
| Monochrome | Single-color applications | 24px height |

### Logo Clear Space

Maintain minimum clear space around the logo:
- **Horizontal:** 1x logo height on all sides
- **Vertical:** 0.5x logo height above/below

### Logo Don'ts

❌ Do not stretch or distort
❌ Do not add effects (shadows, glows, etc.)
❌ Do not change colors outside brand palette
❌ Do not place on busy backgrounds
❌ Do not rotate except for specific motion designs

---

## 2. Color System

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Void Black** | `#05070A` | Primary background |
| **Deep Space** | `#0B0F1A` | Secondary background, cards |
| **Neon Blue** | `#00D4FF` | Primary accent, CTAs, links |
| **Cosmic Purple** | `#6C5CE7` | Secondary accent, gradients |
| **White** | `#ECEBF8` | Primary text |

### Usage Ratios

```
90% — Dark backgrounds (Void Black, Deep Space)
10% — Accent colors (Neon Blue, Cosmic Purple)
```

### Gradient System

**Primary Gradient (Buttons, CTAs):**
```css
linear-gradient(135deg, #00D4FF, #6C5CE7)
```

**Glow Effect (Hover states):**
```css
box-shadow: 0 0 24px rgba(0, 212, 255, 0.3)
```

**Border Glow:**
```css
border: 1px solid rgba(0, 212, 255, 0.3)
```

### Background System

**Void (Primary):** `#05070A`
**Deep Space (Secondary):** `#0B0F1A`
**Glass (Overlays):** `rgba(11, 15, 26, 0.72)` with `backdrop-filter: blur(20px)`

---

## 3. Typography System

### Font Stack

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| **Display** | Space Grotesk | 400, 500, 600, 700 | Headlines, logo, buttons |
| **Body** | Inter | 300, 400, 500, 600 | Paragraphs, UI text |
| **Mono** | IBM Plex Mono | 400, 500 | Code, labels, metadata |

### CSS Import

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### Type Scale

| Element | Font | Size | Weight | Letter Spacing | Line Height |
|---------|------|------|--------|----------------|-------------|
| **H1** | Space Grotesk | clamp(2.5rem, 6vw, 4.5rem) | 700 | -0.03em | 1.1 |
| **H2** | Space Grotesk | clamp(2rem, 4.5vw, 3.2rem) | 700 | -0.02em | 1.15 |
| **H3** | Space Grotesk | 1.35rem | 700 | -0.02em | 1.2 |
| **Body** | Inter | 1.05rem | 400 | 0 | 1.75 |
| **Small** | Inter | 0.9rem | 400 | 0 | 1.7 |
| **Label** | IBM Plex Mono | 0.65rem | 400 | 0.3em | 1.4 |
| **Button** | Space Grotesk | 0.7rem | 600 | 0.15em | 1 |

### CSS Variables

```css
:root {
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
```

### Text Treatment

**Headlines:** Tight tracking (-1% to -2%), bold weight
**Body:** Neutral spacing, high readability
**Labels:** Uppercase, wide tracking (+20% to +30%)
**Buttons:** Uppercase, moderate tracking (+15%)

---

## 4. Layout System

### Grid

- **Max Width:** 1280px
- **Columns:** 12-column grid (desktop)
- **Gutter:** 1.5rem (24px)
- **Margins:** 2rem (32px) minimum

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 0.5rem | Tight spacing |
| `--space-sm` | 1rem | Component padding |
| `--space-md` | 2rem | Section margins |
| `--space-lg` | 4rem | Large sections |
| `--space-xl` | 8rem | Major divisions |

### Section Spacing

- **Between sections:** 8rem (128px)
- **Within sections:** 4rem (64px)
- **Element spacing:** 1-2rem (16-32px)

### Breakpoints

| Name | Width | Layout Change |
|------|-------|---------------|
| Mobile | < 640px | Single column |
| Tablet | 640px - 1024px | 2 columns |
| Desktop | > 1024px | 3+ columns |

---

## 5. Component System

### Buttons

**Primary Button:**
```css
.btn-primary {
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.9rem 2.2rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #00D4FF, #6C5CE7);
  color: #fff;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.25);
  transition: transform 0.25s, box-shadow 0.25s;
}

.btn-primary:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 16px 48px rgba(0, 212, 255, 0.35);
}
```

**Outline Button:**
```css
.btn-outline {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--white);
}

.btn-outline:hover {
  border-color: #00D4FF;
  background: rgba(0, 212, 255, 0.06);
}
```

### Cards

```css
.card {
  background: rgba(11, 15, 26, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 18px;
  padding: 1.75rem;
  transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s;
}

.card:hover {
  border-color: rgba(0, 212, 255, 0.5);
  transform: translateY(-5px);
  box-shadow: 0 28px 56px rgba(0, 212, 255, 0.2);
}
```

### Badges

```css
.badge {
  font-family: var(--font-mono);
  font-size: 0.55rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.3rem 0.9rem;
  border-radius: 40px;
  border: 1px solid currentColor;
}

.badge.live { color: #00D4FF; }
.badge.dev { color: #6C5CE7; }
.badge.wip { color: #FFCC44; }
```

---

## 6. Motion System

### Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Fade In | 0.65s | `cubic-bezier(0.2, 0.9, 0.3, 1)` |
| Hover | 0.25s | `ease` |
| Float | 8s | `ease-in-out` (infinite) |
| Scroll Reveal | 0.6s | `ease` |

### Principles

1. **Slow and smooth** — 0.6s to 1.2s for major transitions
2. **Ease-in-out** — Natural acceleration/deceleration
3. **Subtle over obvious** — Motion should enhance, not distract

### Key Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Logo Float:**
```css
@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
```

---

## 7. Voice & Tone

### Brand Voice

- **Confident** — Direct, assured statements
- **Minimal** — No fluff, no filler
- **Intelligent** — Technical precision
- **Futuristic** — Forward-thinking language

### Examples

❌ "Welcome to my portfolio website!"
✅ "Engineering digital universes."

❌ "We offer many different services for clients."
✅ "Precision-engineered solutions for complex problems."

❌ "Contact us today!"
✅ "Open channel."

### Messaging Pillars

1. **Systems over interfaces** — We build infrastructure
2. **Precision over quantity** — Every element has purpose
3. **Motion over static** — Everything moves with intent

---

## 8. Visual Effects

### Glow Discipline

**Rule:** 90% matte, 10% glow

Apply glow ONLY to:
- Active buttons (hover)
- Logo accent
- Interactive elements
- Section dividers

**Glow Formula:**
```css
/* Subtle glow */
box-shadow: 0 0 24px rgba(0, 212, 255, 0.3);

/* Strong glow (hover) */
box-shadow: 0 0 32px rgba(0, 212, 255, 0.5);

/* Text glow */
text-shadow: 0 0 16px rgba(0, 212, 255, 0.5);
```

### Glassmorphism

```css
.glass {
  background: rgba(11, 15, 26, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Starfield Background

Subtle starfield with 3 depth layers:
- **Foreground:** 140 stars, 0.28px, bright
- **Mid-field:** 600 stars, 0.12px, varied colors
- **Background:** 2200 stars, 0.06px, white/blue

---

## 9. Accessibility

### Color Contrast

- **Text on dark:** Minimum 4.5:1 ratio
- **Large text:** Minimum 3:1 ratio
- **Interactive elements:** Clear visual distinction

### Focus States

All interactive elements must have visible focus states:
```css
button:focus, a:focus {
  outline: 2px solid #00D4FF;
  outline-offset: 2px;
}
```

### Motion Sensitivity

Respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. File Organization

```
o87-portfolio/
├── index.html              # Main site
├── Gemini_Generated_Image_riqg8xriqg8xriqg.png  # Primary logo
├── BRAND_GUIDELINES.md     # This document
├── brands/                 # Sub-brand logos
│   ├── truegle.png
│   ├── munch-logo.png
│   └── ...
└── apps/                   # Application subfolders
    ├── trumpafi/
    ├── munch/
    └── ...
```

---

## 11. Quick Reference

### CSS Variables (Copy/Paste)

```css
:root {
  /* Colors */
  --void: #05070A;
  --deep-space: #0B0F1A;
  --neon-blue: #00D4FF;
  --cosmic-purple: #6C5CE7;
  --white: #ECEBF8;
  --muted: rgba(236, 235, 248, 0.5);
  --glass: rgba(11, 15, 26, 0.72);
  --border: rgba(255, 255, 255, 0.08);
  --border-glow: rgba(0, 212, 255, 0.3);
  
  /* Fonts */
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
  
  /* Timing */
  --ease: cubic-bezier(0.2, 0.9, 0.3, 1);
}
```

### Logo Files

| Format | Path | Use |
|--------|------|-----|
| PNG (primary) | `/Gemini_Generated_Image_riqg8xriqg8xriqg.png` | Web, digital |
| SVG (future) | TBD | Print, scalable |

---

## 12. Brand Evolution

This brand system is designed to evolve. When adding new elements:

1. **Test at scale** — Works at 16px and 1024px?
2. **Check contrast** — Meets accessibility standards?
3. **Maintain ratios** — 90% dark, 10% accent?
4. **Consider motion** — How does it animate?

### Future Enhancements

- [ ] Animated logo variant (Lottie/SVG)
- [ ] Dark/light mode system
- [ ] Print-optimized logo versions
- [ ] Social media template system
- [ ] Icon library (custom set)

---

**Last Updated:** March 2026
**Version:** 2.0 (Cosmic Minimalism)

---

*o87 — precision-engineered digital universes*
