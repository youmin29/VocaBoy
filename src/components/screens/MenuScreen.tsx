import { useEffect, useState } from 'react'
import { Screen } from '../../store/vocabStore'
import { sounds } from '../../utils/audio'

const MENU_ITEMS: { label: string; icon: string; target: Screen }[] = [
  { label: 'QUIZ MODE', icon: '?', target: 'quiz' },
  { label: 'FLASHCARD', icon: '◈', target: 'flashcard' },
  { label: 'WORD LIST', icon: '≡', target: 'wordlist' },
  { label: 'MY STATS', icon: '★', target: 'stats' },
  { label: 'ADD WORD', icon: '+', target: 'addword' },
]

interface Props {
  onNavigate: (screen: Screen) => void
}

export function MenuScreen({ onNavigate }: Props) {
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        sounds.click()
        setSelected(p => (p - 1 + MENU_ITEMS.length) % MENU_ITEMS.length)
      } else if (e.key === 'ArrowDown') {
        sounds.click()
        setSelected(p => (p + 1) % MENU_ITEMS.length)
      } else if (e.key === 'Enter' || e.key === 'z') {
        sounds.select()
        onNavigate(MENU_ITEMS[selected].target)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, onNavigate])

  return (
    <div className="h-full flex flex-col font-dot text-lcd-dark select-none">
      {/* header */}
      <div className="text-center border-b-2 border-lcd-dark/30 pb-1.5 mb-2">
        <div className="text-2xl tracking-widest">◆ VOCABOY ◆</div>
        <div className="text-[10px] opacity-60 tracking-wider">JLPT N4 TRAINER</div>
      </div>

      {/* menu list */}
      <div className="flex-1 space-y-0.5">
        {MENU_ITEMS.map((item, i) => (
          <button
            key={item.target}
            onClick={() => { sounds.select(); onNavigate(item.target) }}
            onMouseEnter={() => setSelected(i)}
            className={`
              w-full text-left px-2 py-1 flex items-center gap-3 text-sm tracking-wider
              transition-all duration-75
              ${selected === i
                ? 'bg-lcd-dark text-lcd-bg'
                : 'bg-lcd-dark/0 hover:bg-lcd-dark/10'}
            `}
          >
            <span className="w-4 text-center">{selected === i ? '▶' : item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* footer */}
      <div className="text-[9px] text-center opacity-50 tracking-wider border-t border-lcd-dark/20 pt-2 mt-1">
        ↑↓ SELECT  A CONFIRM
      </div>
    </div>
  )
}
