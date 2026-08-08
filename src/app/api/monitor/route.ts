import { NextResponse } from "next/server";
import { runMonitor } from "@/lib/monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/monitor — run one scan cycle. Protected by a shared secret so a
// cron (Vercel Cron, GitHub Actions) can call it on a schedule.
export async function POST(req: Request) {
  const secret = process.env.MONITOR_SECRET ?? "dev-secret";
  const provided =
    req.headers.get("x-monitor-secret") ??
    new URL(req.url).searchParams.get("secret");

  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = await runMonitor();
  return NextResponse.json(summary);
}

// Allow GET for easy cron pings (some cron services only do GET).
export async function GET(req: Request) {
  return POST(req);
}
