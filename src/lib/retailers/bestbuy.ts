import type { RetailerAdapter, StockResult, WatchedProduct } from "./types";

// Best Buy is the cleanest source: an official, ToS-sanctioned product API.
// Docs: https://developer.bestbuy.com/  — requires BESTBUY_API_KEY and a product SKU.
export const bestbuy: RetailerAdapter = {
  id: "bestbuy",
  label: "Best Buy (official API)",
  official: true,
  async check(product: WatchedProduct): Promise<StockResult> {
    const key = process.env.BESTBUY_API_KEY;
    if (!key) return { inStock: false, note: "BESTBUY_API_KEY not set" };
    if (!product.sku) return { inStock: false, note: "Best Buy adapter needs a SKU" };

    const fields = "sku,name,salePrice,onlineAvailability,addToCartUrl";
    const url = `https://api.bestbuy.com/v1/products(sku=${encodeURIComponent(
      product.sku,
    )})?apiKey=${key}&format=json&show=${fields}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { inStock: false, note: `Best Buy API ${res.status}` };

    const data = (await res.json()) as {
      products?: Array<{
        salePrice?: number;
        onlineAvailability?: boolean;
        addToCartUrl?: string;
      }>;
    };
    const p = data.products?.[0];
    if (!p) return { inStock: false, note: "SKU not found" };

    return {
      inStock: Boolean(p.onlineAvailability),
      price: p.salePrice ?? null,
      cartUrl: p.addToCartUrl ?? product.url,
    };
  },
};
