// SnagPack local worker.
//
// Why this exists: Target and Walmart block server-side stock checks (Akamai 403 +
// CAPTCHA). This script runs a REAL Chrome on your own machine/IP, opens each watched
// product page like a normal shopper would, reads whether it's buyable, and reports
// back to SnagPack — which then detects the out->in transition and alerts you.
//
// This is not anti-bot evasion: it's your own browser, your own IP, at a polite
// interval. Keep the interval reasonable so you don't hammer the sites.
//
// Run:
//   cd worker && npm run setup           # installs Playwright + Chromium (one time)
//   MONITOR_SECRET=xxxxx npm start
//
// Env:
//   SNAGPACK_URL   default https://snagpack.vercel.app
//   MONITOR_SECRET required — same value as the app's MONITOR_SECRET (Vercel env)
//   INTERVAL_MS    default 180000 (3 min) between full cycles
//   HEADLESS       default "true"; set "false" to watch it / solve a challenge once
//   CHANNEL        default "chrome" (uses your installed Chrome); "" for bundled Chromium

import { chromium } from "playwright";

const BASE = process.env.SNAGPACK_URL || "https://snagpack.vercel.app";
const SECRET = process.env.MONITOR_SECRET;
const INTERVAL = Number(process.env.INTERVAL_MS || 180000);
const HEADLESS = process.env.HEADLESS !== "false";
const CHANNEL = process.env.CHANNEL ?? "chrome";

if (!SECRET) {
  console.error("MONITOR_SECRET is required (same value as the app's Vercel env).");
  process.exit(1);
}

// Runs in the page. Finds the PRIMARY buy button (highest on the page — the buy box,
// not the recommendation carousels below it) and reads its real enabled/disabled
// state, plus any out-of-stock text right around it. Far more reliable than a
// whole-page text match, which trips over "Add to cart" buttons in "you may also like".
function pageProbe() {
  const buyRe = /add to cart|add for shipping|ship it|add to bag|add item to cart/i;
  const oosRe = /out of stock|sold out|temporarily out of stock|currently unavailable|not available|notify me/i;

  const buttons = [...document.querySelectorAll('button, [role="button"], input[type="submit"]')].filter((b) =>
    buyRe.test(b.textContent || b.value || b.getAttribute("aria-label") || ""),
  );
  buttons.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  const primary = buttons[0] || null;

  let enabled = false;
  let oosNear = false;
  if (primary) {
    enabled = !primary.disabled && primary.getAttribute("aria-disabled") !== "true";
    let c = primary;
    for (let i = 0; i < 4 && c.parentElement; i++) c = c.parentElement;
    oosNear = oosRe.test((c.textContent || "").toLowerCase());
  }

  const priceMatch = (document.querySelector("main") || document.body).textContent.match(/\$\s?(\d{1,4}\.\d{2})/);
  return {
    hasPrimaryBuy: !!primary,
    enabled,
    oosNear,
    price: priceMatch ? Number(priceMatch[1]) : null,
    title: document.querySelector("h1")?.textContent?.trim() || "",
  };
}

async function checkPage(context, task) {
  const page = await context.newPage();
  try {
    await page.goto(task.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500 + Math.random() * 1500);

    const html = (await page.content()).toLowerCase();
    if (/access denied|verify you are a human|are you a robot|px-captcha|\/captcha\?/i.test(html)) {
      return { id: task.id, inStock: false, note: "bot challenge — run HEADLESS=false once to clear" };
    }

    const p = await page.evaluate(pageProbe);
    if (!p.hasPrimaryBuy) {
      return { id: task.id, inStock: false, price: p.price, note: "no buy button found (page shape changed?)" };
    }
    const inStock = p.enabled && !p.oosNear;
    return {
      id: task.id,
      inStock,
      price: p.price,
      note: inStock ? undefined : p.oosNear ? "out of stock" : "buy button disabled",
    };
  } catch (e) {
    return { id: task.id, inStock: false, note: "worker error: " + e.message };
  } finally {
    await page.close();
  }
}

async function cycle(context) {
  let tasks = [];
  try {
    const res = await fetch(`${BASE}/api/worker/tasks`, { headers: { "x-monitor-secret": SECRET } });
    if (!res.ok) {
      console.error("tasks fetch failed:", res.status);
      return;
    }
    ({ tasks } = await res.json());
  } catch (e) {
    console.error("tasks fetch error:", e.message);
    return;
  }

  console.log(`\n${new Date().toLocaleTimeString()}  checking ${tasks.length} product(s)`);
  const readings = [];
  for (const t of tasks) {
    const r = await checkPage(context, t);
    console.log(`  ${r.inStock ? "🟢 IN " : "⚪ out"}  ${t.name}${r.price ? "  $" + r.price : ""}${r.note ? "  (" + r.note + ")" : ""}`);
    readings.push(r);
    await new Promise((res) => setTimeout(res, 1500 + Math.random() * 2500));
  }

  if (readings.length) {
    try {
      const rep = await fetch(`${BASE}/api/worker/report`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-monitor-secret": SECRET },
        body: JSON.stringify({ readings }),
      });
      const summary = await rep.json().catch(() => ({}));
      if (summary.landed) console.log(`  🚨 ${summary.landed} LANDED — alert fired`);
    } catch (e) {
      console.error("report error:", e.message);
    }
  }
}

const context = await chromium.launchPersistentContext("./.profile", {
  headless: HEADLESS,
  channel: CHANNEL || undefined,
  viewport: { width: 1280, height: 900 },
});

console.log(`SnagPack worker → ${BASE}`);
console.log(`interval ${INTERVAL / 1000}s · headless=${HEADLESS} · browser=${CHANNEL || "bundled chromium"}`);

for (;;) {
  try {
    await cycle(context);
  } catch (e) {
    console.error("cycle error:", e.message);
  }
  await new Promise((r) => setTimeout(r, INTERVAL));
}
