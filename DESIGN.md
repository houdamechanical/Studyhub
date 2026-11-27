---
name: Study Hub
description: The class planner for Grade 11 – explanations, practice, exams and grades in one place.
colors:
  paper: "#fbf7ef"
  sheet: "#ffffff"
  margin-beige: "#f3ecdf"
  pill-beige: "#efe6d6"
  ruled-line: "#e8dfd0"
  ruled-line-strong: "#cdbfa8"
  ink: "#1f1b16"
  pencil-grey: "#6b5f52"
  correction-red: "#b8360f"
  ink-blue: "#2b5c8a"
  check-green: "#3f7a4f"
  error-red: "#c0262d"
  night-desk: "#17130f"
  night-sheet: "#201a15"
  night-raised: "#29221c"
  night-line: "#3a3027"
  chalk: "#f5eee4"
  night-pencil: "#ab9f92"
  coral-red: "#f47a55"
  coral-fill: "#f2704a"
  night-blue: "#8fb8e3"
  night-green: "#8fc79e"
  book-math: "#3341c9"
  book-deutsch: "#c92a2a"
  book-englisch: "#0f766e"
  book-chemie: "#e67700"
  book-physik: "#1864ab"
  book-bio: "#2b8a3e"
  book-geschichte: "#8a5a2b"
  book-religion: "#a61e4d"
  book-arabisch: "#0b7285"
  book-kunst: "#d9480f"
  book-musik: "#6741d9"
  book-sport: "#5c940d"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.018em"
  title:
    fontFamily: "Bricolage Grotesque, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "\"kern\", \"liga\", \"calt\""
  label:
    fontFamily: "Inter, Noto Sans Arabic, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  study-text:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: "1.04rem"
    fontWeight: 400
    lineHeight: 1.8
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  2xl: "14px"
  card: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  gutter: "16px"
components:
  button-primary:
    backgroundColor: "{colors.correction-red}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "#a4300d"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  chip:
    backgroundColor: "{colors.margin-beige}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  chip-active:
    backgroundColor: "{colors.correction-red}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
  nav-rail-item-active:
    backgroundColor: "{colors.margin-beige}"
    textColor: "{colors.correction-red}"
    rounded: "{rounded.lg}"
    size: "40px"
  grade-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    width: "88px"
    height: "48px"
---

# Design System: Study Hub

## Overview

**Creative North Star: "The Class Planner"**

Study Hub is the planner a well-organised student keeps for the whole school year: cream paper, a red pen for what matters, ink blue for notes, and a shelf of coloured subject books. Everything has its place – the next exam on top, every subject in its own book, every grade in its row – so a student between lessons finds what they need in one tap. Order comes first; personality lives in the details you touch.

Components are **tactile and friendly**. Surfaces sit on the paper with soft shadows, buttons give a small press, and the subject books are real objects: they tilt toward the pointer, catch the light and grow to fill the screen when opened. Study content switches to a printed-page serif with margin line numbers, so a Musterlösung looks like the worksheet it came from.

Light mode is paper on a desk; dark mode is the same planner at night (warm brown-black, chalk text, coral instead of red). Both are first-class; the user picks Light, Dark or System.

**Key Characteristics:**
- Cream paper, red pen, ink blue – one strong accent, one quiet second colour.
- Every subject has a fixed book colour and icon; colour signals the subject, not decoration.
- Soft shadows lift cards gently off the page; pop-ups and books lift further.
- Large, readable text (18px base) with a friendly grotesque for headings.
- Study pages read like printed school material (serif, verse/line numbers, Fachbegriffe in bold).

## Colors

Warm paper neutrals with a correction-pen red as the single loud accent, ink blue as the quiet second voice, and twelve saturated book colours reserved for subjects.

### Primary
- **Correction Red** (#b8360f; dark mode Coral Red #f47a55 for text, Coral Fill #f2704a for filled buttons): primary buttons, the active tab underline, active nav item, links, the next-exam countdown, focus rings. In dark mode the coral sits on Night Desk with near-black text on filled buttons (#1a0d08).

### Secondary
- **Ink Blue** (#2b5c8a; dark Night Blue #8fb8e3): small secondary signals only – the "next exam" dot, crowns on leaderboards, calendar highlights for "today", quiet info states.

### Tertiary
- **Check Green** (#3f7a4f; dark #8fc79e): success only – correct answers, results, saved states, the "Richtig" tick.

### Neutral
- **Paper** (#fbf7ef): page background (light).
- **Sheet** (#ffffff): cards, dialogs, inputs on raised surfaces.
- **Margin Beige** (#f3ecdf) and **Pill Beige** (#efe6d6): secondary buttons, active rail items, segmented-control thumbs, count badges.
- **Ruled Line** (#e8dfd0) / **Ruled Line Strong** (#cdbfa8): borders and dividers; strong for hover borders.
- **Ink** (#1f1b16): body and heading text. **Pencil Grey** (#6b5f52): secondary text, captions, labels (≥5:1 on Paper and Margin Beige).
- **Night Desk / Night Sheet / Night Raised / Night Line** (#17130f / #201a15 / #29221c / #3a3027) with **Chalk** (#f5eee4) and **Night Pencil** (#ab9f92): the dark-mode equivalents, same roles.

### Subject Book Colours
Each subject owns one colour, used for its 3D book cover (gradient from a lighter tint to this value), its icon badge in search and the grade book, and nowhere else: Math #3341c9 · Deutsch #c92a2a · Englisch #0f766e · Chemie #e67700 · Physik #1864ab · Bio #2b8a3e · Geschichte #8a5a2b · Religion #a61e4d · Arabisch #0b7285 · Kunst #d9480f · Musik #6741d9 · Sport #5c940d.

### Named Rules
**The Red Pen Rule.** Correction Red marks what to do or look at next – one primary button, the active tab, the countdown. If everything is red, nothing is.

**The Book Colour Rule.** Subject colours belong to subjects. Never use a book colour as a general accent, background or decoration.

**The Two Modes Rule.** Every colour ships as a light and a dark pair; text pairs must pass WCAG AA (4.5:1) in both.

## Typography

**Display Font:** Bricolage Grotesque (fallback Noto Sans Arabic, system-ui)
**Body Font:** Inter (fallback Noto Sans Arabic, system-ui)
**Study Text Font:** Iowan Old Style / Palatino / Georgia (study pages only)

**Character:** A friendly, slightly quirky grotesque for headings paired with a plain, very readable sans for everything you scan; study material switches to a bookish serif so it feels like the printed worksheet.

### Hierarchy
- **Display** (800, 3rem on desktop / ~2.25rem phone, 1.05): page titles like "Your subjects", subject names, the NC number.
- **Headline** (700, 1.875rem, 1.2): section titles, the next-exam subject.
- **Title** (700, 1.125rem, 1.3): card and folder titles, Aufgabe headings.
- **Body** (400, 18px root, 1.6, line height snapped to a 4px grid): all reading text; keep prose to roughly 65–75ch.
- **Label** (500, 0.875rem): buttons, tabs, meta lines, chips. Uppercase tracked labels only for tiny section captions.
- **Study Text** (400, 1.04rem serif, 1.8, justified with hyphenation): Musterlösungen and poems, with line numbers in the margin.

### Named Rules
**The Big-Enough Rule.** Nothing a student must read is smaller than 0.875rem; fixed pixel sizes below 14px are not allowed.

**The Tabular Numbers Rule.** Grades, points, NC, timers and countdowns use tabular figures so digits don't jump.

## Layout

Single-column content inside a centred container: max-width 48rem (3xl) for reading and subject pages, 56–64rem (4xl–6xl) for home, grade book and the subjects shelf. Side gutter is 16px on phones. Spacing follows a 4px rhythm (4 / 8 / 16 / 24 / 40px).

Navigation: on large screens (≥1024px) a 64px icon rail on the left (logo, search, Home, Subjects, Communities, Exams, Settings at the bottom) with tooltips; below that a sticky top bar (logo + search) and a 5-tab bottom bar that respects the safe-area inset. The subjects shelf is a responsive grid (2 columns on phones → 5 on wide screens). Subject pages use a sticky underline tab row. There is never horizontal page scroll; wide tables and equation blocks scroll inside their own box.

## Elevation & Depth

Depth comes from **soft shadows on top of tonal layering**: Paper → Sheet → Margin Beige. Cards rest slightly lifted from the page; dialogs, menus, toasts and the subject books lift clearly. Dark mode uses deeper, darker shadows and relies more on the tonal steps (Night Desk → Night Sheet → Night Raised).

### Shadow Vocabulary
- **Resting card** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -16px rgb(60 40 20 / 0.25)`): cards, study-page boxes, the grade book.
- **Primary button** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.16), 0 1px 2px rgb(0 0 0 / 0.18)`): a little pressable bevel.
- **Pop-up** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)`): dialogs, calendar, search, menus, toasts.
- **Book** (`box-shadow: 0 10px 24px -12px rgb(0 0 0 / 0.55), 0 2px 4px rgb(0 0 0 / 0.18)` plus a blurred contact shadow underneath): the 3D subject books.

### Named Rules
**The Gentle Lift Rule.** Shadows are soft and warm, never hard black edges. The more a thing can be picked up (dialog, book), the higher it floats.

## Shapes

Gently rounded everything: controls 8px, cards 10–16px, large panels 16px, pills fully round. Books are the exception with a book-like corner (3px at the spine, 10px at the fore-edge). Borders are 1px Ruled Line; inputs use a 2px border when they hold a grade.

## Components

### Buttons
Tactile and friendly – they press down slightly (scale 0.985) when tapped.
- **Shape:** gently rounded (8px), 36–48px tall; 44px minimum touch target.
- **Primary:** Correction Red fill, white label (dark mode: coral fill, near-black label), soft bevel shadow. Hover darkens by 10%.
- **Outline / Secondary:** Paper or Margin Beige with a Ruled Line border; hover turns the surface Margin Beige.
- **Focus:** 2px Correction Red outline with 2px offset (all focusable elements).

### Chips
- **Subject / filter chips:** Margin Beige pills; the selected one turns into a Correction Red filled rounded-rectangle with white text.
- **Count badges:** small Margin Beige rounded tags with tabular numbers.

### Cards / Containers
- **Corner Style:** 10–16px.
- **Background:** Sheet on Paper (Night Sheet on Night Desk).
- **Shadow Strategy:** Resting card shadow; hover may strengthen the border to Ruled Line Strong.
- **Border:** 1px Ruled Line.
- **Internal Padding:** 16–24px; panel headers are separated by a 1px divider.

### Inputs / Fields
- **Style:** Paper background, 1px Input border, 8px radius, 16px text on phones (prevents iOS zoom).
- **Grade field:** an 88×48px box with 2px border, large bold tabular number and a small "P" suffix; filled fields take the subject's colour at 14% as background; out-of-range input shakes and shows a toast.
- **Focus:** border turns Correction Red / ring.
- **Error:** destructive red border and message.

### Navigation
- **Rail (desktop):** 64px wide, 40px icon buttons; the active item gets Margin Beige fill, a red icon and a 3px red bar on the outer edge; labels appear as tooltips after a short hover delay.
- **Bottom bar (phone):** five icons with labels, sliding Margin Beige indicator behind the active one.
- **Search:** full-screen overlay with a large 24px input; results grouped (Pages, Subjects, Topics, Study pages, Tests, Communities) with subject-coloured badges.

### Subject Book (signature component)
A real 3D book per subject: gradient leather cover in the subject colour, dotted texture, the subject icon top-left and the name in heavy display type at the bottom, a spine and cream page block. On pointer devices it tilts toward the cursor with a moving light glare and lifts on hover; on tap it grows to fill the screen in its colour, then fades into the subject page. Respects reduced motion (no tilt, no zoom).

### Study Page (signature component)
Self-contained pages in the app's palette: numbered section badges, "Merke / Achtung / Tipp" boxes with a coloured left edge, book-style "Beispiel" boxes, two-column solutions (explanation left, working right), collapsible "Lösung anzeigen", and printed-page Musterlösungen with margin line numbers. Formulas render with KaTeX. Deutsch pages swap the accent to the Deutsch book red; Math pages use the Math book indigo.

## Do's and Don'ts

### Do:
- **Do** keep one Correction Red action per view; everything else is outline or ghost.
- **Do** use the subject's book colour whenever a subject is shown (book, badge, grade card) – and only then.
- **Do** ship every screen in light and dark and check text contrast ≥ 4.5:1 in both.
- **Do** keep reading text at 18px root and labels ≥ 0.875rem; use tabular numbers for grades and dates.
- **Do** give tappable things press feedback (scale 0.985) and a 44px touch target.
- **Do** respect `prefers-reduced-motion` (no tilt, zoom or slide).

### Don't:
- **Don't** use book colours as decoration, backgrounds or gradients outside subject contexts.
- **Don't** add hard, dark, offset shadows or glowing neon effects.
- **Don't** shrink text below 14px or use thin weights for anything students must read.
- **Don't** let pages scroll sideways on a phone; scroll wide tables and formulas inside their box.
- **Don't** introduce a third accent colour; Ink Blue and Check Green stay small and functional.
