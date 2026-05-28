import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function LCDScreen({ children }: Props) {
  return (
    <div className="relative w-[320px] h-[290px]">
      {/* outer bezel */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1a1a2a] to-[#0d0d18] border-4 border-[#0a0a14] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)]">
        {/* inner bezel */}
        <div className="absolute inset-[5px] rounded-lg bg-[#111120] border border-[#252535]">
          {/* LCD panel */}
          <div className="absolute inset-[4px] rounded-md overflow-hidden bg-[#9ca986]">
            {/* LCD grid texture */}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(0,0,0,1) 1px,rgba(0,0,0,1) 2px),repeating-linear-gradient(90deg,transparent,transparent 1px,rgba(0,0,0,1) 1px,rgba(0,0,0,1) 2px)`,
                backgroundSize: '2px 2px',
              }}
            />
            {/* scan lines */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg,rgba(0,0,0,1) 0px,rgba(0,0,0,1) 1px,transparent 1px,transparent 4px)`,
                backgroundSize: '100% 4px',
              }}
            />
            {/* glare */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/15 pointer-events-none rounded-md" />
            {/* content */}
            <div className="relative h-full p-4 overflow-y-auto lcd-scroll">
              {children}
            </div>
          </div>
        </div>
      </div>
      {/* label */}
      <div className="absolute -bottom-5 left-0 right-0 text-center text-[8px] text-[#4a4a6a] font-mono tracking-widest">
        LCD DISPLAY
      </div>
    </div>
  )
}
