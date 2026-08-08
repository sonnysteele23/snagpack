import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// REAL products with live URLs (verified 2026-08-07 via web search).
// Scanning reality per retailer:
//  - bestbuy: official API (real, reliable) — needs BESTBUY_API_KEY + numeric sku.
//  - target/walmart: real product pages (links work in a browser), but server-side
//    stock scans are bot-blocked (Akamai 403 + CAPTCHA). Real-time checks there need
//    a headless-browser worker or a paid feed — the generic adapter will honestly
//    report the block rather than fake stock.
async function main() {
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      // --- Best Buy (official API path; scans real once BESTBUY_API_KEY is set) ---
      {
        name: "Pokémon TCG: 151 Elite Trainer Box",
        retailer: "bestbuy",
        url: "https://www.bestbuy.com/site/pokemon-trading-card-game-151-elite-trainer-box/6548366.p?skuId=6548366",
        sku: "6548366",
        category: "POKEMON",
        msrp: 49.99,
        marketPrice: 75.0,
      },
      {
        name: "Pokémon TCG: Silver Tempest Elite Trainer Box",
        retailer: "bestbuy",
        url: "https://www.bestbuy.com/site/pokemon-trading-card-game-silver-tempest-elite-trainer-box/6521113.p?skuId=6521113",
        sku: "6521113",
        category: "POKEMON",
        msrp: 49.99,
        marketPrice: 60.0,
      },
      {
        name: "Pokémon TCG: Sword & Shield Elite Trainer Box",
        retailer: "bestbuy",
        url: "https://www.bestbuy.com/site/pokemon-trading-card-game-sword-shield-elite-trainer-box/6397125.p?skuId=6397125",
        sku: "6397125",
        category: "POKEMON",
        msrp: 49.99,
        marketPrice: 55.0,
      },

      // --- Target (real links; server scan bot-blocked → honest error until a worker/feed is added) ---
      {
        name: "2025 Topps Bowman Baseball Value Blaster Box",
        retailer: "target",
        url: "https://www.target.com/p/topps-2025-bowman-baseball-value-blaster-box/-/A-1007746656",
        sku: "1007746656", // Target TCIN
        category: "BASEBALL",
        msrp: 25.99,
        marketPrice: 42.0,
        inStockMatch: "add to cart",
        outOfStockMatch: "out of stock",
      },
      {
        name: "2025 Topps MLB Bowman Baseball Mega Box",
        retailer: "target",
        url: "https://www.target.com/p/2025-topps-mlb-bowman-baseball-trading-card-mega-box/-/A-94742626",
        sku: "94742626",
        category: "BASEBALL",
        msrp: 44.99,
        marketPrice: 70.0,
        inStockMatch: "add to cart",
        outOfStockMatch: "out of stock",
      },
      {
        name: "Pokémon TCG: Mega Evolution — Ascended Heroes Elite Trainer Box",
        retailer: "target",
        url: "https://www.target.com/p/pok-mon-tcg-mega-evolution-ascended-heroes-elite-trainer-box/-/A-1010148053",
        sku: "1010148053",
        category: "POKEMON",
        msrp: 49.99,
        marketPrice: 65.0,
        inStockMatch: "add to cart",
        outOfStockMatch: "out of stock",
      },

      // --- Walmart (real link; server scan bot-blocked, same as Target) ---
      {
        name: "Pokémon TCG: Prismatic Evolutions Booster Bundle",
        retailer: "walmart",
        url: "https://www.walmart.com/ip/Pokemon-TCG-Scarlet-Violet-Prismatic-Evolutions-Booster-Bundle/15531420870",
        category: "POKEMON",
        msrp: 26.94,
        marketPrice: 55.0,
        inStockMatch: "add to cart",
        outOfStockMatch: "out of stock",
      },
    ],
  });

  const count = await prisma.product.count();
  console.log(`Seeded ${count} REAL watched products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
