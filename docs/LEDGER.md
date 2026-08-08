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

## 2026-08-07 — v0.2: inventory/P&L admin + scheduled scanning + pushed to GitHub

**Shipped (verified this session)**
- Pushed to **https://github.com/sonnysteele23/snagpack** (PRIVATE). ✅ Verified —
  `gh repo view` returned URL + visibility PRIVATE.
- Inventory & P&L admin: log a buy, change status (ORDERED→…→SOLD), mark sold with
  price+fees, per-row + portfolio net P&L, capital-out stat. ✅ Verified — POST
  /api/purchases 201, PATCH mark-sold 200 (status SOLD + soldAt stamped), dashboard
  rendered Net P&L $44.52 for a $99.98-cost / $170-sold / $25.50-fees lot.
- Scheduled scanning: `vercel.json` cron (*/5) + `.github/workflows/scan.yml` +
  monitor endpoint now also accepts Vercel Cron `Authorization: Bearer CRON_SECRET`.
- `next build` compiles clean, no TS errors. ✅ Verified — build output.

**Note:** cron granularity is ~5 min (Vercel Hobby is daily-only; GH Actions min ~5m).
True seconds-level drop-sniping needs a persistent worker, not cron — documented.

**Guard event:** project-guard hook blocked writes (session pinned to home). Sonny
cleared the lock via `!` to re-pin to snagpack. If Edit/Write to snagpack blocks
again, remove the lock file printed by the hook.

**Open questions**
- Register snagpack.com? (Sonny)
- Comps data source for `marketPrice`: manual for now vs eBay API / TCGplayer /
  PriceCharting integration.
- Alert channel: Discord webhook vs SMS/push.
- Real retailer coverage order: which stores get real adapters first (Best Buy API
  is the cleanest starting point).
- Push to GitHub as a new repo? (Sonny — gh authed as sonnysteele23.)
