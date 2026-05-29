import { useEffect, useRef, useState } from 'react'
import { useVocabStore } from '../../store/vocabStore'
import { db } from '../../utils/db'
import { sounds } from '../../utils/audio'

const CATEGORIES = ['전체', '★', '동사', '명사', '형용사', 'な형용사', '부사', 'custom']
const PAGE_SIZE = 6

interface Props {
  onBack: () => void
}

export function WordListScreen({ onBack }: Props) {
  const { allWords, updateWordStar, deleteWord: storeDeleteWord } = useVocabStore()
  const [catIdx, setCatIdx] = useState(0)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(0)
  const [searchActive, setSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const isSearching = searchQuery.trim() !== ''

  const baseFiltered = catIdx === 0
    ? allWords
    : catIdx === 1
      ? allWords.filter(w => w.starred)
      : allWords.filter(w => w.category === CATEGORIES[catIdx])

  const filtered = isSearching
    ? allWords.filter(w => {
        const q = searchQuery.toLowerCase()
        return w.word.toLowerCase().includes(q)
            || w.reading.toLowerCase().includes(q)
            || w.meaning.toLowerCase().includes(q)
      })
    : baseFiltered

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0); setSelected(0) }, [catIdx, searchQuery])

  const openSearch = () => {
    setSearchActive(true)
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  const closeSearch = () => {
    setSearchActive(false)
    setSearchQuery('')
    searchRef.current?.blur()
  }

  const handleToggleStar = async (wordId: number, currentStarred: number | undefined) => {
    sounds.click()
    await db.toggleStar(wordId)
    updateWordStar(wordId, currentStarred ? 0 : 1)
  }

  const handleDelete = async (id: number) => {
    sounds.click()
    await db.deleteWord(id)
    storeDeleteWord(id)
    setConfirmDeleteId(null)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 검색창 포커스 중
      if (document.activeElement === searchRef.current) {
        if (e.key === 'Escape') closeSearch()
        return
      }

      // 삭제 확인 중
      if (confirmDeleteId !== null) {
        if (e.key === 'Enter' || e.key === 'z') handleDelete(confirmDeleteId)
        if (e.key === 'Escape' || e.key === 'x') setConfirmDeleteId(null)
        return
      }

      if (e.key === 'Tab') { e.preventDefault(); searchActive ? closeSearch() : openSearch(); return }
      if (e.key === 'ArrowUp') { sounds.click(); setSelected(p => Math.max(0, p - 1)) }
      else if (e.key === 'ArrowDown') { sounds.click(); setSelected(p => Math.min(pageItems.length - 1, p + 1)) }
      else if (e.key === 'ArrowLeft') {
        sounds.click()
        if (!isSearching) {
          if (page > 0) { setPage(p => p - 1); setSelected(0) }
          else { setCatIdx(p => (p - 1 + CATEGORIES.length) % CATEGORIES.length) }
        }
      }
      else if (e.key === 'ArrowRight') {
        sounds.click()
        if (!isSearching) {
          if (page < pages - 1) { setPage(p => p + 1); setSelected(0) }
          else { setCatIdx(p => (p + 1) % CATEGORIES.length) }
        }
      }
      else if (e.key === 'Enter' || e.key === 'z') {
        const word = pageItems[selected]
        if (word) handleToggleStar(word.id, word.starred)
      }
      else if (e.key === 'Escape' || e.key === 'x') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [page, pages, pageItems, selected, searchActive, isSearching, confirmDeleteId, onBack])

  return (
    <div className="h-full flex flex-col font-dot text-lcd-dark select-none">

      {/* ── 헤더 ── */}
      <div className="flex justify-between items-center mb-1.5 pb-1.5 border-b-2 border-lcd-dark/30 text-[10px]">
        <span className="tracking-wider">WORD LIST</span>
        <div className="flex items-center gap-2">
          <span className="opacity-60">{filtered.length} WORDS</span>
          <button
            onClick={searchActive ? closeSearch : openSearch}
            className={`w-5 h-5 flex items-center justify-center border text-[9px] transition-colors
              ${searchActive ? 'bg-lcd-dark text-lcd-bg border-lcd-dark' : 'border-lcd-dark/40 hover:bg-lcd-dark/10'}`}
          >
            {searchActive ? '✕' : '?'}
          </button>
        </div>
      </div>

      {/* ── 검색창 ── */}
      {searchActive && (
        <div className="mb-1.5">
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="SEARCH..."
            className="w-full bg-lcd-dark/10 border-2 border-lcd-dark/40 focus:border-lcd-dark px-2 py-1 text-[11px] font-dot text-lcd-dark placeholder-lcd-dark/30 outline-none"
          />
        </div>
      )}

      {/* ── 카테고리 탭 (검색 중엔 숨김) ── */}
      {!isSearching && (
        <div className="flex gap-1 mb-1.5 overflow-x-auto text-[9px]">
          {CATEGORIES.map((c, i) => (
            <button
              key={c}
              onClick={() => { sounds.click(); setCatIdx(i) }}
              className={`px-1.5 py-0.5 border whitespace-nowrap transition-colors
                ${i === catIdx ? 'bg-lcd-dark text-lcd-bg border-lcd-dark' : 'border-lcd-dark/30 hover:bg-lcd-dark/10'}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* ── 단어 목록 ── */}
      <div className="flex-1 space-y-0.5 overflow-y-auto min-h-0 lcd-scroll">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs opacity-50 text-center px-4">
            {isSearching ? '검색 결과가 없어요' : '즐겨찾기한 단어가 없어요'}
          </div>
        ) : pageItems.map((w, i) => {

          /* 삭제 확인 행 */
          if (confirmDeleteId === w.id) {
            return (
              <div key={w.id}
                className="px-2 py-1.5 flex items-center justify-between text-xs bg-lcd-dark text-lcd-bg">
                <span className="text-[10px] tracking-wide truncate flex-1 mr-2">「{w.word}」삭제?</span>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => handleDelete(w.id)}
                    className="px-1.5 py-0.5 border border-lcd-bg/50 text-[9px] hover:bg-lcd-bg/20">
                    YES
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)}
                    className="px-1.5 py-0.5 border border-lcd-bg/30 text-[9px] opacity-60 hover:bg-lcd-bg/10">
                    NO
                  </button>
                </div>
              </div>
            )
          }

          /* 일반 행 — 클릭 = 별 토글 */
          return (
            <div
              key={w.id}
              onMouseEnter={() => setSelected(i)}
              onClick={() => handleToggleStar(w.id, w.starred)}
              className={`px-2 py-1 flex items-center gap-1.5 text-xs transition-colors cursor-pointer
                ${selected === i ? 'bg-lcd-dark text-lcd-bg' : 'hover:bg-lcd-dark/10'}`}
            >
              <span className="text-base font-bold w-12 shrink-0 truncate">
                {w.word.trim() !== '' ? w.word : w.reading}
              </span>
              {w.word.trim() !== '' && (
                <span className="opacity-60 text-[10px] w-16 shrink-0 truncate">{w.reading}</span>
              )}
              <span className="truncate flex-1 text-[10px]">{w.meaning}</span>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-sm ${w.starred ? 'opacity-100' : 'opacity-20'}`}>
                  {w.starred ? '★' : '☆'}
                </span>
                {w.is_custom === 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); sounds.click(); setConfirmDeleteId(w.id) }}
                    className={`text-[11px] transition-opacity px-0.5
                      ${selected === i ? 'opacity-50 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 하단 힌트 ── */}
      <div className="text-[9px] text-center pt-1.5 border-t border-lcd-dark/20 opacity-60">
        {confirmDeleteId !== null
          ? 'YES / NO'
          : isSearching
            ? `결과 ${filtered.length}개  ESC 닫기`
            : `${page + 1}/${pages}  ◀▶PAGE  A★  SEL검색  B BACK`
        }
      </div>
    </div>
  )
}
