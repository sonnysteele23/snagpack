"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
