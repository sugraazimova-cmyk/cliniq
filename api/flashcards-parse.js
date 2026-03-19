/* global process */

function logEvent(feature) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  fetch(`${url}/rest/v1/feature_events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=minimal' },
    body: JSON.stringify({ feature }),
  }).catch(() => {})
}

import { createRequire } from 'module'
import fs from 'fs'
import os from 'os'
import { formidable } from 'formidable'

export const config = {
  api: { bodyParser: false },
}

// ── Main handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  const form = formidable({
    uploadDir: os.tmpdir(),
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024,
  })

  let uploadedFile
  try {
    const [, files] = await form.parse(req)
    uploadedFile = files.file?.[0]
  } catch {
    return res.status(400).json({ error: 'Fayl oxuna bilmədi. Zəhmət olmasa yenidən cəhd edin.' })
  }

  if (!uploadedFile) {
    return res.status(400).json({ error: 'Fayl tapılmadı.' })
  }

  let buffer
  try {
    buffer = fs.readFileSync(uploadedFile.filepath)
  } catch {
    return res.status(500).json({ error: 'Fayl oxuna bilmədi. Zəhmət olmasa yenidən cəhd edin.' })
  } finally {
    try { fs.unlinkSync(uploadedFile.filepath) } catch {}
  }

  const mime = uploadedFile.mimetype

  try {
    let result
    if (mime === 'application/pdf') {
      result = await parsePdf(buffer)
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      result = await parseDocx(buffer)
    } else if (mime === 'text/plain') {
      result = parseTxt(buffer.toString('utf-8'))
    } else if (mime === 'image/jpeg' || mime === 'image/png') {
      result = {
        isImage: true,
        sections: [{ title: 'Şəkil', pageRange: '1', wordCount: 0, content: '' }],
      }
    } else {
      return res.status(400).json({ error: 'Yalnız PDF, JPG, PNG, DOCX və TXT fayllar dəstəklənir.' })
    }
    logEvent('flashcard_parse')
    return res.json(result)
  } catch (err) {
    console.error('flashcards-parse error:', err)
    return res.status(500).json({
      error: 'Fayl oxuna bilmədi. Zəhmət olmasa yenidən cəhd edin.',
      detail: err.message,
    })
  }
}

// ── PDF ──────────────────────────────────────────────────────────────────────

async function parsePdf(buffer) {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  await parser.destroy()

  const text = result.text
  const numpages = result.total
  const pageTexts = result.pages.map((p) => p.text)

  if (text.trim().length < 50) {
    return {
      isImage: true,
      sections: [{ title: 'PDF Şəkil', pageRange: `1-${numpages}`, wordCount: 0, content: '' }],
    }
  }

  return { isImage: false, sections: detectPdfSections(pageTexts, numpages) }
}

function detectPdfSections(pageTexts, numpages) {
  // Build a flat line list that knows which page each line came from
  const lines = [] // { text, pageNum }
  for (let p = 0; p < pageTexts.length; p++) {
    for (const line of pageTexts[p].split('\n')) {
      lines.push({ text: line.trim(), pageNum: p + 1 })
    }
  }

  const headings = []
  for (let i = 0; i < lines.length; i++) {
    const { text: line, pageNum } = lines[i]
    if (!line || line.length < 3 || line.length > 100) continue
    if (/^\d+$/.test(line)) continue // lone page numbers

    const isAllCaps = line === line.toUpperCase() && /[A-ZÇŞĞÜÖİ]/.test(line)
    const isNumbered = /^(\d+[\.\)]\s+[A-ZÇŞĞÜÖİa-z]|\b(Chapter|Fəsil|Bölmə|CHAPTER|FƏSİL|BÖLMƏ)\s+\d)/i.test(line)
    const isFollowedByBlank = line.length < 60 && i + 1 < lines.length && lines[i + 1].text === ''

    if (isAllCaps || isNumbered || isFollowedByBlank) {
      headings.push({ title: line, lineIndex: i, pageNum })
    }
  }

  // Deduplicate headings within 3 lines of each other
  const deduped = headings.filter(
    (h, i) => i === 0 || h.lineIndex - headings[i - 1].lineIndex > 3
  )

  if (deduped.length < 2) {
    return groupByPages(pageTexts, numpages)
  }

  const sections = []
  for (let s = 0; s < deduped.length; s++) {
    const startLine = deduped[s].lineIndex
    const endLine = s + 1 < deduped.length ? deduped[s + 1].lineIndex : lines.length
    const content = lines.slice(startLine + 1, endLine).map((l) => l.text).join('\n').trim()
    const wordCount = content.split(/\s+/).filter(Boolean).length

    if (wordCount > 20) {
      const startPage = deduped[s].pageNum
      const endPage = s + 1 < deduped.length ? Math.max(startPage, deduped[s + 1].pageNum - 1) : numpages
      sections.push({
        title: deduped[s].title,
        pageRange: startPage === endPage ? `${startPage}` : `${startPage}-${endPage}`,
        wordCount,
        content,
      })
    }
  }

  return sections.length > 0 ? sections : groupByPages(pageTexts, numpages)
}

function groupByPages(pageTexts, numpages) {
  const PAGES_PER_GROUP = 15
  const sectionCount = Math.max(1, Math.ceil(numpages / PAGES_PER_GROUP))
  return Array.from({ length: sectionCount }, (_, i) => {
    const startPage = i * PAGES_PER_GROUP + 1
    const endPage = Math.min((i + 1) * PAGES_PER_GROUP, numpages)
    const content = pageTexts.slice(i * PAGES_PER_GROUP, endPage).join('\n')
    return {
      title: `Hissə ${i + 1}`,
      pageRange: startPage === endPage ? `${startPage}` : `${startPage}-${endPage}`,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      content,
    }
  })
}

// ── DOCX ─────────────────────────────────────────────────────────────────────

async function parseDocx(buffer) {
  const require = createRequire(import.meta.url)
  const mammoth = require('mammoth')
  const htmlResult = await mammoth.convertToHtml({ buffer })
  const html = htmlResult.value

  if (!html.trim()) {
    const textResult = await mammoth.extractRawText({ buffer })
    return parseTxt(textResult.value)
  }

  // Split on heading tags, keeping the heading at the start of each part
  const parts = html.split(/(?=<h[123][ >])/i)
  const sections = []

  for (const part of parts) {
    if (!part.trim()) continue
    const headingMatch = part.match(/^<h[123][^>]*>(.*?)<\/h[123]>/i)
    const title = headingMatch
      ? headingMatch[1].replace(/<[^>]+>/g, '').trim()
      : 'Giriş'
    const content = part.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const wordCount = content.split(/\s+/).filter(Boolean).length
    if (wordCount > 10) {
      sections.push({ title, pageRange: '-', wordCount, content })
    }
  }

  if (sections.length === 0) {
    const textResult = await mammoth.extractRawText({ buffer })  // mammoth already required above
    return parseTxt(textResult.value)
  }

  return { isImage: false, sections }
}

// ── TXT ──────────────────────────────────────────────────────────────────────

function parseTxt(text) {
  const words = text.split(/\s+/).filter(Boolean)
  const WORDS_PER_SECTION = 1500
  const sectionCount = Math.max(1, Math.ceil(words.length / WORDS_PER_SECTION))

  const sections = Array.from({ length: sectionCount }, (_, i) => {
    const start = i * WORDS_PER_SECTION
    const end = Math.min((i + 1) * WORDS_PER_SECTION, words.length)
    const content = words.slice(start, end).join(' ')
    return {
      title: `Hissə ${i + 1}`,
      pageRange: '-',
      wordCount: end - start,
      content,
    }
  })

  return { isImage: false, sections }
}
