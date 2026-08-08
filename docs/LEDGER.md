# SnagPack — Ledger

Append-only record of decisions, verified facts, and open questions.

## 2026-08-07 — Project kickoff

**Decisions**
- Name: **SnagPack**, domain **snagpack.com** (whois-level available 2026-08-07;
  runners-up: packbeacon.com, packpounce.com, packsnag.com, packswoop.com — all
  whois-available same day). Called by Claude, confirmed by Sonny. ⚠️ Registrar
  purchase not yet completed.
- Scope v0: **sealed packs/boxes only, no singles.** Pokémon + baseball + other
  sports.
- Automation posture: **alert + assisted checkout.** Unattended auto-checkout is a
  typed pluggable seam (`src/lib/checkout.ts`) but OFF by default and ships no
  anti-bot evasion.
- Stack: **Next.js 15 (App Router) + Prisma + SQLite** local; Postgres on Vercel.
  Chosen to match Sonny's existing Vercel workflow and give admin UI + cron + API
  in one deployable unit.

**What's true (verified this session)**
- Domain whois check: snagpack.com returns no registration (`whois` output).
  ✅ Verified — whois command output 2026-08-07.

**What's NOT true / do-not-publish**
- "We can reliably auto-buy from Walmart/Target the instant stock lands." ❌
  Big retailers use Akamai/HUMAN bot-detection + purchase limits; unattended
  auto-checkout violates ToS and is unreliable without evasion infra we won't build.

**Open questions**
- Register snagpack.com? (Sonny)
- Comps data source for `marketPrice`: manual for now vs eBay API / TCGplayer /
  PriceCharting integration.
- Alert channel: Discord webhook vs SMS/push.
- Real retailer coverage order: which stores get real adapters first (Best Buy API
  is the cleanest starting point).
- Push to GitHub as a new repo? (Sonny — gh authed as sonnysteele23.)
