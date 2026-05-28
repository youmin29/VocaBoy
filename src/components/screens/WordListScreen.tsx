import { useEffect, useState } from 'react'
import { useVocabStore } from '../../store/vocabStore'
import { sounds } from '../../utils/audio'

const CATEGORIES = ['전체', '동사', '명사', '형용사', 'な형용사', '부사', 'custom']
const PAGE_SIZE = 6

interface Props {
  onBack: () => void
}

export function WordListScreen({ onBack }: Props) {
  const { allWords } = useVocabStore()
  const [catIdx, setCatIdx] = useState(0)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(0)

  const filtered = catIdx === 0
    ? allWords
    : allWords.filter(w => w.category === CATEGORIES[catIdx])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0); setSelected(0) }, [catIdx])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { sounds.click(); setSelected(p => Math.max(0, p - 1)) }
      else if (e.key === 'ArrowDown') { sounds.click(); setSelected(p => Math.min(pageItems.length - 1, p + 1)) }
      else if (e.key === 'ArrowLeft') {
        sounds.click()
        if (page > 0) { setPage(p => p - 1); setSelected(0) }
        else { setCatIdx(p => (p - 1 + CATEGORIES.length) % CATEGORIES.length) }
      }
      else if (e.key === 'ArrowRight') {
        sounds.click()
        if (page < pages - 1) { setPage(p => p + 1); setSelected(0) }
        else { setCatIdx(p => (p + 1) % CATEGORIES.length) }
      }
      else if (e.key === 'Escape' || e.key === 'x') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [page, pages, pageItems.length, onBack])

  return (
    <div className="h-full flex flex-col font-dot text-lcd-dark select-none">
      {/* header */}
      <div className="flex justify-between items-center mb-2 pb-1.5 border-b-2 border-lcd-dark/30 text-[10px]">
        <span className="tracking-wider">WORD LIST</span>
        <span>{filtered.length} WORDS</span>
      </div>

      {/* category tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto text-[9px]">
        {CATEGORIES.map((c, i) => (
          <button
            key={c}
            onClick={() => { sounds.click(); setCatIdx(i) }}
            className={`px-1.5 py-0.5 border whitespace-nowrap transition-colors ${i === catIdx ? 'bg-lcd-dark text-lcd-bg border-lcd-dark' : 'border-lcd-dark/30 hover:bg-lcd-dark/10'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* list */}
      <div className="flex-1 space-y-0.5 overflow-hidden">
        {pageItems.map((w, i) => (
          <div
            key={w.id}
            onMouseEnter={() => setSelected(i)}
            className={`px-2 py-1 flex items-center gap-2 text-xs transition-colors ${selected === i ? 'bg-lcd-dark text-lcd-bg' : 'hover:bg-lcd-dark/10'}`}
          >
            <span className="text-base font-bold w-14 shrink-0">{w.word}</span>
            <span className="opacity-60 text-[10px] w-20 shrink-0">{w.reading}</span>
            <span className="truncate flex-1">{w.meaning}</span>
            {w.mastered ? <span className="shrink-0">★</span> : null}
          </div>
        ))}
      </div>

      {/* pagination */}
      <div className="text-[9px] text-center pt-1.5 border-t border-lcd-dark/20 opacity-60">
        {page + 1}/{pages}  ◀▶ PAGE  B BACK
      </div>
    </div>
  )
}
