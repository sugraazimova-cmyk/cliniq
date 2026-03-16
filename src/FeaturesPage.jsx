import { motion } from "framer-motion"
import { Layers, Stethoscope, CalendarDays, Timer, BookMarked } from "lucide-react"
import { BentoCard, BentoGrid } from "./components/ui/bento-grid.jsx"

export default function FeaturesPage({ session, onEnterCases, setShowProfile }) {
  const name = session?.user?.user_metadata?.full_name ?? session?.user?.email ?? ""
  const firstName = name.split(" ")[0]

  const features = [
    {
      Icon: Stethoscope,
      name: "Kliniki hallar",
      description: "Real klinik ssenariləri həll et, diaqnoz qoy, müalicə planla və bilik səviyyəni yoxla.",
      cta: "Başla",
      disabled: false,
      onClick: onEnterCases,
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-[#EEEFFD] via-white to-white" />
      ),
      className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
    },
    {
      Icon: Layers,
      name: "Öyrənmə kartları",
      description: "Flashcard-larla tibbi terminologiya və faktları tez-tez təkrar et.",
      cta: "Aç",
      disabled: true,
      background: <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAFD] to-white" />,
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
    },
    {
      Icon: CalendarDays,
      name: "Dərs planlaması",
      description: "Gündəlik və həftəlik tədris cədvəlini planlaşdır.",
      cta: "Aç",
      disabled: true,
      background: <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAFD] to-white" />,
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
    },
    {
      Icon: Timer,
      name: "Pomodoro sayğacı",
      description: "Pomodoro texnikası ilə diqqətini idarə et və məhsuldarlığını artır.",
      cta: "Aç",
      disabled: true,
      background: <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAFD] to-white" />,
      className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
    },
    {
      Icon: BookMarked,
      name: "Faydalı mənbələr",
      description: "Kurasiya edilmiş tibbi resurslar, məqalələr və tövsiyə olunan kitablar.",
      cta: "Aç",
      disabled: true,
      background: <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAFD] to-white" />,
      className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: "#FAFAFD" }}>
      {/* Header */}
      <header className="border-b border-[#EEEFFD] bg-white px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold" style={{ color: "#122056" }}>ClinIQ</span>
        <button
          onClick={() => setShowProfile(true)}
          className="text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: "#5B65DC" }}>
          {name}
        </button>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#122056" }}>
            Xoş gəldiniz{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="text-sm mb-8" style={{ color: "#475467" }}>
            Nə öyrənmək istəyirsiniz?
          </p>

          <BentoGrid className="lg:grid-rows-3">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </motion.div>
      </main>
    </div>
  )
}
