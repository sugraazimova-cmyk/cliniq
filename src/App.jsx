import { useState, useEffect } from "react"
import { supabase } from './supabase.js'
import AuthScreen from './AuthScreen.jsx'

function mapCase(row) {
  return {
    id: row.id,
    title: row.title,
    specialty: row.specialty,
    difficulty: row.difficulty,
    patientSummary: row.patient_summary,
    tags: row.tags,
    vitals: row.vitals,
    patientContext: row.patient_context,
    historyQuestions: row.history_questions,
    examinations: row.examinations,
    investigations: row.investigations,
    differentialDiagnosis: row.differential_diagnosis,
    correctDiagnosis: row.correct_diagnosis,
    diagnosisKeywords: row.diagnosis_keywords,
    explanationPoints: row.explanation_points,
    treatmentPoints: row.treatment_points,
    treatmentOptions: row.treatment_options ?? [],
  }
}

const MAX_ANAMNESIS_PICKS = 5
const MAX_INVESTIGATION_PICKS = 5
const MAX_DIFFERENTIAL_PICKS = 3

const TAG_LABEL = { essential: "Vacib", relevant: "Faydalı", irrelevant: "Lazımsız" }
const TAG_COLOR = {
  essential:  "bg-red-100 text-red-700",
  relevant:   "bg-amber-100 text-amber-700",
  irrelevant: "bg-stone-100 text-stone-400",
}
const COST_DISPLAY = { 1: "₼", 2: "₼₼", 3: "₼₼₼" }
const COST_COLOR   = { 1: "bg-green-100 text-green-700", 2: "bg-amber-100 text-amber-700", 3: "bg-red-100 text-red-700" }

const BODY_REGION_MAP = {
  "Baş/Beyin":       { x: 60,  y: 16  },
  "Ağız boşluğu":    { x: 60,  y: 30  },
  "Boyun":           { x: 60,  y: 42  },
  "Limfa düyünləri": { x: 76,  y: 48  },
  "Ağciyərlər":      { x: 44,  y: 74  },
  "Ürək":            { x: 44,  y: 82  },
  "Qarın boşluğu":   { x: 60,  y: 108 },
  "Qaraciyər":       { x: 68,  y: 102 },
  "Dalaq":           { x: 48,  y: 102 },
  "Dəri":            { x: 96,  y: 78  },
  "Sol çiyin":       { x: 18,  y: 58  },
  "Sağ çiyin":       { x: 102, y: 58  },
  "Sol diz":         { x: 40,  y: 185 },
  "Sağ diz":         { x: 80,  y: 185 },
  "default":         { x: 60,  y: 120 },
}

const STEPS = ["Anamnez", "Müayinə", "Analizlər", "Diaqnoz", "Müalicə", "Nəticə"]

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) {
      setCases([])
      setLoading(true)
      setError(null)
      return
    }
    supabase
      .from('cases')
      .select('*')
      .eq('is_published', true)
      .order('id')
      .then(({ data, error: err }) => {
        if (err) { console.error('Failed to load cases:', err); setError(err.message) }
        else { setCases(data.map(mapCase)) }
        setLoading(false)
      })
  }, [session])

  const [selectedCase, setSelectedCase] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)

  // Anamnesis
  const [selectedQuestions, setSelectedQuestions] = useState([])

  // Examination
  const [selectedExams, setSelectedExams] = useState([])

  // Investigations
  const [selectedTests, setSelectedTests] = useState([])

  // Diagnosis
  const [differentialPicks, setDifferentialPicks] = useState([])
  const [diagnosisStage, setDiagnosisStage] = useState("differential")
  const [diagnosis, setDiagnosis] = useState("")
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState(null)

  // Treatment
  const [selectedTreatments, setSelectedTreatments] = useState([])
  const [treatment, setTreatment] = useState("")

  const [score, setScore] = useState(0)

  function toggleQuestion(idx) {
    if (selectedQuestions.includes(idx)) return
    if (selectedQuestions.length >= MAX_ANAMNESIS_PICKS) return
    setSelectedQuestions(prev => [...prev, idx])
    setScore(s => s + (selectedCase.historyQuestions[idx].points ?? 0))
  }

  function toggleExam(idx) {
    if (selectedExams.includes(idx)) return
    setSelectedExams(prev => [...prev, idx])
    if (selectedCase.examinations[idx].relevant) setScore(s => s + 8)
  }

  function toggleTest(idx) {
    if (selectedTests.includes(idx)) return
    if (selectedTests.length >= MAX_INVESTIGATION_PICKS) return
    setSelectedTests(prev => [...prev, idx])
    const inv = selectedCase.investigations[idx]
    const pts = inv.tag === "essential" ? 10 : inv.tag === "relevant" ? 5 : -5
    setScore(s => s + pts)
  }

  function toggleDifferential(idx) {
    if (differentialPicks.includes(idx)) {
      setDifferentialPicks(prev => prev.filter(i => i !== idx))
      return
    }
    if (differentialPicks.length >= MAX_DIFFERENTIAL_PICKS) return
    setDifferentialPicks(prev => [...prev, idx])
  }

  async function checkDiagnosis() {
    if (!diagnosis.trim() || isDiagnosing) return
    setIsDiagnosing(true)
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentDiagnosis: diagnosis,
          correctDiagnosis: selectedCase.correctDiagnosis,
          diagnosisKeywords: selectedCase.diagnosisKeywords,
        }),
      })
      const data = await res.json()
      const correct = data.correct === true
      setDiagnosisResult(correct)
      if (correct) setScore(s => s + 20)
    } catch {
      setDiagnosisResult(false)
    }
    setIsDiagnosing(false)
  }

  function toggleTreatment(idx) {
    setSelectedTreatments(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  function resetAll() {
    setSelectedCase(null)
    setCurrentStep(0)
    setSelectedQuestions([])
    setSelectedExams([])
    setSelectedTests([])
    setDifferentialPicks([])
    setDiagnosisStage("differential")
    setDiagnosis("")
    setDiagnosisResult(null)
    setIsDiagnosing(false)
    setSelectedTreatments([])
    setTreatment("")
    setScore(0)
  }

  // ── Auth / loading gates ────────────────────────────────────────────────

  if (session === undefined) return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <p className="text-stone-400 text-sm">Yüklənir...</p>
    </div>
  )

  if (!session) return <AuthScreen />

  if (loading) return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <p className="text-stone-400 text-sm">Yüklənir...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <p className="text-red-500 text-sm">Xəta: {error}</p>
    </div>
  )

  // ── Case list ───────────────────────────────────────────────────────────

  if (!selectedCase) {
    return (
      <div className="min-h-screen bg-stone-100 p-4">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-2xl font-medium text-indigo-700">ClinIQ</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-stone-400">Azərbaycan Tibbi Simulator</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-xs text-stone-400 hover:text-stone-600">
                Çıxış
              </button>
            </div>
          </div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Kliniki hal seçin</p>
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className="bg-white border border-stone-200 rounded-xl p-4 mb-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-stone-800">Kliniki hal {c.id} — {c.specialty}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full
                  ${c.difficulty === "Çətin" ? "bg-red-100 text-red-700" :
                    c.difficulty === "Orta" ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"}`}>
                  {c.difficulty}
                </span>
              </div>
              <p className="text-xs text-stone-400">{c.tags[0]} · {c.tags[1]}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const c = selectedCase

  // ── Case flow ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-medium text-indigo-700">ClinIQ</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
              {score} xal
            </span>
            <button onClick={resetAll} className="text-xs text-stone-400 hover:text-stone-600">
              ← Geri
            </button>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex rounded-lg overflow-hidden border border-stone-200 mb-4">
          {STEPS.map((step, i) => (
            <div key={step} className={`flex-1 py-2 text-center text-xs font-medium border-r border-stone-200 last:border-r-0
              ${i === currentStep ? "bg-indigo-100 text-indigo-700" :
                i < currentStep ? "bg-emerald-50 text-emerald-700" : "bg-white text-stone-400"}`}>
              {step}
            </div>
          ))}
        </div>

        {/* Patient summary */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Xəstənin təqdimatı</p>
          <p className="text-sm text-stone-800 leading-relaxed mb-3">{c.patientSummary}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {c.tags.map((tag, i) => (
              <span key={i} className={`text-xs font-medium px-3 py-1 rounded-full
                ${i === 0 ? "bg-indigo-100 text-indigo-800" : "bg-orange-100 text-orange-800"}`}>
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Həyati göstəricilər</p>
          <div className="grid grid-cols-4 gap-2">
            {c.vitals.map((v) => (
              <div key={v.label} className="bg-stone-100 rounded-lg p-2 text-center">
                <p className="text-sm font-medium text-stone-800">{v.value}</p>
                <p className="text-xs text-stone-400">{v.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 0: Anamnesis ─────────────────────────────────────────── */}
        {currentStep === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Xəstəyə sual verin</p>
              <span className={`text-xs font-medium px-2 py-1 rounded-full
                ${selectedQuestions.length >= MAX_ANAMNESIS_PICKS ? "bg-red-100 text-red-700" :
                  selectedQuestions.length >= 3 ? "bg-amber-100 text-amber-700" :
                  "bg-emerald-100 text-emerald-700"}`}>
                {selectedQuestions.length}/{MAX_ANAMNESIS_PICKS} seçilib
              </span>
            </div>
            <p className="text-xs text-stone-400 mb-3">Ən vacib hesab etdiyiniz 5 sualı seçin. Cavab dərhal görünəcək.</p>
            <div className="flex flex-col gap-2">
              {(c.historyQuestions ?? []).map((q, idx) => {
                const selected = selectedQuestions.includes(idx)
                const capped = !selected && selectedQuestions.length >= MAX_ANAMNESIS_PICKS
                return (
                  <div key={q.id ?? idx}>
                    <button
                      onClick={() => toggleQuestion(idx)}
                      disabled={capped}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors
                        ${selected ? "bg-indigo-50 border-indigo-200 text-indigo-900" :
                          capped ? "bg-stone-50 border-stone-200 text-stone-400 opacity-50 cursor-not-allowed" :
                          "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"}`}>
                      <div className="flex justify-between items-start gap-2">
                        <span className="flex-1">{q.q}</span>
                        {selected && (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TAG_COLOR[q.tag] ?? TAG_COLOR.irrelevant}`}>
                              {TAG_LABEL[q.tag] ?? q.tag}
                            </span>
                            <span className="text-xs text-stone-400">+{q.points ?? 0}</span>
                          </div>
                        )}
                      </div>
                    </button>
                    {selected && (
                      <div className="mt-1 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 fade-up">
                        <p className="text-xs font-medium text-emerald-600 mb-0.5">Xəstə</p>
                        {q.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 1: Examination ───────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Xəstəyə toxunun — müayinə edin</p>
            <div className="flex gap-3 min-h-60">
              {/* Patient SVG */}
              <div className="shrink-0 flex items-start justify-center w-28">
                <svg viewBox="0 0 120 240" width="112" height="224" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Body (breathing) */}
                  <g className="breathe">
                    <circle cx="60" cy="18" r="14" fill="#d6d3d1"/>
                    <rect x="54" y="31" width="12" height="10" rx="3" fill="#d6d3d1"/>
                    <rect x="28" y="41" width="64" height="68" rx="10" fill="#e7e5e4"/>
                    <rect x="10" y="44" width="18" height="54" rx="9" fill="#d6d3d1"/>
                    <rect x="92" y="44" width="18" height="54" rx="9" fill="#d6d3d1"/>
                    <rect x="32" y="109" width="22" height="72" rx="9" fill="#d6d3d1"/>
                    <rect x="66" y="109" width="22" height="72" rx="9" fill="#d6d3d1"/>
                  </g>
                  {/* Alert dots */}
                  {c.examinations.map((item, i) => {
                    const pos = BODY_REGION_MAP[item.system] ?? BODY_REGION_MAP.default
                    const selected = selectedExams.includes(i)
                    return (
                      <g key={i} onClick={() => toggleExam(i)} style={{cursor: selected ? "default" : "pointer"}}>
                        {!selected ? (
                          <>
                            <circle cx={pos.x} cy={pos.y} r="7"   fill="#ef4444" className="pulse-dot"/>
                            <circle cx={pos.x} cy={pos.y} r="7"   fill="#ef4444" className="pulse-dot-2"/>
                            <circle cx={pos.x} cy={pos.y} r="5.5" fill="#ef4444"/>
                          </>
                        ) : (
                          <>
                            <circle cx={pos.x} cy={pos.y} r="6" fill="#10b981"/>
                            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="white">✓</text>
                          </>
                        )}
                      </g>
                    )
                  })}
                </svg>
              </div>
              {/* Findings feed */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-56">
                {selectedExams.length === 0 ? (
                  <p className="text-xs text-stone-300 mt-2">Xəstəyə toxunun...</p>
                ) : (
                  selectedExams.map(idx => (
                    <div key={idx} className="bg-white border rounded-lg p-2 shadow-sm border-l-4 border-l-emerald-400 fade-in">
                      <p className="text-xs font-medium text-stone-700">{c.examinations[idx].system}</p>
                      <p className="text-xs text-stone-500 mt-0.5 leading-snug">{c.examinations[idx].finding}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Investigations ────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            {/* Patient figure + findings feed */}
            <div className="flex gap-3 mb-4 min-h-28">
              {/* Patient SVG */}
              <div className="shrink-0 flex items-center justify-center w-20">
                <svg viewBox="0 0 60 120" width="60" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Head */}
                  <circle cx="30" cy="14" r="11" fill="#d6d3d1" />
                  {/* Neck */}
                  <rect x="26" y="24" width="8" height="6" rx="2" fill="#d6d3d1" />
                  {/* Body */}
                  <rect x="16" y="30" width="28" height="36" rx="6" fill="#e7e5e4" />
                  {/* Left arm */}
                  <rect x="6" y="32" width="10" height="26" rx="5" fill="#d6d3d1" />
                  {/* Right arm */}
                  <rect x="44" y="32" width="10" height="26" rx="5" fill="#d6d3d1" />
                  {/* Left leg */}
                  <rect x="18" y="66" width="10" height="34" rx="5" fill="#d6d3d1" />
                  {/* Right leg */}
                  <rect x="32" y="66" width="10" height="34" rx="5" fill="#d6d3d1" />
                  {/* Heartbeat line */}
                  <polyline points="18,50 22,50 24,44 27,56 30,44 33,56 36,50 42,50"
                    stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Findings feed */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-40">
                {selectedTests.length === 0 ? (
                  <p className="text-xs text-stone-300 mt-2">Nəticələr burada görünəcək...</p>
                ) : (
                  selectedTests.map((idx) => {
                    const inv = c.investigations[idx]
                    const borderColor = inv.tag === "essential" ? "border-emerald-400" :
                      inv.tag === "relevant" ? "border-amber-400" : "border-red-400"
                    return (
                      <div key={idx} className={`bg-white border rounded-lg p-2 shadow-sm border-l-4 ${borderColor} fade-in`}>
                        <p className="text-xs font-medium text-stone-700">{inv.test}</p>
                        <p className="text-xs text-stone-500 mt-0.5 leading-snug">{inv.result}</p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Test selection */}
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Analiz sifariş edin</p>
              <span className={`text-xs font-medium px-2 py-1 rounded-full
                ${selectedTests.length >= MAX_INVESTIGATION_PICKS ? "bg-red-100 text-red-700" :
                  selectedTests.length >= 3 ? "bg-amber-100 text-amber-700" :
                  "bg-emerald-100 text-emerald-700"}`}>
                {selectedTests.length}/{MAX_INVESTIGATION_PICKS} seçilib
              </span>
            </div>
            <p className="text-xs text-stone-400 mb-3">Lazımsız testlər xal azaldır.</p>
            <div className="flex flex-col gap-2">
              {(c.investigations ?? []).map((inv, idx) => {
                const selected = selectedTests.includes(idx)
                const capped = !selected && selectedTests.length >= MAX_INVESTIGATION_PICKS
                return (
                  <button
                    key={inv.id ?? idx}
                    onClick={() => toggleTest(idx)}
                    disabled={capped}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors
                      ${selected ? "bg-indigo-50 border-indigo-200 text-indigo-900" :
                        capped ? "bg-stone-50 border-stone-200 text-stone-400 opacity-50 cursor-not-allowed" :
                        "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"}`}>
                    <div className="flex justify-between items-center gap-2">
                      <span className="flex-1 font-medium">{inv.test}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {inv.cost && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COST_COLOR[inv.cost]}`}>
                            {COST_DISPLAY[inv.cost]}
                          </span>
                        )}
                        {selected && (
                          <>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TAG_COLOR[inv.tag] ?? TAG_COLOR.irrelevant}`}>
                              {TAG_LABEL[inv.tag] ?? inv.tag}
                            </span>
                            <span className="text-emerald-500 text-sm">✓</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Diagnosis ─────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            {/* Stage 1: Differential */}
            {diagnosisStage === "differential" && (c.differentialDiagnosis?.length > 0) && (
              <>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Differensial diaqnoz</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full
                    ${differentialPicks.length >= MAX_DIFFERENTIAL_PICKS ? "bg-indigo-100 text-indigo-700" : "bg-stone-100 text-stone-500"}`}>
                    {differentialPicks.length}/{MAX_DIFFERENTIAL_PICKS} seçilib
                  </span>
                </div>
                <p className="text-xs text-stone-400 mb-3">Ən ehtimallı diaqnozu seçin (maks. 3)</p>
                <div className="flex flex-col gap-2 mb-4">
                  {c.differentialDiagnosis.map((item, idx) => {
                    const picked = differentialPicks.includes(idx)
                    const capped = !picked && differentialPicks.length >= MAX_DIFFERENTIAL_PICKS
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleDifferential(idx)}
                        disabled={capped}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors
                          ${picked ? "bg-indigo-50 border-indigo-200 text-indigo-900" :
                            capped ? "bg-stone-50 border-stone-200 text-stone-400 opacity-50 cursor-not-allowed" :
                            "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"}`}>
                        <div className="flex justify-between items-center">
                          <span>{item.diagnosis}</span>
                          {picked && <span className="text-indigo-500 text-sm">✓</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setDiagnosisStage("final")}
                  disabled={differentialPicks.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-2 rounded-xl text-sm transition-colors">
                  Diaqnozu müəyyənləşdir →
                </button>
              </>
            )}

            {/* Stage 2: Final diagnosis */}
            {(diagnosisStage === "final" || !c.differentialDiagnosis?.length) && (
              <>
                {/* Show differential commitment if made */}
                {differentialPicks.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-stone-400 mb-1.5">Seçdiyiniz variantlar:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {differentialPicks.map(idx => (
                        <span key={idx} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                          {c.differentialDiagnosis[idx].diagnosis}
                        </span>
                      ))}
                    </div>
                    <div className="border-t border-stone-100 mt-3 mb-3" />
                  </div>
                )}

                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Əsas diaqnoz</p>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkDiagnosis()}
                  placeholder="Diaqnozunuzu yazın..."
                  disabled={diagnosisResult !== null}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 mb-3 outline-none focus:border-indigo-400 disabled:bg-stone-50 disabled:text-stone-400"
                />

                {diagnosisResult === null && (
                  <button
                    onClick={checkDiagnosis}
                    disabled={!diagnosis.trim() || isDiagnosing}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-2 rounded-xl text-sm transition-colors">
                    {isDiagnosing ? "Yoxlanılır..." : "Diaqnozu yoxla"}
                  </button>
                )}

                {diagnosisResult === true && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 fade-up">
                    <p className="text-sm font-medium text-emerald-700">Düzgün! +20 xal</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Diaqnoz: {c.correctDiagnosis}</p>
                  </div>
                )}
                {diagnosisResult === false && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 fade-up">
                    <p className="text-sm font-medium text-red-700">Yanlış</p>
                    <p className="text-xs text-red-600 mt-0.5">Düzgün diaqnoz: {c.correctDiagnosis}</p>
                  </div>
                )}

                {diagnosisResult !== null && (
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-colors mt-3">
                    Növbəti mərhələ →
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 4: Treatment ─────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            {c.treatmentOptions?.length > 0 ? (
              <>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">Müalicə planı</p>
                <p className="text-xs text-stone-400 mb-3">Düzgün hesab etdiyiniz müalicə tədbirlərini seçin</p>
                <div className="flex flex-col gap-2">
                  {c.treatmentOptions.map((opt, idx) => {
                    const selected = selectedTreatments.includes(idx)
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleTreatment(idx)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors
                          ${selected ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"}`}>
                        <div className="flex justify-between items-center gap-2">
                          <span className="flex-1">{opt.text}</span>
                          {selected && <span className="text-indigo-500 shrink-0">✓</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Müalicə planınızı daxil edin</p>
                <textarea
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Müalicə, dərmanlar, göndərişlər..."
                  rows={5}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-indigo-400 resize-none"
                />
              </>
            )}
          </div>
        )}

        {/* ── Step 5: Results ───────────────────────────────────────────── */}
        {currentStep === 5 && (() => {
          // Tally treatment score here to avoid setScore in render
          const treatmentScore = (c.treatmentOptions?.length > 0)
            ? selectedTreatments.reduce((acc, idx) => acc + (c.treatmentOptions[idx].correct ? 5 : -3), 0)
            : 0
          const totalScore = score + treatmentScore

          return (
            <div className="mb-3">
              {/* Score header */}
              <div className={`rounded-xl p-4 mb-3 border ${
                diagnosisResult ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1 text-stone-500">Yekun xal</p>
                <p className="text-3xl font-medium text-stone-800 mb-1">{totalScore} xal</p>
                <p className="text-sm text-stone-600">Düzgün diaqnoz: <span className="font-medium text-indigo-700">{c.correctDiagnosis}</span></p>
                <p className="text-sm text-stone-600 mt-1">Sizin cavab: <span className="font-medium">{diagnosis || "Daxil edilməyib"}</span></p>
              </div>

              {/* Anamnesis breakdown */}
              {selectedQuestions.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Anamnez nəticəsi</p>
                  <div className="flex flex-col gap-2">
                    {selectedQuestions.map(idx => {
                      const q = c.historyQuestions[idx]
                      return (
                        <div key={idx} className="border border-stone-100 rounded-lg p-2">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-xs text-stone-700 flex-1">{q.q}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${TAG_COLOR[q.tag]}`}>
                                {TAG_LABEL[q.tag]}
                              </span>
                              <span className="text-xs text-stone-400">+{q.points ?? 0}</span>
                            </div>
                          </div>
                          <p className="text-xs text-stone-500 bg-stone-50 rounded px-2 py-1">{q.a}</p>
                          {q.explanation && (
                            <p className="text-xs text-stone-400 italic mt-1">{q.explanation}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Missed essentials */}
                  {(() => {
                    const missed = (c.historyQuestions ?? [])
                      .map((q, idx) => ({ q, idx }))
                      .filter(({ q, idx }) => q.tag === "essential" && !selectedQuestions.includes(idx))
                    return missed.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-red-600 mb-1.5">Qaçırılmış vacib suallar</p>
                        <div className="flex flex-col gap-1">
                          {missed.map(({ q, idx }) => (
                            <div key={idx} className="bg-red-50 border border-red-100 rounded-lg px-2 py-1.5">
                              <p className="text-xs text-red-700">{q.q}</p>
                              {q.explanation && <p className="text-xs text-red-500 italic mt-0.5">{q.explanation}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-600 mt-2">Bütün vacib suallar əhatə olunub ✓</p>
                    )
                  })()}
                </div>
              )}

              {/* Examinations breakdown */}
              {selectedExams.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Müayinə nəticəsi</p>
                  <div className="flex flex-col gap-1">
                    {selectedExams.map(idx => {
                      const ex = c.examinations[idx]
                      return (
                        <div key={idx} className="flex justify-between items-start gap-2 text-xs px-2 py-1.5 bg-stone-50 rounded-lg">
                          <span className="text-stone-700 flex-1">{ex.finding}</span>
                          <span className={`font-medium shrink-0 ${ex.relevant ? "text-emerald-600" : "text-stone-400"}`}>
                            {ex.relevant ? "+8 xal" : "0 xal"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Investigations breakdown */}
              {selectedTests.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Analizlər nəticəsi</p>
                  <div className="flex flex-col gap-2">
                    {selectedTests.map(idx => {
                      const inv = c.investigations[idx]
                      const pts = inv.tag === "essential" ? 10 : inv.tag === "relevant" ? 5 : -5
                      return (
                        <div key={idx} className="border border-stone-100 rounded-lg p-2">
                          <div className="flex justify-between items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-stone-700 flex-1">{inv.test}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${TAG_COLOR[inv.tag]}`}>
                                {TAG_LABEL[inv.tag]}
                              </span>
                              <span className={`text-xs font-medium ${pts > 0 ? "text-emerald-600" : pts < 0 ? "text-red-600" : "text-stone-400"}`}>
                                {pts > 0 ? `+${pts}` : pts}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-stone-500 bg-stone-50 rounded px-2 py-1">{inv.result}</p>
                          {inv.explanation && (
                            <p className="text-xs text-stone-400 italic mt-1">{inv.explanation}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Diagnosis explanation */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Diaqnostik əsaslar</p>
                <div className="flex flex-col gap-1">
                  {c.explanationPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Treatment breakdown */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Müalicə nəticəsi</p>
                {c.treatmentOptions?.length > 0 && selectedTreatments.length > 0 && (
                  <div className="flex flex-col gap-1 mb-4">
                    {c.treatmentOptions.map((opt, idx) => {
                      const sel = selectedTreatments.includes(idx)
                      if (!sel && !opt.correct) return null
                      const icon = opt.correct && sel ? "✓" : opt.correct && !sel ? "○" : "✗"
                      const color = opt.correct && sel ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                        : opt.correct && !sel ? "text-stone-500 bg-stone-50 border-stone-100"
                        : "text-red-600 bg-red-50 border-red-100"
                      const pts = sel ? (opt.correct ? "+5" : "-3") : null
                      return (
                        <div key={idx} className={`flex justify-between items-start gap-2 text-xs px-2 py-1.5 rounded-lg border ${color}`}>
                          <span className="flex-1">{icon} {opt.text}</span>
                          {pts && <span className="font-medium shrink-0">{pts}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Müalicə protokolu</p>
                <div className="flex flex-col gap-1">
                  {c.treatmentPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <span className="text-indigo-400 mt-0.5">→</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={resetAll}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-colors">
                Başqa xəstə seç →
              </button>
            </div>
          )
        })()}

        {/* Shared next-step button (steps 0, 1, 2, 4) */}
        {currentStep < 5 && currentStep !== 3 && (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={currentStep === 0 && selectedQuestions.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-3 rounded-xl text-sm transition-colors">
            Növbəti mərhələ →
          </button>
        )}

      </div>
    </div>
  )
}
