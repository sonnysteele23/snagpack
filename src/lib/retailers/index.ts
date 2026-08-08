import type { RetailerAdapter } from "./types";
import { bestbuy } from "./bestbuy";
import { generic } from "./generic";

// The registry. To support a new store: implement RetailerAdapter and add it here.
const ADAPTERS: RetailerAdapter[] = [bestbuy, generic];

const byId = new Map(ADAPTERS.map((a) => [a.id, a]));

export function getAdapter(retailer: string): RetailerAdapter {
  // Unknown retailer ids fall back to the generic page-signal scraper.
  return byId.get(retailer) ?? generic;
}

export function listAdapters(): RetailerAdapter[] {
  return ADAPTERS;
}

export type { RetailerAdapter } from "./types";
