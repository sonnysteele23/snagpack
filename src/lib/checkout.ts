import type { StockResult } from "./retailers/types";

// Where auto-buy plugs in. The monitor calls handleRestock() the moment a
// product lands; the strategy decides what to do.
//
// - "assisted" (default, shipped): build the fastest possible path to buy and
//   surface it in the alert. You tap once and you're checking out in ~2s. This
//   stays inside every retailer's Terms of Service.
//
// - "auto" (interface only, OFF by default): complete the purchase with no human.
//   Against Walmart/Target this means defeating Akamai/HUMAN bot-detection,
//   CAPTCHAs and purchase limits — a ToS violation that gets accounts/cards
//   banned, and an evasion arms race this project does NOT ship. Implement it
//   yourself ONLY for stores that permit programmatic purchase (official
//   checkout API, or your own browser-worker for a store you're allowed to
//   automate). The seam is here so nothing else has to change.

export type CheckoutContext = {
  productId: string;
  name: string;
  retailer: string;
  url: string;
  price?: number | null;
  msrp?: number | null;
  marketPrice?: number | null;
  stock: StockResult;
};

export type CheckoutOutcome = {
  // maps to RestockEvent.action
  action: "ALERTED" | "CART_BUILT" | "PURCHASED" | "SKIPPED_MARGIN" | "FAILED";
  note?: string;
  cartUrl?: string | null;
};

export interface CheckoutStrategy {
  handleRestock(ctx: CheckoutContext): Promise<CheckoutOutcome>;
}

// Only act when the resale math clears a floor. Keeps us from buying dead stock.
const MIN_MARGIN_PCT = Number(process.env.MIN_MARGIN_PCT ?? "20");

function marginPct(ctx: CheckoutContext): number | null {
  const cost = ctx.price ?? ctx.msrp;
  if (!cost || !ctx.marketPrice) return null;
  // Rough net of a 15% resale fee; refine per selling channel later.
  const netResale = ctx.marketPrice * 0.85;
  return ((netResale - cost) / cost) * 100;
}

export const assistedCheckout: CheckoutStrategy = {
  async handleRestock(ctx) {
    const m = marginPct(ctx);
    if (m !== null && m < MIN_MARGIN_PCT) {
      return { action: "SKIPPED_MARGIN", note: `est. margin ${m.toFixed(0)}% < ${MIN_MARGIN_PCT}%` };
    }
    const cartUrl = ctx.stock.cartUrl ?? ctx.url;
    return {
      action: "CART_BUILT",
      cartUrl,
      note: m !== null ? `est. margin ${m.toFixed(0)}%` : "margin unknown (add marketPrice)",
    };
  },
};

// Placeholder so "auto" is a real, typed seam — but refuses loudly instead of
// pretending to bypass retailer protections.
export const autoCheckout: CheckoutStrategy = {
  async handleRestock(ctx) {
    const m = marginPct(ctx);
    if (m !== null && m < MIN_MARGIN_PCT) {
      return { action: "SKIPPED_MARGIN", note: `est. margin ${m.toFixed(0)}% < ${MIN_MARGIN_PCT}%` };
    }
    return {
      action: "FAILED",
      note:
        "auto checkout not implemented for this retailer — implement a compliant strategy " +
        "(official checkout API or a store you're permitted to automate). Falling back to alert.",
      cartUrl: ctx.stock.cartUrl ?? ctx.url,
    };
  },
};

export function getStrategy(): CheckoutStrategy {
  return (process.env.CHECKOUT_MODE ?? "assisted") === "auto" ? autoCheckout : assistedCheckout;
}
