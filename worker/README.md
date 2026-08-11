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

## Notes

- This is your own browser + IP at a polite interval — not evasion infrastructure.
- Only runs while your machine is on. For 24/7 coverage, use a paid stock feed instead.
