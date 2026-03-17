import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, FileText, Image, File, X, Upload, Loader2 } from "lucide-react"

const ACCEPTED_TYPES = {
  "application/pdf": { label: "PDF", icon: FileText },
  "image/jpeg": { label: "JPG", icon: Image },
  "image/png": { label: "PNG", icon: Image },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOCX", icon: FileText },
  "text/plain": { label: "TXT", icon: File },
}
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.docx,.txt"

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function FlashcardsPage({ onBack }) {
  // ── Upload / parse state ─────────────────────────────────────────────────
  const [file, setFile] = useState(null)
  const [text, setText] = useState("")
  const [dragging, setDragging] = useState(false)
  const [parseStatus, setParseStatus] = useState("idle")
  const [parseError, setParseError] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [selectedSections, setSelectedSections] = useState(new Set())

  // ── Generate / deck state ────────────────────────────────────────────────
  const [view, setView] = useState("input") // "input" | "deck"
  const [generateStatus, setGenerateStatus] = useState("idle") // "idle" | "loading"
  const [generateError, setGenerateError] = useState(null)
  const [flashcards, setFlashcards] = useState([])
  const [cardQueue, setCardQueue] = useState([])
  const [cardKey, setCardKey] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownCount, setKnownCount] = useState(0)

  const inputRef = useRef(null)

  // ── Auto-parse when file is set ──────────────────────────────────────────
  useEffect(() => {
    if (!file) {
      setParsedData(null)
      setSelectedSections(new Set())
      setParseStatus("idle")
      setParseError(null)
      return
    }
    setParseStatus("loading")
    setParseError(null)
    setParsedData(null)
    setSelectedSections(new Set())

    const formData = new FormData()
    formData.append("file", file)

    fetch("/api/flashcards-parse", { method: "POST", body: formData })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || "Fayl oxuna bilmədi.")
        return data
      })
      .then((data) => {
        setParsedData(data)
        setSelectedSections(new Set(data.sections.map((_, i) => i)))
        setParseStatus("done")
      })
      .catch((err) => {
        setParseError(err.message)
        setParseStatus("error")
      })
  }, [file])

  // ── File helpers ─────────────────────────────────────────────────────────
  function acceptFile(f) {
    if (f && ACCEPTED_TYPES[f.type]) setFile(f)
  }
  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0]) }, [])
  const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])
  function onInputChange(e) { acceptFile(e.target.files?.[0]); e.target.value = "" }

  // ── Section selection helpers ────────────────────────────────────────────
  function toggleSection(i) {
    setSelectedSections((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const totalSelectedWords = parsedData
    ? parsedData.sections.filter((_, i) => selectedSections.has(i)).reduce((s, sec) => s + sec.wordCount, 0)
    : 0

  const canGenerate = (() => {
    if (generateStatus === "loading") return false
    if (parsedData) {
      if (parsedData.isImage) return true
      return selectedSections.size > 0
    }
    return text.trim().length > 0
  })()

  // ── Generate handler ─────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!canGenerate) return
    setGenerateStatus("loading")
    setGenerateError(null)

    try {
      let body
      if (parsedData?.isImage && file) {
        const dataUrl = await fileToBase64(file)
        const base64 = dataUrl.split(",")[1]
        body = JSON.stringify({ isImage: true, fileBase64: base64, mimeType: file.type })
      } else {
        let content
        if (parsedData && !parsedData.isImage) {
          content = parsedData.sections
            .filter((_, i) => selectedSections.has(i))
            .map((s) => `${s.title}\n${s.content}`)
            .join("\n\n")
        } else {
          content = text
        }
        body = JSON.stringify({ isImage: false, content })
      }

      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Xəta baş verdi.")

      setFlashcards(data.flashcards)
      setCardQueue(data.flashcards.map((_, i) => i))
      setKnownCount(0)
      setIsFlipped(false)
      setCardKey(0)
      setView("deck")
    } catch (err) {
      setGenerateError(err.message)
    } finally {
      setGenerateStatus("idle")
    }
  }

  // ── Deck handlers ────────────────────────────────────────────────────────
  function handleKnown() {
    setKnownCount((c) => c + 1)
    setCardQueue((q) => q.slice(1))
    setIsFlipped(false)
    setCardKey((k) => k + 1)
  }

  function handleRetry() {
    setCardQueue((q) => [...q.slice(1), q[0]])
    setIsFlipped(false)
    setCardKey((k) => k + 1)
  }

  function restartDeck() {
    setCardQueue(flashcards.map((_, i) => i))
    setKnownCount(0)
    setIsFlipped(false)
    setCardKey((k) => k + 1)
  }

  const FileIcon = file ? (ACCEPTED_TYPES[file.type]?.icon ?? File) : File

  // ── Deck view ────────────────────────────────────────────────────────────
  if (view === "deck") {
    const total = flashcards.length
    const isDone = cardQueue.length === 0
    const card = flashcards[cardQueue[0]]
    const progress = knownCount / total

    return (
      <div className="min-h-screen" style={{ background: "#FAFAFD" }}>
        <header className="border-b border-[#EEEFFD] bg-white px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => setView("input")}
            className="p-1.5 rounded-lg hover:bg-[#EEEFFD] transition-colors"
            style={{ color: "#5B65DC" }}>
            <ArrowLeft size={18} />
          </button>
          <span className="text-xl font-bold" style={{ color: "#122056" }}>Öyrənmə kartları</span>
        </header>

        <main className="max-w-lg mx-auto px-6 py-10">
          {isDone ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div className="text-5xl">✅</div>
              <div>
                <p className="text-xl font-bold mb-1" style={{ color: "#122056" }}>Tamamlandı!</p>
                <p className="text-sm" style={{ color: "#475467" }}>
                  {knownCount} / {total} kart öyrənildi
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={restartDeck}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border border-[#EEEFFD] hover:bg-[#EEEFFD] transition-colors"
                  style={{ color: "#5B65DC" }}>
                  Yenidən başla
                </button>
                <button
                  onClick={() => setView("input")}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: "#5B65DC", color: "#FFFFFF" }}>
                  Geri
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-5"
            >
              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs mb-2" style={{ color: "#475467" }}>
                  <span>İrəliləyiş</span>
                  <span>{knownCount} / {total}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#EEEFFD" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "#5B65DC" }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={cardKey}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.22 }}
                >
                  <div
                    style={{ perspective: "1200px" }}
                    onClick={() => !isFlipped && setIsFlipped(true)}
                    className={isFlipped ? "" : "cursor-pointer"}
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.45, ease: "easeInOut" }}
                      style={{ transformStyle: "preserve-3d", position: "relative", minHeight: "220px" }}
                    >
                      {/* Front */}
                      <div
                        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                        className="absolute inset-0 bg-white border border-[#EEEFFD] rounded-2xl p-6 flex flex-col justify-between"
                      >
                        <p className="text-base font-medium leading-relaxed" style={{ color: "#122056" }}>
                          {card.question}
                        </p>
                        <p className="text-xs text-center mt-4" style={{ color: "#a0aec0" }}>
                          Cavabı görmək üçün toxunun
                        </p>
                      </div>
                      {/* Back */}
                      <div
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                          background: "#EEEFFD",
                        }}
                        className="absolute inset-0 rounded-2xl p-6 flex items-center justify-center"
                      >
                        <p className="text-base leading-relaxed text-center" style={{ color: "#122056" }}>
                          {card.answer}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Action buttons */}
              <AnimatePresence>
                {isFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3"
                  >
                    <button
                      onClick={handleRetry}
                      className="flex-1 py-3 rounded-xl font-medium text-sm transition-colors hover:opacity-90"
                      style={{ background: "#FFF7ED", color: "#EA580C" }}>
                      🔁 Təkrar bax
                    </button>
                    <button
                      onClick={handleKnown}
                      className="flex-1 py-3 rounded-xl font-medium text-sm transition-colors hover:opacity-90"
                      style={{ background: "#F0FDF4", color: "#16A34A" }}>
                      ✅ Bildim
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>
    )
  }

  // ── Input view ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#FAFAFD" }}>
      <header className="border-b border-[#EEEFFD] bg-white px-6 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-[#EEEFFD] transition-colors"
          style={{ color: "#5B65DC" }}>
          <ArrowLeft size={18} />
        </button>
        <span className="text-xl font-bold" style={{ color: "#122056" }}>Öyrənmə kartları</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-5"
        >
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#122056" }}>Flashcard yarat</h1>
            <p className="text-sm" style={{ color: "#475467" }}>
              Fayl yükləyin və ya mətn yapışdırın — biz flashcard-ları sizin üçün hazırlayacağıq.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !file && inputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 py-10 px-6 select-none"
            style={{
              borderColor: dragging ? "#5B65DC" : "#EEEFFD",
              background: dragging ? "#EEEFFD" : "#FFFFFF",
              cursor: file ? "default" : "pointer",
            }}
          >
            {file ? (
              <div
                className="flex items-center gap-3 w-full max-w-sm bg-[#FAFAFD] border border-[#EEEFFD] rounded-xl px-4 py-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 rounded-lg" style={{ background: "#EEEFFD" }}>
                  <FileIcon size={18} style={{ color: "#5B65DC" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#122056" }}>{file.name}</p>
                  <p className="text-xs" style={{ color: "#475467" }}>
                    {ACCEPTED_TYPES[file.type]?.label} · {formatBytes(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-1 rounded-full hover:bg-[#EEEFFD] transition-colors flex-shrink-0"
                  style={{ color: "#475467" }}>
                  <X size={15} />
                </button>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-2xl" style={{ background: "#EEEFFD" }}>
                  <Upload size={22} style={{ color: "#5B65DC" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "#122056" }}>Faylı buraya sürükləyin</p>
                  <p className="text-xs mt-0.5" style={{ color: "#475467" }}>
                    və ya <span style={{ color: "#5B65DC" }}>seçmək üçün klikləyin</span>
                  </p>
                </div>
                <p className="text-xs" style={{ color: "#a0aec0" }}>PDF, JPG, PNG, DOCX, TXT</p>
              </>
            )}
          </div>

          <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={onInputChange} className="hidden" />

          {/* Parse loading */}
          {parseStatus === "loading" && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 size={16} className="animate-spin" style={{ color: "#5B65DC" }} />
              <span className="text-sm" style={{ color: "#475467" }}>Fayl təhlil edilir...</span>
            </div>
          )}

          {/* Parse error */}
          {parseStatus === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {parseError}
            </div>
          )}

          {/* Section selector */}
          {parseStatus === "done" && parsedData && !parsedData.isImage && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium" style={{ color: "#122056" }}>
                  {parsedData.sections.length} bölmə tapıldı
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedSections(new Set(parsedData.sections.map((_, i) => i)))}
                    className="text-xs font-medium hover:opacity-70 transition-opacity"
                    style={{ color: "#5B65DC" }}>
                    Hamısını seç
                  </button>
                  <button
                    onClick={() => setSelectedSections(new Set())}
                    className="text-xs font-medium hover:opacity-70 transition-opacity"
                    style={{ color: "#475467" }}>
                    Hamısını sil
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#EEEFFD] overflow-hidden max-h-64 overflow-y-auto">
                {parsedData.sections.map((section, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#FAFAFD] border-b border-[#EEEFFD] last:border-b-0"
                    style={{ background: selectedSections.has(i) ? "#FAFAFD" : "#FFFFFF" }}>
                    <input
                      type="checkbox"
                      checked={selectedSections.has(i)}
                      onChange={() => toggleSection(i)}
                      className="mt-0.5 accent-[#5B65DC]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#122056" }}>{section.title}</p>
                      <p className="text-xs" style={{ color: "#475467" }}>
                        {section.pageRange !== "-" ? `Səh. ${section.pageRange} · ` : ""}
                        {section.wordCount.toLocaleString()} söz
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {totalSelectedWords > 3000 && (
                <p className="mt-2 text-xs" style={{ color: "#d97706" }}>
                  ⚠ Böyük seçim — yalnız ən əhəmiyyətli məzmun istifadə ediləcək
                </p>
              )}
            </div>
          )}

          {/* Divider + text area (only when no file) */}
          {!file && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "#EEEFFD" }} />
                <span className="text-xs" style={{ color: "#a0aec0" }}>Və ya</span>
                <div className="flex-1 h-px" style={{ background: "#EEEFFD" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#122056" }}>
                  Mətni əl ilə yapışdırın
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Mətni buraya yapışdırın..."
                  rows={6}
                  className="w-full rounded-xl border px-4 py-3 text-sm resize-none outline-none transition-colors"
                  style={{ borderColor: "#EEEFFD", background: "#FFFFFF", color: "#122056" }}
                  onFocus={(e) => (e.target.style.borderColor = "#5B65DC")}
                  onBlur={(e) => (e.target.style.borderColor = "#EEEFFD")}
                />
              </div>
            </>
          )}

          {/* Generate error */}
          {generateError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {generateError}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            style={{
              background: canGenerate ? "#5B65DC" : "#EEEFFD",
              color: canGenerate ? "#FFFFFF" : "#a0aec0",
              cursor: canGenerate ? "pointer" : "not-allowed",
            }}
          >
            {generateStatus === "loading" ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Öyrənmə kartları hazırlanır...
              </>
            ) : (
              "Öyrənmə kartları yarat"
            )}
          </button>
        </motion.div>
      </main>
    </div>
  )
}
