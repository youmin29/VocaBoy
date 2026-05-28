import { useEffect, useState } from 'react'
import { db } from '../../utils/db'
import { sounds } from '../../utils/audio'

interface Props {
  onBack: () => void
}

export function StatsScreen({ onBack }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    db.getStats().then(setStats)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'x') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onBack])

  if (!stats) return (
    <div className="h-full flex items-center justify-center font-dot text-lcd-dark text-lg">LOADING...</div>
  )

  const total = stats.totalCorrect + stats.totalWrong
  const acc = total > 0 ? Math.round((stats.totalCorrect / total) * 100) : 0
  const masteredPct = stats.totalWords > 0 ? Math.round((stats.masteredWords / stats.totalWords) * 100) : 0

  return (
    <div className="h-full flex flex-col font-dot text-lcd-dark select-none">
      <div className="text-center border-b-2 border-lcd-dark/30 pb-2 mb-3">
        <div className="text-xl tracking-widest">◆ MY STATS ◆</div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="TOTAL WORDS" value={String(stats.totalWords)} />
          <StatBox label="MASTERED" value={`${stats.masteredWords}`} sub={`${masteredPct}%`} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatBox label="CORRECT" value={String(stats.totalCorrect)} />
          <StatBox label="WRONG" value={String(stats.totalWrong)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatBox label="ACCURACY" value={`${acc}%`} />
          <StatBox label="BEST STREAK" value={String(stats.bestStreak)} />
        </div>

        {/* mastery bar */}
        <div className="bg-lcd-dark/10 border border-lcd-dark/30 p-2">
          <div className="text-[9px] opacity-60 mb-1">MASTERY PROGRESS</div>
          <div className="h-2 bg-lcd-dark/20 border border-lcd-dark/30">
            <div className="h-full bg-lcd-dark transition-all duration-500" style={{ width: `${masteredPct}%` }} />
          </div>
          <div className="text-[9px] opacity-60 mt-0.5 text-right">{stats.masteredWords}/{stats.totalWords}</div>
        </div>

        {/* reset button */}
        <button
          onClick={async () => {
            sounds.wrong()
            if (window.confirm && window.confirm('진행 기록을 초기화할까요?')) {
              await db.resetProgress()
              const s = await db.getStats()
              setStats(s)
            }
          }}
          className="w-full border border-lcd-dark/30 py-1 text-[10px] opacity-60 hover:opacity-100 hover:bg-lcd-dark/10 transition-colors"
        >
          RESET PROGRESS
        </button>
      </div>

      <div className="text-[9px] text-center opacity-50 pt-2 border-t border-lcd-dark/20">B BACK</div>
    </div>
  )
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-lcd-dark/10 border border-lcd-dark/30 p-2">
      <div className="text-[9px] opacity-60 mb-0.5">{label}</div>
      <div className="text-xl font-bold">{value} {sub && <span className="text-sm opacity-60">{sub}</span>}</div>
    </div>
  )
}
