import { useEffect, useState } from 'react'
import { QuizMode, useVocabStore } from '../../store/vocabStore'
import { sounds } from '../../utils/audio'

const MODES: { mode: QuizMode; label: string; sub: string; icon: string }[] = [
  { mode: 'meaning', label: '의미 퀴즈',  sub: '한자 → 한국어 뜻',      icon: '韓' },
  { mode: 'reading', label: '읽기 퀴즈',  sub: '한자 → 히라가나',       icon: '読' },
  { mode: 'writing', label: '표기 퀴즈',  sub: '히라가나 → 한자',       icon: '漢' },
  { mode: 'random',  label: '랜덤 믹스',  sub: '세 가지 섞어서',        icon: '?' },
]

interface Props {
  onSelect: (mode: QuizMode) => void
  onBack: () => void
}

export function QuizModeScreen({ onSelect, onBack }: Props) {
  const [selected, setSelected] = useState(0)
  const { starFilterActive, toggleStarFilter, allWords } = useVocabStore()

  const starredCount = allWords.filter(w => w.starred).length

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp')   { sounds.click(); setSelected(p => (p - 1 + MODES.length) % MODES.length) }
      if (e.key === 'ArrowDown') { sounds.click(); setSelected(p => (p + 1) % MODES.length) }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        sounds.click()
        toggleStarFilter()
      }
      if (e.key === 'Enter' || e.key === 'z') { sounds.select(); onSelect(MODES[selected].mode) }
      if (e.key === 'Escape' || e.key === 'x') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, onSelect, onBack, toggleStarFilter])

  return (
    <div className="h-full flex flex-col font-dot text-lcd-dark select-none">
      {/* header */}
      <div className="text-center border-b-2 border-lcd-dark/30 pb-1 mb-2">
        <div className="text-xl tracking-widest">◆ QUIZ MODE ◆</div>
        <div className="text-[10px] opacity-60 tracking-wider">SELECT TYPE</div>
      </div>

      {/* star filter toggle */}
      <button
        onClick={() => { sounds.click(); toggleStarFilter() }}
        className={`
          w-full text-left px-2 py-1.5 flex items-center justify-between mb-2
          border-2 transition-all duration-75
          ${starFilterActive
            ? 'bg-lcd-dark text-lcd-bg border-lcd-dark'
            : 'border-lcd-dark/30 hover:bg-lcd-dark/10'}
        `}
      >
        <div className="flex items-center gap-2">
          <span className={`text-base ${starFilterActive ? '' : 'opacity-40'}`}>★</span>
          <div>
            <div className="text-[11px] tracking-wider leading-tight">
              {starFilterActive ? '즐겨찾기만' : '전체 단어'}
            </div>
            <div className={`text-[9px] ${starFilterActive ? 'opacity-70' : 'opacity-40'}`}>
              {starFilterActive ? `${starredCount}개 선택됨` : `총 ${allWords.length}개`}
            </div>
          </div>
        </div>
        <span className="text-[10px] opacity-60">◀ ▶ 전환</span>
      </button>

      {/* mode list */}
      <div className="flex-1 space-y-1">
        {MODES.map((m, i) => (
          <button
            key={m.mode}
            onClick={() => { sounds.select(); onSelect(m.mode) }}
            onMouseEnter={() => setSelected(i)}
            className={`
              w-full text-left px-2 py-1.5 flex items-center gap-3
              border-2 transition-all duration-75
              ${selected === i ? 'bg-lcd-dark text-lcd-bg border-lcd-dark' : 'border-lcd-dark/20 hover:bg-lcd-dark/10'}
            `}
          >
            <span className={`w-6 h-6 flex items-center justify-center border text-xs shrink-0
              ${selected === i ? 'border-lcd-bg/40' : 'border-lcd-dark/30'}`}>
              {m.icon}
            </span>
            <div>
              <div className="text-sm tracking-wider leading-tight">{m.label}</div>
              <div className={`text-[9px] tracking-wide ${selected === i ? 'opacity-70' : 'opacity-50'}`}>
                {m.sub}
              </div>
            </div>
            {selected === i && <span className="ml-auto text-xs">▶</span>}
          </button>
        ))}
      </div>

      <div className="text-[9px] text-center opacity-50 pt-1 border-t border-lcd-dark/20 mt-1">
        ↑↓ SELECT  ◀▶ FILTER  A OK  B BACK
      </div>
    </div>
  )
}
