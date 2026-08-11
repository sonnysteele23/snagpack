import { NextResponse } from "next/server";
import { runMonitor } from "@/lib/monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/scan — the "Run scan now" button. This route is NOT in the middleware
// allowlist, so it's protected by the normal login gate: only a logged-in browser
// (with the auth cookie) can reach it. No shared secret needed.
//
// Note: this runs the CLOUD scan (server adapters) — Best Buy via its API, and it will
// honestly report Target/Walmart as blocked. Those two are covered by the local worker.
export async function POST() {
  const summary = await runMonitor();
  return NextResponse.json(summary);
}
