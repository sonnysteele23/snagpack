import { prisma } from "./db";
import { getAdapter } from "./retailers";
import { getStrategy } from "./checkout";
import { sendAlert } from "./alert";

export type MonitorSummary = {
  checked: number;
  landed: number; // fresh out->in transitions this cycle
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

// One polling cycle across all active watched products.
// Concurrency is capped so we stay polite to each retailer.
export async function runMonitor(concurrency = 5): Promise<MonitorSummary> {
  const products = await prisma.product.findMany({ where: { active: true } });
  const strategy = getStrategy();
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

        const transitioned = stock.inStock && !p.lastInStock;

        await prisma.product.update({
          where: { id: p.id },
          data: {
            lastInStock: stock.inStock,
            lastPrice: stock.price ?? p.lastPrice,
            lastCheckedAt: new Date(),
            lastError: stock.note && !stock.inStock ? stock.note : null,
          },
        });

        let action: string | undefined;
        if (transitioned) {
          summary.landed++;
          const outcome = await strategy.handleRestock({
            productId: p.id,
            name: p.name,
            retailer: p.retailer,
            url: p.url,
            price: stock.price,
            msrp: p.msrp,
            marketPrice: p.marketPrice,
            stock,
          });
          action = outcome.action;

          await prisma.restockEvent.create({
            data: {
              productId: p.id,
              price: stock.price ?? undefined,
              action: outcome.action,
              note: outcome.note,
            },
          });

          if (outcome.action !== "SKIPPED_MARGIN") {
            await sendAlert({
              name: p.name,
              retailer: adapter.label,
              price: stock.price,
              cartUrl: outcome.cartUrl,
              note: outcome.note,
            });
          }
        }

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
