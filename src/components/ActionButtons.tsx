import { sounds } from '../utils/audio'

interface Props {
  onA: () => void
  onB: () => void
  pressedA: boolean
  pressedB: boolean
}

export function ActionButtons({ onA, onB, pressedA, pressedB }: Props) {
  return (
    <div className="flex items-center gap-3">
      {/* B button - 취소/뒤로 */}
      <div className="flex flex-col items-center gap-1">
        <button
          onMouseDown={() => { sounds.back(); onB() }}
          className={`
            w-9 h-9 rounded-full
            bg-gradient-to-br from-[#c0392b] to-[#922b21]
            border-2 border-[#e74c3c]/40
            shadow-[0_4px_0_#7b241c,0_6px_8px_rgba(0,0,0,0.5)]
            flex items-center justify-center
            transition-all duration-75
            ${pressedB ? 'translate-y-1 shadow-[0_2px_0_#7b241c,0_3px_4px_rgba(0,0,0,0.5)]' : ''}
            active:translate-y-1
          `}
        >
          <span className="font-dot text-white text-sm font-bold">B</span>
        </button>
        <span className="font-dot text-[9px] text-[#6a6a8a] tracking-wider">BACK</span>
      </div>

      {/* A button - 확인/선택 */}
      <div className="flex flex-col items-center gap-1">
        <button
          onMouseDown={() => { sounds.select(); onA() }}
          className={`
            w-11 h-11 rounded-full
            bg-gradient-to-br from-[#2980b9] to-[#1a5276]
            border-2 border-[#3498db]/40
            shadow-[0_4px_0_#154360,0_6px_8px_rgba(0,0,0,0.5)]
            flex items-center justify-center
            transition-all duration-75
            ${pressedA ? 'translate-y-1 shadow-[0_2px_0_#154360,0_3px_4px_rgba(0,0,0,0.5)]' : ''}
            active:translate-y-1
          `}
        >
          <span className="font-dot text-white text-base font-bold">A</span>
        </button>
        <span className="font-dot text-[9px] text-[#6a6a8a] tracking-wider">OK</span>
      </div>
    </div>
  )
}
