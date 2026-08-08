"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["ORDERED", "IN_TRANSIT", "RECEIVED", "LISTED", "SOLD", "RETURNED"];

export function AddProductForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      alert("Could not add product: " + (await res.text()));
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        Product name
        <input name="name" placeholder="Pokémon SV Prismatic Evolutions ETB" required />
      </label>
      <label>
        Retailer
        <select name="retailer" defaultValue="generic">
          <option value="bestbuy">Best Buy (API)</option>
          <option value="generic">Generic (page signal)</option>
          <option value="target">Target</option>
          <option value="walmart">Walmart</option>
          <option value="pokemoncenter">Pokémon Center</option>
        </select>
      </label>
      <label>
        Category
        <select name="category" defaultValue="POKEMON">
          <option value="POKEMON">Pokémon</option>
          <option value="BASEBALL">Baseball</option>
          <option value="FOOTBALL">Football</option>
          <option value="BASKETBALL">Basketball</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label>
        Product URL
        <input name="url" placeholder="https://…" required />
      </label>
      <label>
        SKU (API adapters)
        <input name="sku" placeholder="6612345" />
      </label>
      <label>
        MSRP ($)
        <input name="msrp" type="number" step="0.01" placeholder="49.99" />
      </label>
      <label>
        Market price ($)
        <input name="marketPrice" type="number" step="0.01" placeholder="80.00" />
      </label>
      <label>
        In-stock text (generic)
        <input name="inStockMatch" placeholder="add to cart" />
      </label>
      <label>
        Out-of-stock text (generic)
        <input name="outOfStockMatch" placeholder="out of stock" />
      </label>
      <button type="submit" disabled={saving}>
        {saving ? "Adding…" : "Add to watchlist"}
      </button>
    </form>
  );
}

export function RunCheckButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setMsg(null);
    const res = await fetch("/api/monitor", {
      method: "POST",
      headers: { "x-monitor-secret": "dev-secret" },
    });
    const data = await res.json();
    setRunning(false);
    setMsg(
      res.ok
        ? `Checked ${data.checked}, landed ${data.landed}, errors ${data.errors}`
        : `Error: ${data.error ?? res.status}`,
    );
    router.refresh();
  }

  return (
    <div className="row-actions">
      <button className="ghost" onClick={run} disabled={running}>
        {running ? "Scanning…" : "▶ Run scan now"}
      </button>
      {msg && <span className="note">{msg}</span>}
    </div>
  );
}

type Product = { id: string; name: string; retailer: string; msrp: number | null };
type Purchase = {
  id: string;
  name: string;
  retailer: string;
  qty: number;
  unitCost: number;
  status: string;
  listPrice: number | null;
  soldPrice: number | null;
  fees: number | null;
  purchasedAt: string;
};

function money(n?: number | null) {
  return n == null ? "—" : `$${n.toFixed(2)}`;
}
function net(p: Purchase) {
  if (p.soldPrice == null) return null;
  return p.soldPrice - p.unitCost * p.qty - (p.fees ?? 0);
}

export function PurchasesPanel({
  products,
  purchases,
}: {
  products: Product[];
  purchases: Purchase[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/purchases/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  async function markSold(p: Purchase) {
    const sold = prompt(`Sold price for "${p.name}" (per the whole lot)?`, p.listPrice?.toString() ?? "");
    if (sold == null) return;
    const fees = prompt("Fees (eBay ~13% + shipping + supplies)?", ((Number(sold) || 0) * 0.15).toFixed(2));
    if (fees == null) return;
    await patch(p.id, { soldPrice: Number(sold), fees: Number(fees), status: "SOLD" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this purchase?")) return;
    await fetch(`/api/purchases/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      alert("Could not log purchase: " + (await res.text()));
    }
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Product</th><th>Retailer</th><th className="num">Qty</th><th className="num">Unit cost</th>
            <th className="num">Cost</th><th>Status</th><th className="num">Sold</th><th className="num">Fees</th>
            <th className="num">Net</th><th></th>
          </tr>
        </thead>
        <tbody>
          {purchases.length === 0 && (
            <tr><td colSpan={10} className="note">No purchases logged yet. Log one below when you buy.</td></tr>
          )}
          {purchases.map((p) => {
            const n = net(p);
            return (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.retailer}</td>
                <td className="num">{p.qty}</td>
                <td className="num">{money(p.unitCost)}</td>
                <td className="num">{money(p.unitCost * p.qty)}</td>
                <td>
                  <select
                    defaultValue={p.status}
                    onChange={(e) => patch(p.id, { status: e.target.value })}
                    style={{ fontSize: 12, padding: "3px 6px" }}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="num">{money(p.soldPrice)}</td>
                <td className="num">{money(p.fees)}</td>
                <td className="num" style={{ color: n == null ? undefined : n >= 0 ? "var(--green)" : "var(--red)" }}>
                  {n == null ? "—" : money(n)}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {p.soldPrice == null && (
                    <button className="ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => markSold(p)}>
                      Mark sold
                    </button>
                  )}{" "}
                  <button className="ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => remove(p.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2 style={{ marginTop: 20 }}>Log a buy</h2>
      <form className="form" onSubmit={onSubmit}>
        <label>
          From watchlist (optional)
          <select
            name="productId"
            defaultValue=""
            onChange={(e) => {
              const p = products.find((x) => x.id === e.target.value);
              if (!p) return;
              const form = e.target.closest("form")!;
              (form.querySelector('[name="name"]') as HTMLInputElement).value = p.name;
              (form.querySelector('[name="retailer"]') as HTMLInputElement).value = p.retailer;
              if (p.msrp != null) (form.querySelector('[name="unitCost"]') as HTMLInputElement).value = String(p.msrp);
            }}
          >
            <option value="">— none —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label>Product name<input name="name" required /></label>
        <label>Retailer<input name="retailer" placeholder="target" required /></label>
        <label>Qty<input name="qty" type="number" min="1" defaultValue="1" /></label>
        <label>Unit cost ($)<input name="unitCost" type="number" step="0.01" required /></label>
        <label>List price ($)<input name="listPrice" type="number" step="0.01" /></label>
        <label>Order ref<input name="orderRef" placeholder="#123-456" /></label>
        <button type="submit" disabled={saving}>{saving ? "Saving…" : "Log buy"}</button>
      </form>
    </>
  );
}
