# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary visitor audiences, both evaluating the site owner professionally, plus the owner as an authenticated admin:

- **Recruiters / hiring managers** — assessing fit for a fixed role; need to validate experience, stack, and seniority quickly.
- **Freelance clients / potential collaborators** — assessing fit for a project-based engagement; need to see finished work and trust the owner's judgment.
- **Site owner (admin)** — manages all profile content through a private dashboard and reviews visitor/engagement analytics.

## Product Purpose

An AI-powered interactive portfolio. Visitors can browse a traditional portfolio (profile, experience, education, projects, skills, gallery, references) or converse with an AI assistant that answers questions about the owner using only real, live data fetched from MongoDB through an MCP tool layer. The owner manages all content and reviews engagement analytics from a private dashboard.

## Positioning

Unlike a static portfolio site, visitors can ask an AI agent free-form questions ("how many years of experience with Node.js?") and get answers grounded in the owner's real, current data — not a scripted FAQ page or a generic LLM guessing from a resume PDF.

## Operating Context

- Public surface: traditional section-based browsing, plus a chat surface where tool-use status indicators (e.g. "Buscando en proyectos...") surface the agent's reasoning steps while it queries live data.
- Admin surface: authenticated dashboard (NextAuth Credentials) to CRUD profile, experience, education, projects, skills, gallery, and references, and to review analytics (page views, chat questions asked, most-viewed projects, frequent chat questions).
- Third-party visitors intentionally see the same "portfolio in numbers" stats (years of experience, project count, distinct technologies, courses/certifications) that the admin sees — this is a deliberate product decision, not an internal metric leaking out. What stays admin-only is traffic/engagement data (page views, chat-question counts).

## Capabilities and Constraints

- Confirmed stack: Next.js 14 (App Router) + Tailwind CSS, MongoDB via Mongoose, Google Gemini API for the chat agent, a standalone Node/Express MCP server exposing DB-backed tools to the chat.
- Auth: NextAuth Credentials provider, single admin user.
- Images are referenced by pasted URL by design (no upload pipeline) — confirmed decision, not a gap to fill visually.
- Real content has since been entered through the admin dashboard (real name, headline, bio, projects) — the database is no longer placeholder/seed data. Contact info was set directly by the assistant on the owner's request: email `julianur012b@gmail.com`, WhatsApp `+573204524545` (rendered as a `mailto:` and a `wa.me` link on the public site).

## Brand Commitments

**The core, durable brand commitment — stated directly by the owner, not inferred:** the portfolio should feel different from a standard portfolio by reading as an AI chat/assistant experience (not just having a chat subpage), minimalist, icon-led, image-carrying, and dynamic/full of real movement. This surfaced explicitly after two prior visual identities were both built and shipped without ever surfacing it — the owner had wanted this from the start but it only came out once they said "no me gustaron los que me diste... yo desde un inicio quería... un portafolio que se pareciera a un chat de IA." Any future redesign proposal must treat this as the pinned brief, not one option among several, unless the owner explicitly changes it.

A secondary, structural correction the owner gave on the same brief: the conversational/chat framing must stay contained to a greeting moment and the real `/chat` page — every other section (projects, experience, services, skills, hobbies, gallery, comments, contact/map) needs its own fully visible card or grid, never nested inside a chat bubble. This is a scanability requirement, not a taste preference: a recruiter or client skimming the page must be able to find any section without reading through a simulated conversation first.

This project has now shipped four visual identities, each explicitly replaced rather than iterated on: "Mission Control" (instrument-panel/console, rejected as too safe/generic), "El Circuito" (PCB/circuit-board world, green-accented — the owner liked green during that round specifically), "El Panel de Salidas" (split-flap departures board, amber-accented — requested for more impact/movement, but still didn't surface the chat-shaped-portfolio brief and was itself later rejected: "no me gustaron los que me diste"), and the current "Modo Voz" (AI-voice-assistant world, lilac/coral-accented), which is the first of the four the owner picked directly from concrete comps rather than through the skill's dice-rolled process, and the first one confirmed against the actual pinned brief above. Earlier per-round color preferences (green, then amber) belonged to those worlds' own material logic and are superseded, not standing requirements — don't assume either back in for a future world; ask.

## Evidence on Hand

Real profile content is now loaded (name, headline, bio, at least one project). Future work should continue using realistic content consistent with the existing Mongoose schemas, and must not fabricate testimonials, press, or metrics beyond what those schemas define.

## Product Principles

1. Every factual claim the AI or the page states about the owner must trace back to real data from the database — never invented.
2. The portfolio must read as credible to two different evaluators (recruiter and freelance client) at once — same content, no mode switch, dual appeal.
3. The admin dashboard is a private operating tool: clarity and speed over expression.
4. The public site and chat are an experience surface for the owner's professional story: the work leads, the interface recedes.

## Accessibility & Inclusion

No product-specific requirement beyond baseline web accessibility. This redesign explicitly requires a working light mode and dark mode, both with sufficient contrast.
