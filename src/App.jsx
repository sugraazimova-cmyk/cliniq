import { useState, useEffect } from "react"
import { MessageSquare, Star, Home } from "lucide-react"
import { supabase } from './supabase.js'
import LandingPage from './LandingPage.jsx'
import ProfileDrawer from './ProfileDrawer.jsx'
import FeaturesPage from './FeaturesPage.jsx'
import CasesPage from './CasesPage.jsx'
import FlashcardsPage from './FlashcardsPage.jsx'
import AdminPage from './AdminPage.jsx'
import FeedbackModal from './FeedbackModal.jsx'

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

// Percentage-based positions on the character image (left%, top%)
const BODY_REGION_MAP = {
  "Baş/Beyin":       { x: 50, y: 8  },
  "Ağız boşluğu":    { x: 50, y: 14 },
  "Boyun":           { x: 50, y: 19 },
  "Limfa düyünləri": { x: 63, y: 23 },
  "Ağciyərlər":      { x: 37, y: 36 },
  "Ürək":            { x: 37, y: 40 },
  "Qarın boşluğu":   { x: 50, y: 52 },
  "Qaraciyər":       { x: 60, y: 48 },
  "Dalaq":           { x: 40, y: 48 },
  "Dəri":            { x: 75, y: 38 },
  "Sol çiyin":       { x: 22, y: 28 },
  "Sağ çiyin":       { x: 78, y: 28 },
  "Sol diz":         { x: 37, y: 78 },
  "Sağ diz":         { x: 63, y: 78 },
  "default":         { x: 50, y: 52 },
}

function getCharacterImage(c) {
  const tags = c.tags.join(" ").toLowerCase()
  if (tags.includes("uşaq") || tags.includes("körpə") || tags.includes("child")) {
    return "/characters/patient.child.jpg"
  }
  if (tags.includes("qadın") || tags.includes("female")) {
    return "/characters/patient.adult.female.png"
  }
  return "/characters/patient.adult.male.png"
}

const STEPS = ["Anamnez", "Müayinə", "Analizlər", "Diaqnoz", "Müalicə", "Nəticə"]

export default function App() {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    const stored = localStorage.getItem('sb-remember')
    if (stored) {
      try {
        const { access_token, refresh_token } = JSON.parse(stored)
        supabase.auth.setSession({ access_token, refresh_token })
          .catch(() => localStorage.removeItem('sb-remember'))
      } catch {
        localStorage.removeItem('sb-remember')
      }
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (_event === 'SIGNED_OUT') localStorage.removeItem('sb-remember')
      setSession(s)
    })
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
  const [differentialScore, setDifferentialScore] = useState(0)
  const [differentialFeedback, setDifferentialFeedback] = useState(null)
  const [showDiffLegend, setShowDiffLegend] = useState(false)
  const [diagnosisStage, setDiagnosisStage] = useState("differential")
  const [diagnosis, setDiagnosis] = useState("")
  const [diagnosisResult, setDiagnosisResult] = useState(null)

  // Treatment
  const [selectedTreatments, setSelectedTreatments] = useState([])
  const [treatment, setTreatment] = useState("")

  const [score, setScore] = useState(0)

  const [page, setPage] = useState("features")

  const isAdmin = session?.user?.email === import.meta.env.VITE_ADMIN_EMAIL

  const [showProfile, setShowProfile] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState(null)
  const [feedbackStepIndex, setFeedbackStepIndex] = useState(null)

  function openStepFeedback(stepIdx) {
    setFeedbackType('content_error')
    setFeedbackStepIndex(stepIdx)
    setShowFeedback(true)
  }
  const [inlineRating, setInlineRating] = useState(0)
  const [inlineHovered, setInlineHovered] = useState(0)
  const [inlineComment, setInlineComment] = useState('')
  const [inlineSubmitted, setInlineSubmitted] = useState(false)
  const [inlineSubmitting, setInlineSubmitting] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())

  // Load bookmarks once session is ready
  useEffect(() => {
    if (!session) return
    supabase.from('bookmarks').select('case_id').then(({ data }) => {
      if (data) setBookmarkedIds(new Set(data.map(r => String(r.case_id))))
    })
  }, [session])

  // Save attempt when Results step is reached
  useEffect(() => {
    if (currentStep !== 5 || !selectedCase || !session) return
    const c = selectedCase
    supabase.from('case_attempts').insert({
      user_id: session.user.id,
      case_id: c.id,
      case_title: c.title ?? `Hal ${c.id}`,
      score: score,
    }).then(() => {})
  }, [currentStep]) // eslint-disable-line

  function toggleQuestion(idx) {
    if (selectedQuestions.includes(idx)) return
    if (selectedQuestions.length >= MAX_ANAMNESIS_PICKS) return
    setSelectedQuestions(prev => [...prev, idx])
    setScore(s => s + (selectedCase.historyQuestions[idx].points ?? 0))
  }

  function toggleExam(idx) {
    if (selectedExams.includes(idx)) return
    setSelectedExams(prev => [...prev, idx])
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
    if (differentialPicks.includes(idx)) return
    if (differentialPicks.length >= MAX_DIFFERENTIAL_PICKS) return
    setDifferentialPicks(prev => [...prev, idx])
    const isCorrect = selectedCase.differentialDiagnosis[idx]?.correct === true
    const delta = isCorrect ? 5 : -3
    setScore(s => Math.max(0, s + delta))
    setDifferentialScore(s => s + delta)
    if (isCorrect) {
      const explanation = selectedCase.differentialDiagnosis[idx]?.explanation ?? ""
      const firstSentence = (explanation.split(".")[0] ?? "").trim() + "."
      setDifferentialFeedback({ type: "correct", text: firstSentence, index: idx })
    } else {
      setDifferentialFeedback({ type: "wrong", text: "Bu diferensial bu xəstənin klinik mənzərəsi ilə tam uyğun gəlmir", index: idx })
    }
  }

  function normalizeDx(s) {
    return s.toLowerCase()
      .replace(/i̇/g, 'i').replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/I/g, 'i')
      .replace(/[()]/g, '').replace(/\s+/g, ' ').trim()
  }

  function checkDiagnosis(label) {
    if (!label) return
    setDiagnosis(label)
    const normStudent = normalizeDx(label)
    const normCorrect = normalizeDx(selectedCase.correctDiagnosis)
    const keywords = (selectedCase.diagnosisKeywords ?? []).map(normalizeDx)
    const correct =
      normStudent === normCorrect ||
      normCorrect.includes(normStudent) ||
      normStudent.includes(normCorrect) ||
      keywords.some(k => k && (normStudent.includes(k) || k.includes(normStudent)))
    setDiagnosisResult(correct)
    if (correct) setScore(s => s + 20)
  }

  function toggleTreatment(idx) {
    if (selectedTreatments.includes(idx)) return
    setSelectedTreatments(prev => [...prev, idx])
    const opts = selectedCase.treatmentOptions
    const correctCount = opts.filter(o => o.correct).length
    const pointsEach = correctCount > 0 ? Math.round(20 / correctCount) : 0
    if (opts[idx].correct) setScore(s => Math.max(0, s + pointsEach))
  }

  function submitTreatment() {
    setCurrentStep(5)
  }

  function resetAll() {
    setSelectedCase(null)
    setCurrentStep(0)
    setPage("features")
    setSelectedQuestions([])
    setSelectedExams([])
    setSelectedTests([])
    setDifferentialPicks([])
    setDifferentialScore(0)
    setDifferentialFeedback(null)
    setDiagnosisStage("differential")
    setDiagnosis("")
    setDiagnosisResult(null)
    setSelectedTreatments([])
    setTreatment("")
    setScore(0)
    setInlineRating(0)
    setInlineHovered(0)
    setInlineComment('')
    setInlineSubmitted(false)
    setInlineSubmitting(false)
  }

  // ── Auth / loading gates ────────────────────────────────────────────────

  if (session === undefined) return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <p className="text-stone-400 text-sm">Yüklənir...</p>
    </div>
  )

  if (!session) return <LandingPage />

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

  // ── Admin page ───────────────────────────────────────────────────────────

  if (page === "admin" && isAdmin) {
    return <AdminPage session={session} onBack={() => setPage("features")} />
  }

  // ── Flashcards page ─────────────────────────────────────────────────────

  if (page === "flashcards") {
    return <FlashcardsPage onBack={() => setPage("features")} />
  }

  // ── Features page ───────────────────────────────────────────────────────

  if (!selectedCase && page === "features") {
    return (
      <>
        <FeaturesPage
          session={session}
          onEnterCases={() => setPage("cases")}
          onEnterFlashcards={() => setPage("flashcards")}
          onEnterAdmin={isAdmin ? () => setPage("admin") : null}
          setShowProfile={setShowProfile}
        />
        <ProfileDrawer
          open={showProfile}
          onClose={() => setShowProfile(false)}
          session={session}
          cases={cases}
          bookmarkedIds={bookmarkedIds}
          setBookmarkedIds={setBookmarkedIds}
          onSelectCase={(id) => { setSelectedCase(cases.find(x => String(x.id) === String(id)) ?? null); setPage("cases"); setShowProfile(false) }}
        />
      </>
    )
  }

  // ── Case list ───────────────────────────────────────────────────────────

  if (!selectedCase) {
    return (
      <>
        <CasesPage
          session={session}
          cases={cases}
          bookmarkedIds={bookmarkedIds}
          setBookmarkedIds={setBookmarkedIds}
          onSelectCase={(c) => setSelectedCase(c)}
          onBack={() => setPage("features")}
          setShowProfile={setShowProfile}
        />
        <ProfileDrawer
          open={showProfile}
          onClose={() => setShowProfile(false)}
          session={session}
          cases={cases}
          bookmarkedIds={bookmarkedIds}
          setBookmarkedIds={setBookmarkedIds}
          onSelectCase={(id) => { setSelectedCase(cases.find(x => String(x.id) === String(id)) ?? null); setShowProfile(false) }}
        />
      </>
    )
  }

  const c = selectedCase

  // ── Case flow ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { resetAll(); setPage("features") }}
              className="text-stone-400 hover:text-indigo-600 transition-colors"
              title="Ana səhifə"
            >
              <Home size={18} />
            </button>
            <img src="/logo.png" alt="ClinIQ" style={{ height: '120px', width: 'auto', mixBlendMode: 'multiply' }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
              {score} xal
            </span>
            <button
              onClick={() => setShowProfile(true)}
              className="text-xs text-stone-400 hover:text-indigo-600 transition-colors">
              {session.user.user_metadata.full_name?.split(' ')[0] ?? session.user.email}
            </button>
            <button
              onClick={() => { resetAll(); setPage("cases") }}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors">
              ← Xəstə seç
            </button>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex rounded-lg overflow-hidden border border-stone-200 mb-4">
          {STEPS.map((step, i) => (
            <div
              key={step}
              onClick={() => i < currentStep && setCurrentStep(i)}
              className={`flex-1 py-2 text-center text-xs font-medium border-r border-stone-200 last:border-r-0 transition-colors
                ${i === currentStep ? "bg-indigo-100 text-indigo-700" :
                  i < currentStep ? "bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100" :
                  "bg-white text-stone-400"}`}>
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
            <div className="flex gap-3">
              {/* Patient image with alert dots */}
              <div className="shrink-0 w-32 relative" style={{aspectRatio: "4/7"}}>
                <img
                  src={getCharacterImage(c)}
                  alt="Xəstə"
                  className="w-full select-none breathe"
                  draggable={false}
                />
                {c.examinations.map((item, i) => {
                  const pos = BODY_REGION_MAP[item.system] ?? BODY_REGION_MAP.default
                  const selected = selectedExams.includes(i)
                  return (
                    <button
                      key={i}
                      onClick={() => toggleExam(i)}
                      disabled={selected}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
                      className="absolute w-5 h-5 flex items-center justify-center">
                      {!selected ? (
                        <span className="relative flex h-4 w-4">
                          <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/>
                          <span className="pulse-dot-2 absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/>
                          <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500"/>
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {/* Findings feed */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-64">
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
                    const fb = differentialFeedback?.index === idx ? differentialFeedback : null
                    return (
                      <div key={idx}>
                        <button
                          onClick={() => toggleDifferential(idx)}
                          disabled={capped || picked}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors
                            ${picked ? "bg-indigo-50 border-indigo-200 text-indigo-900 cursor-default" :
                              capped ? "bg-stone-50 border-stone-200 text-stone-400 opacity-50 cursor-not-allowed" :
                              "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"}`}>
                          <div className="flex justify-between items-center">
                            <span>{item.diagnosis}</span>
                            {picked && <span className="text-indigo-500 text-sm">✓</span>}
                          </div>
                        </button>
                        {fb && (
                          <div className={`mt-1 px-3 py-2 rounded-lg border text-xs
                            ${fb.type === "correct"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-red-50 border-red-200 text-red-700"}`}>
                            {fb.text}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => { setDiagnosisStage("final"); setDifferentialFeedback(null) }}
                  disabled={differentialPicks.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-2 rounded-xl text-sm transition-colors">
                  Diaqnozu müəyyənləşdir →
                </button>
              </>
            )}

            {/* Stage 2: Final diagnosis */}
            {(diagnosisStage === "final" || !c.differentialDiagnosis?.length) && (
              <>
                {/* Differential picks — clickable to auto-submit as final diagnosis */}
                {differentialPicks.length > 0 && diagnosisResult === null && (
                  <div className="mb-4">
                    <p className="text-xs text-stone-400 mb-2">Seçdiyiniz variantdan birini əsas diaqnoz kimi seçin:</p>
                    <div className="flex flex-wrap gap-2">
                      {differentialPicks.map(idx => {
                        const label = c.differentialDiagnosis[idx].diagnosis
                        return (
                          <button
                            key={idx}
                            onClick={() => checkDiagnosis(label)}
                            className="px-3 py-1.5 rounded-full text-sm border transition-colors hover:bg-[#EEEFFD]"
                            style={{ borderColor: "#EEEFFD", background: "#FAFAFD", color: "#5B65DC" }}>
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    <div className="border-t border-stone-100 mt-3 mb-3" />
                  </div>
                )}

                {/* Static recap after result is shown */}
                {differentialPicks.length > 0 && diagnosisResult !== null && (
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
                <p className="text-xs text-stone-400 mb-2">Düzgün hesab etdiyiniz müalicə tədbirlərini seçin</p>
                {(() => {
                  const correctCount = c.treatmentOptions.filter(o => o.correct).length
                  const pointsEach = correctCount > 0 ? Math.round(20 / correctCount) : 0
                  const earned = selectedTreatments.filter(i => c.treatmentOptions[i].correct).length * pointsEach
                  return (
                    <p className="text-sm font-medium text-indigo-700 mb-3">Qazanılan xal: {earned} / 20</p>
                  )
                })()}
                <div className="flex flex-col gap-2">
                  {c.treatmentOptions.map((opt, idx) => {
                    const selected = selectedTreatments.includes(idx)
                    const correctCount = c.treatmentOptions.filter(o => o.correct).length
                    const pointsEach = correctCount > 0 ? Math.round(20 / correctCount) : 0
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleTreatment(idx)}
                        disabled={selected}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors
                          ${selected && opt.correct ? "bg-indigo-50 border-indigo-200 text-indigo-900 cursor-default"
                            : selected && !opt.correct ? "bg-red-50 border-red-300 text-red-800 cursor-default"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"}`}>
                        <div className="flex justify-between items-center gap-2">
                          <span className="flex-1">{opt.text.split(' — ')[0]}</span>
                          {selected && opt.correct && (
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">+{pointsEach} xal</span>
                          )}
                          {selected && !opt.correct && <span className="text-red-500 shrink-0">✗</span>}
                        </div>
                        {selected && !opt.correct && (
                          <p className="text-xs text-red-500 mt-1">Bu müalicə bu xəstə üçün uyğun deyil!</p>
                        )}
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
          const totalScore = score

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

              {/* Differential diagnosis analysis */}
              {c.differentialDiagnosis?.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3" onClick={() => setShowDiffLegend(false)}>
                  <div className="flex justify-between items-center mb-3 relative">
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Diferensial diaqnoz analizi</p>
                    <div className="relative">
                      <button
                        onClick={e => { e.stopPropagation(); setShowDiffLegend(v => !v) }}
                        className="text-xs text-stone-400 hover:text-stone-600 w-5 h-5 rounded-full border border-stone-200 flex items-center justify-center">
                        ⓘ
                      </button>
                      {showDiffLegend && (
                        <div className="absolute top-7 right-0 z-10 bg-white border border-stone-200 rounded-xl shadow-md p-3 w-48" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2 text-xs py-1"><span className="font-bold text-emerald-700">✓</span><span className="text-emerald-700">Düzgün seçdiniz</span></div>
                          <div className="flex items-center gap-2 text-xs py-1"><span className="font-bold text-red-600">✗</span><span className="text-red-600">Yanlış seçdiniz</span></div>
                          <div className="flex items-center gap-2 text-xs py-1"><span className="font-bold text-amber-700">⚠</span><span className="text-amber-700">Seçilməli idi</span></div>
                          <div className="flex items-center gap-2 text-xs py-1"><span className="font-bold text-stone-400">—</span><span className="text-stone-400">Düzgün atladınız</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {c.differentialDiagnosis.map((item, idx) => {
                      const selected = differentialPicks.includes(idx)
                      const isCorrect = item.correct === true
                      const isCorrectSelected   = isCorrect && selected
                      const isWrongSelected     = !isCorrect && selected
                      const isMissed            = isCorrect && !selected
                      const isCorrectlyIgnored  = !isCorrect && !selected
                      return (
                        <div key={idx} className={`flex items-start gap-2 text-xs px-2 py-1.5 rounded-lg
                          ${isCorrectlyIgnored ? "bg-stone-50" : isCorrectSelected ? "bg-emerald-50" : isMissed ? "bg-amber-50" : "bg-red-50"}`}>
                          {isCorrectlyIgnored ? (
                            <span className="font-bold shrink-0 mt-0.5 text-stone-300">—</span>
                          ) : isCorrectSelected ? (
                            <span className="font-bold shrink-0 mt-0.5 text-emerald-600">✓</span>
                          ) : isWrongSelected ? (
                            <span className="font-bold shrink-0 mt-0.5 text-red-500">✗</span>
                          ) : (
                            <span className="font-bold shrink-0 mt-0.5 text-amber-500">⚠</span>
                          )}
                          <div>
                            {isCorrectlyIgnored ? (
                              <p className="text-stone-300 text-sm">{item.diagnosis}</p>
                            ) : isMissed ? (
                              <p className="font-medium text-amber-800">
                                {item.diagnosis}
                                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Seçilməli idi</span>
                              </p>
                            ) : (
                              <p className={`font-medium ${isCorrectSelected ? "text-emerald-800" : "text-red-700"}`}>{item.diagnosis}</p>
                            )}
                            {item.explanation && !isCorrectlyIgnored && (
                              <p className={`text-xs mt-1 leading-snug ${isMissed ? "text-amber-700" : isCorrectSelected ? "text-emerald-700/70" : "text-red-600/70"}`}>
                                {item.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-stone-500 mt-3 pt-2 border-t border-stone-100">
                    Diferensial xallar: <span className={`font-medium ${differentialScore >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {differentialScore >= 0 ? `+${differentialScore}` : differentialScore}
                    </span>
                  </p>
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
                  {c.treatmentOptions.filter(o => o.correct).map((opt, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <span className="text-indigo-400 mt-0.5">→</span>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inline feedback card */}
              <div className="rounded-xl p-4 mb-3 border" style={{ background: '#EEEFFD', borderColor: 'rgba(91,101,220,0.3)' }}>
                {inlineSubmitted ? (
                  <p className="text-sm text-emerald-600 font-medium text-center">Rəyiniz üçün təşəkkür edirik ✓</p>
                ) : (
                  <>
                    <p className="text-xs text-stone-500 mb-3">Bu hal necə idi?</p>
                    <div className="flex gap-1.5 mb-3">
                      {[1,2,3,4,5].map(i => {
                        const active = inlineHovered || inlineRating
                        return (
                          <button
                            key={i}
                            onClick={() => setInlineRating(i)}
                            onMouseEnter={() => setInlineHovered(i)}
                            onMouseLeave={() => setInlineHovered(0)}
                            className="transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              size={24}
                              fill={i <= active ? '#F59E0B' : 'none'}
                              stroke={i <= active ? '#F59E0B' : '#9CA3AF'}
                              strokeWidth={1.5}
                            />
                          </button>
                        )
                      })}
                    </div>
                    <input
                      type="text"
                      value={inlineComment}
                      onChange={e => setInlineComment(e.target.value)}
                      placeholder="Şərhinizi yazın... (istəyə bağlı)"
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-700 outline-none mb-3"
                      style={{ borderColor: 'rgba(91,101,220,0.3)' }}
                    />
                    <button
                      disabled={!inlineRating || inlineSubmitting}
                      onClick={async () => {
                        if (!inlineRating) return
                        setInlineSubmitting(true)
                        await supabase.from('feedback').insert({
                          user_id: session.user.id,
                          rating: inlineRating,
                          comment: inlineComment.trim() || null,
                          page: 'case_result',
                          case_id: selectedCase?.id ?? null,
                        })
                        setInlineSubmitting(false)
                        setInlineSubmitted(true)
                      }}
                      className="w-full rounded-lg py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
                      style={{ background: '#5B65DC' }}
                    >
                      {inlineSubmitting ? '...' : 'Göndər'}
                    </button>
                  </>
                )}
              </div>

              <button onClick={() => { resetAll(); setPage("cases") }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-colors">
                Başqa xəstəyə keç →
              </button>
              <button onClick={resetAll}
                className="w-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 font-medium py-3 rounded-xl text-sm transition-colors mt-2">
                Ana səhifəyə qayıt
              </button>
            </div>
          )
        })()}

        {/* Shared next-step button (steps 0, 1, 2) */}
        {currentStep < 5 && currentStep !== 3 && currentStep !== 4 && (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={currentStep === 0 && selectedQuestions.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-3 rounded-xl text-sm transition-colors">
            Növbəti mərhələ →
          </button>
        )}

        {/* Step 4 submit button */}
        {currentStep === 4 && (
          <button onClick={submitTreatment}
            disabled={selectedTreatments.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-3 rounded-xl text-sm transition-colors">
            Müalicəni təsdiqlə →
          </button>
        )}

      </div>
      <ProfileDrawer
        open={showProfile}
        onClose={() => setShowProfile(false)}
        session={session}
        cases={cases}
        bookmarkedIds={bookmarkedIds}
        setBookmarkedIds={setBookmarkedIds}
        onSelectCase={(id) => { setSelectedCase(cases.find(x => String(x.id) === String(id)) ?? null); setPage('cases'); setShowProfile(false) }}
      />

      {/* Məzmuna düzəliş button — visible during case steps 0-4 */}
      {selectedCase && currentStep < 5 && (
        <button
          onClick={() => openStepFeedback(currentStep)}
          className="fixed bottom-24 right-6 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full shadow-md text-xs font-medium border transition-all hover:scale-105 active:scale-95 animate-pulse"
          style={{ background: 'white', borderColor: '#5B65DC', color: '#5B65DC', animationDuration: '2.5s' }}
        >
          ⚑ Məzmuna düzəliş
        </button>
      )}

      {/* Floating feedback button with animated label on features page */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        {page === 'features' && !selectedCase && (
          <motion.span
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="bg-white border rounded-full px-3 py-1.5 text-xs font-medium shadow-md whitespace-nowrap cursor-pointer"
            style={{ borderColor: '#5B65DC', color: '#5B65DC' }}
            onClick={() => setShowFeedback(true)}
          >
            Rəyini bizimlə bölüş!
          </motion.span>
        )}
        <button
          onClick={() => setShowFeedback(true)}
          className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ background: '#5B65DC' }}
          title="Rəy bildirin"
        >
          <MessageSquare size={20} color="white" />
        </button>
      </div>

      {showFeedback && (
        <FeedbackModal
          page={page}
          caseId={selectedCase?.id ?? null}
          session={session}
          initialType={feedbackType}
          stepIndex={feedbackStepIndex}
          onClose={() => { setShowFeedback(false); setFeedbackType(null); setFeedbackStepIndex(null) }}
        />
      )}
    </div>
  )
}
