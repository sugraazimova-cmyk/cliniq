/* global process */

function logEvent(feature) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  fetch(`${url}/rest/v1/feature_events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=minimal' },
    body: JSON.stringify({ feature }),
  }).catch(() => {})
}

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 1000
const MAX_WORDS = 3000

const SYSTEM_PROMPT = `You are a medical education assistant. When given clinical text or an image of medical content, generate exactly 8 high-quality flashcards for medical students and doctors.

Rules:
- Each flashcard must have a clear, specific QUESTION and a concise ANSWER
- Focus on: drug mechanisms, dosages, diagnostic criteria, treatment steps, contraindications, and key clinical facts
- Questions should test active recall, not just definitions
- Keep answers under 3 sentences
- If given an image, read all visible text and base flashcards on the medical content shown
- Return ONLY a valid JSON array, no extra text, no markdown, no backticks

Format:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' })

  const { isImage, content, fileBase64, mimeType } = req.body

  if (!isImage && (!content || !content.trim())) {
    return res.status(400).json({ error: 'Zəhmət olmasa fayl yükləyin və ya mətn yapışdırın.' })
  }
  if (isImage && !fileBase64) {
    return res.status(400).json({ error: 'Zəhmət olmasa fayl yükləyin və ya mətn yapışdırın.' })
  }

  // Build message content
  let messageContent
  if (isImage) {
    messageContent = [
      {
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data: fileBase64 },
      },
      { type: 'text', text: 'Generate 8 flashcards from this medical image/document.' },
    ]
  } else {
    const words = content.trim().split(/\s+/)
    const truncated = words.slice(0, MAX_WORDS).join(' ')
    messageContent = [{ type: 'text', text: truncated }]
  }

  const messages = [{ role: 'user', content: messageContent }]

  try {
    let raw = await callClaude(apiKey, messages)
    let flashcards
    try {
      flashcards = JSON.parse(raw)
    } catch {
      // Retry once
      raw = await callClaude(apiKey, messages)
      try {
        flashcards = JSON.parse(raw)
      } catch {
        return res.status(500).json({ error: 'Öyrənmə kartları yaradıla bilmədi. Zəhmət olmasa yenidən cəhd edin.' })
      }
    }
    logEvent('flashcard_generate')
    return res.json({ flashcards })
  } catch (err) {
    console.error('flashcards error:', err)
    return res.status(500).json({ error: 'Öyrənmə kartları yaradıla bilmədi. Zəhmət olmasa yenidən cəhd edin.' })
  }
}

async function callClaude(apiKey, messages) {
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `API error ${res.status}`)
  return data.content[0].text
}
