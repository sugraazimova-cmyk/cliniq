import { useState } from 'react'
import { Star, X, AlertTriangle, Bug, Lightbulb, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './supabase.js'

const TYPES = [
  { id: 'general',       label: 'Ümumi rəy',         Icon: Star },
  { id: 'content_error', label: 'Məzmuna düzəliş',   Icon: AlertTriangle },
  { id: 'bug',           label: 'Xəta bildiriş',      Icon: Bug },
  { id: 'feature',       label: 'Təklif',             Icon: Lightbulb },
]

const STEP_NAMES = ['Anamnez', 'Müayinə', 'Analizlər', 'Diaqnoz', 'Müalicə', 'Nəticə']

export default function FeedbackModal({ onClose, page, caseId, session, initialType = null, stepIndex = null }) {
  const [type, setType] = useState(initialType)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [whatIsWrong, setWhatIsWrong] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [selectedStep, setSelectedStep] = useState(stepIndex)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (type === 'general' && !rating) return
    if (type === 'content_error' && !whatIsWrong.trim()) return
    if ((type === 'bug' || type === 'feature') && !comment.trim()) return

    setSubmitting(true)

    const payload = {
      user_id: session.user.id,
      page,
      case_id: caseId ?? null,
      type: type ?? 'general',
      step_index: selectedStep ?? null,
    }

    if (type === 'general') {
      payload.rating = rating
      payload.comment = comment.trim() || null
    } else if (type === 'content_error') {
      payload.comment = [
        whatIsWrong.trim(),
        correctAnswer.trim() ? `Düzgün cavab: ${correctAnswer.trim()}` : null,
      ].filter(Boolean).join('\n\n')
    } else {
      payload.comment = comment.trim()
    }

    await supabase.from('feedback').insert(payload)
    setSubmitting(false)
    setDone(true)
    setTimeout(onClose, 1800)
  }

  const active = hovered || rating

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col gap-4 overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} style={{ color: '#5B65DC' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#122056' }}>
                {type ? TYPES.find(t => t.id === type)?.label : 'Rəy bildirin'}
              </h2>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-4">
            {done ? (
              <div className="py-6 flex flex-col items-center gap-3">
                <span className="text-3xl">🎉</span>
                <p className="text-base font-semibold text-center" style={{ color: '#122056' }}>
                  Təşəkkür edirik!
                </p>
              </div>
            ) : !type ? (
              /* Type selector */
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setType(id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all hover:border-[#5B65DC] hover:bg-[#EEEFFD]"
                    style={{ borderColor: '#EEEFFD', color: '#122056' }}
                  >
                    <Icon size={18} style={{ color: '#5B65DC' }} />
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-3"
                >
                  {/* Back button (only if not pre-filled) */}
                  {!initialType && (
                    <button
                      onClick={() => setType(null)}
                      className="text-xs text-stone-400 hover:text-stone-600 self-start transition-colors"
                    >
                      ← Geri
                    </button>
                  )}

                  {/* ── General ── */}
                  {type === 'general' && (
                    <>
                      <div className="flex gap-1.5 justify-center">
                        {[1, 2, 3, 4, 5].map(i => (
                          <button
                            key={i}
                            onClick={() => setRating(i)}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(0)}
                            className="transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              size={30}
                              fill={i <= active ? '#F59E0B' : 'none'}
                              stroke={i <= active ? '#F59E0B' : '#D1D5DB'}
                              strokeWidth={1.5}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Şərhinizi yazın... (istəyə bağlı)"
                        rows={3}
                        className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm text-stone-700 outline-none transition-colors"
                        style={{ borderColor: '#EEEFFD' }}
                        onFocus={e => (e.target.style.borderColor = '#5B65DC')}
                        onBlur={e => (e.target.style.borderColor = '#EEEFFD')}
                      />
                    </>
                  )}

                  {/* ── Content error ── */}
                  {type === 'content_error' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-stone-500 mb-1 block">Addım</label>
                        <select
                          value={selectedStep ?? ''}
                          onChange={e => setSelectedStep(e.target.value === '' ? null : Number(e.target.value))}
                          className="w-full rounded-xl border px-3 py-2 text-sm text-stone-700 outline-none transition-colors bg-white"
                          style={{ borderColor: '#EEEFFD' }}
                          onFocus={e => (e.target.style.borderColor = '#5B65DC')}
                          onBlur={e => (e.target.style.borderColor = '#EEEFFD')}
                        >
                          <option value="">— Addımı seçin —</option>
                          {STEP_NAMES.map((s, i) => (
                            <option key={i} value={i}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-stone-500 mb-1 block">Nə yanlışdır? *</label>
                        <textarea
                          value={whatIsWrong}
                          onChange={e => setWhatIsWrong(e.target.value)}
                          placeholder="Yanlış olan məlumatı təsvir edin..."
                          rows={3}
                          className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm text-stone-700 outline-none transition-colors"
                          style={{ borderColor: '#EEEFFD' }}
                          onFocus={e => (e.target.style.borderColor = '#5B65DC')}
                          onBlur={e => (e.target.style.borderColor = '#EEEFFD')}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-stone-500 mb-1 block">Düzgün cavab nədir? (istəyə bağlı)</label>
                        <textarea
                          value={correctAnswer}
                          onChange={e => setCorrectAnswer(e.target.value)}
                          placeholder="Düzgün məlumat..."
                          rows={2}
                          className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm text-stone-700 outline-none transition-colors"
                          style={{ borderColor: '#EEEFFD' }}
                          onFocus={e => (e.target.style.borderColor = '#5B65DC')}
                          onBlur={e => (e.target.style.borderColor = '#EEEFFD')}
                        />
                      </div>
                    </>
                  )}

                  {/* ── Bug / Feature ── */}
                  {(type === 'bug' || type === 'feature') && (
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder={type === 'bug' ? 'Xətanı təsvir edin...' : 'Təklifinizi yazın...'}
                      rows={4}
                      className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm text-stone-700 outline-none transition-colors"
                      style={{ borderColor: '#EEEFFD' }}
                      onFocus={e => (e.target.style.borderColor = '#5B65DC')}
                      onBlur={e => (e.target.style.borderColor = '#EEEFFD')}
                    />
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={onClose}
                      className="flex-1 rounded-xl border py-2 text-sm text-stone-500 hover:bg-stone-50 transition-colors"
                      style={{ borderColor: '#EEEFFD' }}
                    >
                      Ləğv et
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={
                        submitting ||
                        (type === 'general' && !rating) ||
                        (type === 'content_error' && !whatIsWrong.trim()) ||
                        ((type === 'bug' || type === 'feature') && !comment.trim())
                      }
                      className="flex-1 rounded-xl py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
                      style={{ background: '#5B65DC' }}
                    >
                      {submitting ? '...' : 'Göndər'}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
