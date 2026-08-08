import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(products);
}

function num(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (!b.name || !b.url || !b.retailer) {
    return new NextResponse("name, url and retailer are required", { status: 400 });
  }
  const product = await prisma.product.create({
    data: {
      name: String(b.name),
      retailer: String(b.retailer),
      url: String(b.url),
      sku: b.sku ? String(b.sku) : null,
      category: b.category ? String(b.category) : "OTHER",
      msrp: num(b.msrp),
      marketPrice: num(b.marketPrice),
      inStockMatch: b.inStockMatch ? String(b.inStockMatch) : null,
      outOfStockMatch: b.outOfStockMatch ? String(b.outOfStockMatch) : null,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
