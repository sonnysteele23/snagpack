import type { RetailerAdapter, StockResult, WatchedProduct } from "./types";

// Generic HTML-signal adapter: fetch the product page and look for stock strings.
// Works for many small/independent shops (Shopify, BigCommerce, LCS sites).
//
// HONEST LIMITATION: big retailers (Walmart, Target) sit behind Akamai / HUMAN
// bot-detection that blocks plain fetch() and renders stock via JS. For those,
// use an official API where one exists, a paid stock-data feed, or a headless
// browser worker you run yourself — plug it in as its own adapter. This generic
// adapter is intentionally polite (one request, real UA) and will simply report
// `note: blocked/needs-js` rather than pretend.
export const generic: RetailerAdapter = {
  id: "generic",
  label: "Generic page-signal scraper",
  official: false,
  async check(product: WatchedProduct): Promise<StockResult> {
    const inMatch = product.inStockMatch?.toLowerCase();
    const outMatch = product.outOfStockMatch?.toLowerCase();
    if (!inMatch && !outMatch) {
      return { inStock: false, note: "set inStockMatch/outOfStockMatch to use generic adapter" };
    }

    let html: string;
    try {
      const res = await fetch(product.url, {
        cache: "no-store",
        redirect: "follow",
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
        },
      });
      if (!res.ok) return { inStock: false, note: `HTTP ${res.status} (may be bot-blocked)` };
      html = (await res.text()).toLowerCase();
    } catch (e) {
      return { inStock: false, note: `fetch failed: ${(e as Error).message}` };
    }

    // Out-of-stock signal wins if present (avoids false positives from menus/footers).
    if (outMatch && html.includes(outMatch)) return { inStock: false, cartUrl: product.url };
    if (inMatch && html.includes(inMatch)) return { inStock: true, cartUrl: product.url };
    return { inStock: false, cartUrl: product.url, note: "no signal matched" };
  },
};
