import { RetroHandheld } from './components/RetroHandheld'

export default function App() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      {/* subtle grid bg */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 40px)`,
        }}
      />
      <RetroHandheld />
    </div>
  )
}
