import { useState, useRef, useEffect } from "react"
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
    correctDiagnosis: row.correct_diagnosis,
    diagnosisKeywords: row.diagnosis_keywords,
    explanationPoints: row.explanation_points,
    treatmentPoints: row.treatment_points,
  }
}

function norm(s) {
  return s.toLowerCase().replace(/[\s/() -]/g, "")
}

const ALIASES = [
  ["alt", "altast"],
  ["ast", "altast"],
  ["altast", "altast"],
  ["ferment", "ferment"],
  ["qaraciyərferment", "ferment"],
  ["hbsag", "hbsag"],
  ["antihbc", "antihbc"],
  ["hbc", "antihbc"],
  ["antihbs", "antihbs"],
  ["hbs", "antihbs"],
  ["bilirubin", "bilirubin"],
  ["antihiv", "antihiv"],
  ["hiv", "antihiv"],
  ["cd4", "cd4"],
  ["rentgen", "rentgen"],
  ["cxr", "rentgen"],
  ["döşrentgen", "döşqəfəsi"],
  ["tamqan", "tamqan"],
  ["qananalizi", "tamqan"],
  ["klinikalıqan", "tamqan"],
  ["leishmania", "leishmania"],
  ["leişmania", "leishmania"],
  ["rk39", "rk39"],
  ["giemsa", "giemsa"],
  ["yarasürtüntüsü", "sürtüntü"],
  ["qanmədəniyyəti", "mədəniyyəti"],
  ["hemokültur", "mədəniyyəti"],
  ["widal", "widal"],
  ["qarınrentgen", "qarınrentgeni"],
  ["botulinum", "botulinum"],
  ["emg", "emg"],
  ["elektromiaqrafiya", "emg"],
  ["spirometriya", "spirometriya"],
  ["tənəffüs", "spirometriya"],
  ["kt", "ktbeyin"],
  ["ktbeyin", "ktbeyin"],
  ["lumbal", "lumbal"],
  ["lp", "lumbal"],
  ["antihcv", "antihcv"],
  ["hepatitc", "antihcv"],
  ["göbələk", "göbələk"],
  ["tst", "tst"],
  ["tuberkulin", "tst"],
  ["sidik", "sidik"],
]

const FALLBACK_RESPONSES = [
  "Düzünü desəm, nə demək istədiyinizi tam başa düşmədim...",
  "Bağışlayın, bu barədə nə cavab verəcəyimi bilmirəm.",
  "Yəni... necə izah edim? Başqa cür soruşa bilərsinizmi?",
  "Həkimə bu sualı vermək ağlıma gəlməmişdi, bilmirəm ki...",
]

const STEPS = ["Anamnez", "Müayinə", "Analizlər", "Diaqnoz", "Müalicə", "Nəticə"]
const MAX_QUESTIONS = 5

function askPatient(question, historyQuestions) {
  const normalize = (text) =>
    text.toLowerCase().replace(/[?!.,;:()'"-]/g, "").split(/\s+/).filter(w => w.length > 2)

  const studentWords = new Set(normalize(question))

  let bestScore = 0
  let bestIndex = -1

  historyQuestions.forEach((hq, i) => {
    const hqWords = new Set(normalize(hq.q))
    const intersection = [...studentWords].filter(w => hqWords.has(w)).length
    const union = new Set([...studentWords, ...hqWords]).size
    const score = union > 0 ? intersection / union : 0
    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  })

  if (bestScore >= 0.12 && bestIndex >= 0) {
    return historyQuestions[bestIndex].a
  }
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
}

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
        if (err) {
          console.error('Failed to load cases:', err)
          setError(err.message)
        } else {
          setCases(data.map(mapCase))
        }
        setLoading(false)
      })
  }, [session])

  const [selectedCase, setSelectedCase] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)

  const [conversation, setConversation] = useState([])
  const [questionInput, setQuestionInput] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const [questionsUsed, setQuestionsUsed] = useState(0)
  const [anamnesisComplete, setAnamnesisComplete] = useState(false)
  const chatEndRef = useRef(null)

  const [examined, setExamined] = useState([])
  const [orderedTests, setOrderedTests] = useState([])
  const [testInput, setTestInput] = useState("")
  const [testFeedback, setTestFeedback] = useState(null)
  const [diagnosis, setDiagnosis] = useState("")
  const [treatment, setTreatment] = useState("")
  const [score, setScore] = useState(0)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation, isAsking])

  async function handleAskQuestion() {
  if (!questionInput.trim() || isAsking || questionsUsed >= MAX_QUESTIONS) return

  const question = questionInput.trim()
  setQuestionInput("")
  setIsAsking(true)

  // Show clean question in UI, send enhanced prompt to API
  const displayMessage = { role: "user", content: question }
  const apiMessage = { role: "user", content: `[Xəstə kimi cavab ver, Azərbaycan dilində, qısa və təbii. Tibbi termin işlətmə.] ${question}` }

  // For display
  setConversation(prev => [...prev, displayMessage])
  setQuestionsUsed(q => q + 1)

  // For API: use clean history + enhanced current question
  const cleanHistory = conversation.filter(m =>
  m.role === "assistant" ? !m.content.includes("Bağışlayın") : true
)
  const apiConversation = [...cleanHistory, apiMessage]

  console.log("Sending to Gemini:", JSON.stringify(apiConversation))  // ADD THIS LINE

  try {
    const answer = askPatient(question, selectedCase.historyQuestions)
    const matched = selectedCase.historyQuestions.some(hq =>
      question.toLowerCase().includes(hq.q.toLowerCase().slice(0, 8)) ||
      hq.q.toLowerCase().includes(question.toLowerCase().slice(0, 8))
    )
    if (matched) setScore(s => s + 5)
    setConversation(prev => [...prev, { role: "assistant", content: answer }])
  } catch {
  // don't pollute conversation history with error messages
}

  setIsAsking(false)

  if (questionsUsed + 1 >= MAX_QUESTIONS) {
    setAnamnesisComplete(true)
  }
}

  function toggle(list, setList, index, points = 0) {
    if (!list.includes(index)) {
      setList([...list, index])
      setScore(s => s + points)
    }
  }

  function submitTest() {
    if (!testInput.trim()) return
    const c = selectedCase
    const inputNorm = norm(testInput)
    const aliasEntry = ALIASES.find(([key]) => inputNorm.includes(key) || key.includes(inputNorm))
    const fragment = aliasEntry ? aliasEntry[1] : inputNorm
    const match = c.investigations.findIndex(inv => norm(inv.test).includes(fragment))

    if (match !== -1 && !orderedTests.includes(match)) {
      const inv = c.investigations[match]
      setOrderedTests(prev => [...prev, match])
      setTestFeedback({ type: inv.relevant ? "good" : "warning", test: inv.test, result: inv.result, message: inv.relevant ? "Düzgün seçim" : "Bu test lazımsızdır — xərci artırır", points: inv.relevant ? 10 : -5 })
      setScore(s => s + (inv.relevant ? 10 : -5))
    } else if (match !== -1 && orderedTests.includes(match)) {
      setTestFeedback({ type: "info", test: testInput, result: "", message: "Bu test artıq sifariş edilib", points: 0 })
    } else {
      setTestFeedback({ type: "error", test: testInput, result: "", message: "Tapılmadı. Fərqli yazın (məs: ALT, HBsAg, Widal...)", points: 0 })
    }
    setTestInput("")
  }

  function submitTestDirect(value) {
    const c = selectedCase
    const clean = (s) => s.toLowerCase()
      .replace(/ı/g, "i").replace(/ə/g, "e").replace(/ö/g, "o")
      .replace(/ü/g, "u").replace(/ğ/g, "g").replace(/ş/g, "s")
      .replace(/ç/g, "c").replace(/İ/g, "i").replace(/[^a-z0-9]/g, "")
    const input = clean(value)
    const match = c.investigations.findIndex(inv => {
      const t = clean(inv.test)
      return t.includes(input) || input.includes(t)
    })
    if (match !== -1 && !orderedTests.includes(match)) {
      const inv = c.investigations[match]
      setOrderedTests(prev => [...prev, match])
      setTestFeedback({ type: inv.relevant ? "good" : "warning", test: inv.test, result: inv.result, message: inv.relevant ? "Düzgün seçim" : "Bu test lazımsızdır — xərci artırır", points: inv.relevant ? 10 : -5 })
      setScore(s => s + (inv.relevant ? 10 : -5))
    } else if (match !== -1) {
      setTestFeedback({ type: "info", test: value, result: "", message: "Bu test artıq sifariş edilib", points: 0 })
    } else {
      setTestFeedback({ type: "error", test: value, result: "", message: "Tapılmadı", points: 0 })
    }
  }

  function checkDiagnosis() {
    const input = diagnosis.toLowerCase()
    const correct = selectedCase.diagnosisKeywords.some(k => input.includes(k))
    setScore(s => s + (correct ? 20 : 0))
    setCurrentStep(4)
  }

  function resetAll() {
    setSelectedCase(null)
    setCurrentStep(0)
    setConversation([])
    setQuestionInput("")
    setIsAsking(false)
    setQuestionsUsed(0)
    setAnamnesisComplete(false)
    setExamined([])
    setOrderedTests([])
    setTestInput("")
    setTestFeedback(null)
    setDiagnosis("")
    setTreatment("")
    setScore(0)
  }

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
  const questionsLeft = MAX_QUESTIONS - questionsUsed

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <div className="max-w-xl mx-auto">

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

        <div className="flex rounded-lg overflow-hidden border border-stone-200 mb-4">
          {STEPS.map((step, i) => (
            <div key={step} className={`flex-1 py-2 text-center text-xs font-medium border-r border-stone-200 last:border-r-0
              ${i === currentStep ? "bg-indigo-100 text-indigo-700" :
                i < currentStep ? "bg-emerald-50 text-emerald-700" : "bg-white text-stone-400"}`}>
              {step}
            </div>
          ))}
        </div>

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

        {currentStep === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Xəstəyə sual verin</p>
              <span className={`text-xs font-medium px-2 py-1 rounded-full
                ${questionsLeft > 2 ? "bg-emerald-100 text-emerald-700" :
                  questionsLeft > 0 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"}`}>
                {questionsLeft > 0 ? `${questionsLeft} sual qaldı` : "Suallar bitdi"}
              </span>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 mb-3 min-h-32 max-h-72 overflow-y-auto flex flex-col gap-3">
              {conversation.length === 0 && (
                <p className="text-xs text-stone-400 text-center mt-4">
                  Xəstəyə istədiyiniz sualı yazın. Məsələn: "Şikayətləriniz nə vaxtdan başlayıb?"
                </p>
              )}
              {conversation.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-xl text-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border border-stone-200 text-stone-800 rounded-bl-sm"}`}>
                    {msg.role === "assistant" && (
                      <p className="text-xs font-medium text-stone-400 mb-1">Xəstə</p>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 rounded-xl rounded-bl-sm px-3 py-2">
                    <p className="text-xs font-medium text-stone-400 mb-1">Xəstə</p>
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}/>
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}/>
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}/>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {!anamnesisComplete && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                  placeholder="Sualınızı yazın..."
                  disabled={isAsking || questionsLeft === 0}
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:bg-stone-50 disabled:text-stone-400"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={isAsking || !questionInput.trim() || questionsLeft === 0}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-stone-300 transition-colors">
                  Soruş
                </button>
              </div>
            )}

            {anamnesisComplete && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-medium text-amber-700 mb-2">📋 Anamnez tamamlandı — topladığınız məlumat:</p>
                <div className="flex flex-col gap-1">
                  {conversation
                    .filter(m => m.role === "user")
                    .map((m, i) => (
                      <p key={i} className="text-xs text-stone-600">• {m.content}</p>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Hansı sistemi müayinə etmək istərsiniz?</p>
            <div className="flex flex-col gap-2">
              {c.examinations.map((item, i) => (
                <div key={i}>
                  <button onClick={() => toggle(examined, setExamined, i, 8)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors
                      ${examined.includes(i) ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"}`}>
                    {item.system}
                  </button>
                  {examined.includes(i) && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mt-1 border border-emerald-200">
                      {item.finding}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">Analiz sifariş edin</p>
            <p className="text-xs text-stone-400 mb-3">Analiz adını yazın və göndərin. Lazımsız testlər xal azaldır.</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {["Tam qan", "ALT", "HBsAg", "Anti-HIV", "CD4", "Widal", "Qan mədəniyyəti", "Rentgen", "Bilirubin", "Leishmania", "Botulinum", "EMG"].map(hint => (
                <button key={hint} onClick={() => submitTestDirect(hint)}
                  className="text-xs bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 text-stone-500 px-2 py-1 rounded border border-stone-200 transition-colors">
                  {hint}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitTest()}
                placeholder="məs: ALT, HBsAg, Widal..."
                className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <button onClick={submitTest}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Sifariş et
              </button>
            </div>
            {testFeedback && (
              <div className={`rounded-lg px-3 py-2 mb-3 border text-sm
                ${testFeedback.type === "good" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                  testFeedback.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
                  testFeedback.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
                  "bg-stone-50 border-stone-200 text-stone-700"}`}>
                <p className="font-medium">{testFeedback.message} {testFeedback.points !== 0 && `(${testFeedback.points > 0 ? "+" : ""}${testFeedback.points} xal)`}</p>
                {testFeedback.result && <p className="mt-1">{testFeedback.result}</p>}
              </div>
            )}
            {orderedTests.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Sifariş edilmiş testlər</p>
                <div className="flex flex-col gap-1">
                  {orderedTests.map((idx) => (
                    <div key={idx} className={`text-xs px-2 py-1 rounded flex justify-between
                      ${c.investigations[idx].relevant ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      <span>{c.investigations[idx].test}</span>
                      <span>{c.investigations[idx].relevant ? "✓" : "⚠ lazımsız"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Diaqnozunuzu daxil edin</p>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Əsas diaqnoz..."
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 mb-4 outline-none focus:border-indigo-400"
            />
            <button
              onClick={checkDiagnosis}
              disabled={!diagnosis.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-2 rounded-xl text-sm transition-colors">
              Diaqnozu təsdiqlə
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Müalicə planınızı daxil edin</p>
            <textarea
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="Müalicə, dərmanlar, göndərişlər..."
              rows={5}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-indigo-400 resize-none"
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="mb-3">
            <div className={`rounded-xl p-4 mb-3 border ${
              selectedCase.diagnosisKeywords.some(k => diagnosis.toLowerCase().includes(k))
                ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1 text-stone-500">Yekun xal</p>
              <p className="text-3xl font-medium text-stone-800 mb-1">{score} xal</p>
              <p className="text-sm text-stone-600">Düzgün diaqnoz: <span className="font-medium text-indigo-700">{c.correctDiagnosis}</span></p>
              <p className="text-sm text-stone-600 mt-1">Sizin cavab: <span className="font-medium">{diagnosis || "Daxil edilməyib"}</span></p>
            </div>
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
            <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Müalicə protokolu</p>
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
        )}

        {currentStep < 5 && currentStep !== 3 && (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={currentStep === 0 && !anamnesisComplete && questionsUsed === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-3 rounded-xl text-sm transition-colors">
            Növbəti mərhələ →
          </button>
        )}

      </div>
    </div>
  )
}
