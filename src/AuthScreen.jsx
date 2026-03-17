import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Stethoscope } from "lucide-react"
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

      // Subtle grid
      ctx.strokeStyle = "rgba(91,101,220,0.08)"
      ctx.lineWidth = 1
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

      // Background faint lines
      ctx.strokeStyle = "#5B65DC"
      ctx.lineWidth = 1
      drawLine(0.2, 0.1, 0.15, 300, offset * 0.7)
      drawLine(0.8, 0.1, 0.12, 300, offset * 1.3 + 150)

      // Main ECG line with glow
      ctx.lineWidth = 2
      ctx.strokeStyle = "#5B65DC"
      ctx.shadowColor = "#5B65DC"
      ctx.shadowBlur = 10
      drawLine(0.5, 0.28, 0.9, 260, offset)
      ctx.shadowBlur = 0

      // Second line, offset phase
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

export default function AuthScreen() {
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
    + " focus:border-[#5B65DC] focus:ring-2 focus:ring-[#5B65DC]/10"
    + " text-[#122056]"
    + " bg-[#FAFAFD]"

  if (resetSent || emailSent) return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: "#FAFAFD" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <p className="text-3xl mb-3">{emailSent ? "📧" : "🔑"}</p>
        <p className="text-sm font-semibold mb-2" style={{ color: "#122056" }}>
          {emailSent ? "E-poçtunuzu yoxlayın" : "Şifrə sıfırlama linki göndərildi"}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#475467" }}>
          <span className="font-medium" style={{ color: "#122056" }}>{email}</span> ünvanına{" "}
          {emailSent ? "təsdiq linki göndərildi. Linki açdıqdan sonra daxil ola bilərsiniz." : "şifrə sıfırlama linki göndərildi."}
        </p>
        <button onClick={() => { setEmailSent(false); setResetSent(false); setMode("login"); setEmail("") }}
          className="mt-5 text-xs hover:underline" style={{ color: "#5B65DC" }}>
          Daxil olun
        </button>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: "#FAFAFD" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex shadow-2xl"
      >
        {/* Left panel — ECG animation */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col"
          style={{ background: "#EEEFFD" }}>
          <ECGCanvas />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="text-3xl font-bold mb-1 text-center" style={{ color: "#122056" }}>
              ClinIQ
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="text-sm font-semibold text-center max-w-xs mb-3" style={{ color: "#5B65DC" }}>
              Tibb tələbələri üçün ağıllı tədris mühiti
            </motion.p>
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
              className="text-xs text-center max-w-xs leading-relaxed" style={{ color: "rgba(18,32,86,0.6)" }}>
              Klinik halları analiz et, biliklərini möhkəmləndir və tədrisini daha effektiv təşkil et.
            </motion.p>
          </div>
        </div>

        {/* Right panel — Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "#122056" }}>
              {mode === "login" ? "Xoş gəldiniz" : mode === "signup" ? "Qeydiyyat" : "Şifrəni sıfırla"}
            </h1>
            <p className="text-sm mb-8" style={{ color: "#475467" }}>
              {mode === "login" ? "Hesabınıza daxil olun" : mode === "signup" ? "Yeni hesab yaradın" : "E-poçtunuzu daxil edin"}
            </p>

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
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#5B65DC]"
                    />
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

                <p className="text-center text-xs mt-1" style={{ color: "#475467" }}>
                  {mode === "login" ? (
                    <>Hesabınız yoxdur?{" "}
                      <button type="button" onClick={switchMode} className="hover:underline" style={{ color: "#5B65DC" }}>
                        Qeydiyyatdan keçin
                      </button>
                    </>
                  ) : (
                    <>Artıq hesabınız var?{" "}
                      <button type="button" onClick={switchMode} className="hover:underline" style={{ color: "#5B65DC" }}>
                        Daxil olun
                      </button>
                    </>
                  )}
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
