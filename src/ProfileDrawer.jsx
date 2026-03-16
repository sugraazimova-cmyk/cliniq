import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Clock, Bookmark, FileText, ArrowLeft, LogOut, Trash2 } from 'lucide-react'
import { supabase } from './supabase.js'
import { UserProfileSidebar } from './components/ui/menu.jsx'

export default function ProfileDrawer({ open, onClose, session, cases, bookmarkedIds, setBookmarkedIds, onSelectCase }) {
  const [activeTab, setActiveTab] = useState(null)

  // Profile tab state
  const [fullName, setFullName] = useState(session?.user?.user_metadata?.full_name ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // History tab state
  const [attempts, setAttempts] = useState(null)

  // Bookmarks tab state
  const [bookmarkList, setBookmarkList] = useState(null)

  // Notes tab state
  const [notes, setNotes] = useState(null)
  const [noteContent, setNoteContent] = useState({})

  function goBack() { setActiveTab(null); setDeleteConfirm(false) }

  useEffect(() => {
    if (!open) { setActiveTab(null); setDeleteConfirm(false) }
  }, [open])

  useEffect(() => {
    if (activeTab === 'tarixce' && attempts === null) {
      supabase.from('case_attempts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setAttempts(data ?? []))
    }
    if (activeTab === 'saxlanmis' && bookmarkList === null) {
      supabase.from('bookmarks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setBookmarkList(data ?? []))
    }
    if (activeTab === 'qeydler' && notes === null) {
      supabase.from('notes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .then(({ data }) => {
          const list = data ?? []
          setNotes(list)
          const map = {}
          list.forEach(n => { map[n.id] = n.content })
          setNoteContent(map)
        })
    }
  }, [activeTab])

  async function saveName() {
    setNameSaving(true)
    await supabase.auth.updateUser({ data: { full_name: fullName } })
    setNameSaving(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  async function sendPasswordReset() {
    await supabase.auth.resetPasswordForEmail(session.user.email)
    setResetSent(true)
  }

  async function deleteAccount() {
    setDeleting(true)
    await fetch('/api/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id }),
    })
    await supabase.auth.signOut()
  }

  async function saveNote(noteId) {
    const content = noteContent[noteId] ?? ''
    await supabase.from('notes').update({ content, updated_at: new Date().toISOString() }).eq('id', noteId)
  }

  async function deleteNote(noteId) {
    await supabase.from('notes').delete().eq('id', noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  function removeBookmark(caseId) {
    supabase.from('bookmarks').delete().match({ user_id: session.user.id, case_id: caseId }).then(() => {})
    setBookmarkList(prev => prev.filter(b => b.case_id !== caseId))
    setBookmarkedIds(prev => { const s = new Set(prev); s.delete(caseId); return s })
  }

  const navItems = [
    { icon: <User className="h-full w-full" />, label: "Profil", onClick: () => setActiveTab('profil') },
    { icon: <Clock className="h-full w-full" />, label: "Tarixçə", onClick: () => setActiveTab('tarixce') },
    { icon: <Bookmark className="h-full w-full" />, label: "Saxlanmış", onClick: () => setActiveTab('saxlanmis') },
    { icon: <FileText className="h-full w-full" />, label: "Qeydlər", onClick: () => setActiveTab('qeydler') },
  ]

  const logoutItem = {
    icon: <LogOut className="h-full w-full" />,
    label: "Çıxış",
    onClick: () => supabase.auth.signOut(),
  }

  const user = {
    name: session?.user?.user_metadata?.full_name ?? '',
    email: session?.user?.email ?? '',
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-xs z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <AnimatePresence mode="wait">
              {activeTab === null ? (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full p-3"
                >
                  <UserProfileSidebar
                    user={user}
                    navItems={navItems}
                    logoutItem={logoutItem}
                    className="h-full shadow-xl"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="h-full bg-white border-l border-stone-200 shadow-xl flex flex-col"
                >
                  {/* Sub-page header */}
                  <div className="flex items-center gap-3 p-4 border-b border-stone-100">
                    <button onClick={goBack} className="text-stone-400 hover:text-stone-700 transition-colors">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="font-semibold text-stone-800">
                      {activeTab === 'profil' ? 'Profil' :
                       activeTab === 'tarixce' ? 'Tarixçə' :
                       activeTab === 'saxlanmis' ? 'Saxlanmış' : 'Qeydlər'}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                    {/* PROFIL TAB */}
                    {activeTab === 'profil' && (
                      <>
                        <div>
                          <label className="text-xs text-stone-500 mb-1 block">Ad Soyad</label>
                          <div className="flex gap-2">
                            <input
                              value={fullName}
                              onChange={e => setFullName(e.target.value)}
                              className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                            />
                            <button
                              onClick={saveName}
                              disabled={nameSaving}
                              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white text-xs px-3 rounded-lg transition-colors">
                              {nameSaved ? '✓' : nameSaving ? '...' : 'Saxla'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-stone-500 mb-1 block">E-poçt</label>
                          <p className="text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
                            {session.user.email}
                          </p>
                        </div>

                        <div>
                          {resetSent ? (
                            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                              Şifrə sıfırlama linki göndərildi.
                            </p>
                          ) : (
                            <button
                              onClick={sendPasswordReset}
                              className="text-sm text-indigo-600 hover:underline">
                              Şifrəni sıfırla →
                            </button>
                          )}
                        </div>

                        <div className="mt-4 border-t border-stone-100 pt-4">
                          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Təhlükəli zona</p>
                          {!deleteConfirm ? (
                            <button
                              onClick={() => setDeleteConfirm(true)}
                              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" /> Hesabı sil
                            </button>
                          ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col gap-2">
                              <p className="text-xs text-red-700">Hesabınız birdəfəlik silinəcək. Əminsiniz?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={deleteAccount}
                                  disabled={deleting}
                                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-stone-300 text-white text-xs py-1.5 rounded-lg transition-colors">
                                  {deleting ? '...' : 'Bəli, sil'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(false)}
                                  className="flex-1 border border-stone-200 text-xs py-1.5 rounded-lg text-stone-600 hover:bg-stone-50">
                                  Ləğv et
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* TARIXCE TAB */}
                    {activeTab === 'tarixce' && (
                      attempts === null ? (
                        <p className="text-xs text-stone-400">Yüklənir...</p>
                      ) : attempts.length === 0 ? (
                        <p className="text-xs text-stone-400">Hələ heç bir hal tamamlanmayıb.</p>
                      ) : (
                        attempts.map(a => (
                          <div key={a.id} className="flex items-center justify-between border border-stone-100 rounded-lg px-3 py-2.5 bg-stone-50">
                            <div>
                              <p className="text-sm font-medium text-stone-700">{a.case_title}</p>
                              <p className="text-xs text-stone-400 mt-0.5">{formatDate(a.created_at)}</p>
                            </div>
                            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                              {a.score} xal
                            </span>
                          </div>
                        ))
                      )
                    )}

                    {/* SAXLANMIS TAB */}
                    {activeTab === 'saxlanmis' && (
                      bookmarkList === null ? (
                        <p className="text-xs text-stone-400">Yüklənir...</p>
                      ) : bookmarkList.length === 0 ? (
                        <p className="text-xs text-stone-400">Saxlanmış hal yoxdur.</p>
                      ) : (
                        bookmarkList.map(b => (
                          <div key={b.case_id} className="flex items-center justify-between border border-stone-100 rounded-lg px-3 py-2.5 bg-stone-50">
                            <button
                              onClick={() => onSelectCase(b.case_id)}
                              className="text-sm font-medium text-stone-700 hover:text-indigo-600 text-left flex-1">
                              {b.case_title}
                            </button>
                            <button
                              onClick={() => removeBookmark(b.case_id)}
                              className="text-stone-300 hover:text-red-500 ml-3 text-base leading-none transition-colors">
                              ★
                            </button>
                          </div>
                        ))
                      )
                    )}

                    {/* QEYDLER TAB */}
                    {activeTab === 'qeydler' && (
                      notes === null ? (
                        <p className="text-xs text-stone-400">Yüklənir...</p>
                      ) : notes.length === 0 ? (
                        <p className="text-xs text-stone-400">Heç bir qeyd yoxdur.</p>
                      ) : (
                        notes.map(n => (
                          <div key={n.id} className="border border-stone-200 rounded-lg p-3 bg-white">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-xs font-medium text-stone-500">{n.case_id}</p>
                              <button onClick={() => deleteNote(n.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <textarea
                              value={noteContent[n.id] ?? ''}
                              onChange={e => setNoteContent(prev => ({ ...prev, [n.id]: e.target.value }))}
                              onBlur={() => saveNote(n.id)}
                              rows={3}
                              className="w-full text-sm text-stone-700 border border-stone-100 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-300 resize-none"
                            />
                            <p className="text-xs text-stone-300 mt-1">{formatDate(n.updated_at)}</p>
                          </div>
                        ))
                      )
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
