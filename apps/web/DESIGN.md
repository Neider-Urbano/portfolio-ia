---
name: Portafolio Interactivo con IA — Modo Voz
description: El portafolio se siente como abrir un asistente de IA moderno — un orbe que respira saluda al visitante, y cada sección vive en su propia tarjeta real, nunca encerrada en una burbuja de chat.
colors:
  hall-day: "hsl(260 35% 98%)"
  hall-night: "hsl(258 22% 7%)"
  board-day: "hsl(0 0% 100%)"
  board-night: "hsl(258 18% 11%)"
  board-raised-day: "hsl(260 30% 96%)"
  board-raised-night: "hsl(258 18% 15%)"
  rule-day: "hsl(260 16% 91%)"
  rule-day-strong: "hsl(260 12% 82%)"
  rule-night: "hsl(258 14% 20%)"
  rule-night-strong: "hsl(258 12% 28%)"
  ink-day: "hsl(260 22% 13%)"
  ink-night: "hsl(258 20% 95%)"
  ink-muted-day: "hsl(258 10% 38%)"
  ink-muted-night: "hsl(258 8% 72%)"
  ink-faint-day: "hsl(258 8% 44%)"
  ink-faint-night: "hsl(258 8% 56%)"
  accent-lilac-day: "hsl(262 68% 54%)"
  accent-lilac-night: "hsl(262 85% 74%)"
  accent-coral-day: "hsl(18 88% 48%)"
  accent-coral-night: "hsl(18 92% 66%)"
  fault-day: "hsl(4 72% 44%)"
  fault-night: "hsl(4 85% 65%)"
typography:
  display:
    fontFamily: "Urbanist, ui-monospace, SFMono-Regular, monospace"
    fontSize: "clamp(1.5rem, 3vw, 1.875rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Urbanist, ui-monospace, SFMono-Regular, monospace"
    fontSize: "1rem — 1.125rem"
    fontWeight: 700
  label:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.02em"
  body:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  card: "16px"
  full: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.accent-lilac-night}"
    textColor: "on-accent (white in day, near-black in night — see Named Rules)"
    rounded: "{rounded.full}"
    padding: "0.625rem 1.25rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted-night}"
    rounded: "{rounded.full}"
    padding: "0.625rem 1.25rem"
  card:
    backgroundColor: "{colors.board-night}"
    rounded: "{rounded.card}"
    padding: "1rem"
---

# Design System: Modo Voz

## Overview

**Creative North Star: "Open the Assistant, Then Scroll a Real Page"**

The site's own product is an AI that answers questions about the owner using only live, real data — so the portfolio itself opens like that assistant. A breathing orb greets the visitor with the owner's name, a headline, and a waveform, exactly as a modern voice/AI app would. But the conversational framing is deliberately contained to that single greeting moment and to the real `/chat` page: everything below the hero — projects, experience, education, services, skills, hobbies, gallery, comments, contact and map — lives in its own real card or grid, fully visible and scannable, never trapped inside a chat bubble pretending to be a page.

This is the fourth visual world this project has shipped (Mission Control → El Circuito → El Panel de Salidas → Modo Voz), and the first one the owner picked directly rather than through the skill's dice-rolled direction process: after two rolled directions (a PCB world, a split-flap departures board) and a rejected round of four freshly-rolled alternatives (a drum machine, a patch bay, a Greiman-style collage, a bioluminescent forest), the owner stated the actual pinned brief outright — the whole product should read as chatting with an AI, minimalist, icon-led, image-carrying, dynamic — and picked "Modo Voz" from four concrete readings of that brief presented as static comps. A user- or brief-pinned direction beats the roll, always; this is that case.

**Key Characteristics:**
- One lilac accent (`--amber` — the token name survives from earlier worlds on purpose, see Do's/Don'ts) means "interactive / live," full stop: links, the primary CTA, live-status dots, focus rings, skill-bar fills.
- A warm coral (`--copper` — same survives-the-token-name logic) is reserved for the orb's gradient and small secondary icon tiles (currently only the Servicios cards). It is a companion to the accent, not a second independent status color.
- The orb is the system's one avatar. It never becomes a decorative motif elsewhere — no small orbs sprinkled around the page as bullets; every other "live" indicator uses the plain glowing dot (`.led-dot`) instead.
- Every corner in the entire site (home, chat, project detail, admin) is soft — 16px on cards/inputs, fully round on pills, dots, and avatars. This is driven by one CSS variable (`--radius-card`) that Tailwind's `rounded-sm` now resolves to (see `tailwind.config.ts`), not by editing each component; the previous two worlds kept `rounded-sm` at a literal 2px, so this is the first world in this project's history where the shape language itself — not just color and type — changed site-wide from a single token edit.
- Day is the assistant under daylight (cool violet-white ground, a deep enough lilac for AA text contrast); night is the same assistant in a dim room (near-black violet-tinted ground, the lilac and coral both brightened for glow). Because the accent flips from dark-on-light (day) to light-on-dark (night), any solid-fill accent button needs day/night-aware foreground text — see the On-Accent rule below; this is a real trap a straight day/night value swap would have shipped broken.

## Colors

Color strategy is Committed: the lilac accent carries real surface area (CTA fill, orb gradient, focus rings, skill bars) against a two-tone violet-tinted neutral system, not a rare accent dot on a gray page.

### Primary
- **Lilac** (`hsl(262 68% 54%)` day / `hsl(262 85% 74%)` night, Tailwind class `signal`, CSS var `--amber`): everything interactive or live. Every glowing dot uses `.led-dot`.

### Secondary
- **Coral** (`hsl(18 88% 48%)` day / `hsl(18 92% 66%)` night, Tailwind class `copper`, CSS var `--copper`): the orb's second gradient stop, and the icon color on the Servicios cards (`bg-copper-soft text-copper`). Never used as a second status meaning.
- **Fault** (`hsl(4 72% 44%)` day / `hsl(4 85% 65%)` night): error/validation text only.

### Neutral
- **Hall** (Tailwind `console`): page background, faint violet-white in day, near-black violet in night.
- **Board** (Tailwind `panel`): card/window surfaces — pure white in day (for real lift off the tinted hall), one step up from hall in night.
- **Board Raised** (Tailwind `panel-raised`): modals (WelcomeModal).
- **Ink / Ink Muted / Ink Faint**: body text, secondary text, and the faintest label tier. All three were contrast-audited against both Hall and Board in both themes and sit at or above 4.5:1 for body-weight text (Ink Faint day is 5.14:1 against Hall, 5.42:1 against Board; night is 5.43:1 / 5.01:1).

### Named Rules
**The One Meaning Rule.** Lilac always means "interactive / live." Coral is a companion accent, never a second status color, and stays confined to the orb and the one icon-tile variant that opts into it.
**The On-Accent Rule.** Text placed on a *solid* lilac fill (buttons, the user's chat bubble, the mic level meter) must use the `on-accent` token (`text-on-accent` / `bg-on-accent`), never a hardcoded `text-white`. Day's lilac is dark enough for white text (5.9–6.8:1); night's lilac is deliberately bright for glow, so white text on it fails (2.8:1) — `on-accent` resolves to white in day and near-black in night, verified by contrast math, not eyeballing. This bug shipped once during the build (`text-white` hardcoded on the primary CTA) and was caught by a computed-contrast pass, not a screenshot — a purely visual QA pass on a light-mode screenshot would not have caught it.

## Typography

**Display / UI Font:** Urbanist — a soft geometric sans with real character as an app's title/UI voice, used at 500–800 weight for the hero name, section headings, card titles, and every button/pill label.
**Body Font:** Nunito Sans — a warm humanist sans for bios, descriptions, comments, and the chat's own prose answers, chosen for comfortable on-screen reading rather than a display face pressed into paragraph duty.

### Hierarchy
- **Display** (800, `clamp(1.5rem, 3vw, 1.875rem)`, Urbanist): the hero name.
- **Title** (700, 1rem–1.125rem, Urbanist): section headings, project/card titles.
- **Body** (400, 1rem, Nunito Sans, line-height 1.6): bios, descriptions, chat prose.
- **Body Secondary** (400, 0.875rem / Tailwind `text-sm`): card descriptions, muted text, and the toast notification (`react-hot-toast`, styled via inline `style` in `layout.tsx` since the library takes a style object, not classes — same 14px step, just not expressible as a Tailwind class there).
- **Label** (600, 0.75rem, Nunito Sans, slight tracking): stat pill labels, dates, tags, status text.
- **Micro-label** (11px / `text-[11px]`): a documented secondary step below Label, used in two contexts — the circular monogram badges (skill initial, comment-author initial) where 12px reads too large for a 20px/32px circle, and the admin dashboard's dense sidebar/table labels (inherited unchanged from earlier worlds, where this step was already established for Operate-surface density). Both are intentional, not drift.

## Layout

Single centered column, `max-w-4xl` on the home, `max-w-2xl`/`max-w-3xl` on chat and project detail — narrower than a marketing page on purpose, since the hero is a centered conversational moment, not a two-column spread. Sections below the hero use `grid` (2-column projects/education/comments, 3-column services) or a bordered list-card (experience, skills) rather than the previous worlds' flat divided rows: cards are the board's own unit in a voice-app world the way rows were the unit in a departures-board world. More space above a section heading than below it; sections separate with consistent `mb-16` rhythm. Admin keeps its fixed 224px sidebar and inherits the palette, type, and soft radius automatically through the same shared Tailwind tokens, but — consistent with every prior world in this project — adds none of the public surface's orb/waveform choreography, because an operating tool should not perform for the person using it.

## Elevation & Depth

Flat by default — cards use a 1px hairline border (`border-line`) plus a one-step background shift (Hall → Board), not a shadow. The one exception is `.lift-hover`: interactive cards (projects, education, gallery images) lift 2px and gain a soft shadow on hover, a real elevation change on interaction rather than resting-state decoration. The orb carries its own soft glow (`box-shadow` blended from the accent) because it is meant to read as a light source, the same exception class the previous worlds carved out for their own "lit" indicators.

## Shapes

Corners are soft everywhere — 16px on cards, inputs, and icon tiles (`--radius-card`, consumed through Tailwind's `rounded-sm`), fully round on buttons, pills, avatars, dots, and the orb. This is the opposite shape language from the two prior worlds (both kept near-square 2px corners as a deliberate "signage/instrument" material choice); Modo Voz's own material is a soft modern app surface, so roundness is the committed default rather than an exception.

## Components

### Orb (signature component)
`src/components/voice/Orb.tsx`. A circular gradient (lilac → coral) that breathes continuously via CSS (`orb-pulse` + an expanding `orb-ring`), server-renderable since the animation is pure CSS. Used at three scales: 84px in the hero, 52px on the chat page header, 22px as the assistant's avatar on every chat message and the chat window's own header. It never appears smaller as a decorative bullet — that job stays with the plain `.led-dot` glow.

### Waveform
`src/components/voice/Waveform.tsx`. Seven bars breathing at staggered delays beneath the hero orb — purely ambient, not tied to real audio (the chat's own `VoiceLevelMeter` is the component that reflects the live microphone).

### Icon set
`src/components/voice/icons.tsx`. Ten single-stroke SVG icons (project, briefcase, sparkle, image, service, hobby, comment, location, external-link, graduation cap), drawn in the same one-weight geometric grammar `ContactActions`/`SocialLinks` already established in earlier worlds — no icon library, no emoji standing in for an icon.

### Buttons
- **Primary:** solid lilac fill, fully round, `on-accent` text (see Named Rules), a small upward hover lift.
- **Secondary:** transparent with a `line-strong` border, fully round, text shifts to lilac on hover.

### Cards (projects, education, services, references, comments)
16px radius, 1px `line` border, `board` background, `.lift-hover` on anything clickable. An icon tile (lilac-soft or, for Servicios, coral-soft) sits at the top of project/education/service cards as the section's visual anchor in place of a index number or eyebrow label.

### Chat
`src/components/chat/ChatWindow.tsx`. Rounded bubbles (16px), the user's in solid lilac with `on-accent` text, the assistant's in a bordered neutral card with a 22px Orb avatar beside it. The typing indicator keeps the three-dot bounce carried over from every prior world in this project — the one deliberate, documented exception to "no bounce/elastic easing," because it is a near-universal "composing a reply" convention, not an ambient page animation.

## Do's and Don'ts

### Do:
- Reserve lilac strictly for interactive/live meaning; give every solid-accent button `on-accent` text, verified by contrast math in both themes, not by eye.
- Keep the orb as the one avatar/greeting device — 84/52/22px, never smaller as a decorative bullet.
- Keep every section below the hero in a real card or grid; the conversational frame stops at the greeting and at `/chat`.
- Change the site-wide corner radius by editing `--radius-card`, never by touching `rounded-sm` call sites one by one.

### Don't:
- Don't add a kicker/eyebrow line above any heading — none exists in this build; keep it that way.
- Don't introduce a third saturated accent beyond lilac and coral.
- Don't hardcode `text-white` (or any other literal) on a solid `bg-signal` fill — always `text-on-accent`; the accent's own lightness flips between themes by design.
- Don't push the flap/mechanical-reveal device from the previous world back into this one — Modo Voz's signature motion is the orb's breathing and cards' hover lift, not a per-character mechanical animation.
- Don't add the orb/waveform choreography to the admin dashboard — Operate mode inherits color, type, and radius only, same rule every prior world in this project has kept.
