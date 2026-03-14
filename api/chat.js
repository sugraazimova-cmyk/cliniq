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
    const { question, historyQuestions } = req.body

    // Build a prompt asking Gemini to pick the best matching question index
    const questionList = historyQuestions
      .map((hq, i) => `${i}: "${hq.q}"`)
      .join("\n")

    const prompt = `A medical student asked: "${question}"

The available history questions are:
${questionList}

Which question number (0-${historyQuestions.length - 1}) best matches what the student is asking?
Reply with ONLY a single integer. If none match, reply with -1.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 5, temperature: 0 },
        }),
      }
    )

    const data = await response.json()
    console.log("Gemini response:", JSON.stringify(data).slice(0, 200))

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    const index = parseInt(raw, 10)

    console.log("Matched index:", index)

    // Valid match → return stored answer
    if (!isNaN(index) && index >= 0 && index < historyQuestions.length) {
      return res.status(200).json({
        content: [{ text: historyQuestions[index].a }]
      })
    }

    // No match
    return res.status(200).json({
      content: [{ text: "Bağışlayın, bu sualı başa düşmədim. Başqa cür soruşa bilərsiniz." }]
    })

  } catch (err) {
    console.error("api/chat error:", err)
    return res.status(500).json({ error: err.message })
  }
}