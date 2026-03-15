// One-time migration: inserts all hardcoded cases into Supabase
// Usage: node scripts/migrate-cases.js

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { allCases } from '../src/cases.js'

// Load .env.local so this works without any special flags
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const envPath = resolve(__dirname, '../.env.local')
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key) process.env[key] = val
  }
} catch (e) {
  console.warn('Could not load .env.local:', e.message)
}

// NOTE: run with SUPABASE_SERVICE_ROLE_KEY env var set (bypasses RLS)
// e.g. SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/migrate-cases.js
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

function toRow(c) {
  return {
    id: c.id,
    title: c.title,
    specialty: c.specialty,
    difficulty: c.difficulty,
    patient_summary: c.patientSummary,
    tags: c.tags,
    vitals: c.vitals,
    patient_context: c.patientContext,
    history_questions: c.historyQuestions,
    examinations: c.examinations,
    investigations: c.investigations,
    correct_diagnosis: c.correctDiagnosis,
    diagnosis_keywords: c.diagnosisKeywords,
    explanation_points: c.explanationPoints,
    treatment_points: c.treatmentPoints,
    is_published: true,
  }
}

async function migrate() {
  console.log(`Migrating ${allCases.length} cases to Supabase...\n`)

  for (const c of allCases) {
    const row = toRow(c)
    const { error } = await supabase
      .from('cases')
      .upsert(row, { onConflict: 'id' })

    if (error) {
      console.error(`  ✗ Case ${c.id} (${c.specialty}): ${error.message}`)
    } else {
      console.log(`  ✓ Case ${c.id} — ${c.specialty} — ${c.title}`)
    }
  }

  console.log('\nDone.')
}

migrate()
