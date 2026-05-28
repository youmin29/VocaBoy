import { useState, useEffect } from 'react'
import { useVocabStore, Screen, QuizMode } from '../store/vocabStore'
import { db, ensureSeeded } from '../utils/db'
import { sounds } from '../utils/audio'

import { LCDScreen } from './LCDScreen'
import { DPad, Direction } from './DPad'
import { ActionButtons } from './ActionButtons'
import { BootScreen } from './BootScreen'
import { MenuScreen } from './screens/MenuScreen'
import { QuizModeScreen } from './screens/QuizModeScreen'
import { QuizScreen } from './screens/QuizScreen'
import { FlashcardScreen } from './screens/FlashcardScreen'
import { WordListScreen } from './screens/WordListScreen'
import { StatsScreen } from './screens/StatsScreen'
import { AddWordScreen } from './screens/AddWordScreen'

export function RetroHandheld() {
  const { screen, setScreen, setAllWords, setQuizMode, currentStreak, sessionScore, sessionTotal } = useVocabStore()
  const [pressedA, setPressedA] = useState(false)
  const [pressedB, setPressedB] = useState(false)
  const [pressedDir, setPressedDir] = useState<Direction | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(1, (window.innerWidth - 16) / 440))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // load all words on boot complete
  const handleBootComplete = async () => {
    await ensureSeeded()
    const words = await db.getAll()
    setAllWords(words)
    setScreen('menu')
  }

  const handleDPad = (dir: Direction) => {
    setPressedDir(dir)
    setTimeout(() => setPressedDir(null), 120)
    // dispatch keyboard event for screen handlers
    const key = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir]
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  }

  const handleA = () => {
    setPressedA(true)
    setTimeout(() => setPressedA(false), 120)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  }

  const handleB = () => {
    setPressedB(true)
    setTimeout(() => setPressedB(false), 120)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  }

  const navigateTo = (s: Screen) => setScreen(s)
  const goMenu = () => setScreen('menu')

  const acc = sessionTotal > 0 ? Math.round((sessionScore / sessionTotal) * 100) : 0

  return (
    <div className="relative flex flex-col items-center" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
      {/* ── Device body — 기기 플라스틱 전체 drag ── */}
      <div className="relative w-[420px] bg-gradient-to-b from-[#d0d0dc] via-[#c4c4d0] to-[#b8b8c8] rounded-[44px] shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] border border-[#a0a0b4] select-none cursor-grab active:cursor-grabbing"
        style={{ paddingBottom: '32px', WebkitAppRegion: 'drag' } as React.CSSProperties}>

        {/* glossy highlight */}
        <div className="absolute top-0 left-0 right-0 h-40 rounded-t-[44px] bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
        {/* bottom shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-20 rounded-b-[44px] bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

        <div className="relative flex flex-col items-center px-8 pt-8">

          {/* ── Top brand bar ── */}
          <div className="flex justify-between items-center w-full mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
              <span className="text-[10px] font-mono tracking-[0.2em] text-[#5a5a7a] font-bold">VOCABOY</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
            </div>
            {/* battery */}
            <div className="flex items-center gap-1 opacity-70">
              <span className="text-[8px] font-mono text-[#6a6a8a] tracking-wider">BATT</span>
              <div className="flex items-center">
                <div className="w-6 h-3 border border-[#6a6a8a] rounded-l-[2px] flex items-center px-0.5">
                  <div className="flex-1 h-1.5 bg-emerald-600 rounded-[1px]" />
                </div>
                <div className="w-0.5 h-2 bg-[#6a6a8a] rounded-r" />
              </div>
            </div>
          </div>

          {/* ── LCD Screen ── */}
          <div className="mb-8" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <LCDScreen>
              {screen === 'boot'     && <BootScreen onComplete={handleBootComplete} />}
              {screen === 'menu'     && <MenuScreen onNavigate={navigateTo} />}
              {screen === 'quizmode' && (
                <QuizModeScreen
                  onSelect={(mode: QuizMode) => { setQuizMode(mode); setScreen('quiz') }}
                  onBack={goMenu}
                />
              )}
              {screen === 'quiz'     && <QuizScreen onBack={() => setScreen('quizmode')} />}
              {screen === 'flashcard'&& <FlashcardScreen onBack={goMenu} />}
              {screen === 'wordlist' && <WordListScreen onBack={goMenu} />}
              {screen === 'stats'    && <StatsScreen onBack={goMenu} />}
              {screen === 'addword'  && <AddWordScreen onBack={goMenu} />}
            </LCDScreen>
          </div>

          {/* ── Speaker grille ── */}
          <div className="flex gap-[3px] mb-5 self-end mr-4 opacity-40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[3px] h-7 bg-[#7a7a9a] rounded-full" />
            ))}
          </div>

          {/* ── Controls ── */}
          <div className="flex items-center justify-between w-full px-2 mb-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <DPad onPress={handleDPad} pressed={pressedDir} />

            {/* center info */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full border-2 border-[#9090b0]/40 flex items-center justify-center">
                <span className="font-mono text-[8px] text-[#7a7a9a] tracking-wider text-center leading-tight">
                  {screen !== 'boot' && screen !== 'menu' ? `${acc}%` : 'SEL'}
                </span>
              </div>
              {currentStreak > 1 && (
                <span className="font-dot text-[9px] text-lcd-dark bg-lcd-bg/80 px-1 rounded border border-lcd-dark/30">
                  🔥{currentStreak}
                </span>
              )}
            </div>

            <ActionButtons onA={handleA} onB={handleB} pressedA={pressedA} pressedB={pressedB} />
          </div>

          {/* ── Menu / Start buttons ── */}
          <div className="flex gap-6 items-center mb-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            {[{ label: 'SELECT', key: 'Tab' }, { label: 'START', key: 'Enter' }].map(({ label, key }) => (
              <button
                key={label}
                onClick={() => {
                  sounds.click()
                  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-10 h-3 rounded-full bg-gradient-to-b from-[#8888aa] to-[#5a5a7a] shadow-md border border-[#4a4a6a]/50" />
                <span className="font-mono text-[7px] text-[#6a6a8a] tracking-widest">{label}</span>
              </button>
            ))}
          </div>

        </div>

        {/* bottom label */}
        <div className="absolute bottom-3 left-0 right-0 text-center font-mono text-[7px] text-[#7a7a9a] tracking-[0.15em]">
          JAPANESE VOCABULARY TRAINER • MODEL VB-2003
        </div>
      </div>

      {/* ground shadow */}
      <div className="w-[340px] h-4 bg-black/25 rounded-full blur-xl -mt-1" />
    </div>
  )
}
