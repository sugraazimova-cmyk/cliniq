/* global process */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

const VALID_SPECIALTIES = [
  'Kardiologiya', 'Nevrologiya', 'Pulmonologiya', 'Gastroenterologiya',
  'Endokrinologiya', 'Nefrologiya', 'Ortopediya', 'Pediatriya',
  'Cərrahiyyə', 'Ginekologiya', 'Psixiatriya', 'Dərmatologiya', 'Digər',
]
const VALID_DIFFICULTIES = ['Asan', 'Orta', 'Çətin']

function adminDb() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function verifyAdmin(req) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const db = adminDb()
  const { data: { user }, error } = await db.auth.getUser(token)
  if (error || !user) return null
  if (user.email !== ADMIN_EMAIL) return null
  return user
}

function validateCaseRow(c) {
  const title = String(c.title ?? '').trim().slice(0, 200)
  if (!title) throw new Error('Title required')
  return {
    title,
    specialty: VALID_SPECIALTIES.includes(c.specialty) ? c.specialty : 'Digər',
    difficulty: VALID_DIFFICULTIES.includes(c.difficulty) ? c.difficulty : 'Orta',
    patient_summary: String(c.patient_summary ?? '').trim().slice(0, 1000),
    patient_context: String(c.patient_context ?? '').trim().slice(0, 3000),
    correct_diagnosis: String(c.correct_diagnosis ?? '').trim().slice(0, 200),
    tags: Array.isArray(c.tags) ? c.tags.slice(0, 10) : [],
    vitals: Array.isArray(c.vitals) ? c.vitals.slice(0, 10) : [],
    history_questions: Array.isArray(c.history_questions) ? c.history_questions.slice(0, 20) : [],
    examinations: Array.isArray(c.examinations) ? c.examinations.slice(0, 20) : [],
    investigations: Array.isArray(c.investigations) ? c.investigations.slice(0, 20) : [],
    differential_diagnosis: Array.isArray(c.differential_diagnosis) ? c.differential_diagnosis.slice(0, 10) : [],
    diagnosis_keywords: Array.isArray(c.diagnosis_keywords) ? c.diagnosis_keywords.slice(0, 10) : [],
    explanation_points: Array.isArray(c.explanation_points) ? c.explanation_points.slice(0, 10) : [],
    treatment_options: Array.isArray(c.treatment_options) ? c.treatment_options.slice(0, 20) : [],
    treatment_points: Array.isArray(c.treatment_points) ? c.treatment_points.slice(0, 10) : [],
    is_published: c.is_published === true,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ADMIN_EMAIL) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const user = await verifyAdmin(req)
  if (!user) return res.status(403).json({ error: 'Forbidden' })

  const { action, payload = {} } = req.body ?? {}
  const db = adminDb()

  try {
    switch (action) {

      case 'stats': {
        const [{ data: cases }, attemptsRes, eventsRes] = await Promise.all([
          db.from('cases').select('id, is_published'),
          db.from('case_attempts').select('score, case_title, case_id'),
          db.from('feature_events').select('feature'),
        ])

        const publishedCount = cases?.filter(c => c.is_published).length ?? 0
        const draftCount = cases?.filter(c => !c.is_published).length ?? 0

        const attempts = attemptsRes.data ?? []
        const totalAttempts = attempts.length
        const avgScore = totalAttempts > 0
          ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / totalAttempts)
          : 0

        const caseCounts = {}
        for (const a of attempts) {
          const key = a.case_title || String(a.case_id)
          caseCounts[key] = (caseCounts[key] || 0) + 1
        }
        const topCases = Object.entries(caseCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([title, count]) => ({ title, count }))

        const featureCounts = {}
        for (const e of eventsRes.data ?? []) {
          featureCounts[e.feature] = (featureCounts[e.feature] || 0) + 1
        }

        // Users count via Admin API
        const usersRes = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users?per_page=1`,
          { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
        )
        const usersJson = await usersRes.json()
        const totalUsers = usersJson.total ?? 0

        return res.json({ publishedCount, draftCount, totalUsers, totalAttempts, avgScore, topCases, featureCounts })
      }

      case 'list': {
        const { data, error } = await db.from('cases').select('*').order('id')
        if (error) throw error

        // Attach attempt stats per case
        const { data: attempts } = await db.from('case_attempts').select('case_id, score')
        const statMap = {}
        for (const a of attempts ?? []) {
          if (!statMap[a.case_id]) statMap[a.case_id] = { count: 0, total: 0 }
          statMap[a.case_id].count++
          statMap[a.case_id].total += a.score || 0
        }
        const enriched = (data ?? []).map(c => ({
          ...c,
          attempt_count: statMap[c.id]?.count ?? 0,
          avg_score: statMap[c.id]
            ? Math.round(statMap[c.id].total / statMap[c.id].count)
            : null,
        }))
        return res.json({ cases: enriched })
      }

      case 'create': {
        const row = validateCaseRow(payload)
        const { data, error } = await db.from('cases').insert(row).select().single()
        if (error) throw error
        return res.json({ case: data })
      }

      case 'update': {
        const { id, ...rest } = payload
        if (!id) return res.status(400).json({ error: 'Missing id' })
        const row = validateCaseRow(rest)
        const { data, error } = await db.from('cases').update(row).eq('id', id).select().single()
        if (error) throw error
        return res.json({ case: data })
      }

      case 'delete': {
        const { id } = payload
        if (!id) return res.status(400).json({ error: 'Missing id' })
        const { error } = await db.from('cases').delete().eq('id', id)
        if (error) throw error
        return res.json({ ok: true })
      }

      case 'duplicate': {
        const { id } = payload
        if (!id) return res.status(400).json({ error: 'Missing id' })
        const { data: original, error: fetchErr } = await db.from('cases').select('*').eq('id', id).single()
        if (fetchErr) throw fetchErr
        // eslint-disable-next-line no-unused-vars
        const { id: _id, ...rest } = original
        const { data, error } = await db.from('cases').insert({ ...rest, title: `${rest.title} (kopya)`, is_published: false }).select().single()
        if (error) throw error
        return res.json({ case: data })
      }

      case 'toggle_publish': {
        const { id, is_published } = payload
        if (!id || typeof is_published !== 'boolean') return res.status(400).json({ error: 'Missing params' })
        const { error } = await db.from('cases').update({ is_published }).eq('id', id)
        if (error) throw error
        return res.json({ ok: true })
      }

      case 'users': {
        const usersRes = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users?per_page=500`,
          { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
        )
        const { users } = await usersRes.json()
        const { data: attempts } = await db.from('case_attempts').select('user_id, created_at')
        const attemptCounts = {}
        const lastActive = {}
        for (const a of attempts ?? []) {
          attemptCounts[a.user_id] = (attemptCounts[a.user_id] || 0) + 1
          if (!lastActive[a.user_id] || a.created_at > lastActive[a.user_id]) {
            lastActive[a.user_id] = a.created_at
          }
        }
        const result = (users ?? []).map(u => ({
          id: u.id,
          email: u.email,
          full_name: u.user_metadata?.full_name ?? '',
          created_at: u.created_at,
          attempts: attemptCounts[u.id] ?? 0,
          last_active: lastActive[u.id] ?? u.last_sign_in_at ?? null,
        }))
        return res.json({ users: result })
      }

      default:
        return res.status(400).json({ error: 'Unknown action' })
    }
  } catch (err) {
    console.error('admin error:', err)
    return res.status(500).json({ error: err.message })
  }
}
