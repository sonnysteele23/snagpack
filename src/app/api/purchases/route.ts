import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const purchases = await prisma.purchase.findMany({ orderBy: { purchasedAt: "desc" } });
  return NextResponse.json(purchases);
}

function num(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (!b.name || !b.retailer || num(b.unitCost) === null) {
    return new NextResponse("name, retailer and unitCost are required", { status: 400 });
  }
  const purchase = await prisma.purchase.create({
    data: {
      productId: b.productId ? String(b.productId) : null,
      name: String(b.name),
      retailer: String(b.retailer),
      qty: num(b.qty) ?? 1,
      unitCost: num(b.unitCost)!,
      orderRef: b.orderRef ? String(b.orderRef) : null,
      status: b.status ? String(b.status) : "ORDERED",
      listPrice: num(b.listPrice),
      note: b.note ? String(b.note) : null,
    },
  });
  return NextResponse.json(purchase, { status: 201 });
}
