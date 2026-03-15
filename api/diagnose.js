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

    const prompt = `You are a medical education evaluator. Be lenient — this is a student typing quickly.
Correct diagnosis: "${correctDiagnosis}"${keywordHint}
Student's answer: "${studentDiagnosis}"

Reply YES if the student's answer refers to the same diagnosis. Accept:
- Different capitalisation (e.g. "qiçs" = "QİÇS")
- Azerbaijani dotted/undotted letter variants (i/İ, ı/I)
- Abbreviation only without the full name in parentheses (e.g. "QİÇS" = "QİÇS (AIDS)")
- The English equivalent instead of Azerbaijani (e.g. "AIDS" = "QİÇS")
- Common synonyms or alternative medical terms for the same condition
Reply NO only if the student named a clearly different disease.
Reply only YES or NO.`

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
