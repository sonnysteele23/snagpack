# SnagPack local worker

Checks **Target / Walmart** stock from a real Chrome on your machine (their servers
block cloud scraping), and reports back to SnagPack so it can detect landings and alert
you. Best Buy is handled by the cloud app's official-API adapter — this worker only
covers the retailers that need a real browser.

## One-time setup

```bash
cd worker
npm run setup          # installs Playwright + Chromium
```

## Run it

You need the app's `MONITOR_SECRET` (from the Vercel project env). Then:

```bash
MONITOR_SECRET='your-monitor-secret' npm start
```

Leave it running. Every 3 minutes it opens each Target/Walmart product, reads whether
it's buyable + the price, and reports to https://snagpack.vercel.app. When something
flips out→in, SnagPack fires the alert.

### Options (env vars)

| var | default | notes |
|-----|---------|-------|
| `MONITOR_SECRET` | — | required; matches the app's Vercel env |
| `SNAGPACK_URL` | `https://snagpack.vercel.app` | point at a local dev server if testing |
| `INTERVAL_MS` | `180000` | 3 min between cycles — keep it polite |
| `HEADLESS` | `true` | set `false` to watch it, or to clear a bot challenge once |
| `CHANNEL` | `chrome` | uses your installed Chrome; set `CHANNEL=` for bundled Chromium |

### If a site shows a bot challenge

Run once with `HEADLESS=false CHANNEL=chrome npm start`, solve the challenge in the
window that opens (and/or sign into Target/Walmart there). The `.profile` folder keeps
that session, so later headless runs reuse it.

## Assisted checkout (opt-in)

When an item lands, the worker can **add it to your cart and open the checkout screen in
your own browser, then stop** — you review and click "Place your order" yourself. It
**never** places the order. This runs in your own Target session (your account, card,
address), so it ships to you.

**One-time prep:** run the worker with `HEADLESS=false`, and in the Chrome window that
opens, **sign into Target** and make sure you have a **saved shipping address + payment
method**. The `./.profile` folder keeps that session.

**Run with assisted buy:**

```bash
HEADLESS=false BUY_MODE=assisted MONITOR_SECRET='your-monitor-secret' npm start
```

**Try the flow now** (dry run against a specific product, e.g. one that's in stock) —
it will add to cart and open checkout so you can see it work, without waiting for a drop:

```bash
HEADLESS=false BUY_MODE=assisted \
  BUY_TEST_URL='https://www.target.com/p/2026-topps-mlb-series-2-baseball-trading-card-mega-box/-/A-1011011003' \
  MONITOR_SECRET='your-monitor-secret' npm start
```

Then finish the purchase by clicking **Place your order** in the window.

## Notes

- This is your own browser + IP at a polite interval — not evasion infrastructure.
- SnagPack never clicks "Place your order" — you always approve the money.
- Automated purchasing is against Target's ToS; there's a small account/card ban risk,
  and checkout can hit a CAPTCHA. Assisted mode (a human finishing) trips fewer flags.
- Only runs while your machine is on. For 24/7 coverage, use a paid stock feed instead.
