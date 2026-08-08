import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seed data:
// - One DEMO row that reliably "lands" on the first scan so you can see the
//   full pipeline (detect -> event -> margin check -> alert) with no API keys.
// - A few real sealed-pack templates. Replace url/sku with live values; big
//   retailers need an official API or your own browser-worker adapter (the
//   generic scraper will often report bot-blocked for them).
async function main() {
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: "DEMO — landing test (example.com)",
        retailer: "generic",
        url: "https://example.com",
        category: "OTHER",
        msrp: 49.99,
        marketPrice: 90.0,
        inStockMatch: "example domain",
        outOfStockMatch: "this text will never appear zzz",
      },
      {
        name: "Pokémon TCG: Prismatic Evolutions Elite Trainer Box",
        retailer: "target",
        url: "https://www.target.com/p/-/A-REPLACE_DPCI",
        sku: "REPLACE_DPCI",
        category: "POKEMON",
        msrp: 49.99,
        marketPrice: 85.0,
        inStockMatch: "add to cart",
        outOfStockMatch: "out of stock",
      },
      {
        name: "Pokémon TCG: Prismatic Evolutions Booster Bundle",
        retailer: "walmart",
        url: "https://www.walmart.com/ip/REPLACE_ID",
        category: "POKEMON",
        msrp: 26.94,
        marketPrice: 55.0,
        inStockMatch: "add to cart",
        outOfStockMatch: "out of stock",
      },
      {
        name: "2025 Topps Series 1 Baseball Blaster Box",
        retailer: "bestbuy",
        url: "https://www.bestbuy.com/site/REPLACE",
        sku: "REPLACE_SKU",
        category: "BASEBALL",
        msrp: 24.99,
        marketPrice: 40.0,
      },
      {
        name: "2025 Bowman Chrome Baseball Hobby (retail hanger)",
        retailer: "generic",
        url: "https://example-cardshop.com/products/bowman-chrome",
        category: "BASEBALL",
        msrp: 34.99,
        marketPrice: 60.0,
        inStockMatch: "add to cart",
        outOfStockMatch: "sold out",
      },
    ],
  });

  const count = await prisma.product.count();
  console.log(`Seeded ${count} watched products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
