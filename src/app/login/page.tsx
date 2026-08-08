"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("next") || "/";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <form
        onSubmit={onSubmit}
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 28,
          width: "100%",
          maxWidth: 360,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22, letterSpacing: "-0.02em" }}>SnagPack</h1>
          <span className="tag" style={{ color: "var(--muted)", fontSize: 13 }}>sealed card pack radar</span>
        </div>
        <p className="note" style={{ marginTop: 0, marginBottom: 18 }}>Enter the access password to continue.</p>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--muted)" }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
            }}
          />
        </label>

        {error && (
          <div style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>{error}</div>
        )}

        <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 18, padding: "10px 16px" }}>
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
