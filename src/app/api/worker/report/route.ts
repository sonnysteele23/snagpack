import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyStock } from "@/lib/monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.MONITOR_SECRET ?? "dev-secret";
  return req.headers.get("x-monitor-secret") === secret;
}

type Reading = { id: string; inStock: boolean; price?: number | null; cartUrl?: string | null; note?: string };

// POST /api/worker/report — the local worker sends stock readings it collected
// from a real browser. We apply the same transition/alert logic as the cloud monitor.
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const readings: Reading[] = Array.isArray(body?.readings) ? body.readings : [];
  if (!readings.length) return NextResponse.json({ error: "no readings" }, { status: 400 });

  let landed = 0;
  const results: Array<{ id: string; ok: boolean; transitioned?: boolean; note?: string }> = [];

  for (const r of readings) {
    const product = await prisma.product.findUnique({ where: { id: r.id } });
    if (!product) {
      results.push({ id: r.id, ok: false, note: "unknown product" });
      continue;
    }
    const { transitioned } = await applyStock(product, {
      inStock: Boolean(r.inStock),
      price: r.price ?? null,
      cartUrl: r.cartUrl ?? product.url,
      note: r.note,
    });
    if (transitioned) landed++;
    results.push({ id: r.id, ok: true, transitioned });
  }

  return NextResponse.json({ processed: readings.length, landed, results });
}
