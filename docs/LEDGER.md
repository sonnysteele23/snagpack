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

## 2026-08-11 — First-party curation + Discord alerts

**Curation finding (verified via live browser check of seller):**
- Best Buy AND Walmart now run 3rd-party MARKETPLACES for cards. EVERY sealed-card SKU
  checked on both was a marketplace reseller at 3-6x MSRP (Best Buy API won't cover them).
  Best Buy marketplace tells: `/product/{slug}/{ALPHANUM}` URLs + "SP-" model prefix.
- Most Target Pokémon ETBs / Build-&-Battle are also Target Plus (marketplace).
- Reliable FIRST-PARTY = Target's own retail box configs (Value/Mega/Hanger/Chrome/Bowman)
  + current Pokémon booster bundles ("sold by Target").
- Watchlist replaced with 8 verified first-party Target items (6 Topps/Bowman/Chrome
  baseball + 2 Pokémon bundles), mostly out-of-stock = ideal restock candidates. All
  scanned by the local worker. ✅ Verified live via /api/worker/tasks.
- Implication: the "get a Best Buy API key" plan is moot for cards; Target-via-worker is
  the real path. bestbuy adapter stays in code for future non-marketplace use.

**Discord alerts:** rich embed (title/price/retailer/margin/buy-link) + `/api/alert/test`
(login-gated). Plumbing ✅ verified (returns "no DISCORD_WEBHOOK_URL set"). Needs Sonny's
webhook URL to go live. "Run scan now" auth fixed → uses login session via /api/scan.

## 2026-08-11 — Local browser-worker shipped (free Target/Walmart scanning)

- `worker/` Playwright script runs a real Chrome on the user's machine, reads the PRIMARY
  buy-button state (position heuristic, not naive full-page text), reports to the app.
- Endpoints: `GET /api/worker/tasks` + `POST /api/worker/report` (MONITOR_SECRET auth,
  middleware-allowlisted). `applyStock()` extracted from monitor.ts, shared by both.
- ✅ Verified: real browser loads Target with NO 403 (Bowman Blaster $59.99, "Out of
  stock", disabled Add-to-cart — read correctly). tasks endpoint returns 4 Target/Walmart
  products with secret (401 without). report endpoint processed a reading (HTTP 200).
- MONITOR_SECRET reset to a known value + redeployed so the worker can auth (value NOT
  recorded here — public repo; it's in the run instructions / private memory).
- Repo is now PUBLIC. Live app: https://snagpack.vercel.app (login Welcome13@).
- Still open: Best Buy free API key (cloud adapter ready); curate FIRST-PARTY listings
  (several seeded URLs are 3rd-party marketplace resellers at markup, not MSRP retail).

## 2026-08-07 — Real products seeded + scanning reality confirmed (receipts)

**What's true**
- Replaced all placeholder URLs with REAL live products (7). ✅ Verified: /api/products
  returns them; a Target URL (Prismatic ETB A-1008746912) confirmed live via WebFetch
  ($219.99, though that one is 3rd-party marketplace, not first-party MSRP).
- **Target availability API (redsky) is bot-blocked from servers.** ✅ Verified: curl →
  HTTP 403 with `captchaAbsoluteURL` in body. Best Buy storefront curl → HTTP 000.
- Real product IDs captured: Best Buy numeric SKUs (151=6548366, Silver Tempest=6521113,
  S&S=6397125); Target TCINs (Bowman Blaster=1007746656, Bowman Mega=94742626, Mega Evo
  Ascended Heroes ETB=1010148053); Walmart Prismatic bundle ip/15531420870.

**Scanning paths (honest)**
- Best Buy = official API (api.bestbuy.com) → REAL + reliable. Needs free BESTBUY_API_KEY
  (developer.bestbuy.com). Not yet provided. Adapter already wired.
- Target/Walmart = server scrape blocked (Akamai). Real options: (a) local headless
  Playwright worker on Sonny's own machine/IP (legit, not evasion infra) that POSTs
  results to /api/monitor-style ingest; (b) paid stock feed. NOT building anti-bot evasion.

## 2026-08-07 — Auth gate added (shared password)

- Shared-password gate via Edge middleware: all pages + data APIs require login;
  `/login`, `/api/auth/*`, and `/api/monitor` (own secret, for cron) stay open.
- Cookie stores a password-derived SHA-256 token (not the password); rotate
  `AUTH_SECRET` to invalidate all sessions.
- Env (production only): APP_PASSWORD, AUTH_SECRET. ⚠️ NOT set for preview/development,
  so preview deploys + local dev are locked out until those envs get the vars.
- ✅ Verified live on https://snagpack.vercel.app: `/` no-auth → 307 to /login;
  /login 200; /api/products no-auth → 401; wrong pw → 401; correct pw → 200 + cookie;
  authed `/` → 200 with content.

## 2026-08-07 — DEPLOYED LIVE to Vercel + Neon Postgres

- **Live:** https://snagpack.vercel.app — ✅ Verified: homepage HTTP 200, renders
  watchlist/inventory, `GET /api/products` 200 returning seeded rows from Neon.
- **DB:** Neon Postgres `neon-pink-coin` provisioned via `vercel integration add neon`
  (Marketplace, auto-injected env). Schema pushed + seeded (5 products). Prisma uses
  `POSTGRES_PRISMA_URL` (pooled) at runtime + `POSTGRES_URL_NON_POOLING` for migrations.
- **Project:** sonny-steeles-projects/snagpack (personal/Hobby scope). GitHub
  auto-connect failed at link time — deploys are via CLI (`vercel deploy --prod`), NOT
  git-push auto-deploy. Wire GitHub integration in the dashboard if you want push-to-deploy.
- **Env set (production):** POSTGRES_* (Neon), CHECKOUT_MODE=assisted, MONITOR_SECRET
  (random). BESTBUY_API_KEY / DISCORD_WEBHOOK_URL not set yet.
- **Cron:** removed from vercel.json (Hobby = daily-only). Scheduled scanning runs via
  `.github/workflows/scan.yml` — needs repo secrets SNAGPACK_MONITOR_URL
  (https://snagpack.vercel.app/api/monitor) + MONITOR_SECRET before it fires.

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
