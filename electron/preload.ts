import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('vocaAPI', {
  vocab: {
    getAll: () => ipcRenderer.invoke('vocab:getAll'),
    getByCategory: (category: string) => ipcRenderer.invoke('vocab:getByCategory', category),
    getRandom: (count: number, excludeIds: number[]) => ipcRenderer.invoke('vocab:getRandom', count, excludeIds),
    addCustom: (word: string, reading: string, meaning: string, example: string, category: string) =>
      ipcRenderer.invoke('vocab:addCustom', word, reading, meaning, example, category),
    delete: (id: number) => ipcRenderer.invoke('vocab:delete', id),
  },
  progress: {
    record: (vocabId: number, correct: boolean) => ipcRenderer.invoke('progress:record', vocabId, correct),
    reset: () => ipcRenderer.invoke('progress:reset'),
    getStats: () => ipcRenderer.invoke('progress:getStats'),
  },
  session: {
    save: (mode: string, score: number, total: number, bestStreak: number) =>
      ipcRenderer.invoke('session:save', mode, score, total, bestStreak),
  },
})
