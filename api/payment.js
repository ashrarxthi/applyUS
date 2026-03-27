export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sourceId, amount, email, name, formId } = req.body;

  if (!sourceId || !amount || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch("https://connect.squareupsandbox.com/v2/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: `${email}-${formId}-${Date.now()}`,
        amount_money: {
          amount: amount, // in cents — 15000 = $150
          currency: "USD",
        },
        buyer_email_address: email,
        note: `ApplyUS DIY Kit — ${formId}`,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      const msg = data.errors?.[0]?.detail || "Payment failed";
      return res.status(400).json({ error: msg });
    }

    return res.status(200).json({ success: true, paymentId: data.payment.id });

  } catch (err) {
    console.error("Square payment error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
