import { sounds } from '../utils/audio'

export type Direction = 'up' | 'down' | 'left' | 'right'

interface Props {
  onPress: (dir: Direction) => void
  pressed: Direction | null
}

export function DPad({ onPress, pressed }: Props) {
  const handle = (dir: Direction) => {
    sounds.click()
    onPress(dir)
  }

  const btn = (dir: Direction, pos: string, shape: string, arrow: string) => (
    <button
      onMouseDown={() => handle(dir)}
      className={`
        absolute ${pos} ${shape}
        bg-gradient-to-b from-[#3a3a4a] to-[#252535]
        border border-[#5a5a6a]/60
        flex items-center justify-center
        transition-all duration-75 active:scale-95
        ${pressed === dir ? 'scale-95 from-[#252535] to-[#1a1a28] shadow-inner' : 'shadow-md'}
      `}
    >
      <span className="text-[#8888aa] text-[10px] leading-none">{arrow}</span>
    </button>
  )

  return (
    <div className="relative w-[88px] h-[88px]">
      {/* center */}
      <div className="absolute inset-0 m-auto w-8 h-8 rounded-sm bg-[#1e1e2e] border border-[#3a3a4a]" />
      {btn('up',    'top-0 left-1/2 -translate-x-1/2 w-8 h-9 rounded-t-md', '', '▲')}
      {btn('down',  'bottom-0 left-1/2 -translate-x-1/2 w-8 h-9 rounded-b-md', '', '▼')}
      {btn('left',  'left-0 top-1/2 -translate-y-1/2 w-9 h-8 rounded-l-md', '', '◀')}
      {btn('right', 'right-0 top-1/2 -translate-y-1/2 w-9 h-8 rounded-r-md', '', '▶')}
    </div>
  )
}
