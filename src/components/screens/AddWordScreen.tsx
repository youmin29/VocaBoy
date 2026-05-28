import { useEffect, useState } from 'react'
import { db } from '../../utils/db'
import { useVocabStore } from '../../store/vocabStore'
import { sounds } from '../../utils/audio'

interface Props {
  onBack: () => void
}

export function AddWordScreen({ onBack }: Props) {
  const { setAllWords } = useVocabStore()
  const [word, setWord] = useState('')
  const [reading, setReading] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onBack])

  const handleSave = async () => {
    if (!word.trim() || !reading.trim() || !meaning.trim()) return
    sounds.correct()
    await db.addWord(word.trim(), reading.trim(), meaning.trim(), example.trim())
    const updated = await db.getAll()
    setAllWords(updated)
    setSaved(true)
    setWord(''); setReading(''); setMeaning(''); setExample('')
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="min-h-full flex flex-col font-dot text-lcd-dark select-none">
      <div className="text-center border-b-2 border-lcd-dark/30 pb-2 mb-3">
        <div className="text-xl tracking-widest">◆ ADD WORD ◆</div>
      </div>

      <div className="flex-1 space-y-2">
        <Field label="WORD (일본어)" value={word} onChange={setWord} placeholder="e.g. 勉強" />
        <Field label="READING (읽기)" value={reading} onChange={setReading} placeholder="e.g. べんきょう" />
        <Field label="MEANING (뜻)" value={meaning} onChange={setMeaning} placeholder="e.g. 공부" />
        <Field label="EXAMPLE (예문)" value={example} onChange={setExample} placeholder="e.g. 毎日勉強する" />

        {saved && (
          <div className="text-center text-sm animate-pixelIn">◆ SAVED! ◆</div>
        )}

        <button
          onClick={handleSave}
          disabled={!word || !reading || !meaning}
          className="w-full py-2 border-2 border-lcd-dark text-sm tracking-wider hover:bg-lcd-dark hover:text-lcd-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          SAVE WORD
        </button>
      </div>

      <div className="text-[9px] text-center opacity-50 pt-2 border-t border-lcd-dark/20">B / ESC BACK</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <div className="text-[9px] opacity-60 mb-0.5 tracking-wider">{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-lcd-dark/10 border border-lcd-dark/40 px-2 py-1 text-sm font-dot text-lcd-dark placeholder:opacity-30 outline-none focus:border-lcd-dark"
      />
    </div>
  )
}
