import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Stethoscope, X } from "lucide-react"
import { supabase } from './supabase.js'

function ECGCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let animFrameId
    let offset = 0

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      canvas.width = width
      canvas.height = height
    })
    ro.observe(canvas.parentElement)

    function lerp(a, b, t) { return a + (b - a) * t }

    function ecgValue(t) {
      t = ((t % 1) + 1) % 1
      if (t < 0.08) return 0
      if (t < 0.13) return lerp(0, 0.18, (t - 0.08) / 0.05)
      if (t < 0.18) return lerp(0.18, 0, (t - 0.13) / 0.05)
      if (t < 0.28) return 0
      if (t < 0.30) return lerp(0, -0.25, (t - 0.28) / 0.02)
      if (t < 0.33) return lerp(-0.25, 1.0, (t - 0.30) / 0.03)
      if (t < 0.36) return lerp(1.0, -0.35, (t - 0.33) / 0.03)
      if (t < 0.40) return lerp(-0.35, 0, (t - 0.36) / 0.04)
      if (t < 0.50) return 0
      if (t < 0.57) return lerp(0, 0.28, (t - 0.50) / 0.07)
      if (t < 0.65) return lerp(0.28, 0, (t - 0.57) / 0.08)
      return 0
    }

    function drawLine(yCenterRatio, amplitudeRatio, alpha, patternPx, phase) {
      const w = canvas.width
      const h = canvas.height
      const yCenter = h * yCenterRatio
      const amp = h * amplitudeRatio
      ctx.beginPath()
      ctx.globalAlpha = alpha
      for (let x = 0; x <= w; x++) {
        const t = ((x + phase) % patternPx) / patternPx
        const y = yCenter - ecgValue(t) * amp
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    function animate() {
      const w = canvas.width
      const h = canvas.height
      if (!w || !h) { animFrameId = requestAnimationFrame(animate); return }

      ctx.clearRect(0, 0, w, h)

      ctx.strokeStyle = "rgba(91,101,220,0.08)"
      ctx.lineWidth = 1
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

      ctx.strokeStyle = "#5B65DC"
      ctx.lineWidth = 1
      drawLine(0.2, 0.1, 0.15, 300, offset * 0.7)
      drawLine(0.8, 0.1, 0.12, 300, offset * 1.3 + 150)

      ctx.lineWidth = 2
      ctx.strokeStyle = "#5B65DC"
      ctx.shadowColor = "#5B65DC"
      ctx.shadowBlur = 10
      drawLine(0.5, 0.28, 0.9, 260, offset)
      ctx.shadowBlur = 0

      ctx.lineWidth = 1.5
      drawLine(0.5, 0.28, 0.2, 260, offset + 130)

      offset += 1.2
      animFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => { cancelAnimationFrame(animFrameId); ro.disconnect() }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState("login")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!email || !password || (mode === "signup" && !fullName)) { setError("Bütün sahələr doldurulmalıdır"); return }
    if (!validateEmail(email)) { setError("E-poçt ünvanı düzgün deyil"); return }
    if (password.length < 6) { setError("Şifrə minimum 6 simvol olmalıdır"); return }
    if (mode === "signup" && password !== confirmPassword) { setError("Şifrələr uyğun deyil"); return }
    setLoading(true)
    if (mode === "login") {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError("E-poçt və ya şifrə yanlışdır")
      else if (rememberMe && data.session) {
        localStorage.setItem('sb-remember', JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }))
      }
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      if (err) setError(err.message.toLowerCase().includes("already") ? "E-poçt artıq istifadə olunur" : err.message)
      else setEmailSent(true)
    }
    setLoading(false)
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setError(null)
    if (!validateEmail(email)) { setError("E-poçt ünvanı düzgün deyil"); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (err) { setError(err.message); return }
    setResetSent(true)
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login")
    setError(null); setFullName(""); setEmail(""); setPassword(""); setConfirmPassword("")
  }

  const inputClass = "w-full border border-[#EEEFFD] rounded-lg px-3 py-2.5 text-sm outline-none transition-all placeholder:text-[#5B65DC]/30"
    + " focus:border-[#5B65DC] focus:ring-2 focus:ring-[#5B65DC]/10 text-[#122056] bg-[#FAFAFD]"

  const successContent = (emailSent || resetSent) && (
    <div className="flex flex-col items-center justify-center h-full p-10 text-center">
      <p className="text-4xl mb-4">{emailSent ? "📧" : "🔑"}</p>
      <p className="text-lg font-semibold mb-2" style={{ color: "#122056" }}>
        {emailSent ? "E-poçtunuzu yoxlayın" : "Şifrə sıfırlama linki göndərildi"}
      </p>
      <p className="text-sm leading-relaxed mb-6" style={{ color: "#475467" }}>
        <span className="font-medium" style={{ color: "#122056" }}>{email}</span> ünvanına{" "}
        {emailSent ? "təsdiq linki göndərildi." : "şifrə sıfırlama linki göndərildi."}
      </p>
      <button
        onClick={() => { setEmailSent(false); setResetSent(false); setMode("login"); setEmail("") }}
        className="text-sm hover:underline" style={{ color: "#5B65DC" }}>
        Daxil olun
      </button>
    </div>
  )

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(18,32,86,0.55)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full max-w-3xl overflow-hidden rounded-2xl flex shadow-2xl"
          style={{ maxHeight: "90vh" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Left panel — ECG animation */}
          <div className="hidden md:flex md:w-5/12 relative overflow-hidden flex-col" style={{ background: "#EEEFFD" }}>
            <ECGCanvas />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <h2 className="text-3xl font-bold mb-1 text-center" style={{ color: "#122056" }}>ClinIQ</h2>
              <p className="text-sm font-semibold text-center max-w-xs mb-3" style={{ color: "#5B65DC" }}>
                Tibb tələbələri üçün ağıllı tədris mühiti
              </p>
              <p className="text-xs text-center max-w-xs leading-relaxed" style={{ color: "rgba(18,32,86,0.6)" }}>
                Klinik halları analiz et, biliklərini möhkəmləndir və tədrisini daha effektiv təşkil et.
              </p>
            </div>
          </div>

          {/* Right panel — Form */}
          <div className="w-full md:w-7/12 flex flex-col justify-center bg-white relative overflow-y-auto" style={{ maxHeight: "90vh" }}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors z-10"
              aria-label="Bağla"
            >
              <X size={18} />
            </button>

            {successContent ? successContent : (
              <div className="p-8 md:p-10">
                <h1 className="text-2xl font-bold mb-1" style={{ color: "#122056" }}>
                  {mode === "login" ? "Xoş gəldiniz" : mode === "signup" ? "Qeydiyyat" : "Şifrəni sıfırla"}
                </h1>
                <p className="text-sm mb-7" style={{ color: "#475467" }}>
                  {mode === "login" ? "Hesabınıza daxil olun" : mode === "signup" ? "Yeni hesab yaradın" : "E-poçtunuzu daxil edin"}
                </p>

                {/* Tabs */}
                {mode !== "forgot" && (
                  <div className="flex rounded-xl p-1 mb-6" style={{ background: "#EEEFFD" }}>
                    {["login", "signup"].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setMode(m); setError(null); setFullName(""); setPassword(""); setConfirmPassword("") }}
                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                        style={mode === m
                          ? { background: "#fff", color: "#122056", boxShadow: "0 1px 4px rgba(18,32,86,0.10)" }
                          : { color: "rgba(18,32,86,0.45)" }
                        }
                      >
                        {m === "login" ? "Daxil ol" : "Qeydiyyat"}
                      </button>
                    ))}
                  </div>
                )}

                {/* Forgot password form */}
                {mode === "forgot" && (
                  <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "#475467" }}>E-poçt</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="email@example.com" className={inputClass} />
                    </div>
                    {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                    <button type="submit" disabled={loading}
                      className="w-full text-white font-medium py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: "#5B65DC" }}>
                      {loading ? "Gözləyin..." : "Sıfırlama linki göndər"}
                    </button>
                    <p className="text-center text-xs" style={{ color: "#475467" }}>
                      <button type="button" onClick={() => { setMode("login"); setError(null) }}
                        className="hover:underline" style={{ color: "#5B65DC" }}>Geri qayıt</button>
                    </p>
                  </form>
                )}

                {/* Login / Signup form */}
                {mode !== "forgot" && (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {mode === "signup" && (
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "#475467" }}>Ad Soyad</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                          placeholder="Adınız Soyadınız" className={inputClass} />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "#475467" }}>E-poçt</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="email@example.com" className={inputClass} />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium" style={{ color: "#475467" }}>Şifrə</label>
                        {mode === "login" && (
                          <button type="button" onClick={() => { setMode("forgot"); setError(null) }}
                            className="text-xs hover:underline" style={{ color: "#5B65DC" }}>
                            Şifrəni unutdunuz?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={password}
                          onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 simvol"
                          className={inputClass + " pr-10"} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-[#5B65DC]">
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    {mode === "signup" && (
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "#475467" }}>Şifrəni təsdiqləyin</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Şifrəni təkrar daxil edin" className={inputClass} />
                      </div>
                    )}

                    {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

                    {mode === "login" && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded accent-[#5B65DC]" />
                        <span className="text-xs" style={{ color: "#475467" }}>Məni yadda saxla</span>
                      </label>
                    )}

                    <motion.button
                      type="submit" disabled={loading}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      className="w-full text-white font-medium py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                      style={{ background: "#5B65DC" }}>
                      {loading ? "Gözləyin..." : mode === "login" ? "Daxil ol" : "Qeydiyyat"}
                      {!loading && <Stethoscope size={15} />}
                    </motion.button>
                  </form>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
