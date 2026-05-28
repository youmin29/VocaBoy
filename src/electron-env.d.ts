interface VocaAPI {
  vocab: {
    getAll: () => Promise<VocabRow[]>
    getByCategory: (category: string) => Promise<VocabRow[]>
    getRandom: (count: number, excludeIds: number[]) => Promise<VocabRow[]>
    addCustom: (word: string, reading: string, meaning: string, example: string) => Promise<number>
    delete: (id: number) => Promise<void>
  }
  progress: {
    record: (vocabId: number, correct: boolean) => Promise<void>
    reset: () => Promise<void>
    getStats: () => Promise<StatsData>
  }
  session: {
    save: (mode: string, score: number, total: number, bestStreak: number) => Promise<void>
  }
}

interface VocabRow {
  id: number
  word: string
  reading: string
  meaning: string
  example?: string
  level: string
  category: string
  is_custom: number
  correct?: number
  wrong?: number
  streak?: number
  last_seen?: string
  mastered?: number
}

interface StatsData {
  totalWords: number
  masteredWords: number
  totalCorrect: number
  totalWrong: number
  bestStreak: number
  recentSessions: SessionRow[]
}

interface SessionRow {
  id: number
  mode: string
  score: number
  total: number
  best_streak: number
  played_at: string
}

declare interface Window {
  vocaAPI: VocaAPI
}
