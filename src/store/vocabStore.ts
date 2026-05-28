import { create } from 'zustand'

export type Screen = 'boot' | 'menu' | 'quiz' | 'flashcard' | 'wordlist' | 'stats' | 'addword'

interface VocabState {
  screen: Screen
  currentStreak: number
  bestStreak: number
  sessionScore: number
  sessionTotal: number
  allWords: VocabRow[]
  isLoading: boolean

  setScreen: (s: Screen) => void
  setAllWords: (words: VocabRow[]) => void
  incrementStreak: () => void
  resetStreak: () => void
  recordCorrect: () => void
  recordWrong: () => void
  resetSession: () => void
  setLoading: (v: boolean) => void
}

export const useVocabStore = create<VocabState>((set, get) => ({
  screen: 'boot',
  currentStreak: 0,
  bestStreak: 0,
  sessionScore: 0,
  sessionTotal: 0,
  allWords: [],
  isLoading: false,

  setScreen: (screen) => set({ screen }),
  setAllWords: (allWords) => set({ allWords }),
  setLoading: (isLoading) => set({ isLoading }),

  incrementStreak: () => set(s => ({
    currentStreak: s.currentStreak + 1,
    bestStreak: Math.max(s.bestStreak, s.currentStreak + 1),
  })),
  resetStreak: () => set({ currentStreak: 0 }),

  recordCorrect: () => {
    get().incrementStreak()
    set(s => ({ sessionScore: s.sessionScore + 1, sessionTotal: s.sessionTotal + 1 }))
  },
  recordWrong: () => {
    get().resetStreak()
    set(s => ({ sessionTotal: s.sessionTotal + 1 }))
  },
  resetSession: () => set({ sessionScore: 0, sessionTotal: 0, currentStreak: 0 }),
}))
