import { NextResponse } from "next/server";
import { runMonitor } from "@/lib/monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST/GET /api/monitor — run one scan cycle. Authorized by either:
//  - header  x-monitor-secret: <MONITOR_SECRET>   (our own callers / GH Actions)
//  - query   ?secret=<MONITOR_SECRET>
//  - header  authorization: Bearer <CRON_SECRET>  (Vercel Cron injects this)
function authorized(req: Request): boolean {
  const monitorSecret = process.env.MONITOR_SECRET ?? "dev-secret";
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(req.url);

  if (req.headers.get("x-monitor-secret") === monitorSecret) return true;
  if (url.searchParams.get("secret") === monitorSecret) return true;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`) return true;
  return false;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const summary = await runMonitor();
  return NextResponse.json(summary);
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
