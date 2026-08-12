// Push a restock alert. Rich Discord embed if DISCORD_WEBHOOK_URL is set, else console.
// Add SMS/push here later (Twilio, ntfy, etc.) — same signature.

export type Alert = {
  name: string;
  retailer: string;
  price?: number | null;
  cartUrl?: string | null;
  note?: string;
};

export async function sendAlert(a: Alert): Promise<void> {
  const line = `🟢 LANDED: ${a.name} @ ${a.retailer}${
    a.price ? ` — $${a.price}` : ""
  }${a.note ? ` (${a.note})` : ""}${a.cartUrl ? `\nBuy: ${a.cartUrl}` : ""}`;

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.log("[alert]", line);
    return;
  }

  const fields = [
    { name: "Retailer", value: a.retailer || "—", inline: true },
    { name: "Price", value: a.price != null ? `$${a.price.toFixed(2)}` : "—", inline: true },
  ];
  if (a.note) fields.push({ name: "Note", value: a.note, inline: false });
  if (a.cartUrl) fields.push({ name: "Buy now", value: `[Open cart →](${a.cartUrl})`, inline: false });

  const payload = {
    // Plain content shows in the phone push preview even before the embed renders.
    content: `🚨 **LANDED** — ${a.name}`,
    embeds: [
      {
        title: `🟢 ${a.name}`,
        url: a.cartUrl || undefined,
        color: 0x2ec26a, // green
        fields,
        footer: { text: "SnagPack" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error("[alert] webhook", res.status, "\n", line);
  } catch (e) {
    console.error("[alert] webhook failed:", (e as Error).message, "\n", line);
  }
}
