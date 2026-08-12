import { NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";

export const dynamic = "force-dynamic";

// POST /api/alert/test — fire a sample alert to confirm the Discord webhook works.
// Login-gated (not in the middleware allowlist). Returns whether a webhook is configured.
export async function POST() {
  const hasWebhook = Boolean(process.env.DISCORD_WEBHOOK_URL);
  await sendAlert({
    name: "TEST — Prismatic Evolutions Elite Trainer Box",
    retailer: "test",
    price: 49.99,
    cartUrl: "https://snagpack.vercel.app",
    note: "This is a SnagPack test alert. If you see this in Discord, alerts work.",
  });
  return NextResponse.json({
    ok: true,
    delivered: hasWebhook ? "sent to Discord" : "no DISCORD_WEBHOOK_URL set — logged to server console only",
  });
}
