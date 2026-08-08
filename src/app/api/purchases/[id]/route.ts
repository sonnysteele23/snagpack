import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function num(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Update a purchase — status changes, list/sold price, fees, etc.
// Setting status to SOLD (or providing soldPrice) stamps soldAt if unset.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (b.status !== undefined) data.status = String(b.status);
  if (b.qty !== undefined) data.qty = num(b.qty) ?? 1;
  if (b.unitCost !== undefined) data.unitCost = num(b.unitCost) ?? 0;
  if (b.listPrice !== undefined) data.listPrice = num(b.listPrice);
  if (b.soldPrice !== undefined) data.soldPrice = num(b.soldPrice);
  if (b.fees !== undefined) data.fees = num(b.fees);
  if (b.orderRef !== undefined) data.orderRef = b.orderRef ? String(b.orderRef) : null;
  if (b.note !== undefined) data.note = b.note ? String(b.note) : null;

  const current = await prisma.purchase.findUnique({ where: { id } });
  if (!current) return new NextResponse("not found", { status: 404 });

  const nowSold =
    (data.status === "SOLD" || data.soldPrice != null) && !current.soldAt;
  if (nowSold) data.soldAt = new Date();
  if (data.soldPrice != null && data.status === undefined && current.status !== "SOLD") {
    data.status = "SOLD";
  }

  const purchase = await prisma.purchase.update({ where: { id }, data });
  return NextResponse.json(purchase);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.purchase.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
