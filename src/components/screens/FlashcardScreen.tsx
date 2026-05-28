import { useEffect, useState, useCallback } from 'react'
import { useVocabStore } from '../../store/vocabStore'
import { db } from '../../utils/db'
import { sounds } from '../../utils/audio'

interface Props {
  onBack: () => void
}

export function FlashcardScreen({ onBack }: Props) {
  const { allWords } = useVocabStore()
  const [deck, setDeck] = useState<VocabRow[]>([])
  const [cursor, setCursor] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [rated, setRated] = useState(false)
  const [knownCount, setKnownCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (allWords.length === 0) return
    const shuffled = [...allWords].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setCursor(0)
    setFlipped(false)
    setRated(false)
    setKnownCount(0)
    setDone(false)
  }, [allWords])

  const current = deck[cursor]

  const flip = useCallback(() => {
    sounds.flip()
    setFlipped(f => !f)
  }, [])

  const rate = useCallback(async (known: boolean) => {
    if (!current || rated) return
    setRated(true)
    if (known) {
      sounds.correct()
      setKnownCount(k => k + 1)
    } else {
      sounds.wrong()
    }
    await db.recordProgress(current.id, known)
    setTimeout(() => {
      if (cursor + 1 >= deck.length) {
        setDone(true)
      } else {
        setCursor(p => p + 1)
        setFlipped(false)
        setRated(false)
      }
    }, 300)
  }, [current, rated, cursor, deck.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done) { if (e.key === 'Escape' || e.key === 'x') onBack(); return }
      if (e.key === 'Enter' || e.key === 'z') flip()
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { if (flipped) rate(true) }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { if (flipped) rate(false) }
      else if (e.key === 'Escape' || e.key === 'x') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [flip, rate, flipped, done, onBack])

  if (deck.length === 0) return (
    <div className="h-full flex items-center justify-center font-dot text-lcd-dark text-lg">LOADING...</div>
  )

  if (done) {
    const acc = deck.length > 0 ? Math.round((knownCount / deck.length) * 100) : 0
    return (
      <div className="h-full flex flex-col font-dot text-lcd-dark select-none">
        <div className="text-center border-b-2 border-lcd-dark/30 pb-2 mb-3">
          <div className="text-xl tracking-widest">◆ COMPLETE ◆</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <div className="text-5xl">{acc >= 70 ? '(^_^)' : '(･_･)'}</div>
          <div className="text-lg">{knownCount} / {deck.length} KNOWN</div>
          <div className="text-sm opacity-70">ACCURACY: {acc}%</div>
        </div>
        <div className="text-[9px] text-center opacity-50 pt-2 border-t border-lcd-dark/20">B BACK TO MENU</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col font-dot text-lcd-dark select-none">
      {/* header */}
      <div className="flex justify-between items-center mb-2 pb-1.5 border-b-2 border-lcd-dark/30 text-[10px]">
        <span>FLASHCARD</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-lcd-dark rounded-full animate-blink" />
          <span>{cursor + 1}/{deck.length}</span>
        </div>
      </div>

      {/* progress bar */}
      <div className="h-1 bg-lcd-dark/20 mb-3">
        <div className="h-full bg-lcd-dark transition-all duration-300" style={{ width: `${(cursor / deck.length) * 100}%` }} />
      </div>

      {/* card area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {!flipped ? (
          /* front - 일본어 */
          <div className="w-full text-center space-y-2 animate-pixelIn">
            <div className="text-[10px] opacity-50 tracking-wider mb-3">◇ JAPANESE ◇</div>
            <div className="text-4xl font-bold tracking-tight">{current.word}</div>
            <div className="text-lg opacity-70">{current.reading}</div>
            <div className="text-[10px] opacity-40 mt-4 border border-lcd-dark/20 inline-block px-2 py-0.5">
              {current.category}
            </div>
          </div>
        ) : (
          /* back - 한국어 의미 */
          <div className="w-full text-center space-y-1 animate-pixelIn">
            <div className="text-[10px] opacity-50 tracking-wider mb-3">◆ MEANING ◆</div>
            <div className="text-2xl font-bold">{current.meaning}</div>
            {current.example && (
              <div className="mt-3 text-xs opacity-60 bg-lcd-dark/10 px-2 py-1 border-l-2 border-lcd-dark/40 text-left">
                예) {current.example}
              </div>
            )}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="mt-2 pt-1.5 border-t-2 border-lcd-dark/30 text-[9px] text-center">
        {!flipped
          ? <span className="opacity-60">A FLIP  B BACK</span>
          : <span>◀ 모름  A 다시보기  ▶ 알았어!</span>
        }
      </div>
    </div>
  )
}
