// SnagPack local worker.
//
// Why this exists: Target blocks server-side stock checks (Akamai 403 + CAPTCHA). This
// script runs a REAL Chrome on your own machine/IP, opens each watched product like a
// normal shopper, reads whether it's buyable, and reports to SnagPack — which detects
// the out->in transition and alerts you.
//
// ASSISTED CHECKOUT (opt-in): with BUY_MODE=assisted, when an item lands the worker
// adds it to your cart and opens the checkout screen in YOUR OWN logged-in browser,
// then STOPS. It never clicks "Place your order" — you review and tap once. This runs
// in your own Target session (your account/card/address), not a cloud bot, and ships to
// you because you're buying online with your saved address.
//
// Run (watch only):
//   MONITOR_SECRET=xxxxx npm start
// Run (assisted buy — must be visible, and signed into Target with saved address+card):
//   HEADLESS=false BUY_MODE=assisted MONITOR_SECRET=xxxxx npm start
// Test the checkout flow once against a specific URL (e.g. an in-stock item):
//   HEADLESS=false BUY_MODE=assisted BUY_TEST_URL='https://www.target.com/p/.../-/A-...' MONITOR_SECRET=xxxxx npm start
//
// Env:
//   SNAGPACK_URL   default https://snagpack.vercel.app
//   MONITOR_SECRET required — same value as the app's MONITOR_SECRET
//   INTERVAL_MS    default 180000 (3 min)
//   HEADLESS       default "true"; MUST be "false" for assisted buy
//   CHANNEL        default "chrome"; "" for bundled Chromium
//   BUY_MODE       "off" (default) | "assisted"
//   BUY_TEST_URL   optional — run assisted checkout against this URL once at startup

import { chromium } from "playwright";

const BASE = process.env.SNAGPACK_URL || "https://snagpack.vercel.app";
const SECRET = process.env.MONITOR_SECRET;
const INTERVAL = Number(process.env.INTERVAL_MS || 180000);
const HEADLESS = process.env.HEADLESS !== "false";
const CHANNEL = process.env.CHANNEL ?? "chrome";
const BUY_MODE = process.env.BUY_MODE || "off";
const BUY_TEST_URL = process.env.BUY_TEST_URL || "";

if (!SECRET) {
  console.error("MONITOR_SECRET is required (same value as the app's Vercel env).");
  process.exit(1);
}

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
    if (
      /pardon our interruption|access to this page has been denied|access denied|verify you are a human|are you a robot|px-captcha|robot or human\?|unusual traffic/i.test(
        html,
      )
    ) {
      return { id: task.id, inStock: false, note: "bot challenge — run with HEADLESS=false once to clear it" };
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

// Assisted checkout — add to cart + open the checkout/review screen in your own browser,
// then STOP. Never clicks the final "Place your order". Fail-safe: if any step can't be
// found, it leaves the window on the furthest point reached for you to finish by hand.
// Requires HEADLESS=false and you signed into Target (saved address + payment) in ./.profile.
async function assistedCheckout(context, label, url) {
  console.log(`\n  🛒 ASSISTED CHECKOUT — ${label}`);
  if (HEADLESS) {
    console.log("     ⚠️ Worker is headless — no window to hand you. Restart with HEADLESS=false.");
    return;
  }
  const page = await context.newPage();
  try {
    await page.bringToFront();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2000);

    const added = await page.evaluate(() => {
      const buyRe = /add to cart|ship it|add for shipping|add to bag/i;
      const btns = [...document.querySelectorAll("button")].filter(
        (b) => buyRe.test(b.textContent || "") && !b.disabled,
      );
      btns.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      if (btns[0]) {
        btns[0].click();
        return true;
      }
      return false;
    });
    if (!added) {
      console.log("     couldn't find an enabled Add-to-cart — item may not be buyable. Finish in the window.");
      return;
    }
    await page.waitForTimeout(2500);

    await page.goto("https://www.target.com/cart", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2000);
    const checkout = page.getByRole("button", { name: /check ?out/i }).first();
    if (await checkout.count().catch(() => 0)) {
      await checkout.click().catch(() => {});
      await page.waitForTimeout(3000);
    }

    await page.bringToFront();
    console.log("     ✅ In your cart + checkout opened. Review and click 'Place your order' YOURSELF.");
    console.log("     (SnagPack never places the order — you approve the money.)");
  } catch (e) {
    console.log(`     checkout automation stopped (${e.message}). Finish in the open window.`);
  }
  // Do NOT close the page — leave it for you to complete.
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

  if (!readings.length) return;
  let summary = {};
  try {
    const rep = await fetch(`${BASE}/api/worker/report`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-monitor-secret": SECRET },
      body: JSON.stringify({ readings }),
    });
    summary = await rep.json().catch(() => ({}));
  } catch (e) {
    console.error("report error:", e.message);
  }
  if (summary.landed) console.log(`  🚨 ${summary.landed} LANDED — alert fired`);

  if (BUY_MODE === "assisted" && Array.isArray(summary.results)) {
    for (const r of summary.results) {
      if (!r.transitioned) continue;
      const task = tasks.find((t) => t.id === r.id);
      if (task) await assistedCheckout(context, task.name, task.url);
    }
  }
}

const context = await chromium.launchPersistentContext("./.profile", {
  headless: HEADLESS,
  channel: CHANNEL || undefined,
  viewport: { width: 1280, height: 900 },
});

console.log(`SnagPack worker → ${BASE}`);
console.log(`interval ${INTERVAL / 1000}s · headless=${HEADLESS} · browser=${CHANNEL || "bundled chromium"} · buy=${BUY_MODE}`);

if (BUY_TEST_URL) {
  console.log("\n[BUY_TEST_URL set] running one assisted-checkout dry run…");
  await assistedCheckout(context, "TEST checkout", BUY_TEST_URL);
}

for (;;) {
  try {
    await cycle(context);
  } catch (e) {
    console.error("cycle error:", e.message);
  }
  await new Promise((r) => setTimeout(r, INTERVAL));
}
