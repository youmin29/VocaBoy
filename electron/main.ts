import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import http from 'node:http'
import fs from 'node:fs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let win: BrowserWindow | null
let localServer: http.Server | null = null
let localPort = 0

function startLocalServer(): Promise<void> {
  return new Promise((resolve) => {
    localServer = http.createServer((req, res) => {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
      let filePath = path.join(RENDERER_DIST, pathname)

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(RENDERER_DIST, 'index.html')
      }

      const ext = path.extname(filePath)
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' })
      fs.createReadStream(filePath).pipe(res)
    })

    localServer.listen(0, () => {
      const addr = localServer!.address() as { port: number }
      localPort = addr.port
      resolve()
    })
  })
}

function initDatabase() {
  const Database = require('better-sqlite3')
  const dbPath = path.join(app.getPath('userData'), 'vocaboy.db')
  db = new Database(dbPath)

  db.exec(`
    CREATE TABLE IF NOT EXISTS vocab (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      reading TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example TEXT,
      level TEXT NOT NULL DEFAULT 'N4',
      category TEXT NOT NULL DEFAULT 'general',
      is_custom INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vocab_id INTEGER NOT NULL REFERENCES vocab(id),
      correct INTEGER NOT NULL DEFAULT 0,
      wrong INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0,
      last_seen TEXT,
      mastered INTEGER NOT NULL DEFAULT 0,
      UNIQUE(vocab_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      played_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 780,
    minWidth: 480,
    minHeight: 680,
    resizable: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadURL(`http://localhost:${localPort}`)
  }
}

// ── IPC: vocab ──────────────────────────────────────────────────────────────

ipcMain.handle('vocab:getAll', () => {
  return db.prepare(`
    SELECT v.*, p.correct, p.wrong, p.streak, p.last_seen, p.mastered
    FROM vocab v
    LEFT JOIN progress p ON v.id = p.vocab_id
    ORDER BY v.id ASC
  `).all()
})

ipcMain.handle('vocab:getByCategory', (_e: unknown, category: string) => {
  return db.prepare(`
    SELECT v.*, p.correct, p.wrong, p.streak, p.last_seen, p.mastered
    FROM vocab v
    LEFT JOIN progress p ON v.id = p.vocab_id
    WHERE v.category = ?
    ORDER BY v.id ASC
  `).all(category)
})

ipcMain.handle('vocab:getRandom', (_e: unknown, count: number, excludeIds: number[]) => {
  const placeholders = excludeIds.length > 0 ? `AND v.id NOT IN (${excludeIds.join(',')})` : ''
  return db.prepare(`
    SELECT v.*, p.correct, p.wrong, p.streak, p.last_seen, p.mastered
    FROM vocab v
    LEFT JOIN progress p ON v.id = p.vocab_id
    WHERE 1=1 ${placeholders}
    ORDER BY RANDOM()
    LIMIT ?
  `).all(count)
})

ipcMain.handle('vocab:addCustom', (_e: unknown, word: string, reading: string, meaning: string, example: string) => {
  const result = db.prepare(
    `INSERT INTO vocab (word, reading, meaning, example, level, category, is_custom) VALUES (?, ?, ?, ?, 'N4', 'custom', 1)`
  ).run(word, reading, meaning, example)
  return result.lastInsertRowid
})

ipcMain.handle('vocab:delete', (_e: unknown, id: number) => {
  db.prepare('DELETE FROM progress WHERE vocab_id = ?').run(id)
  db.prepare('DELETE FROM vocab WHERE id = ? AND is_custom = 1').run(id)
})

// ── IPC: progress ────────────────────────────────────────────────────────────

ipcMain.handle('progress:record', (_e: unknown, vocabId: number, correct: boolean) => {
  const existing = db.prepare('SELECT * FROM progress WHERE vocab_id = ?').get(vocabId)
  if (existing) {
    if (correct) {
      const newStreak = (existing.streak || 0) + 1
      const mastered = newStreak >= 5 ? 1 : existing.mastered
      db.prepare(`
        UPDATE progress SET correct = correct + 1, streak = ?, mastered = ?, last_seen = datetime('now')
        WHERE vocab_id = ?
      `).run(newStreak, mastered, vocabId)
    } else {
      db.prepare(`
        UPDATE progress SET wrong = wrong + 1, streak = 0, mastered = 0, last_seen = datetime('now')
        WHERE vocab_id = ?
      `).run(vocabId)
    }
  } else {
    db.prepare(`
      INSERT INTO progress (vocab_id, correct, wrong, streak, last_seen)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(vocabId, correct ? 1 : 0, correct ? 0 : 1, correct ? 1 : 0)
  }
})

ipcMain.handle('progress:reset', () => {
  db.prepare('UPDATE progress SET correct = 0, wrong = 0, streak = 0, mastered = 0, last_seen = NULL').run()
})

ipcMain.handle('progress:getStats', () => {
  const total = db.prepare('SELECT COUNT(*) as count FROM vocab').get() as { count: number }
  const mastered = db.prepare('SELECT COUNT(*) as count FROM progress WHERE mastered = 1').get() as { count: number }
  const totalCorrect = db.prepare('SELECT SUM(correct) as sum FROM progress').get() as { sum: number }
  const totalWrong = db.prepare('SELECT SUM(wrong) as sum FROM progress').get() as { sum: number }
  const bestStreak = db.prepare('SELECT MAX(streak) as max FROM progress').get() as { max: number }
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY played_at DESC LIMIT 10').all()
  return {
    totalWords: total.count,
    masteredWords: mastered.count,
    totalCorrect: totalCorrect.sum || 0,
    totalWrong: totalWrong.sum || 0,
    bestStreak: bestStreak.max || 0,
    recentSessions: sessions,
  }
})

// ── IPC: sessions ────────────────────────────────────────────────────────────

ipcMain.handle('session:save', (_e: unknown, mode: string, score: number, total: number, bestStreak: number) => {
  db.prepare(
    'INSERT INTO sessions (mode, score, total, best_streak) VALUES (?, ?, ?, ?)'
  ).run(mode, score, total, bestStreak)
})

// ── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  initDatabase()
  if (!VITE_DEV_SERVER_URL) {
    await startLocalServer()
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') {
    localServer?.close()
    app.quit()
  }
})
