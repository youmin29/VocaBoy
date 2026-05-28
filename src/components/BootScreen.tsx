import { useEffect, useRef, useState } from 'react'
import { sounds } from '../utils/audio'

interface Props {
  onComplete: () => void
}

export function BootScreen({ onComplete }: Props) {
  const [stage, setStage] = useState(0)
  const [ready, setReady] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // 로딩 애니메이션 (자동 진행)
  useEffect(() => {
    const t0 = setTimeout(() => { setStage(1); sounds.boot() }, 400)
    const t1 = setTimeout(() => setStage(2), 1100)
    const t2 = setTimeout(() => setStage(3), 1700)
    const t3 = setTimeout(() => setStage(4), 2300)
    const t4 = setTimeout(() => setReady(true), 3000) // 완료 후 입력 대기
    return () => [t0, t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  // 키 입력으로 진입
  useEffect(() => {
    if (!ready) return
    const handler = () => { sounds.select(); onCompleteRef.current() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [ready])

  const handlePress = () => {
    if (!ready) return
    sounds.select()
    onCompleteRef.current()
  }

  return (
    <div
      className="h-full flex flex-col items-center justify-center text-lcd-dark font-dot select-none"
      onClick={handlePress}
      style={{ cursor: ready ? 'pointer' : 'default' }}
    >
      <div className="mb-6 text-center">
        <div className={`text-4xl font-bold tracking-widest transition-opacity duration-200 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          VOCABOY
        </div>
        <div className={`text-sm mt-1 transition-opacity duration-300 ${stage >= 2 ? 'opacity-70' : 'opacity-0'}`}>
          JLPT N4 TRAINER
        </div>
      </div>

      {stage >= 3 && (
        <div className="w-36 mb-4">
          <div className="text-xs mb-1 text-center tracking-wider">
            {ready ? 'READY!' : 'LOADING...'}
          </div>
          <div className="h-2 bg-lcd-dark/20 border border-lcd-dark/40">
            <div
              className="h-full bg-lcd-dark transition-all duration-700"
              style={{ width: stage >= 4 ? '100%' : '40%' }}
            />
          </div>
        </div>
      )}

      {/* PRESS ANY KEY — 로딩 완료 후 깜빡임 */}
      <div className={`text-xs tracking-widest transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}>
        <span className="animate-blink">▶ PRESS ANY KEY</span>
      </div>

      <div className={`absolute bottom-3 text-[10px] tracking-wider transition-opacity duration-300 ${stage >= 2 ? 'opacity-50' : 'opacity-0'}`}>
        VB-2003  v1.0
      </div>
    </div>
  )
}
