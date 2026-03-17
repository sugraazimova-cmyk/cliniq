import { useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, FileText, Image, File, X, Upload } from "lucide-react"

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

export default function FlashcardsPage({ onBack }) {
  const [file, setFile] = useState(null)
  const [text, setText] = useState("")
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const hasInput = file !== null || text.trim().length > 0

  function acceptFile(f) {
    if (f && ACCEPTED_TYPES[f.type]) {
      setFile(f)
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    acceptFile(f)
  }, [])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setDragging(false), [])

  function onInputChange(e) {
    acceptFile(e.target.files?.[0])
    e.target.value = ""
  }

  const FileIcon = file ? (ACCEPTED_TYPES[file.type]?.icon ?? File) : File

  return (
    <div className="min-h-screen" style={{ background: "#FAFAFD" }}>
      {/* Header */}
      <header className="border-b border-[#EEEFFD] bg-white px-6 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-[#EEEFFD] transition-colors"
          style={{ color: "#5B65DC" }}>
          <ArrowLeft size={18} />
        </button>
        <span className="text-xl font-bold" style={{ color: "#122056" }}>Öyrənmə kartları</span>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-5"
        >
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#122056" }}>
              Flashcard yarat
            </h1>
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
            className="rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 py-10 px-6 cursor-pointer select-none"
            style={{
              borderColor: dragging ? "#5B65DC" : "#EEEFFD",
              background: dragging ? "#EEEFFD" : "#FFFFFF",
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
                  <p className="text-sm font-medium" style={{ color: "#122056" }}>
                    Faylı buraya sürükləyin
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#475467" }}>
                    və ya <span style={{ color: "#5B65DC" }}>seçmək üçün klikləyin</span>
                  </p>
                </div>
                <p className="text-xs" style={{ color: "#a0aec0" }}>
                  PDF, JPG, PNG, DOCX, TXT
                </p>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={onInputChange}
            className="hidden"
          />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "#EEEFFD" }} />
            <span className="text-xs" style={{ color: "#a0aec0" }}>Və ya</span>
            <div className="flex-1 h-px" style={{ background: "#EEEFFD" }} />
          </div>

          {/* Text area */}
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
              style={{
                borderColor: "#EEEFFD",
                background: "#FFFFFF",
                color: "#122056",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#5B65DC")}
              onBlur={(e) => (e.target.style.borderColor = "#EEEFFD")}
            />
          </div>

          {/* Generate button */}
          <button
            disabled={!hasInput}
            className="w-full font-medium py-3 rounded-xl text-sm transition-colors"
            style={{
              background: hasInput ? "#5B65DC" : "#EEEFFD",
              color: hasInput ? "#FFFFFF" : "#a0aec0",
              cursor: hasInput ? "pointer" : "not-allowed",
            }}
          >
            Öyrənmə kartları yarat
          </button>
        </motion.div>
      </main>
    </div>
  )
}
