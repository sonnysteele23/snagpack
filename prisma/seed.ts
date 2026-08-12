import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// FIRST-PARTY watchlist (verified 2026-08-11 by live browser check of the seller).
//
// Finding: Best Buy and Walmart now run third-party Marketplaces for trading cards —
// their card listings that surface in search are almost all marketplace resellers at
// 3-6x MSRP (and Best Buy's API doesn't cover marketplace items). The reliable
// first-party source is Target's own retail box configurations (Value/Mega/Hanger/
// Chrome/Bowman boxes) and current Pokémon booster bundles — all "sold by Target".
//
// All of these are scanned by the LOCAL WORKER (retailer "target"). Most are currently
// out of stock, which is exactly what a restock monitor wants.
async function main() {
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: "2026 Topps MLB Series 1 Baseball Value Box",
        retailer: "target",
        url: "https://www.target.com/p/2026-topps-mlb-series-1-baseball-trading-card-value-box/-/A-95179368",
        sku: "95179368",
        category: "BASEBALL",
        msrp: 24.99,
        marketPrice: 34.99,
      },
      {
        name: "2026 Topps MLB Series 1 Baseball Mega Box",
        retailer: "target",
        url: "https://www.target.com/p/2026-topps-mlb-series-1-baseball-trading-card-mega-box/-/A-95179363",
        sku: "95179363",
        category: "BASEBALL",
        msrp: 49.99,
        marketPrice: 69.99,
      },
      {
        name: "2026 Topps MLB Series 2 Baseball Mega Box",
        retailer: "target",
        url: "https://www.target.com/p/2026-topps-mlb-series-2-baseball-trading-card-mega-box/-/A-1011011003",
        sku: "1011011003",
        category: "BASEBALL",
        msrp: 49.99,
        marketPrice: 54.99,
      },
      {
        name: "2026 Topps MLB Series 1 Baseball Hanger Box",
        retailer: "target",
        url: "https://www.target.com/p/2026-topps-mlb-series-1-baseball-trading-card-hanger-box/-/A-95179371",
        sku: "95179371",
        category: "BASEBALL",
        msrp: 14.99,
        marketPrice: 19.99,
      },
      {
        name: "2026 Topps MLB Bowman Baseball Value Box",
        retailer: "target",
        url: "https://www.target.com/p/topps-mlb-bowman-baseball-foil-box/-/A-1011060501",
        sku: "1011060501",
        category: "BASEBALL",
        msrp: 29.99,
        marketPrice: 44.99,
      },
      {
        name: "2026 Topps MLB Chrome Baseball Value Box",
        retailer: "target",
        url: "https://www.target.com/p/topps-2026-mlb-chrome-baseball-foil-box/-/A-1012055699",
        sku: "1012055699",
        category: "BASEBALL",
        msrp: 39.99,
        marketPrice: 49.99,
      },
      {
        name: "Pokémon TCG: Scarlet & Violet—Destined Rivals Booster Bundle",
        retailer: "target",
        url: "https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-8212-destined-rivals-booster-bundle/-/A-94300067",
        sku: "94300067",
        category: "POKEMON",
        msrp: 29.99,
        marketPrice: 39.99,
      },
      {
        name: "Pokémon TCG: Scarlet & Violet—Surging Sparks Booster Bundle",
        retailer: "target",
        url: "https://www.target.com/p/pokemon-trading-card-game-scarlet-38-violet-surging-sparks-booster-bundle/-/A-91619929",
        sku: "91619929",
        category: "POKEMON",
        msrp: 27.99,
        marketPrice: 44.99,
      },
    ],
  });

  const count = await prisma.product.count();
  console.log(`Seeded ${count} first-party Target products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
