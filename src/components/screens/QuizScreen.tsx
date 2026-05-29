import { useEffect, useState, useCallback } from 'react'
import { useVocabStore, QuizMode } from '../../store/vocabStore'
import { db } from '../../utils/db'
import { sounds } from '../../utils/audio'

type Phase = 'question' | 'result' | 'summary'

interface QuizItem {
  vocab: VocabRow
  questionLabel: string   // 화면 상단 안내 ("TRANSLATE" / "READING" / "WRITING")
  questionText: string    // 문제로 보여줄 텍스트
  questionSub: string     // 문제 서브텍스트 (읽기, 뜻 등 힌트)
  options: [string, string]
  correctIndex: 0 | 1
  type: QuizMode
}

function buildItem(vocab: VocabRow, pool: VocabRow[], type: QuizMode): QuizItem {
  const hasKanji = vocab.word.trim() !== ''

  // 한자 없는 단어는 random이어도 의미 퀴즈만 가능
  let resolvedType = type === 'random'
    ? (['meaning', 'reading', 'writing'] as const)[Math.floor(Math.random() * 3)]
    : type
  if (!hasKanji && resolvedType !== 'meaning') resolvedType = 'meaning'

  const others = pool.filter(v => v.id !== vocab.id)
  const ci: 0 | 1 = Math.random() < 0.5 ? 0 : 1

  if (resolvedType === 'reading') {
    // 한자 → 히라가나
    const pick = others[Math.floor(Math.random() * others.length)]
    const opts: [string, string] = ci === 0
      ? [vocab.reading, pick.reading]
      : [pick.reading, vocab.reading]
    return { vocab, questionLabel: 'READING', questionText: vocab.word, questionSub: vocab.meaning, options: opts, correctIndex: ci, type: resolvedType }
  }

  if (resolvedType === 'writing') {
    // 히라가나 → 한자 (보기도 한자 있는 단어에서만)
    const kanjiOthers = others.filter(v => v.word.trim() !== '')
    const pick = kanjiOthers[Math.floor(Math.random() * kanjiOthers.length)]
    const opts: [string, string] = ci === 0
      ? [vocab.word, pick.word]
      : [pick.word, vocab.word]
    return { vocab, questionLabel: 'WRITING', questionText: vocab.reading, questionSub: vocab.meaning, options: opts, correctIndex: ci, type: resolvedType }
  }

  // meaning: 한자 있으면 한자 표시, 없으면 히라가나 표시 → 한국어 뜻 맞추기
  const pick = others[Math.floor(Math.random() * others.length)]
  const questionText = hasKanji ? vocab.word : vocab.reading
  const questionSub  = hasKanji ? vocab.reading : ''
  const opts: [string, string] = ci === 0
    ? [vocab.meaning, pick.meaning]
    : [pick.meaning, vocab.meaning]
  return { vocab, questionLabel: 'MEANING', questionText, questionSub, options: opts, correctIndex: ci, type: resolvedType }
}

interface Props {
  onBack: () => void
}

const QUIZ_LENGTH = 10

export function QuizScreen({ onBack }: Props) {
  const { allWords, quizMode, starFilterActive, recordCorrect, recordWrong, sessionScore, sessionTotal, currentStreak, bestStreak, resetSession } = useVocabStore()
  const [items, setItems] = useState<QuizItem[]>([])
  const [cursor, setCursor] = useState(0)
  const [selected, setSelected] = useState<0 | 1 | null>(null)
  const [phase, setPhase] = useState<Phase>('question')
  const [shake, setShake] = useState(false)

  const pool = starFilterActive ? allWords.filter(w => w.starred) : allWords

  // 읽기·표기 모드는 한자 있는 단어만 출제
  const quizPool = (quizMode === 'reading' || quizMode === 'writing')
    ? pool.filter(v => v.word.trim() !== '')
    : pool

  useEffect(() => {
    if (quizPool.length < 4) return
    resetSession()
    const shuffled = [...quizPool].sort(() => Math.random() - 0.5).slice(0, QUIZ_LENGTH)
    setItems(shuffled.map(v => buildItem(v, allWords, quizMode)))
    setCursor(0); setSelected(null); setPhase('question')
  }, [allWords, quizMode, starFilterActive])

  const current = items[cursor]

  const confirm = useCallback(async () => {
    if (!current || selected === null || phase !== 'question') return
    const correct = selected === current.correctIndex
    setPhase('result')
    if (correct) {
      sounds.correct(); recordCorrect()
      await db.recordProgress(current.vocab.id, true)
    } else {
      sounds.wrong(); recordWrong()
      setShake(true); setTimeout(() => setShake(false), 350)
      await db.recordProgress(current.vocab.id, false)
    }
  }, [current, selected, phase, recordCorrect, recordWrong])

  const next = useCallback(async () => {
    if (cursor + 1 >= items.length) {
      const isLastCorrect = selected === current?.correctIndex
      await db.saveSession(quizMode, sessionScore + (isLastCorrect ? 1 : 0), sessionTotal + 1, bestStreak)
      setPhase('summary')
    } else {
      setCursor(p => p + 1); setSelected(null); setPhase('question')
    }
  }, [cursor, items.length, sessionScore, sessionTotal, bestStreak, selected, current, quizMode])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === 'summary') { if (e.key === 'Escape' || e.key === 'x') onBack(); return }
      if (phase === 'result')  { if (e.key === 'Enter' || e.key === 'z') next(); return }
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  { sounds.click(); setSelected(0) }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { sounds.click(); setSelected(1) }
      else if (e.key === 'Enter' || e.key === 'z') confirm()
      else if (e.key === 'Escape' || e.key === 'x') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, confirm, next, onBack])

  if (quizPool.length < 4) return (
    <div className="h-full flex flex-col items-center justify-center font-dot text-lcd-dark gap-3 text-center px-4">
      {starFilterActive
        ? <>
            <div className="text-2xl">★</div>
            <div className="text-sm tracking-wide">즐겨찾기 단어가<br/>4개 이상 필요해요</div>
            <div className="text-[10px] opacity-50">단어 목록에서 ★를 눌러<br/>즐겨찾기를 추가해주세요</div>
          </>
        : <>
            <div className="text-2xl">(･_･)</div>
            <div className="text-sm tracking-wide">한자가 있는 단어가<br/>4개 이상 필요해요</div>
            <div className="text-[10px] opacity-50">의미 퀴즈 또는 랜덤 믹스를<br/>이용해 주세요</div>
          </>
      }
    </div>
  )

  if (items.length === 0) return (
    <div className="h-full flex items-center justify-center font-dot text-lcd-dark text-lg">LOADING...</div>
  )

  // ── Summary ───────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const acc = sessionTotal > 0 ? Math.round((sessionScore / sessionTotal) * 100) : 0
    const modeLabel: Record<QuizMode, string> = { meaning: '의미', reading: '읽기', writing: '표기', random: '랜덤' }
    return (
      <div className="h-full flex flex-col font-dot text-lcd-dark select-none">
        <div className="text-center border-b-2 border-lcd-dark/30 pb-2 mb-3">
          <div className="text-xl tracking-widest">◆ RESULT ◆</div>
          <div className="text-[9px] opacity-60 mt-0.5">[{modeLabel[quizMode]} 퀴즈]</div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="SCORE"    value={`${sessionScore}/${sessionTotal}`} />
            <StatBox label="ACCURACY" value={`${acc}%`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="STREAK" value={String(currentStreak)} />
            <StatBox label="BEST"   value={String(bestStreak)} />
          </div>
          <div className="text-center text-sm mt-3 opacity-70">
            {acc >= 80 ? '(^_^) GREAT JOB!' : acc >= 60 ? '(･_･) KEEP GOING!' : '(>_<) STUDY MORE!'}
          </div>
        </div>
        <div className="text-[9px] text-center opacity-50 pt-2 border-t border-lcd-dark/20">B BACK TO MENU</div>
      </div>
    )
  }

  const isCorrect = phase === 'result' && selected === current.correctIndex

  // ── Type badge color ──────────────────────────────────────────────────────
  const typeBadge: Record<string, string> = {
    meaning: 'KOR', reading: 'よみ', writing: '漢字',
  }

  return (
    <div className={`h-full flex flex-col font-dot text-lcd-dark select-none ${shake ? 'animate-shake' : ''}`}>
      {/* status bar */}
      <div className="flex justify-between items-center mb-1.5 pb-1 border-b-2 border-lcd-dark/30 text-[10px]">
        <div className="flex items-center gap-2">
          <span>{phase === 'result' ? (isCorrect ? '(^_^)' : '(>_<)') : '(･_･)'}</span>
          {currentStreak > 1 && <span>🔥{currentStreak}</span>}
          <span>SCORE: {sessionScore}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="border border-lcd-dark/40 px-1 text-[8px] opacity-60">{typeBadge[current.type] ?? '?'}</span>
          <span className="w-1.5 h-1.5 bg-lcd-dark rounded-full animate-blink" />
          <span>{cursor + 1}/{items.length}</span>
        </div>
      </div>

      {/* question */}
      <div className="mb-2">
        <div className="text-[9px] opacity-60 tracking-wider mb-0.5">{current.questionLabel}:</div>
        <div className="text-3xl font-bold tracking-tight leading-none mb-0.5">{current.questionText}</div>
        <div className="text-xs opacity-50">{current.questionSub}</div>
      </div>

      {/* options */}
      <div className="space-y-1.5 flex-1">
        {current.options.map((opt, i) => {
          const isSel      = selected === i
          const showRight  = phase === 'result' && i === current.correctIndex
          const showWrong  = phase === 'result' && isSel && !isCorrect

          return (
            <button
              key={i}
              onClick={() => { if (phase === 'question') { sounds.click(); setSelected(i as 0 | 1) } }}
              className={`
                w-full text-left px-2 py-2 text-sm tracking-wide border-2 transition-all duration-75
                ${isSel && phase === 'question' ? 'bg-lcd-dark text-lcd-bg border-lcd-dark'
                  : showRight ? 'bg-lcd-dark text-lcd-bg border-lcd-dark'
                  : showWrong ? 'bg-lcd-dark/20 border-lcd-dark/40 line-through opacity-50'
                  : 'bg-lcd-dark/5 border-lcd-dark/20 hover:bg-lcd-dark/15'}
              `}
            >
              <span className="opacity-60 mr-2">{i === 0 ? 'A.' : 'B.'}</span>
              {opt}
              {showRight && <span className="ml-2">✓</span>}
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
