import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Stethoscope, Heart, Brain, Bug, Wind, Baby,
  Zap, Droplets, MessageCircle, Scissors, Utensils,
  ArrowRight, ChevronLeft,
} from "lucide-react"
import { supabase } from './supabase.js'

const SPECIALTY_ICONS = {
  "Kardiologiya":          Heart,
  "Nevrologiya":           Brain,
  "İnfeksion xəstəliklər": Bug,
  "Gastroenterologiya":    Utensils,
  "Pulmonologiya":         Wind,
  "Pediatriya":            Baby,
  "Endokrinologiya":       Zap,
  "Nefrologiya":           Droplets,
  "Psixiatriya":           MessageCircle,
  "Cərrahiyyə":            Scissors,
}

const Sep = () => <div className="h-px w-full" style={{ background: "#EEEFFD" }} />

function DifficultyBadge({ difficulty }) {
  const cls =
    difficulty === "Çətin" ? "bg-red-100 text-red-700" :
    difficulty === "Orta"  ? "bg-amber-100 text-amber-700" :
                             "bg-green-100 text-green-700"
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${cls}`}>
      {difficulty}
    </span>
  )
}

export default function CasesPage({
  session, cases, bookmarkedIds, setBookmarkedIds,
  onSelectCase, onBack, setShowProfile,
}) {
  const [selectedSpecialty, setSelectedSpecialty] = useState(null)

  // Group cases by specialty
  const grouped = {}
  cases.forEach(c => {
    if (!grouped[c.specialty]) grouped[c.specialty] = []
    grouped[c.specialty].push(c)
  })
  const specialties = Object.entries(grouped)

  const userName = session?.user?.user_metadata?.full_name ?? session?.user?.email ?? ""

  function toggleBookmark(e, c) {
    e.stopPropagation()
    const isBookmarked = bookmarkedIds.has(c.id)
    if (isBookmarked) {
      supabase.from('bookmarks').delete().match({ user_id: session.user.id, case_id: c.id }).then(() => {})
      setBookmarkedIds(prev => { const s = new Set(prev); s.delete(c.id); return s })
    } else {
      supabase.from('bookmarks').insert({ user_id: session.user.id, case_id: c.id, case_title: c.title ?? `Hal ${c.id}` }).then(() => {})
      setBookmarkedIds(prev => new Set([...prev, c.id]))
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAFAFD" }}>
      {/* Header */}
      <header className="border-b border-[#EEEFFD] bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={selectedSpecialty ? () => setSelectedSpecialty(null) : onBack}
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: "#5B65DC" }}>
            <ChevronLeft className="h-4 w-4" />
            {selectedSpecialty ? selectedSpecialty : "Geri"}
          </button>
          <span className="text-xl font-bold" style={{ color: "#122056" }}>ClinIQ</span>
        </div>
        <button
          onClick={() => setShowProfile(true)}
          className="text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: "#5B65DC" }}>
          {userName}
        </button>
      </header>

      <AnimatePresence mode="wait">
        {/* ── Page 3a: Specialty list ── */}
        {!selectedSpecialty && (
          <motion.div
            key="specialties"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="max-w-3xl mx-auto px-6 py-10">
              <h1 className="text-3xl font-bold mb-2" style={{ color: "#122056" }}>
                Kliniki hallar
              </h1>
              <p className="text-sm mb-8" style={{ color: "#475467" }}>
                Bir ixtisas sahəsi seçin
              </p>

              <div className="bg-white rounded-2xl overflow-hidden [box-shadow:0_0_0_1px_rgba(18,32,86,.06),0_2px_4px_rgba(18,32,86,.05),0_12px_24px_rgba(18,32,86,.05)]">
                <Sep />
                {specialties.map(([specialty, specCases], idx) => {
                  const Icon = SPECIALTY_ICONS[specialty] ?? Stethoscope
                  return (
                    <div key={specialty}>
                      <button
                        onClick={() => setSelectedSpecialty(specialty)}
                        className="w-full grid items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-[#FAFAFD] md:grid-cols-4"
                      >
                        {/* Icon + name */}
                        <div className="order-2 flex items-center gap-3 md:order-none">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: "#EEEFFD" }}>
                            <Icon className="h-5 w-5" style={{ color: "#5B65DC" }} />
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-sm" style={{ color: "#122056" }}>{specialty}</span>
                            <span className="text-xs" style={{ color: "#475467" }}>{specCases.length} hal</span>
                          </div>
                        </div>

                        {/* Difficulty breakdown */}
                        <p className="order-1 text-sm md:order-none md:col-span-2" style={{ color: "#475467" }}>
                          {[...new Set(specCases.map(c => c.difficulty))].join(" · ")}
                        </p>

                        {/* Arrow */}
                        <div className="order-3 ml-auto flex items-center gap-1 text-sm font-medium md:order-none" style={{ color: "#5B65DC" }}>
                          Bax <ArrowRight className="h-4 w-4" />
                        </div>
                      </button>
                      <Sep />
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Page 3b: Cases within specialty ── */}
        {selectedSpecialty && (
          <motion.div
            key={selectedSpecialty}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="max-w-3xl mx-auto px-6 py-10">
              <h1 className="text-3xl font-bold mb-2" style={{ color: "#122056" }}>
                {selectedSpecialty}
              </h1>
              <p className="text-sm mb-8" style={{ color: "#475467" }}>
                {grouped[selectedSpecialty]?.length ?? 0} kliniki hal
              </p>

              <div className="bg-white rounded-2xl overflow-hidden [box-shadow:0_0_0_1px_rgba(18,32,86,.06),0_2px_4px_rgba(18,32,86,.05),0_12px_24px_rgba(18,32,86,.05)]">
                <Sep />
                {(grouped[selectedSpecialty] ?? []).map(c => {
                  const isBookmarked = bookmarkedIds.has(c.id)
                  return (
                    <div key={c.id}>
                      <div className="grid items-center gap-4 px-6 py-5 md:grid-cols-4 hover:bg-[#FAFAFD] transition-colors">
                        {/* Icon + case id */}
                        <div className="order-2 flex items-center gap-3 md:order-none">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: "#EEEFFD" }}>
                            <Stethoscope className="h-5 w-5" style={{ color: "#5B65DC" }} />
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-sm" style={{ color: "#122056" }}>
                              {c.title ?? `Kliniki hal ${c.id}`}
                            </span>
                            <span className="text-xs" style={{ color: "#475467" }}>
                              {c.tags[0]}
                            </span>
                          </div>
                        </div>

                        {/* Patient summary */}
                        <p className="order-1 text-sm md:order-none md:col-span-2 line-clamp-2" style={{ color: "#475467" }}>
                          {c.patientSummary ?? (c.tags[1] ?? "")}
                        </p>

                        {/* Actions */}
                        <div className="order-3 ml-auto flex items-center gap-3 md:order-none">
                          <DifficultyBadge difficulty={c.difficulty} />
                          <button
                            onClick={(e) => toggleBookmark(e, c)}
                            className="text-base leading-none transition-colors"
                            style={{ color: isBookmarked ? "#f59e0b" : "#c7caed" }}
                            title={isBookmarked ? "Saxlanmışdan çıxar" : "Saxla"}>
                            {isBookmarked ? "★" : "☆"}
                          </button>
                          <button
                            onClick={() => onSelectCase(c)}
                            className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: "#5B65DC", background: "#EEEFFD" }}>
                            Başla <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <Sep />
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
