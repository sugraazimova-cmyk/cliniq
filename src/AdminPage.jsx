import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, LayoutDashboard, Folder, Sparkles, Users,
  Eye, EyeOff, Pencil, Trash2, Copy, Plus, Loader2,
  TrendingUp, BookOpen, Zap, BarChart2, AlertCircle,
  Star, MessageSquare, Globe,
} from "lucide-react"
import { supabase } from './supabase.js'
import CaseEditor from "./admin/CaseEditor.jsx"
import { EMPTY_CASE } from "./admin/caseDefaults.js"

const TABS = [
  { id: 'overview',  label: 'Ümumi baxış',   Icon: LayoutDashboard },
  { id: 'cases',     label: 'Hallar',         Icon: Folder },
  { id: 'generator', label: 'AI Generator',   Icon: Sparkles },
  { id: 'users',     label: 'İstifadəçilər',  Icon: Users },
  { id: 'feedback',  label: 'Rəylər',         Icon: MessageSquare },
  { id: 'landing',   label: 'Səhifə',         Icon: Globe },
]

const SPECIALTIES = [
  'Kardiologiya', 'Nevrologiya', 'Pulmonologiya', 'Gastroenterologiya',
  'Endokrinologiya', 'Nefrologiya', 'Ortopediya', 'Pediatriya',
  'İnfeksion xəstəliklər', 'Cərrahiyyə', 'Ginekologiya', 'Psixiatriya', 'Dərmatologiya', 'Digər',
]

const DIFF_COLOR = {
  Asan:  'bg-green-100 text-green-700',
  Orta:  'bg-amber-100 text-amber-700',
  Çətin: 'bg-red-100 text-red-700',
}

// ─── API helper ────────────────────────────────────────────────────────────
async function adminCall(action, payload, token) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, payload }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
  return data
}

// ─── Overview tab ──────────────────────────────────────────────────────────
function Overview({ session }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    adminCall('stats', {}, session.access_token)
      .then(data => setStats(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [session])

  if (loading) return <Spinner />
  if (error) return <ErrorMsg msg={error} />

  const statCards = [
    { label: 'Yayımlanmış hallar', value: stats.publishedCount, Icon: BookOpen, color: '#5B65DC' },
    { label: 'Qaralamalar', value: stats.draftCount, Icon: Folder, color: '#6b7280' },
    { label: 'Qeydiyyatdan keçmiş istifadəçilər', value: stats.totalUsers, Icon: Users, color: '#16a34a' },
    { label: 'Ümumi cəhdlər', value: stats.totalAttempts, Icon: TrendingUp, color: '#d97706' },
    { label: 'Orta bal', value: stats.avgScore ?? '—', Icon: BarChart2, color: '#0891b2' },
    { label: 'Flashcard generasiyaları', value: stats.featureCounts?.flashcard_generate ?? 0, Icon: Zap, color: '#7c3aed' },
    { label: 'Flashcard faylı oxunmaları', value: stats.featureCounts?.flashcard_parse ?? 0, Icon: Zap, color: '#9d4edd' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#EEEFFD] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} style={{ color }} />
              <span className="text-xs text-stone-500 leading-tight">{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#122056' }}>{value}</p>
          </div>
        ))}
      </div>

      {stats.topCases?.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EEEFFD] p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#122056' }}>Ən çox cəhd edilən hallar</h3>
          <div className="space-y-2">
            {stats.topCases.map(({ title, count }, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#EEEFFD] last:border-0">
                <span className="text-sm" style={{ color: '#122056' }}>{title}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#EEEFFD]" style={{ color: '#5B65DC' }}>
                  {count} cəhd
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Cases tab ─────────────────────────────────────────────────────────────
function CaseList({ session, onEdit }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterSpecialty, setFilterSpecialty] = useState('')
  const [filterPublished, setFilterPublished] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    adminCall('list', {}, session.access_token)
      .then(data => setCases(data.cases ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [session])

  useEffect(() => { load() }, [load])

  async function handleTogglePublish(c) {
    setActionLoading(`pub-${c.id}`)
    try {
      await adminCall('toggle_publish', { id: c.id, is_published: !c.is_published }, session.access_token)
      setCases(cs => cs.map(x => x.id === c.id ? { ...x, is_published: !c.is_published } : x))
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  async function handleDelete(c) {
    if (!confirm(`"${c.title}" silinsin?`)) return
    setActionLoading(`del-${c.id}`)
    try {
      await adminCall('delete', { id: c.id }, session.access_token)
      setCases(cs => cs.filter(x => x.id !== c.id))
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  async function handleDuplicate(c) {
    setActionLoading(`dup-${c.id}`)
    try {
      const { case: newCase } = await adminCall('duplicate', { id: c.id }, session.access_token)
      setCases(cs => [...cs, newCase])
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  const filtered = cases.filter(c => {
    if (filterSpecialty && c.specialty !== filterSpecialty) return false
    if (filterPublished === 'published' && !c.is_published) return false
    if (filterPublished === 'draft' && c.is_published) return false
    return true
  })

  if (loading) return <Spinner />
  if (error) return <ErrorMsg msg={error} />

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterSpecialty}
            onChange={e => setFilterSpecialty(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#EEEFFD] bg-white text-sm focus:outline-none"
            style={{ color: '#122056' }}
          >
            <option value="">Bütün ixtisaslar</option>
            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterPublished}
            onChange={e => setFilterPublished(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#EEEFFD] bg-white text-sm focus:outline-none"
            style={{ color: '#122056' }}
          >
            <option value="all">Hamısı</option>
            <option value="published">Yayımlanmış</option>
            <option value="draft">Qaralama</option>
          </select>
        </div>
        <button
          onClick={() => onEdit({ ...EMPTY_CASE })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#5B65DC' }}
        >
          <Plus size={16} /> Yeni hal
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center py-12 text-sm text-stone-400">Hal tapılmadı</p>
        )}
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-[#EEEFFD] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-medium text-sm truncate" style={{ color: '#122056' }}>{c.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFF_COLOR[c.difficulty] ?? ''}`}>{c.difficulty}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_published ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                  {c.is_published ? 'Yayımlanmış' : 'Qaralama'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-400">
                <span>{c.specialty}</span>
                {c.attempt_count > 0 && <span>{c.attempt_count} cəhd · ort. {c.avg_score} bal</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <ActionBtn
                icon={c.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                label={c.is_published ? 'Gizlə' : 'Yayımla'}
                loading={actionLoading === `pub-${c.id}`}
                onClick={() => handleTogglePublish(c)}
                color="#5B65DC"
              />
              <ActionBtn icon={<Copy size={15} />} label="Kopyala" loading={actionLoading === `dup-${c.id}`} onClick={() => handleDuplicate(c)} color="#475467" />
              <ActionBtn icon={<Pencil size={15} />} label="Düzəlt" onClick={() => onEdit(c)} color="#475467" />
              <ActionBtn icon={<Trash2 size={15} />} label="Sil" loading={actionLoading === `del-${c.id}`} onClick={() => handleDelete(c)} color="#ef4444" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, loading, color }) {
  return (
    <button
      title={label}
      disabled={loading}
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-[#EEEFFD] transition-colors disabled:opacity-40"
      style={{ color }}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
    </button>
  )
}

// ─── AI Generator tab ──────────────────────────────────────────────────────
function AiGenerator({ session, onEdit }) {
  const [form, setForm] = useState({ diagnosis: '', specialty: 'Kardiologiya', difficulty: 'Orta', additionalNotes: '' })
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState(null)

  async function handleGenerate() {
    if (!form.diagnosis.trim()) return
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/admin-generate-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
      onEdit(data.case)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-[#EEEFFD] p-6 space-y-4">
        <h2 className="font-semibold" style={{ color: '#122056' }}>Yeni hal yarat</h2>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#475467' }}>Diaqnoz / Mövzu *</label>
          <input
            value={form.diagnosis}
            onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
            placeholder="məs. Kəskin miokard infarktı..."
            className="w-full px-3 py-2.5 rounded-lg border border-[#EEEFFD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30"
            style={{ color: '#122056' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#475467' }}>İxtisas</label>
            <select value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[#EEEFFD] bg-white text-sm focus:outline-none" style={{ color: '#122056' }}>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#475467' }}>Çətinlik</label>
            <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[#EEEFFD] bg-white text-sm focus:outline-none" style={{ color: '#122056' }}>
              {['Asan', 'Orta', 'Çətin'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#475467' }}>Əlavə kontekst (istəyə bağlı)</label>
          <textarea
            value={form.additionalNotes}
            onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))}
            placeholder="Xüsusi tapıntılar, fon xəstəlikləri, müəyyən ssenari..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-[#EEEFFD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30 resize-none"
            style={{ color: '#122056' }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <button
          disabled={!form.diagnosis.trim() || status === 'loading'}
          onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: '#5B65DC' }}
        >
          {status === 'loading' ? (
            <><Loader2 size={16} className="animate-spin" /> Hal yaradılır...</>
          ) : (
            <><Sparkles size={16} /> Hal yarat</>
          )}
        </button>
      </div>

      <p className="text-xs text-center text-stone-400">
        AI tərəfindən yaradılan hal redaktə üçün açılacaq. Yayımlamadan əvvəl yoxlayın.
      </p>
    </div>
  )
}

// ─── Users tab ─────────────────────────────────────────────────────────────
function UsersTab({ session }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    adminCall('users', {}, session.access_token)
      .then(data => setUsers(data.users ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [session])

  if (loading) return <Spinner />
  if (error) return <ErrorMsg msg={error} />

  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-400 mb-4">{users.length} istifadəçi</p>
      {users.map(u => (
        <div key={u.id} className="bg-white rounded-2xl border border-[#EEEFFD] p-4 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" style={{ color: '#122056' }}>
              {u.full_name || u.email}
            </p>
            {u.full_name && <p className="text-xs text-stone-400 truncate">{u.email}</p>}
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-400 flex-shrink-0">
            <span>{u.attempts} cəhd</span>
            <span>Qeydiyyat: {new Date(u.created_at).toLocaleDateString('az-AZ')}</span>
            {u.last_active && <span>Son fəaliyyət: {new Date(u.last_active).toLocaleDateString('az-AZ')}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Feedback tab ──────────────────────────────────────────────────────────
function FeedbackTab({ session }) {
  const [rows, setRows] = useState([])
  const [userMap, setUserMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('feedback').select('*').order('created_at', { ascending: false }),
      adminCall('users', {}, session.access_token),
    ])
      .then(([{ data, error: err }, usersData]) => {
        if (err) throw new Error(err.message)
        setRows(data ?? [])
        const map = {}
        for (const u of usersData.users ?? []) map[u.id] = u.email
        setUserMap(map)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [session])

  if (loading) return <Spinner />
  if (error) return <ErrorMsg msg={error} />

  if (rows.length === 0) return (
    <p className="text-sm text-stone-400 py-8 text-center">Hələ rəy yoxdur</p>
  )

  function Stars({ rating }) {
    return (
      <span className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star
            key={i}
            size={14}
            fill={i <= rating ? '#F59E0B' : 'none'}
            stroke={i <= rating ? '#F59E0B' : '#D1D5DB'}
            strokeWidth={1.5}
          />
        ))}
      </span>
    )
  }

  function userId(id) {
    return userMap[id] || `${id.slice(0, 8)}…`
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#EEEFFD]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#EEEFFD] bg-[#FAFAFD]">
            {['Tarix', 'Reytinq', 'Şərh', 'Səhifə', 'İstifadəçi'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEEFFD]">
          {rows.map(r => (
            <tr key={r.id} className="bg-white hover:bg-[#FAFAFD] transition-colors">
              <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
                {new Date(r.created_at).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-4 py-3">
                <Stars rating={r.rating} />
              </td>
              <td className="px-4 py-3 text-stone-600 max-w-xs">
                {r.comment ? (
                  <span className="line-clamp-2">{r.comment}</span>
                ) : (
                  <span className="text-stone-300">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs bg-[#EEEFFD] text-[#5B65DC] px-2 py-0.5 rounded-full whitespace-nowrap">
                  {r.page ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap font-mono">
                {r.user_id ? userId(r.user_id) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Shared helpers ────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 size={24} className="animate-spin" style={{ color: '#5B65DC' }} />
    </div>
  )
}

function ErrorMsg({ msg }) {
  return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
      <AlertCircle size={16} /> {msg}
    </div>
  )
}

// ─── Landing tab ───────────────────────────────────────────────────────────
const LANDING_FIELDS = [
  { key: 'hero_headline',  label: 'Hero başlıq',  rows: 1 },
  { key: 'hero_subheading', label: 'Hero alt başlıq', rows: 2 },
  { key: 'problem_body',   label: 'Problem mətni', rows: 3 },
  { key: 'cta_headline',   label: 'CTA başlıq',   rows: 1 },
  { key: 'cta_subtext',    label: 'CTA alt mətn',  rows: 1 },
  { key: 'quote_text',     label: 'Sitat',         rows: 2 },
]

function LandingTab() {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('landing_content').select('*').eq('id', 1).single()
      .then(({ data }) => { if (data) setForm(data) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    await supabase.from('landing_content').upsert({ ...form, id: 1, updated_at: new Date().toISOString() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="py-12 text-center text-stone-400 text-sm"><Loader2 size={20} className="animate-spin mx-auto" /></div>

  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="text-lg font-semibold" style={{ color: '#122056' }}>Açılış səhifəsi məzmunu</h2>
      {LANDING_FIELDS.map(({ key, label, rows }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-stone-600 mb-1">{label}</label>
          {rows === 1 ? (
            <input
              type="text"
              value={form[key] || ''}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-[#EEEFFD] rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30"
            />
          ) : (
            <textarea
              rows={rows}
              value={form[key] || ''}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-[#EEEFFD] rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5B65DC]/30 resize-none"
            />
          )}
        </div>
      ))}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: '#5B65DC' }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Yadda saxla
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">Dəyişikliklər saxlanıldı ✓</span>}
      </div>
    </div>
  )
}

// ─── Main AdminPage ────────────────────────────────────────────────────────
export default function AdminPage({ session, onBack }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [editingCase, setEditingCase] = useState(null) // null = list view

  function handleEdit(c) {
    setEditingCase(c)
  }

  function handleSaved(savedCase, published) {
    setEditingCase(null)
    setActiveTab('cases')
    void published // signal to user
    void savedCase
  }

  // Full-screen editor replaces dashboard
  if (editingCase) {
    return (
      <CaseEditor
        initialCase={editingCase}
        session={session}
        onBack={() => setEditingCase(null)}
        onSaved={handleSaved}
      />
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFD' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#EEEFFD] bg-white px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#5B65DC' }}>
          <ArrowLeft size={16} /> Geri
        </button>
        <span className="font-bold" style={{ color: '#122056' }}>Admin Panel</span>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-[#EEEFFD] bg-white overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
              id === activeTab ? 'border-[#5B65DC] text-[#5B65DC]' : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview'  && <Overview session={session} />}
            {activeTab === 'cases'     && <CaseList session={session} onEdit={handleEdit} />}
            {activeTab === 'generator' && <AiGenerator session={session} onEdit={handleEdit} />}
            {activeTab === 'users'     && <UsersTab session={session} />}
            {activeTab === 'feedback'  && <FeedbackTab session={session} />}
            {activeTab === 'landing'   && <LandingTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
