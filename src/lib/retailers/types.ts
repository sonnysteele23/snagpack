// A retailer adapter checks one product and reports its stock state.
// Adding a new store = adding one file that implements RetailerAdapter and
// registering it in ./index.ts. No other code changes.

export type StockResult = {
  inStock: boolean;
  price?: number | null;
  /** Direct add-to-cart / buy URL when the adapter can build one (powers assisted checkout). */
  cartUrl?: string | null;
  note?: string;
};

export type WatchedProduct = {
  id: string;
  name: string;
  retailer: string;
  url: string;
  sku?: string | null;
  inStockMatch?: string | null;
  outOfStockMatch?: string | null;
};

export interface RetailerAdapter {
  /** stable id stored on Product.retailer */
  id: string;
  label: string;
  /** true if this adapter uses an official API (ToS-safe, reliable) vs HTML scraping */
  official: boolean;
  check(product: WatchedProduct): Promise<StockResult>;
}
