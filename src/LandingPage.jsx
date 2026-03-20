import { useState, useEffect } from "react"
import { Stethoscope, BookOpen, LayoutDashboard, Play } from "lucide-react"
import { supabase } from './supabase.js'
import AuthModal from './AuthModal.jsx'

const DEFAULTS = {
  hero_headline:  'Klinik düşüncəni mühazirədə öyrənmək olmur.',
  hero_subheading: 'ClinIQ sənə real klinik qərarvermə məşq etdirməyə kömək edir — xəstə qarşısına çıxmadan əvvəl hazır ol.',
  problem_body:   'Tibb təhsili çox vaxt nəzəriyyə ilə başlayır və birbaşa xəstə ilə bitir. Arada isə ən vacib mərhələ — klinik düşüncə məşqi — çatışmır. Nəticədə tələbələr palataya tam hazır olmadan daxil olur.',
  cta_headline:   'Klinikaya daha hazır çıxmaq istəyirsən?',
  cta_subtext:    'Beta mərhələsindədir — erkən qoşul və pulsuz istifadə et',
  quote_text:     'Bu platforma klinik düşüncəmə fərqli baxış qazandırdı. İlk dəfə diaqnoz qoymağın nə demək olduğunu hiss etdim.',
}

export default function LandingPage() {
  const [content, setContent] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.from('landing_content').select('*').eq('id', 1).single()
      .then(({ data }) => setContent(data || DEFAULTS))
      .catch(() => setContent(DEFAULTS))
  }, [])

  if (!content) return null

  const c = content
  return (
    <div className="min-h-screen bg-[#FAFAFD] font-sans">

      {/* ── Full-page fixed tech/medical background ───────────────────────── */}
      <div className="fixed inset-0 pointer-events-none select-none" style={{ zIndex: 0 }} aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.12 }}>
          <defs>
            <pattern id="tech-bg" x="0" y="0" width="600" height="300" patternUnits="userSpaceOnUse">

              {/* ── Graph paper grid (light) ── */}
              {[0,30,60,90,120,150,180,210,240,270,300].map(y => (
                <line key={`gh${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#5B65DC" strokeWidth="0.3" />
              ))}
              {[0,30,60,90,120,150,180,210,240,270,300,330,360,390,420,450,480,510,540,570,600].map(x => (
                <line key={`gv${x}`} x1={x} y1="0" x2={x} y2="300" stroke="#5B65DC" strokeWidth="0.3" />
              ))}

              {/* ── ECG trace 1 (top band) ── */}
              <path d="M-10,72 L40,72 L50,63 L60,72 L80,72 L87,72 L92,28 L97,92 L102,72 L122,72 L130,56 L140,72 L210,72 L260,72 L270,63 L280,72 L300,72 L307,72 L312,28 L317,92 L322,72 L342,72 L350,56 L360,72 L430,72 L480,72 L490,63 L500,72 L520,72 L527,72 L532,28 L537,92 L542,72 L562,72 L570,56 L580,72 L610,72"
                fill="none" stroke="#5B65DC" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

              {/* ── ECG trace 2 (bottom band, offset) ── */}
              <path d="M-10,228 L20,228 L30,219 L40,228 L70,228 L77,228 L82,184 L87,248 L92,228 L112,228 L120,212 L130,228 L200,228 L250,228 L260,219 L270,228 L290,228 L297,228 L302,184 L307,248 L312,228 L332,228 L340,212 L350,228 L420,228 L470,228 L480,219 L490,228 L510,228 L517,228 L522,184 L527,248 L532,228 L552,228 L560,212 L570,228 L610,228"
                fill="none" stroke="#5B65DC" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

              {/* ── Lab flask A (Erlenmeyer) ── */}
              <path d="M178,220 L178,188 L168,220 Z" fill="none" stroke="#5B65DC" strokeWidth="1" strokeLinejoin="round" />
              <path d="M178,188 L188,220" fill="none" stroke="#5B65DC" strokeWidth="1" strokeLinecap="round" />
              <line x1="166" y1="220" x2="190" y2="220" stroke="#5B65DC" strokeWidth="1" strokeLinecap="round" />
              <line x1="175" y1="188" x2="181" y2="188" stroke="#5B65DC" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="177" y1="185" x2="179" y2="185" stroke="#5B65DC" strokeWidth="1.2" strokeLinecap="round" />
              {/* bubbles */}
              <circle cx="174" cy="210" r="1.5" fill="none" stroke="#5B65DC" strokeWidth="0.7" />
              <circle cx="180" cy="215" r="1" fill="none" stroke="#5B65DC" strokeWidth="0.7" />
              <circle cx="176" cy="205" r="1" fill="none" stroke="#5B65DC" strokeWidth="0.7" />

              {/* ── Lab flask B (round bottom) ── */}
              <circle cx="448" cy="215" r="14" fill="none" stroke="#5B65DC" strokeWidth="1" />
              <line x1="444" y1="201" x2="444" y2="188" stroke="#5B65DC" strokeWidth="1" />
              <line x1="452" y1="201" x2="452" y2="188" stroke="#5B65DC" strokeWidth="1" />
              <line x1="442" y1="188" x2="454" y2="188" stroke="#5B65DC" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="444" y1="185" x2="452" y2="185" stroke="#5B65DC" strokeWidth="1" strokeLinecap="round" />
              {/* liquid level */}
              <path d="M435,218 Q448,214 461,218" fill="none" stroke="#5B65DC" strokeWidth="0.8" />
              {/* bubbles */}
              <circle cx="444" cy="212" r="1.5" fill="none" stroke="#5B65DC" strokeWidth="0.7" />
              <circle cx="452" cy="216" r="1" fill="none" stroke="#5B65DC" strokeWidth="0.7" />

              {/* ── Circuit board (chip + traces) ── */}
              <rect x="50" y="118" width="40" height="34" rx="3" fill="none" stroke="#5B65DC" strokeWidth="1" />
              {/* pin left */}
              <line x1="40" y1="124" x2="50" y2="124" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="40" y1="132" x2="50" y2="132" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="40" y1="140" x2="50" y2="140" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="40" y1="148" x2="50" y2="148" stroke="#5B65DC" strokeWidth="0.9" />
              {/* pin right */}
              <line x1="90" y1="124" x2="100" y2="124" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="90" y1="132" x2="100" y2="132" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="90" y1="140" x2="100" y2="140" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="90" y1="148" x2="100" y2="148" stroke="#5B65DC" strokeWidth="0.9" />
              {/* pin top */}
              <line x1="60" y1="108" x2="60" y2="118" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="70" y1="108" x2="70" y2="118" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="80" y1="108" x2="80" y2="118" stroke="#5B65DC" strokeWidth="0.9" />
              {/* corner notch */}
              <circle cx="53" cy="121" r="2" fill="none" stroke="#5B65DC" strokeWidth="0.7" />
              {/* trace routes */}
              <polyline points="100,124 110,124 110,108 130,108" fill="none" stroke="#5B65DC" strokeWidth="0.8" />
              <polyline points="100,148 114,148 114,160 135,160" fill="none" stroke="#5B65DC" strokeWidth="0.8" />
              <circle cx="130" cy="108" r="2" fill="none" stroke="#5B65DC" strokeWidth="0.8" />
              <circle cx="135" cy="160" r="2" fill="none" stroke="#5B65DC" strokeWidth="0.8" />

              {/* ── Medical cross ── */}
              <line x1="335" y1="136" x2="335" y2="164" stroke="#5B65DC" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="321" y1="150" x2="349" y2="150" stroke="#5B65DC" strokeWidth="1.6" strokeLinecap="round" />

              {/* ── Second medical cross ── */}
              <line x1="520" y1="258" x2="520" y2="282" stroke="#5B65DC" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="508" y1="270" x2="532" y2="270" stroke="#5B65DC" strokeWidth="1.4" strokeLinecap="round" />

              {/* ── Abstract monitor icon ── */}
              <rect x="360" y="92" width="38" height="26" rx="3" fill="none" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="373" y1="118" x2="373" y2="125" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="385" y1="118" x2="385" y2="125" stroke="#5B65DC" strokeWidth="0.9" />
              <line x1="367" y1="125" x2="391" y2="125" stroke="#5B65DC" strokeWidth="0.9" />
              <path d="M366,108 L372,103 L376,110 L380,100 L384,108" fill="none" stroke="#5B65DC" strokeWidth="0.8" strokeLinecap="round" />

              {/* ── Dot grid top-right ── */}
              <circle cx="535" cy="35" r="1.5" fill="#5B65DC" />
              <circle cx="555" cy="35" r="1.5" fill="#5B65DC" />
              <circle cx="575" cy="35" r="1.5" fill="#5B65DC" />
              <circle cx="535" cy="52" r="1.5" fill="#5B65DC" />
              <circle cx="555" cy="52" r="1.5" fill="#5B65DC" />
              <circle cx="575" cy="52" r="1.5" fill="#5B65DC" />

            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tech-bg)" />
        </svg>
      </div>

      {/* ── SECTION 1: Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#EEEFFD] px-6 py-4" style={{ position: 'relative', zIndex: 50 }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-[#122056] font-semibold text-lg tracking-tight">ClinIQ</span>
          <button
            onClick={() => setShowAuth(true)}
            className="text-[#5B65DC] font-medium text-sm hover:opacity-80 transition-opacity">
            Daxil ol
          </button>
        </div>
      </nav>

      {/* ── SECTION 2: Hero ───────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 text-center overflow-hidden" style={{ zIndex: 1 }}>

        {/* Top-left corner accent */}
        <svg
          width="120" height="80"
          viewBox="0 0 120 80"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-6 left-6 pointer-events-none select-none"
          style={{ opacity: 0.08 }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" fill="none" stroke="#5B65DC" strokeWidth="1.5" />
          <circle cx="60" cy="12" r="4" fill="none" stroke="#5B65DC" strokeWidth="1.5" />
          <circle cx="108" cy="12" r="4" fill="none" stroke="#5B65DC" strokeWidth="1.5" />
          <circle cx="12" cy="50" r="4" fill="none" stroke="#5B65DC" strokeWidth="1.5" />
          <circle cx="60" cy="50" r="4" fill="none" stroke="#5B65DC" strokeWidth="1.5" />
          <line x1="12" y1="12" x2="60" y2="12" stroke="#5B65DC" strokeWidth="1" />
          <line x1="60" y1="12" x2="108" y2="12" stroke="#5B65DC" strokeWidth="1" />
          <line x1="12" y1="12" x2="12" y2="50" stroke="#5B65DC" strokeWidth="1" />
          <line x1="60" y1="12" x2="60" y2="50" stroke="#5B65DC" strokeWidth="1" />
          <line x1="12" y1="50" x2="60" y2="50" stroke="#5B65DC" strokeWidth="1" />
          <line x1="108" y1="12" x2="108" y2="68" stroke="#5B65DC" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="60" y1="50" x2="108" y2="68" stroke="#5B65DC" strokeWidth="1" strokeDasharray="3 3" />
        </svg>

        {/* Bottom-right corner accent */}
        <svg
          width="120" height="80"
          viewBox="0 0 120 80"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-6 right-6 pointer-events-none select-none"
          style={{ opacity: 0.08 }}
          aria-hidden="true"
        >
          <circle cx="108" cy="68" r="4" fill="none" stroke="#5B65DC" strokeWidth="1.5" />
          <circle cx="60" cy="68" r="4" fill="none" stroke="#5B65DC" strokeWidth="1.5" />
          <circle cx="12" cy="68" r="4" fill="none" stroke="#5B65DC" strokeWidth="1.5" />
          <circle cx="108" cy="30" r="4" fill="none" stroke="#5B65DC" strokeWidth="1.5" />
          <circle cx="60" cy="30" r="4" fill="none" stroke="#5B65DC" strokeWidth="1.5" />
          <line x1="108" y1="68" x2="60" y2="68" stroke="#5B65DC" strokeWidth="1" />
          <line x1="60" y1="68" x2="12" y2="68" stroke="#5B65DC" strokeWidth="1" />
          <line x1="108" y1="68" x2="108" y2="30" stroke="#5B65DC" strokeWidth="1" />
          <line x1="60" y1="68" x2="60" y2="30" stroke="#5B65DC" strokeWidth="1" />
          <line x1="108" y1="30" x2="60" y2="30" stroke="#5B65DC" strokeWidth="1" />
          <line x1="12" y1="68" x2="12" y2="12" stroke="#5B65DC" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="60" y1="30" x2="12" y2="12" stroke="#5B65DC" strokeWidth="1" strokeDasharray="3 3" />
        </svg>

        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-[#5B65DC]/10 text-[#5B65DC] text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            Beta mərhələsindədir
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#122056] leading-tight">
            {c.hero_headline}
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto mt-4 leading-relaxed">
            {c.hero_subheading}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setShowAuth(true)}
              className="bg-[#5B65DC] text-white rounded-xl px-6 py-3 font-medium hover:opacity-90 transition-opacity">
              Pulsuz sına →
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="border border-[#5B65DC] text-[#5B65DC] rounded-xl px-6 py-3 font-medium hover:bg-[#5B65DC]/5 transition-colors">
              Daxil ol
            </button>
          </div>
          <p className="mt-3 text-xs text-stone-400">Qeydiyyat 30 saniyə çəkir</p>

          {/* Video placeholder */}
          <div className="mt-12 mx-auto max-w-3xl rounded-2xl bg-stone-900 border border-stone-700 aspect-video flex flex-col items-center justify-center gap-3">
            <Play size={48} className="text-white opacity-80" />
            <p className="text-sm text-stone-400">Tətbiqin icmalı — tezliklə</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Problem ────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center" style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(238,239,253,0.75)' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#5B65DC] font-medium mb-4">Niyə ClinIQ?</p>
          <p className="text-lg text-stone-700 leading-relaxed">
            {c.problem_body}
          </p>
          <p className="mt-6 text-xl font-semibold text-[#122056]">ClinIQ bu boşluğu doldurur.</p>
        </div>
      </section>

      {/* ── SECTION 4: How it works ───────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(255,255,255,0.75)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-[#5B65DC] font-medium mb-2">Necə işləyir?</p>
            <h2 className="text-3xl font-bold text-[#122056]">Üç addımda klinik düşüncə</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                n: 1,
                title: "Klinik hal seç",
                desc: "Real Azərbaycan dilindəki ssenarilər arasından birini seç — infeksion xəstəliklər, kardiologiya, endokrinologiya və daha çox",
              },
              {
                n: 2,
                title: "Qərarlar ver",
                desc: "Anamnez, müayinə, analizlər, diaqnoz və müalicə — addım-addım klinik qərarvermə məşqi",
              },
              {
                n: 3,
                title: "Düşüncəni analiz et",
                desc: "Hər addımda xallar qazanırsan. Nəticə ekranında güclü və zəif tərəflərini görürsən",
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-white border border-[#EEEFFD] rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-[#5B65DC] text-white font-bold flex items-center justify-center mb-4">
                  {n}
                </div>
                <h3 className="font-semibold text-[#122056] text-lg mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Features ───────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(250,250,253,0.75)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-[#5B65DC] font-medium mb-2">Nələr var?</p>
            <h2 className="text-3xl font-bold text-[#122056]">Tədrisin hər tərəfi üçün</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-[#EEEFFD] rounded-2xl p-6">
              <Stethoscope size={28} className="text-[#5B65DC] mb-4" />
              <h3 className="font-semibold text-[#122056] mb-2">Klinik simulyasiya</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Real xəstə halları ilə qərarvermə bacarığını inkişaf etdir. Hər hal 6 addımdan ibarətdir: anamnez, müayinə, analizlər, diaqnoz, müalicə, nəticə.
              </p>
            </div>
            <div className="bg-white border border-[#EEEFFD] rounded-2xl p-6">
              <BookOpen size={28} className="text-[#5B65DC] mb-4" />
              <h3 className="font-semibold text-[#122056] mb-2">Aktiv öyrənmə</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Sənədlərdən avtomatik flashcard yarat. Öyrənmə kartları ilə bilikləri uzunmüddətli möhkəmləndir.
              </p>
            </div>
            <div className="relative bg-white border border-[#EEEFFD] rounded-2xl p-6">
              <span className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                Tezliklə
              </span>
              <LayoutDashboard size={28} className="text-[#5B65DC] mb-4" />
              <h3 className="font-semibold text-[#122056] mb-2">Özünü idarə et</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Pomodoro, imtahan geri sayımı, qeydlər və tədris planı — hamısı bir yerdə.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Social proof ───────────────────────────────────────── */}
      <section className="py-20 px-6 text-center" style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(238,239,253,0.75)' }}>
        <div className="max-w-lg mx-auto">
          <div className="bg-white border border-[#EEEFFD] rounded-2xl shadow-sm p-8">
            <p className="text-5xl leading-none font-serif text-[#5B65DC]">"</p>
            <p className="text-lg text-stone-700 italic leading-relaxed mt-2">
              {c.quote_text}
            </p>
            <p className="mt-4 text-sm text-stone-500 font-medium">— 4-cü kurs tibb tələbəsi, AzMU</p>
          </div>
          <p className="mt-8 text-sm text-stone-500">
            Azərbaycanda tibb tələbəsi tərəfindən hazırlanıb — tibb tələbələri üçün.
          </p>
        </div>
      </section>

      {/* ── SECTION 7: Final CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center" style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(18,32,86,0.92)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white">{c.cta_headline}</h2>
          <p className="mt-4 text-lg text-white/70">
            {c.cta_subtext}
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="mt-8 bg-white text-[#122056] rounded-xl px-8 py-3 font-semibold hover:opacity-90 transition-opacity">
            İndi qoşul →
          </button>
        </div>
      </section>

      {/* ── SECTION 8: Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-[#EEEFFD] py-8 px-6 text-center" style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(255,255,255,0.75)' }}>
        <p className="text-sm text-stone-500">ClinIQ — Azərbaycan tibb tələbələri üçün klinik simulyasiya platformu</p>
        <p className="text-xs text-stone-400 mt-1">© 2026 ClinIQ. Bütün hüquqlar qorunur.</p>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
