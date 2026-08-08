// Push a restock alert. Discord webhook if configured, else console.
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
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: line }),
    });
  } catch (e) {
    console.error("[alert] webhook failed:", (e as Error).message, "\n", line);
  }
}
