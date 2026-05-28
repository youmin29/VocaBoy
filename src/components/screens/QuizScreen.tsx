import { useEffect, useState, useCallback } from 'react'
import { useVocabStore } from '../../store/vocabStore'
import { db } from '../../utils/db'
import { sounds } from '../../utils/audio'

type Phase = 'question' | 'result' | 'summary'

interface QuizItem {
  vocab: VocabRow
  options: [string, string]   // [incorrect, correct] shuffled
  correctIndex: 0 | 1
}

function buildQuiz(vocab: VocabRow, pool: VocabRow[]): QuizItem {
  const wrong = pool.filter(v => v.id !== vocab.id)
  const wrongPick = wrong[Math.floor(Math.random() * wrong.length)]
  const correctIndex = Math.random() < 0.5 ? 0 : 1
  const options: [string, string] = correctIndex === 0
    ? [vocab.meaning, wrongPick.meaning]
    : [wrongPick.meaning, vocab.meaning]
  return { vocab, options, correctIndex }
}

interface Props {
  onBack: () => void
}

const QUIZ_LENGTH = 10

export function QuizScreen({ onBack }: Props) {
  const { allWords, recordCorrect, recordWrong, sessionScore, sessionTotal, currentStreak, bestStreak, resetSession } = useVocabStore()
  const [items, setItems] = useState<QuizItem[]>([])
  const [cursor, setCursor] = useState(0)
  const [selected, setSelected] = useState<0 | 1 | null>(null)
  const [phase, setPhase] = useState<Phase>('question')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (allWords.length < 4) return
    resetSession()
    const shuffled = [...allWords].sort(() => Math.random() - 0.5).slice(0, QUIZ_LENGTH)
    setItems(shuffled.map(v => buildQuiz(v, allWords)))
    setCursor(0)
    setSelected(null)
    setPhase('question')
  }, [allWords])

  const current = items[cursor]

  const confirm = useCallback(async () => {
    if (!current || selected === null || phase !== 'question') return
    const correct = selected === current.correctIndex
    setPhase('result')
    if (correct) {
      sounds.correct()
      recordCorrect()
      await db.recordProgress(current.vocab.id, true)
    } else {
      sounds.wrong()
      recordWrong()
      setShake(true)
      setTimeout(() => setShake(false), 350)
      await db.recordProgress(current.vocab.id, false)
    }
  }, [current, selected, phase, recordCorrect, recordWrong])

  const next = useCallback(async () => {
    if (cursor + 1 >= items.length) {
      await db.saveSession('quiz', sessionScore + (selected === current?.correctIndex ? 1 : 0), sessionTotal + 1, bestStreak)
      setPhase('summary')
    } else {
      setCursor(p => p + 1)
      setSelected(null)
      setPhase('question')
    }
  }, [cursor, items.length, sessionScore, sessionTotal, bestStreak, selected, current])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === 'summary') { if (e.key === 'Escape' || e.key === 'x') onBack(); return }
      if (phase === 'result') { if (e.key === 'Enter' || e.key === 'z') next(); return }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { sounds.click(); setSelected(0) }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { sounds.click(); setSelected(1) }
      else if (e.key === 'Enter' || e.key === 'z') confirm()
      else if (e.key === 'Escape' || e.key === 'x') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, confirm, next, onBack])

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center font-dot text-lcd-dark text-lg">
        LOADING...
      </div>
    )
  }

  if (phase === 'summary') {
    const total = sessionTotal
    const score = sessionScore
    const acc = total > 0 ? Math.round((score / total) * 100) : 0
    return (
      <div className="h-full flex flex-col font-dot text-lcd-dark select-none">
        <div className="text-center border-b-2 border-lcd-dark/30 pb-2 mb-3">
          <div className="text-xl tracking-widest">◆ RESULT ◆</div>
        </div>
        <div className="flex-1 space-y-2 px-1">
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="SCORE" value={`${score}/${total}`} />
            <StatBox label="ACCURACY" value={`${acc}%`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="STREAK" value={String(currentStreak)} />
            <StatBox label="BEST" value={String(bestStreak)} />
          </div>
          <div className="text-center text-sm mt-3 opacity-70">
            {acc >= 80 ? '(^_^) GREAT JOB!' : acc >= 60 ? '(･_･) KEEP GOING!' : '(>_<) STUDY MORE!'}
          </div>
        </div>
        <div className="text-[9px] text-center opacity-50 pt-2 border-t border-lcd-dark/20">
          B BACK TO MENU
        </div>
      </div>
    )
  }

  const isCorrect = phase === 'result' && selected === current.correctIndex

  return (
    <div className={`h-full flex flex-col font-dot text-lcd-dark select-none ${shake ? 'animate-shake' : ''}`}>
      {/* status bar */}
      <div className="flex justify-between items-center mb-1.5 pb-1 border-b-2 border-lcd-dark/30 text-[10px]">
        <div className="flex items-center gap-2">
          <span>{phase === 'result' ? (isCorrect ? '(^_^)' : '(>_<)') : '(･_･)'}</span>
          {currentStreak > 1 && <span>🔥{currentStreak}</span>}
          <span>SCORE: {sessionScore}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-lcd-dark rounded-full animate-blink" />
          <span>{cursor + 1}/{items.length}</span>
        </div>
      </div>

      {/* word */}
      <div className="mb-2">
        <div className="text-[9px] opacity-60 tracking-wider mb-0.5">TRANSLATE:</div>
        <div className="text-3xl font-bold tracking-tight leading-none mb-0.5">{current.vocab.word}</div>
        <div className="text-xs opacity-60">{current.vocab.reading}</div>
      </div>

      {/* 2-choice options */}
      <div className="space-y-1.5 flex-1">
        {current.options.map((opt, i) => {
          const isSelected = selected === i
          const showCorrect = phase === 'result' && i === current.correctIndex
          const showWrong = phase === 'result' && isSelected && !isCorrect

          return (
            <button
              key={i}
              onClick={() => { if (phase === 'question') { sounds.click(); setSelected(i as 0 | 1) } }}
              className={`
                w-full text-left px-2 py-2 text-sm tracking-wide
                border-2 transition-all duration-75
                ${isSelected && phase === 'question'
                  ? 'bg-lcd-dark text-lcd-bg border-lcd-dark'
                  : showCorrect
                    ? 'bg-lcd-dark text-lcd-bg border-lcd-dark'
                    : showWrong
                      ? 'bg-lcd-dark/20 border-lcd-dark/40 line-through opacity-50'
                      : 'bg-lcd-dark/5 border-lcd-dark/20 hover:bg-lcd-dark/15'}
              `}
            >
              <span className="opacity-60 mr-2">{i === 0 ? 'A.' : 'B.'}</span>
              {opt}
              {showCorrect && <span className="ml-2">✓</span>}
              {showWrong && <span className="ml-2">✗</span>}
            </button>
          )
        })}
      </div>

      {/* footer */}
      <div className="mt-2 pt-1.5 border-t-2 border-lcd-dark/30 text-[9px] text-center">
        {phase === 'question'
          ? <span className="opacity-60">↑↓ SELECT  A CONFIRM  B BACK</span>
          : <span className="font-bold">{isCorrect ? '◆ CORRECT! ◆' : '◇ WRONG ◇'} — A NEXT</span>
        }
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-lcd-dark/10 border border-lcd-dark/30 p-2">
      <div className="text-[9px] opacity-60 mb-0.5">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  )
}
