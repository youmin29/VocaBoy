import { sounds } from '../utils/audio'

export type Direction = 'up' | 'down' | 'left' | 'right'

interface Props {
  onPress: (dir: Direction) => void
  pressed: Direction | null
}

const CROSS_CLIP = 'polygon(33% 0%, 67% 0%, 67% 33%, 100% 33%, 100% 67%, 67% 67%, 67% 100%, 33% 100%, 33% 67%, 0% 67%, 0% 33%, 33% 33%)'

export function DPad({ onPress, pressed }: Props) {
  const handle = (dir: Direction) => {
    sounds.click()
    onPress(dir)
  }

  const isPressed = pressed !== null
  const lift = isPressed ? 'translateY(2px)' : 'translateY(0px)'

  return (
    // 외부 wrapper: 그림자 공간 확보용 (overflow visible)
    <div className="relative w-[88px] h-[88px]" style={{ overflow: 'visible' }}>

      {/* ── 바닥 진한 십자 (입체 그림자) ── */}
      <div
        className="absolute w-[88px] h-[88px]"
        style={{
          clipPath: CROSS_CLIP,
          backgroundColor: '#14141e',
          top: '4px',
          left: '0',
        }}
      />

      {/* ── 메인 십자 ── */}
      <div
        className="absolute w-[88px] h-[88px] transition-transform duration-75"
        style={{
          clipPath: CROSS_CLIP,
          top: 0,
          left: 0,
          transform: lift,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a3a4a] to-[#282838]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {pressed === 'up'    && <div className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-black/35" />}
        {pressed === 'down'  && <div className="absolute bottom-0 left-1/3 w-1/3 h-1/3 bg-black/35" />}
        {pressed === 'left'  && <div className="absolute left-0 top-1/3 w-1/3 h-1/3 bg-black/35" />}
        {pressed === 'right' && <div className="absolute right-0 top-1/3 w-1/3 h-1/3 bg-black/35" />}
      </div>

      {/* ── 중앙 원형 장식 ── */}
      <div
        className="absolute w-[88px] h-[88px] flex items-center justify-center pointer-events-none transition-transform duration-75"
        style={{ top: 0, left: 0, transform: lift }}
      >
        <div className="w-5 h-5 rounded-full bg-[#1e1e2e]/50 border border-[#4a4a5a]/30" />
      </div>

      {/* ── 화살표 레이블 ── */}
      {([
        ['up',    'items-start justify-center pt-1.5', '▲'],
        ['down',  'items-end   justify-center pb-1.5', '▼'],
        ['left',  'items-center justify-start pl-1.5', '◀'],
        ['right', 'items-center justify-end   pr-1.5', '▶'],
      ] as const).map(([dir, cls, arrow]) => (
        <div
          key={dir}
          className={`absolute w-[88px] h-[88px] flex ${cls} pointer-events-none transition-transform duration-75`}
          style={{ top: 0, left: 0, transform: lift }}
        >
          <span className="text-[#8888a8] text-[9px] leading-none">{arrow}</span>
        </div>
      ))}

      {/* ── 투명 히트존 ── */}
      <button onMouseDown={() => handle('up')}    className="absolute top-0 left-1/3 w-1/3 h-1/3"    style={{ background: 'transparent' }} aria-label="up" />
      <button onMouseDown={() => handle('down')}  className="absolute bottom-0 left-1/3 w-1/3 h-1/3" style={{ background: 'transparent' }} aria-label="down" />
      <button onMouseDown={() => handle('left')}  className="absolute left-0 top-1/3 w-1/3 h-1/3"    style={{ background: 'transparent' }} aria-label="left" />
      <button onMouseDown={() => handle('right')} className="absolute right-0 top-1/3 w-1/3 h-1/3"   style={{ background: 'transparent' }} aria-label="right" />
    </div>
  )
}
