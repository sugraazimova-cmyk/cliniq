import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './supabase.js'

export default function FeedbackModal({ onClose, page, caseId, session }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!rating) return
    setSubmitting(true)
    await supabase.from('feedback').insert({
      user_id: session.user.id,
      rating,
      comment: comment.trim() || null,
      page,
      case_id: caseId ?? null,
    })
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
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5"
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={18} />
          </button>

          {done ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <span className="text-3xl">🎉</span>
              <p className="text-base font-semibold text-center" style={{ color: '#122056' }}>
                Təşəkkür edirik!
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold" style={{ color: '#122056' }}>
                Rəyinizi bildirin
              </h2>

              {/* Stars */}
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={32}
                      fill={i <= active ? '#F59E0B' : 'none'}
                      stroke={i <= active ? '#F59E0B' : '#D1D5DB'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              {/* Comment */}
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

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border py-2 text-sm text-stone-500 hover:bg-stone-50 transition-colors"
                  style={{ borderColor: '#EEEFFD' }}
                >
                  Ləğv et
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!rating || submitting}
                  className="flex-1 rounded-xl py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
                  style={{ background: '#5B65DC' }}
                >
                  {submitting ? '...' : 'Göndər'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
