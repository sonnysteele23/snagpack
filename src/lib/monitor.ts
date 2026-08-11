import { prisma } from "./db";
import { getAdapter } from "./retailers";
import { getStrategy } from "./checkout";
import { sendAlert } from "./alert";
import type { StockResult } from "./retailers/types";
import type { Product } from "@prisma/client";

export type ProcessResult = {
  transitioned: boolean;
  action?: string;
};

// Apply a stock reading to a product: persist it, detect an out->in transition,
// and on a transition record a RestockEvent, run the checkout strategy, and alert.
// Shared by the cloud monitor (server adapters) and the local worker ingest.
export async function applyStock(product: Product, stock: StockResult): Promise<ProcessResult> {
  const transitioned = stock.inStock && !product.lastInStock;

  await prisma.product.update({
    where: { id: product.id },
    data: {
      lastInStock: stock.inStock,
      lastPrice: stock.price ?? product.lastPrice,
      lastCheckedAt: new Date(),
      lastError: stock.note && !stock.inStock ? stock.note : null,
    },
  });

  if (!transitioned) return { transitioned: false };

  const strategy = getStrategy();
  const outcome = await strategy.handleRestock({
    productId: product.id,
    name: product.name,
    retailer: product.retailer,
    url: product.url,
    price: stock.price,
    msrp: product.msrp,
    marketPrice: product.marketPrice,
    stock,
  });

  await prisma.restockEvent.create({
    data: {
      productId: product.id,
      price: stock.price ?? undefined,
      action: outcome.action,
      note: outcome.note,
    },
  });

  if (outcome.action !== "SKIPPED_MARGIN") {
    await sendAlert({
      name: product.name,
      retailer: product.retailer,
      price: stock.price,
      cartUrl: outcome.cartUrl,
      note: outcome.note,
    });
  }

  return { transitioned: true, action: outcome.action };
}

export type MonitorSummary = {
  checked: number;
  landed: number;
  errors: number;
  results: Array<{
    product: string;
    retailer: string;
    inStock: boolean;
    transitioned: boolean;
    action?: string;
    note?: string;
  }>;
};

// One cloud polling cycle across all active watched products (server adapters only).
// Retailers that block server scraping (target/walmart) are handled by the local worker.
export async function runMonitor(concurrency = 5): Promise<MonitorSummary> {
  const products = await prisma.product.findMany({ where: { active: true } });
  const summary: MonitorSummary = { checked: 0, landed: 0, errors: 0, results: [] };

  const queue = [...products];
  async function worker() {
    for (;;) {
      const p = queue.shift();
      if (!p) return;
      summary.checked++;
      const adapter = getAdapter(p.retailer);
      try {
        const stock = await adapter.check({
          id: p.id,
          name: p.name,
          retailer: p.retailer,
          url: p.url,
          sku: p.sku,
          inStockMatch: p.inStockMatch,
          outOfStockMatch: p.outOfStockMatch,
        });
        const { transitioned, action } = await applyStock(p, stock);
        if (transitioned) summary.landed++;
        summary.results.push({
          product: p.name,
          retailer: adapter.label,
          inStock: stock.inStock,
          transitioned,
          action,
          note: stock.note,
        });
      } catch (e) {
        summary.errors++;
        const msg = (e as Error).message;
        await prisma.product.update({
          where: { id: p.id },
          data: { lastCheckedAt: new Date(), lastError: msg },
        });
        summary.results.push({
          product: p.name,
          retailer: p.retailer,
          inStock: false,
          transitioned: false,
          note: `error: ${msg}`,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length || 1) }, worker));
  return summary;
}
