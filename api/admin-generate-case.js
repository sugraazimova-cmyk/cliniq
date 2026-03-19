/* global process */
import { createClient } from '@supabase/supabase-js'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const VALID_SPECIALTIES = [
  'Kardiologiya', 'Nevrologiya', 'Pulmonologiya', 'Gastroenterologiya',
  'Endokrinologiya', 'Nefrologiya', 'Ortopediya', 'Pediatriya',
  'Cərrahiyyə', 'Ginekologiya', 'Psixiatriya', 'Dərmatologiya', 'Digər',
]
const VALID_DIFFICULTIES = ['Asan', 'Orta', 'Çətin']

async function verifyAdmin(req) {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user }, error } = await db.auth.getUser(token)
  if (error || !user) return null
  if (user.email !== ADMIN_EMAIL) return null
  return user
}

const SYSTEM_PROMPT = `You are a medical education case author. Generate realistic Azerbaijani clinical cases for medical students.

Return ONLY a valid JSON object with these exact fields — no markdown, no backticks, no extra text:

{
  "title": "descriptive case title in Azerbaijani",
  "specialty": "one of: Kardiologiya | Nevrologiya | Pulmonologiya | Gastroenterologiya | Endokrinologiya | Nefrologiya | Ortopediya | Pediatriya | Cərrahiyyə | Ginekologiya | Psixiatriya | Dərmatologiya | Digər",
  "difficulty": "one of: Asan | Orta | Çətin",
  "patient_summary": "one sentence patient presentation in Azerbaijani",
  "patient_context": "2-3 sentences of patient background in Azerbaijani",
  "tags": ["2-4 Azerbaijani tags like 'kişi', 'qadın', '53 yaş', 'xroniki xəstəlik'"],
  "vitals": [{"label": "Təzyiq", "value": "120/80"}, {"label": "Nabz", "value": "72"}, {"label": "Temp", "value": "36.6°C"}, {"label": "SpO2", "value": "98%"}],
  "history_questions": [
    {"q": "question in Azerbaijani", "a": "answer in Azerbaijani", "tag": "essential|relevant|irrelevant", "points": 10}
  ],
  "examinations": [
    {"system": "body system name — one of: Baş/Beyin | Ağız boşluğu | Boyun | Limfa düyünləri | Ağciyərlər | Ürək | Qarın boşluğu | Qaraciyər | Dalaq | Dəri | Sol çiyin | Sağ çiyin | Sol diz | Sağ diz", "finding": "exam finding in Azerbaijani", "relevant": true}
  ],
  "investigations": [
    {"test": "test name in Azerbaijani", "result": "result in Azerbaijani", "cost": 1, "tag": "essential|relevant|irrelevant"}
  ],
  "differential_diagnosis": [{"diagnosis": "diagnosis option in Azerbaijani"}],
  "correct_diagnosis": "exact correct diagnosis in Azerbaijani",
  "diagnosis_keywords": ["2-4 keyword strings for matching"],
  "explanation_points": ["3-5 educational bullet points in Azerbaijani"],
  "treatment_options": [{"text": "Short name — reason why correct or incorrect in Azerbaijani", "correct": true}],
  "treatment_points": ["3-5 treatment protocol bullet points in Azerbaijani"]
}

Rules:
- ALL text must be in Azerbaijani
- history_questions: 6-8 total — 2-3 essential (points: 10), 2-3 relevant (points: 5), 1-2 irrelevant (points: 0)
- examinations: 5-7 findings — 3-4 relevant:true, 2-3 relevant:false
- investigations: 6-8 total — 2-3 essential (cost 1-2), 2-3 relevant (cost 1-2), 2 distractors (cost 2-3, tag: irrelevant)
- differential_diagnosis: 4-5 options including the correct one
- treatment_options: 5-7 options — 3-4 correct:true, 2-3 correct:false (distractors)
- cost values: 1=cheap, 2=moderate, 3=expensive
- Make the case clinically accurate and self-consistent`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await verifyAdmin(req)
  if (!user) return res.status(403).json({ error: 'Forbidden' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' })

  const {
    diagnosis = '',
    specialty = '',
    difficulty = 'Orta',
    additionalNotes = '',
  } = req.body ?? {}

  if (!diagnosis.trim()) {
    return res.status(400).json({ error: 'Diaqnoz tələb olunur' })
  }

  const safeSpecialty = VALID_SPECIALTIES.includes(specialty) ? specialty : ''
  const safeDifficulty = VALID_DIFFICULTIES.includes(difficulty) ? difficulty : 'Orta'
  const safeNotes = additionalNotes.slice(0, 500)

  const userMessage = [
    `Generate a complete Azerbaijani medical case:`,
    `- Diagnosis: ${diagnosis.trim().slice(0, 200)}`,
    safeSpecialty ? `- Specialty: ${safeSpecialty}` : '',
    `- Difficulty: ${safeDifficulty}`,
    safeNotes ? `- Additional context: ${safeNotes}` : '',
  ].filter(Boolean).join('\n')

  async function callClaude() {
    const resp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userMessage }],
      }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error?.message ?? `API error ${resp.status}`)
    return data.content[0].text
  }

  try {
    let raw = await callClaude()
    let caseData
    try {
      caseData = JSON.parse(raw)
    } catch {
      raw = await callClaude()
      caseData = JSON.parse(raw)
    }
    return res.json({ case: caseData })
  } catch (err) {
    console.error('generate-case error:', err)
    return res.status(500).json({ error: 'Hal yaradıla bilmədi. Zəhmət olmasa yenidən cəhd edin.' })
  }
}
