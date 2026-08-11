import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.MONITOR_SECRET ?? "dev-secret";
  return (
    req.headers.get("x-monitor-secret") === secret ||
    new URL(req.url).searchParams.get("secret") === secret
  );
}

// GET /api/worker/tasks — products the LOCAL worker should check (the retailers
// that block server-side scraping). Auth via MONITOR_SECRET.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { active: true, retailer: { in: ["target", "walmart"] } },
    select: {
      id: true,
      name: true,
      retailer: true,
      url: true,
      sku: true,
      inStockMatch: true,
      outOfStockMatch: true,
    },
  });
  return NextResponse.json({ tasks: products });
}
