# SnagPack 🃏📡

Sealed trading-card **pack radar**. Watches retailers for sealed Pokémon / sports
card products, catches the drop the instant it lands, alerts you with a one-tap
cart, and tracks each buy through to the flip (buy price → sell price → net P&L).

> **Scope (v0):** sealed packs/boxes only — no singles yet. Alert + **assisted**
> checkout. Unattended auto-checkout is a pluggable seam, off by default (see below).

## Quick start

```bash
npm install
cp .env.example .env        # fill in DISCORD_WEBHOOK_URL / BESTBUY_API_KEY when ready
npm run db:push             # create the SQLite schema
npm run db:seed             # sample watchlist incl. a DEMO row that "lands"
npm run dev                 # http://localhost:3000
```

Then hit **▶ Run scan now** on the dashboard, or:

```bash
npm run monitor:once        # one scan cycle from the CLI
curl -s -X POST localhost:3000/api/monitor -H 'x-monitor-secret: dev-secret' | jq
```

## How it works

- **Watchlist** (`Product`) — one row per product you track. Adding a store is
  config, not code.
- **Adapters** (`src/lib/retailers/*`) — each retailer implements `check()` →
  `{ inStock, price, cartUrl }`. `bestbuy` uses the **official API**; `generic`
  scrapes page-signal text. Register new ones in `retailers/index.ts`.
- **Monitor** (`src/lib/monitor.ts`) — one polite polling cycle. On an
  out-of-stock → in-stock **transition** it records a `RestockEvent`, runs the
  checkout strategy, and fires an alert.
- **Checkout** (`src/lib/checkout.ts`) — `assisted` (build fastest cart + alert;
  ToS-safe) or `auto` (typed seam, refuses by default — implement only for stores
  that permit programmatic purchase).
- **Alerts** (`src/lib/alert.ts`) — Discord webhook, else console. Add SMS/push here.
- **Admin** (`src/app/page.tsx`) — watchlist status, recent landings, and P&L.

## Reality check (read this)

- **Big retailers (Walmart/Target) block plain scraping** (Akamai/HUMAN) and render
  stock via JS. Use an official API, a paid stock feed, or your own headless-browser
  adapter for those. The generic adapter reports `bot-blocked` rather than faking it.
- **Unattended auto-buy against those sites violates their ToS**, risks account/card
  bans, and is an anti-bot arms race this repo does not ship the evasion for.
- **Margin gate:** the strategy only acts when est. resale (net ~15% fees) beats
  cost by `MIN_MARGIN_PCT` (default 20%). Set `marketPrice` from comps.

## Deploy (Vercel)

Swap the datasource to `postgresql`, set `DATABASE_URL` to a Postgres URL, and add a
**Vercel Cron** hitting `POST /api/monitor` with the `x-monitor-secret` header on
your desired interval.
