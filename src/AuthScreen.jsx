import { useState } from "react"
import { supabase } from './supabase.js'

export default function AuthScreen() {
  const [mode, setMode] = useState("login") // "login" | "signup"
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  function validateEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!email || !password || (mode === "signup" && !fullName)) {
      setError("Bütün sahələr doldurulmalıdır")
      return
    }
    if (!validateEmail(email)) {
      setError("E-poçt ünvanı düzgün deyil")
      return
    }
    if (password.length < 6) {
      setError("Şifrə minimum 6 simvol olmalıdır")
      return
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Şifrələr uyğun deyil")
      return
    }

    setLoading(true)

    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError("E-poçt və ya şifrə yanlışdır")
      }
    } else {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (err) {
        if (err.message.toLowerCase().includes("already")) {
          setError("E-poçt artıq istifadə olunur")
        } else {
          setError(err.message)
        }
      } else {
        setEmailSent(true)
      }
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
    setError(null)
    setFullName("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
  }

  if (resetSent) return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-medium text-indigo-700">ClinIQ</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
          <p className="text-2xl mb-3">🔑</p>
          <p className="text-sm font-medium text-stone-800 mb-2">Şifrə sıfırlama linki göndərildi</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            <span className="font-medium text-stone-600">{email}</span> ünvanına şifrə sıfırlama linki göndərildi.
          </p>
          <button
            onClick={() => { setResetSent(false); setMode("login"); setEmail("") }}
            className="mt-5 text-xs text-indigo-600 hover:underline">
            Daxil olun
          </button>
        </div>
      </div>
    </div>
  )

  if (emailSent) return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-medium text-indigo-700">ClinIQ</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
          <p className="text-2xl mb-3">📧</p>
          <p className="text-sm font-medium text-stone-800 mb-2">E-poçtunuzu yoxlayın</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            <span className="font-medium text-stone-600">{email}</span> ünvanına təsdiq linki göndərildi.
            Linki açdıqdan sonra daxil ola bilərsiniz.
          </p>
          <button
            onClick={() => { setEmailSent(false); setMode("login") }}
            className="mt-5 text-xs text-indigo-600 hover:underline">
            Daxil olun
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-medium text-indigo-700">ClinIQ</span>
          <p className="text-sm text-stone-400 mt-1">Azərbaycan Tibbi Simulator</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <p className="text-sm font-medium text-stone-700 mb-4">
            {mode === "login" ? "Daxil olun" : "Qeydiyyatdan keçin"}
          </p>

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">E-poçt</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-2 rounded-lg text-sm transition-colors mt-1">
                {loading ? "Gözləyin..." : "Şifrəni sıfırla"}
              </button>
              <p className="text-xs text-stone-400 text-center">
                <button type="button" onClick={() => { setMode("login"); setError(null) }} className="text-indigo-600 hover:underline">
                  Geri qayıt
                </button>
              </p>
            </form>
          )}

          {mode !== "forgot" && <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Ad Soyad</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-stone-500 mb-1 block">E-poçt</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-stone-500">Şifrə</label>
                {mode === "login" && (
                  <button type="button" onClick={() => { setMode("forgot"); setError(null) }} className="text-xs text-indigo-500 hover:underline">
                    Şifrəni unutdunuz?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 simvol"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Şifrəni təsdiqləyin</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifrəni təkrar daxil edin"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-medium py-2 rounded-lg text-sm transition-colors mt-1">
              {loading ? "Gözləyin..." : mode === "login" ? "Daxil ol" : "Qeydiyyat"}
            </button>
          </form>}

          {mode !== "forgot" && (
            <p className="text-xs text-stone-400 text-center mt-4">
              {mode === "login" ? (
                <>
                  Hesabınız yoxdur?{" "}
                  <button onClick={switchMode} className="text-indigo-600 hover:underline">
                    Qeydiyyatdan keçin
                  </button>
                </>
              ) : (
                <>
                  Artıq hesabınız var?{" "}
                  <button onClick={switchMode} className="text-indigo-600 hover:underline">
                    Daxil olun
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
