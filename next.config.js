export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  // If no API key is set, return null so the component uses fallback copy
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(200).json({ text: null });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find((b) => b.type === "text")?.text || null;
    return res.status(200).json({ text: text ? text.trim().replace(/^["']|["']$/g, "") : null });
  } catch (e) {
    console.error("Generate error:", e);
    return res.status(200).json({ text: null });
  }
}
