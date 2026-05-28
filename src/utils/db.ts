import { JLPT_N4_VOCAB } from '../data/jlpt-n4'

let seeded = false

export async function ensureSeeded() {
  if (seeded) return
  seeded = true

  if (!window.vocaAPI) return

  const all = await window.vocaAPI.vocab.getAll()
  if (all.length > 0) return

  for (const v of JLPT_N4_VOCAB) {
    await window.vocaAPI.vocab.addCustom(v.word, v.reading, v.meaning, v.example, v.category)
  }
}

// ── 브라우저 모드용 로컬스토리지 커스텀 단어 ─────────────────────────────────
const STORAGE_KEY = 'vocaboy_custom'

function loadCustomFromStorage(): VocabRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCustomToStorage(words: VocabRow[]) {
  try {
    const custom = words.filter(w => w.is_custom === 1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
  } catch {}
}

// In browser mode (no electron), use in-memory fallback with localStorage persistence
const n4Words: VocabRow[] = JLPT_N4_VOCAB.map((v, i) => ({
  id: i + 1,
  word: v.word,
  reading: v.reading,
  meaning: v.meaning,
  example: v.example,
  level: 'N4',
  category: v.category,
  is_custom: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  mastered: 0,
}))

const memVocab: VocabRow[] = [
  ...n4Words,
  ...loadCustomFromStorage(),
]

const memProgress: Record<number, { correct: number; wrong: number; streak: number; mastered: number }> = {}

export const db = {
  async getAll(): Promise<VocabRow[]> {
    if (window.vocaAPI) return window.vocaAPI.vocab.getAll()
    return memVocab
  },
  async getRandom(count: number, excludeIds: number[]): Promise<VocabRow[]> {
    if (window.vocaAPI) return window.vocaAPI.vocab.getRandom(count, excludeIds)
    const available = memVocab.filter(v => !excludeIds.includes(v.id))
    const shuffled = [...available].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  },
  async recordProgress(vocabId: number, correct: boolean): Promise<void> {
    if (window.vocaAPI) return window.vocaAPI.progress.record(vocabId, correct)
    const p = memProgress[vocabId] ?? { correct: 0, wrong: 0, streak: 0, mastered: 0 }
    if (correct) {
      p.correct++
      p.streak++
      if (p.streak >= 5) p.mastered = 1
    } else {
      p.wrong++
      p.streak = 0
      p.mastered = 0
    }
    memProgress[vocabId] = p
    const v = memVocab.find(x => x.id === vocabId)
    if (v) Object.assign(v, p)
  },
  async getStats(): Promise<StatsData> {
    if (window.vocaAPI) return window.vocaAPI.progress.getStats()
    const mastered = memVocab.filter(v => v.mastered).length
    const totalCorrect = memVocab.reduce((s, v) => s + (v.correct || 0), 0)
    const totalWrong = memVocab.reduce((s, v) => s + (v.wrong || 0), 0)
    const bestStreak = Math.max(0, ...memVocab.map(v => v.streak || 0))
    return { totalWords: memVocab.length, masteredWords: mastered, totalCorrect, totalWrong, bestStreak, recentSessions: [] }
  },
  async saveSession(mode: string, score: number, total: number, bestStreak: number): Promise<void> {
    if (window.vocaAPI) return window.vocaAPI.session.save(mode, score, total, bestStreak)
  },
  async resetProgress(): Promise<void> {
    if (window.vocaAPI) return window.vocaAPI.progress.reset()
    memVocab.forEach(v => { v.correct = 0; v.wrong = 0; v.streak = 0; v.mastered = 0 })
    Object.keys(memProgress).forEach(k => delete memProgress[Number(k)])
  },
  async addWord(word: string, reading: string, meaning: string, example: string, category = 'custom'): Promise<void> {
    if (window.vocaAPI) {
      await window.vocaAPI.vocab.addCustom(word, reading, meaning, example, category)
      return
    }
    // 브라우저 모드: 메모리 + 로컬스토리지에 저장
    const id = memVocab.length + 1
    memVocab.push({ id, word, reading, meaning, example, level: 'N4', category, is_custom: 1, correct: 0, wrong: 0, streak: 0, mastered: 0 })
    saveCustomToStorage(memVocab)
  },
}
