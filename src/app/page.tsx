import { prisma } from "@/lib/db";
import { AddProductForm, RunCheckButton, PurchasesPanel } from "./ui";

export const dynamic = "force-dynamic";

function money(n?: number | null) {
  return n == null ? "—" : `$${n.toFixed(2)}`;
}
function ago(d?: Date | null) {
  if (!d) return "never";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default async function Dashboard() {
  const [products, events, purchases] = await Promise.all([
    prisma.product.findMany({ orderBy: [{ lastInStock: "desc" }, { createdAt: "desc" }] }),
    prisma.restockEvent.findMany({
      orderBy: { detectedAt: "desc" },
      take: 15,
      include: { product: true },
    }),
    prisma.purchase.findMany({ orderBy: { purchasedAt: "desc" } }),
  ]);

  const inStock = products.filter((p) => p.lastInStock).length;
  const soldNet = purchases
    .filter((p) => p.soldPrice != null)
    .reduce((acc, p) => acc + ((p.soldPrice ?? 0) - p.unitCost * p.qty - (p.fees ?? 0)), 0);
  const capitalOut = purchases
    .filter((p) => p.soldPrice == null)
    .reduce((acc, p) => acc + p.unitCost * p.qty, 0);

  const purchaseRows = purchases.map((p) => ({
    id: p.id,
    name: p.name,
    retailer: p.retailer,
    qty: p.qty,
    unitCost: p.unitCost,
    status: p.status,
    listPrice: p.listPrice,
    soldPrice: p.soldPrice,
    fees: p.fees,
    purchasedAt: p.purchasedAt.toISOString(),
  }));
  const productRows = products.map((p) => ({
    id: p.id,
    name: p.name,
    retailer: p.retailer,
    msrp: p.msrp,
  }));

  return (
    <main className="wrap">
      <div className="brand">
        <h1>SnagPack</h1>
        <span className="tag">sealed card pack radar</span>
      </div>
      <p className="sub">
        Watch retailers for sealed packs, catch the drop the instant it lands, track the flip.
      </p>

      <div className="banner">
        Checkout mode: <strong>{process.env.CHECKOUT_MODE ?? "assisted"}</strong>. Assisted =
        SnagPack builds the fastest cart link and alerts you to confirm the buy (ToS-safe). Auto
        checkout is a pluggable seam and off by default.
      </div>

      <div className="stats">
        <div className="stat"><div className="n">{products.length}</div><div className="l">Watched</div></div>
        <div className="stat"><div className="n" style={{ color: inStock ? "var(--green)" : undefined }}>{inStock}</div><div className="l">In stock now</div></div>
        <div className="stat"><div className="n">{purchases.length}</div><div className="l">Purchases</div></div>
        <div className="stat"><div className="n">{money(capitalOut)}</div><div className="l">Capital out</div></div>
        <div className="stat"><div className="n" style={{ color: soldNet >= 0 ? "var(--green)" : "var(--red)" }}>{money(soldNet)}</div><div className="l">Net P&amp;L (sold)</div></div>
      </div>

      <RunCheckButton />

      <section className="section">
        <h2>Watchlist</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th><th>Retailer</th><th>Cat</th><th>Status</th>
              <th className="num">MSRP</th><th className="num">Market</th><th className="num">Last price</th><th>Checked</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={8} className="note">No products yet — add one below.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id}>
                <td><a href={p.url} target="_blank" rel="noreferrer">{p.name}</a></td>
                <td>{p.retailer}</td>
                <td><span className="pill cat">{p.category}</span></td>
                <td>
                  {p.lastError ? <span className="pill err" title={p.lastError}>error</span>
                    : p.lastInStock ? <span className="pill in">in stock</span>
                    : <span className="pill out">out</span>}
                </td>
                <td className="num">{money(p.msrp)}</td>
                <td className="num">{money(p.marketPrice)}</td>
                <td className="num">{money(p.lastPrice)}</td>
                <td className="note">{ago(p.lastCheckedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>Recent landings</h2>
        <table>
          <thead>
            <tr><th>When</th><th>Product</th><th className="num">Price</th><th>Action</th><th>Note</th></tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={5} className="note">No landings yet. Run a scan.</td></tr>
            )}
            {events.map((e) => (
              <tr key={e.id}>
                <td className="note">{ago(e.detectedAt)}</td>
                <td className="landed">{e.product?.name ?? "—"}</td>
                <td className="num">{money(e.price)}</td>
                <td>{e.action}</td>
                <td className="note">{e.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>Inventory &amp; P&amp;L</h2>
        <PurchasesPanel products={productRows} purchases={purchaseRows} />
      </section>

      <section className="section">
        <h2>Add to watchlist</h2>
        <AddProductForm />
      </section>
    </main>
  );
}
