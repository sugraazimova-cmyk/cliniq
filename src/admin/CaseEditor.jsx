import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, X, Save, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { EMPTY_CASE } from "./caseDefaults.js"

const SPECIALTIES = [
  'Kardiologiya', 'Nevrologiya', 'Pulmonologiya', 'Gastroenterologiya',
  'Endokrinologiya', 'Nefrologiya', 'Ortopediya', 'Pediatriya',
  'Cərrahiyyə', 'Ginekologiya', 'Psixiatriya', 'Dərmatologiya', 'Digər',
]
const DIFFICULTIES = ['Asan', 'Orta', 'Çətin']
const BODY_SYSTEMS = [
  'Baş/Beyin', 'Ağız boşluğu', 'Boyun', 'Limfa düyünləri',
  'Ağciyərlər', 'Ürək', 'Qarın boşluğu', 'Qaraciyər',
  'Dalaq', 'Dəri', 'Sol çiyin', 'Sağ çiyin', 'Sol diz', 'Sağ diz',
]
const STEPS = ['Əsas', 'Anamnez', 'Müayinə', 'Analizlər', 'Diaqnoz', 'Müalicə']

const TAG_COLOR = {
  essential:  'bg-red-100 text-red-700',
  relevant:   'bg-amber-100 text-amber-700',
  irrelevant: 'bg-stone-100 text-stone-500',
}
const DIFF_COLOR = {
  Asan:  'bg-green-100 text-green-700',
  Orta:  'bg-amber-100 text-amber-700',
  Çətin: 'bg-red-100 text-red-700',
}


// Reusable field components
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: '#475467' }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, className = '' }) {
  return (
    <input
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg border border-[#EEEFFD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30 ${className}`}
      style={{ color: '#122056' }}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg border border-[#EEEFFD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30 resize-none"
      style={{ color: '#122056' }}
    />
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-[#EEEFFD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30"
      style={{ color: '#122056' }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  )
}

function Toggle({ value, onChange, labels = ['Yanlış', 'Düzgün'] }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${value ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}
    >
      {value ? labels[1] : labels[0]}
    </button>
  )
}

function AddButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-dashed border-[#5B65DC] transition-colors hover:bg-[#EEEFFD]"
      style={{ color: '#5B65DC' }}
    >
      <Plus size={14} /> {label}
    </button>
  )
}

function RemoveBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 p-1 rounded text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
    >
      <X size={14} />
    </button>
  )
}

// ─── Step 0: Basic Info ────────────────────────────────────────────────────
function StepBasic({ draft, update }) {
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const t = tagInput.trim()
    if (!t || draft.tags?.includes(t)) return
    update('tags', [...(draft.tags ?? []), t])
    setTagInput('')
  }

  function addVital() {
    update('vitals', [...(draft.vitals ?? []), { label: '', value: '' }])
  }

  function updateVital(i, field, val) {
    update('vitals', draft.vitals.map((v, idx) => idx === i ? { ...v, [field]: val } : v))
  }

  return (
    <div className="space-y-5">
      <Field label="Başlıq">
        <Input value={draft.title} onChange={v => update('title', v)} placeholder="Case başlığı" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="İxtisas">
          <Select value={draft.specialty} onChange={v => update('specialty', v)} options={SPECIALTIES} />
        </Field>
        <Field label="Çətinlik">
          <Select value={draft.difficulty} onChange={v => update('difficulty', v)} options={DIFFICULTIES} />
        </Field>
      </div>

      <Field label="Xəstə xülasəsi">
        <Textarea value={draft.patient_summary} onChange={v => update('patient_summary', v)} placeholder="Bir cümlə ilə xəstənin vəziyyəti..." rows={2} />
      </Field>

      <Field label="Xəstə konteksti">
        <Textarea value={draft.patient_context} onChange={v => update('patient_context', v)} placeholder="Anamnez, fon xəstəlikləri..." rows={3} />
      </Field>

      <Field label="Teqlər">
        <div className="flex flex-wrap gap-2 mb-2">
          {(draft.tags ?? []).map((t, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[#EEEFFD]" style={{ color: '#5B65DC' }}>
              {t}
              <button type="button" onClick={() => update('tags', draft.tags.filter((_, j) => j !== i))} className="hover:opacity-70"><X size={11} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Teq əlavə et (Enter)"
            className="flex-1 px-3 py-2 rounded-lg border border-[#EEEFFD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30"
          />
          <button type="button" onClick={addTag} className="px-3 py-2 rounded-lg text-sm font-medium bg-[#5B65DC] text-white">Əlavə et</button>
        </div>
      </Field>

      <Field label="Vital göstəricilər">
        <div className="space-y-2">
          {(draft.vitals ?? []).map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input value={v.label} onChange={val => updateVital(i, 'label', val)} placeholder="Ad (Təzyiq)" className="w-1/3" />
              <Input value={v.value} onChange={val => updateVital(i, 'value', val)} placeholder="Dəyər (120/80)" />
              <RemoveBtn onClick={() => update('vitals', draft.vitals.filter((_, j) => j !== i))} />
            </div>
          ))}
          <AddButton onClick={addVital} label="Vital əlavə et" />
        </div>
      </Field>
    </div>
  )
}

// ─── Step 1: Anamnez ───────────────────────────────────────────────────────
function StepAnamnez({ draft, update }) {
  function addQ() {
    update('history_questions', [...(draft.history_questions ?? []), { q: '', a: '', tag: 'essential', points: 10 }])
  }
  function updateQ(i, field, val) {
    update('history_questions', draft.history_questions.map((q, idx) => idx === i ? { ...q, [field]: val } : q))
  }
  const questions = draft.history_questions ?? []

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="p-4 rounded-xl border border-[#EEEFFD] bg-white space-y-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-stone-400 mt-0.5">#{i + 1}</span>
            <RemoveBtn onClick={() => update('history_questions', questions.filter((_, j) => j !== i))} />
          </div>
          <Field label="Sual">
            <Input value={q.q} onChange={v => updateQ(i, 'q', v)} placeholder="Sual mətni..." />
          </Field>
          <Field label="Cavab">
            <Textarea value={q.a} onChange={v => updateQ(i, 'a', v)} placeholder="Cavab mətni..." rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Əhəmiyyət">
              <Select value={q.tag} onChange={v => updateQ(i, 'tag', v)} options={['essential', 'relevant', 'irrelevant']} />
            </Field>
            <Field label="Bal">
              <Input value={q.points} onChange={v => updateQ(i, 'points', Number(v))} placeholder="10" />
            </Field>
          </div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${TAG_COLOR[q.tag] ?? ''}`}>
            {q.tag}
          </span>
        </div>
      ))}
      <AddButton onClick={addQ} label="Sual əlavə et" />
    </div>
  )
}

// ─── Step 2: Müayinə ───────────────────────────────────────────────────────
function StepMuayine({ draft, update }) {
  function addEx() {
    update('examinations', [...(draft.examinations ?? []), { system: 'Ürək', finding: '', relevant: true }])
  }
  function updateEx(i, field, val) {
    update('examinations', draft.examinations.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }
  const exams = draft.examinations ?? []

  return (
    <div className="space-y-3">
      {exams.map((ex, i) => (
        <div key={i} className="p-4 rounded-xl border border-[#EEEFFD] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">#{i + 1}</span>
            <RemoveBtn onClick={() => update('examinations', exams.filter((_, j) => j !== i))} />
          </div>
          <Field label="Sistem">
            <Select value={ex.system} onChange={v => updateEx(i, 'system', v)} options={BODY_SYSTEMS} />
          </Field>
          <Field label="Tapıntı">
            <Textarea value={ex.finding} onChange={v => updateEx(i, 'finding', v)} placeholder="Fiziki müayinə tapıntısı..." rows={2} />
          </Field>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Əhəmiyyət:</span>
            <Toggle value={ex.relevant} onChange={v => updateEx(i, 'relevant', v)} labels={['Əhəmiyyətsiz', 'Əhəmiyyətli']} />
          </div>
        </div>
      ))}
      <AddButton onClick={addEx} label="Tapıntı əlavə et" />
    </div>
  )
}

// ─── Step 3: Analizlər ─────────────────────────────────────────────────────
function StepAnalizler({ draft, update }) {
  function addInv() {
    update('investigations', [...(draft.investigations ?? []), { test: '', result: '', cost: 1, tag: 'essential' }])
  }
  function updateInv(i, field, val) {
    update('investigations', draft.investigations.map((inv, idx) => idx === i ? { ...inv, [field]: val } : inv))
  }
  const invs = draft.investigations ?? []

  return (
    <div className="space-y-3">
      {invs.map((inv, i) => (
        <div key={i} className="p-4 rounded-xl border border-[#EEEFFD] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">#{i + 1}</span>
            <RemoveBtn onClick={() => update('investigations', invs.filter((_, j) => j !== i))} />
          </div>
          <Field label="Test adı">
            <Input value={inv.test} onChange={v => updateInv(i, 'test', v)} placeholder="Test adı..." />
          </Field>
          <Field label="Nəticə">
            <Textarea value={inv.result} onChange={v => updateInv(i, 'result', v)} placeholder="Test nəticəsi..." rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qiymət">
              <Select value={String(inv.cost)} onChange={v => updateInv(i, 'cost', Number(v))} options={[{value:'1',label:'₼ Ucuz'},{value:'2',label:'₼₼ Orta'},{value:'3',label:'₼₼₼ Baha'}]} />
            </Field>
            <Field label="Əhəmiyyət">
              <Select value={inv.tag} onChange={v => updateInv(i, 'tag', v)} options={['essential', 'relevant', 'irrelevant']} />
            </Field>
          </div>
        </div>
      ))}
      <AddButton onClick={addInv} label="Test əlavə et" />
    </div>
  )
}

// ─── Step 4: Diaqnoz ───────────────────────────────────────────────────────
function StepDiaqnoz({ draft, update }) {
  const [kwInput, setKwInput] = useState('')
  const [epInput, setEpInput] = useState('')

  function addDiff() {
    update('differential_diagnosis', [...(draft.differential_diagnosis ?? []), { diagnosis: '' }])
  }
  function updateDiff(i, val) {
    update('differential_diagnosis', draft.differential_diagnosis.map((d, idx) => idx === i ? { diagnosis: val } : d))
  }
  const diffs = draft.differential_diagnosis ?? []

  function addKeyword() {
    const k = kwInput.trim()
    if (!k) return
    update('diagnosis_keywords', [...(draft.diagnosis_keywords ?? []), k])
    setKwInput('')
  }

  function addEp() {
    const e = epInput.trim()
    if (!e) return
    update('explanation_points', [...(draft.explanation_points ?? []), e])
    setEpInput('')
  }

  return (
    <div className="space-y-5">
      <Field label="Diferensial diaqnozlar">
        <div className="space-y-2">
          {diffs.map((d, i) => (
            <div key={i} className="flex gap-2">
              <Input value={d.diagnosis} onChange={v => updateDiff(i, v)} placeholder="Diaqnoz adı..." />
              <RemoveBtn onClick={() => update('differential_diagnosis', diffs.filter((_, j) => j !== i))} />
            </div>
          ))}
          <AddButton onClick={addDiff} label="Diferensial əlavə et" />
        </div>
      </Field>

      <Field label="Düzgün diaqnoz">
        <Input value={draft.correct_diagnosis} onChange={v => update('correct_diagnosis', v)} placeholder="Dəqiq diaqnoz..." />
      </Field>

      <Field label="Açar sözlər (uyğunluq üçün)">
        <div className="flex flex-wrap gap-2 mb-2">
          {(draft.diagnosis_keywords ?? []).map((k, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[#EEEFFD]" style={{ color: '#5B65DC' }}>
              {k}
              <button type="button" onClick={() => update('diagnosis_keywords', draft.diagnosis_keywords.filter((_, j) => j !== i))}><X size={11} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())} placeholder="Açar söz (Enter)" className="flex-1 px-3 py-2 rounded-lg border border-[#EEEFFD] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30" />
          <button type="button" onClick={addKeyword} className="px-3 py-2 rounded-lg text-sm font-medium bg-[#5B65DC] text-white">Əlavə et</button>
        </div>
      </Field>

      <Field label="Izahat nöqtələri">
        <div className="space-y-2 mb-2">
          {(draft.explanation_points ?? []).map((ep, i) => (
            <div key={i} className="flex gap-2">
              <Input value={ep} onChange={v => update('explanation_points', draft.explanation_points.map((x, j) => j === i ? v : x))} placeholder="İzahat..." />
              <RemoveBtn onClick={() => update('explanation_points', draft.explanation_points.filter((_, j) => j !== i))} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={epInput} onChange={e => setEpInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEp())} placeholder="İzahat nöqtəsi (Enter)" className="flex-1 px-3 py-2 rounded-lg border border-[#EEEFFD] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30" />
          <button type="button" onClick={addEp} className="px-3 py-2 rounded-lg text-sm font-medium bg-[#5B65DC] text-white">Əlavə et</button>
        </div>
      </Field>
    </div>
  )
}

// ─── Step 5: Müalicə ───────────────────────────────────────────────────────
function StepMualice({ draft, update }) {
  const [tpInput, setTpInput] = useState('')

  function addOpt() {
    update('treatment_options', [...(draft.treatment_options ?? []), { text: '', correct: false }])
  }
  function updateOpt(i, field, val) {
    update('treatment_options', draft.treatment_options.map((o, idx) => idx === i ? { ...o, [field]: val } : o))
  }
  const opts = draft.treatment_options ?? []

  function addTp() {
    const t = tpInput.trim()
    if (!t) return
    update('treatment_points', [...(draft.treatment_points ?? []), t])
    setTpInput('')
  }

  return (
    <div className="space-y-5">
      <Field label="Müalicə variantları">
        <div className="space-y-3">
          {opts.map((o, i) => (
            <div key={i} className="p-4 rounded-xl border border-[#EEEFFD] bg-white space-y-3">
              <div className="flex items-center justify-between">
                <Toggle value={o.correct} onChange={v => updateOpt(i, 'correct', v)} labels={['Yanlış', 'Düzgün']} />
                <RemoveBtn onClick={() => update('treatment_options', opts.filter((_, j) => j !== i))} />
              </div>
              <Field label="Mətn (Qısa ad — İzahat)">
                <Input value={o.text} onChange={v => updateOpt(i, 'text', v)} placeholder="Metformin — DKA-da əks-göstərişdir" />
              </Field>
            </div>
          ))}
          <AddButton onClick={addOpt} label="Variant əlavə et" />
        </div>
      </Field>

      <Field label="Müalicə protokolu nöqtələri">
        <div className="space-y-2 mb-2">
          {(draft.treatment_points ?? []).map((tp, i) => (
            <div key={i} className="flex gap-2">
              <Input value={tp} onChange={v => update('treatment_points', draft.treatment_points.map((x, j) => j === i ? v : x))} placeholder="Protokol nöqtəsi..." />
              <RemoveBtn onClick={() => update('treatment_points', draft.treatment_points.filter((_, j) => j !== i))} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={tpInput} onChange={e => setTpInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTp())} placeholder="Protokol nöqtəsi (Enter)" className="flex-1 px-3 py-2 rounded-lg border border-[#EEEFFD] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30" />
          <button type="button" onClick={addTp} className="px-3 py-2 rounded-lg text-sm font-medium bg-[#5B65DC] text-white">Əlavə et</button>
        </div>
      </Field>
    </div>
  )
}

// ─── Main CaseEditor ───────────────────────────────────────────────────────
export default function CaseEditor({ initialCase, session, onBack, onSaved }) {
  const [draft, setDraft] = useState(() => ({ ...EMPTY_CASE, ...initialCase }))
  const [activeStep, setActiveStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  function update(field, value) {
    setDirty(true)
    setDraft(d => ({ ...d, [field]: value }))
  }

  function handleBack() {
    if (dirty) setShowLeaveConfirm(true)
    else onBack()
  }

  async function save(publish) {
    setSaving(true)
    setSaveError(null)
    try {
      const payload = { ...draft, is_published: publish }
      const action = draft.id ? 'update' : 'create'
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
      setDirty(false)
      onSaved(data.case, publish)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const stepComponents = [
    <StepBasic key="basic" draft={draft} update={update} />,
    <StepAnamnez key="anamnez" draft={draft} update={update} />,
    <StepMuayine key="muayine" draft={draft} update={update} />,
    <StepAnalizler key="analizler" draft={draft} update={update} />,
    <StepDiaqnoz key="diaqnoz" draft={draft} update={update} />,
    <StepMualice key="mualice" draft={draft} update={update} />,
  ]

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFD' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#EEEFFD] bg-white px-4 py-3 flex items-center justify-between gap-3">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#5B65DC' }}>
          <ArrowLeft size={16} /> Geri
        </button>

        <div className="flex items-center gap-2">
          {draft.title && (
            <span className="hidden sm:block text-sm font-medium truncate max-w-48" style={{ color: '#122056' }}>
              {draft.title}
            </span>
          )}
          {draft.difficulty && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFF_COLOR[draft.difficulty] ?? ''}`}>
              {draft.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {saveError && <span className="text-xs text-red-500 hidden sm:block">{saveError}</span>}
          <button
            disabled={saving}
            onClick={() => save(false)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#EEEFFD] text-sm font-medium transition-colors hover:bg-[#EEEFFD] disabled:opacity-50"
            style={{ color: '#475467' }}
          >
            <Save size={14} /> Qaralama
          </button>
          <button
            disabled={saving}
            onClick={() => save(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#5B65DC' }}
          >
            <Globe size={14} /> Yayımla
          </button>
        </div>
      </header>

      {/* Step tabs */}
      <div className="flex border-b border-[#EEEFFD] bg-white overflow-x-auto">
        {STEPS.map((step, i) => (
          <button
            key={step}
            onClick={() => setActiveStep(i)}
            className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              i === activeStep
                ? 'border-[#5B65DC] text-[#5B65DC]'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            {step}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {stepComponents[activeStep]}
          </motion.div>
        </AnimatePresence>

        {/* Bottom nav */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setActiveStep(s => Math.max(0, s - 1))}
            disabled={activeStep === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#EEEFFD] text-sm font-medium transition-colors hover:bg-[#EEEFFD] disabled:opacity-30"
            style={{ color: '#475467' }}
          >
            <ChevronUp size={14} className="rotate-[-90deg]" /> Əvvəlki
          </button>
          {activeStep < STEPS.length - 1 ? (
            <button
              onClick={() => setActiveStep(s => s + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: '#5B65DC' }}
            >
              Növbəti <ChevronDown size={14} className="rotate-[-90deg]" />
            </button>
          ) : (
            <button
              disabled={saving}
              onClick={() => save(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: '#5B65DC' }}
            >
              <Save size={14} /> Saxla
            </button>
          )}
        </div>
      </main>

      {/* Leave confirmation modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 mx-4 max-w-sm w-full">
            <h2 className="text-base font-semibold mb-2" style={{ color: '#122056' }}>Dəyişikliklər saxlanılmayıb</h2>
            <p className="text-sm mb-6" style={{ color: '#475467' }}>
              Geri qayıtsanız bütün redaktə etdiyiniz məlumatlar itirilər. Davam etmək istəyirsiniz?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[#EEEFFD] hover:bg-[#EEEFFD] transition-colors"
                style={{ color: '#475467' }}
              >
                Ləğv et
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-80"
                style={{ background: '#DC2626' }}
              >
                Saxlamadan çıx
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
