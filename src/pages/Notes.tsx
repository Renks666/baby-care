import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, PenLine, FolderOpen, Folder, Trash2, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useNotesStore } from '../store/notesStore'
import { Drawer } from '../components/common/Drawer'
import { ActionButtons } from '../components/ui/ActionButtons'
import { pageVariants } from '../utils/animations'

export function Notes() {
  const navigate = useNavigate()
  const { notes, folders, addNote, updateNote, deleteNote, addFolder, updateFolder, deleteFolder } = useNotesStore()

  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all')
  const [foldersDrawerOpen, setFoldersDrawerOpen] = useState(false)
  const [noteDrawerOpen, setNoteDrawerOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [noteFolderId, setNoteFolderId] = useState<string | undefined>(undefined)
  const [editNote, setEditNote] = useState<{ id: string; text: string; date: string; folderId?: string } | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [editFolder, setEditFolder] = useState<{ id: string; name: string } | null>(null)

  const todayStr = new Date().toISOString().slice(0, 10)

  const filteredNotes = [...notes]
    .filter((n) => {
      if (selectedFolderId === 'all') return true
      if (selectedFolderId === 'none') return !n.folderId
      return n.folderId === selectedFolderId
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  function handleAddNote() {
    if (!noteText.trim()) return
    addNote(noteText.trim(), noteDate, noteFolderId)
    setNoteText('')
    setNoteDate(new Date().toISOString().slice(0, 10))
    setNoteFolderId(undefined)
    setNoteDrawerOpen(false)
  }

  function handleSaveEditNote() {
    if (!editNote || !editNote.text.trim()) return
    updateNote(editNote.id, editNote.text.trim(), editNote.date, editNote.folderId)
    setEditNote(null)
  }

  function openNewNote() {
    setNoteText('')
    setNoteDate(new Date().toISOString().slice(0, 10))
    setNoteFolderId(undefined)
    setNoteDrawerOpen(true)
  }

  function handleAddFolder() {
    if (!newFolderName.trim()) return
    addFolder(newFolderName.trim())
    setNewFolderName('')
  }

  function handleSaveFolder() {
    if (!editFolder || !editFolder.name.trim()) return
    updateFolder(editFolder.id, editFolder.name.trim())
    setEditFolder(null)
  }

  const folderName = (folderId?: string) => {
    if (!folderId) return null
    return folders.find((f) => f.id === folderId)?.name ?? null
  }

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="px-4 pb-24"
      >
        {/* Шапка */}
        <div className="pt-12 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-full bg-pink-50 dark:bg-gray-800 flex items-center justify-center"
            >
              <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
            </motion.button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Заметки</h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setFoldersDrawerOpen(true)}
              className="w-9 h-9 rounded-full bg-pink-50 dark:bg-gray-800 flex items-center justify-center"
            >
              <FolderOpen size={17} className="text-pink-400" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={openNewNote}
              className="flex items-center gap-1.5 bg-pink-500 text-white text-sm font-semibold px-3 py-2 rounded-xl"
            >
              <Plus size={15} /> Новая
            </motion.button>
          </div>
        </div>

        {/* Фильтр по папкам */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {[
            { id: 'all', label: 'Все' },
            { id: 'none', label: 'Без папки' },
            ...folders.map((f) => ({ id: f.id, label: f.name })),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFolderId(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedFolderId === tab.id
                  ? 'bg-pink-500 text-white'
                  : 'bg-pink-50 dark:bg-gray-800 text-pink-500 dark:text-pink-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Список заметок */}
        {filteredNotes.length === 0 ? (
          <button
            onClick={openNewNote}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-pink-200 dark:border-gray-600 text-sm text-gray-400 dark:text-gray-500 mt-2"
          >
            <PenLine size={15} className="text-pink-300" />
            Нет заметок — добавь первую...
          </button>
        ) : (
          <div className="space-y-2">
            {filteredNotes.map((note) => {
              const fname = folderName(note.folderId)
              return (
                <div key={note.id} className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl px-3 py-2.5">
                  <PenLine size={15} className="text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs text-amber-500 dark:text-amber-400 font-medium">
                        {note.date === todayStr
                          ? 'Сегодня'
                          : format(new Date(note.date + 'T12:00:00'), 'd MMMM', { locale: ru })}
                      </p>
                      {fname && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full font-medium">
                          <Folder size={9} /> {fname}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{note.text}</p>
                  </div>
                  <ActionButtons
                    onEdit={() => setEditNote({ id: note.id, text: note.text, date: note.date, folderId: note.folderId })}
                    onDelete={() => deleteNote(note.id)}
                    editColor="hover:text-amber-400"
                  />
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Drawer: добавить заметку */}
      <Drawer open={noteDrawerOpen} onClose={() => setNoteDrawerOpen(false)} title="Новая заметка">
        <div className="space-y-3 pb-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">Дата</span>
            <input
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 flex-1"
            />
          </div>
          {folders.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Папка</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setNoteFolderId(undefined)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!noteFolderId ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  Без папки
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setNoteFolderId(f.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${noteFolderId === f.id ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Что хочешь записать?"
            rows={4}
            className="w-full border border-pink-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim()}
            className="w-full bg-pink-500 disabled:bg-pink-200 dark:disabled:bg-pink-900/40 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
          >
            Сохранить
          </button>
        </div>
      </Drawer>

      {/* Drawer: редактировать заметку */}
      <Drawer open={!!editNote} onClose={() => setEditNote(null)} title="Редактировать заметку">
        {editNote && (
          <div className="space-y-3 pb-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">Дата</span>
              <input
                type="date"
                value={editNote.date}
                onChange={(e) => setEditNote({ ...editNote, date: e.target.value })}
                className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 flex-1"
              />
            </div>
            {folders.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Папка</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setEditNote({ ...editNote, folderId: undefined })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!editNote.folderId ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    Без папки
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setEditNote({ ...editNote, folderId: f.id })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${editNote.folderId === f.id ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <textarea
              value={editNote.text}
              onChange={(e) => setEditNote({ ...editNote, text: e.target.value })}
              rows={4}
              className="w-full border border-pink-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            />
            <button
              onClick={handleSaveEditNote}
              disabled={!editNote.text.trim()}
              className="w-full bg-pink-500 disabled:bg-pink-200 dark:disabled:bg-pink-900/40 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
            >
              Сохранить
            </button>
          </div>
        )}
      </Drawer>

      {/* Drawer: управление папками */}
      <Drawer open={foldersDrawerOpen} onClose={() => setFoldersDrawerOpen(false)} title="Папки">
        <div className="space-y-3 pb-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Новая папка..."
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-pink-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
            />
            <button
              onClick={handleAddFolder}
              disabled={!newFolderName.trim()}
              className="bg-pink-500 disabled:bg-pink-200 dark:disabled:bg-pink-900/40 text-white px-4 rounded-xl text-sm font-medium"
            >
              <Plus size={16} />
            </button>
          </div>

          {folders.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Папок пока нет</p>
          ) : (
            <div className="space-y-2">
              {folders.map((f) => (
                <div key={f.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2.5">
                  <Folder size={15} className="text-pink-400 shrink-0" />
                  {editFolder?.id === f.id ? (
                    <>
                      <input
                        autoFocus
                        value={editFolder.name}
                        onChange={(e) => setEditFolder({ ...editFolder, name: e.target.value })}
                        className="flex-1 text-sm bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveFolder()}
                      />
                      <button onClick={handleSaveFolder} className="text-xs text-pink-500 font-semibold">Ок</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">{f.name}</span>
                      <button onClick={() => setEditFolder({ id: f.id, name: f.name })} className="text-gray-300 dark:text-gray-600 hover:text-pink-400 transition-colors p-1">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteFolder(f.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </>
  )
}
