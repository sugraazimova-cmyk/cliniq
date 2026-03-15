/* global process */

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY", correct: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { studentDiagnosis, correctDiagnosis, diagnosisKeywords } = await req.json()

    const keywordHint = diagnosisKeywords?.length
      ? `\nAccepted terms: ${diagnosisKeywords.join(", ")}.`
      : ""

    const prompt = `You are a medical education evaluator.
Correct diagnosis: "${correctDiagnosis}"${keywordHint}
Student's answer: "${studentDiagnosis}"
Does the student's answer refer to the same diagnosis? Consider synonyms, abbreviations, and Azerbaijani variants as correct. Reply only YES or NO.`

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

    if (data.error) {
      return new Response(
        JSON.stringify({ error: `Gemini error: ${data.error.message}`, correct: false }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      )
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase()
    const correct = raw === "YES"

    return new Response(JSON.stringify({ correct }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, correct: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
