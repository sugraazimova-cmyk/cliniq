/* global process */

export const config = {
  api: { bodyParser: true },
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed")
  }

  const apiKey = process.env.GEMINI_API_KEY
  console.log("api/chat: key present?", !!apiKey)

  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" })
  }

  try {
    const { system, messages } = req.body

    // Convert messages to Gemini format
    // Gemini uses "user"/"model" roles (not "user"/"assistant")
    const geminiMessages = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: system }],
          },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
          },
        }),
      }
    )

    const data = await response.json()
    console.log("Gemini response:", JSON.stringify(data).slice(0, 200))

    // Extract text from Gemini response shape
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      || "Bağışlayın, başa düşmədim..."

    // Return in the same shape App.jsx expects: { content: [{ text }] }
    return res.status(200).json({ content: [{ text }] })

  } catch (err) {
    console.error("api/chat error:", err)
    return res.status(500).json({ error: err.message })
  }
}