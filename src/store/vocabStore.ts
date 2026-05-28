import { create } from 'zustand'

export type Screen = 'boot' | 'menu' | 'quizmode' | 'quiz' | 'flashcard' | 'wordlist' | 'stats' | 'addword'
export type QuizMode = 'meaning' | 'reading' | 'writing' | 'random'

interface VocabState {
  screen: Screen
  quizMode: QuizMode
  currentStreak: number
  bestStreak: number
  sessionScore: number
  sessionTotal: number
  allWords: VocabRow[]
  isLoading: boolean
  starFilterActive: boolean

  setScreen: (s: Screen) => void
  setQuizMode: (m: QuizMode) => void
  setAllWords: (words: VocabRow[]) => void
  incrementStreak: () => void
  resetStreak: () => void
  recordCorrect: () => void
  recordWrong: () => void
  resetSession: () => void
  setLoading: (v: boolean) => void
  toggleStarFilter: () => void
  updateWordStar: (id: number, starred: number) => void
  deleteWord: (id: number) => void
}

export const useVocabStore = create<VocabState>((set, get) => ({
  screen: 'boot',
  quizMode: 'meaning',
  currentStreak: 0,
  bestStreak: 0,
  sessionScore: 0,
  sessionTotal: 0,
  allWords: [],
  isLoading: false,
  starFilterActive: false,

  setScreen: (screen) => set({ screen }),
  setQuizMode: (quizMode) => set({ quizMode }),
  setAllWords: (allWords) => set({ allWords }),
  setLoading: (isLoading) => set({ isLoading }),

  toggleStarFilter: () => set(s => ({ starFilterActive: !s.starFilterActive })),

  updateWordStar: (id, starred) => set(s => ({
    allWords: s.allWords.map(w => w.id === id ? { ...w, starred } : w),
  })),

  deleteWord: (id) => set(s => ({
    allWords: s.allWords.filter(w => w.id !== id),
  })),

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
