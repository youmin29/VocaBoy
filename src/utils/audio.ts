const playBeep = (frequency: number, duration: number, type: OscillatorType = 'square') => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration / 1000)
  } catch {
    // Web Audio not supported
  }
}

export const sounds = {
  click: () => playBeep(800, 35),
  select: () => playBeep(900, 40),
  correct: () => {
    playBeep(880, 80)
    setTimeout(() => playBeep(1108, 120), 90)
  },
  wrong: () => {
    playBeep(300, 80)
    setTimeout(() => playBeep(250, 120), 90)
  },
  boot: () => {
    playBeep(440, 60)
    setTimeout(() => playBeep(550, 60), 80)
    setTimeout(() => playBeep(660, 120), 160)
  },
  menuOpen: () => playBeep(1200, 50),
  back: () => playBeep(500, 40),
  flip: () => playBeep(700, 30),
  streak: () => {
    playBeep(660, 60)
    setTimeout(() => playBeep(880, 60), 70)
    setTimeout(() => playBeep(1100, 100), 140)
  },
}
