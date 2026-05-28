import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { db } from '../../utils/db'
import { useVocabStore } from '../../store/vocabStore'
import { sounds } from '../../utils/audio'

interface Props {
  onBack: () => void
}

type Tab = 'manual' | 'import'
type ImportState = 'idle' | 'preview' | 'saving' | 'done'

const CATEGORIES = ['동사', '명사', '형용사', 'な형용사', '부사', 'custom'] as const
type Category = typeof CATEGORIES[number]

interface ParsedWord {
  word: string
  reading: string
  meaning: string
  example: string
  category: string
}

export function AddWordScreen({ onBack }: Props) {
  const { setAllWords } = useVocabStore()
  const [tab, setTab] = useState<Tab>('manual')

  // ── 직접 입력 ──────────────────────────────────────────────────
  const [word, setWord]         = useState('')
  const [reading, setReading]   = useState('')
  const [meaning, setMeaning]   = useState('')
  const [example, setExample]   = useState('')
  const [category, setCategory] = useState<Category>('custom')
  const [saved, setSaved]       = useState(false)

  // ── 엑셀 가져오기 ───────────────────────────────────────────────
  const fileRef                         = useRef<HTMLInputElement>(null)
  const [importState, setImportState]   = useState<ImportState>('idle')
  const [parsed, setParsed]             = useState<ParsedWord[]>([])
  const [savedCount, setSavedCount]     = useState(0)
  const [errorMsg, setErrorMsg]         = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onBack])

  // 직접 입력 저장
  const handleSave = async () => {
    if (!word.trim() || !reading.trim() || !meaning.trim()) return
    sounds.correct()
    await db.addWord(word.trim(), reading.trim(), meaning.trim(), example.trim(), category)
    const updated = await db.getAll()
    setAllWords(updated)
    setSaved(true)
    setWord(''); setReading(''); setMeaning(''); setExample(''); setCategory('custom')
    setTimeout(() => setSaved(false), 1500)
  }

  // 엑셀 파일 파싱
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorMsg('')

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer)
        const wb   = XLSX.read(data, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]

        // 1행 헤더 스킵, 빈 행 제거
        const validCategories: string[] = [...CATEGORIES]
        const words: ParsedWord[] = rows
          .slice(1)
          .filter(r => r[0] && r[1] && r[2])
          .map(r => {
            const rawCat = r[4] ? String(r[4]).trim() : ''
            return {
              word:     String(r[0]).trim(),
              reading:  String(r[1]).trim(),
              meaning:  String(r[2]).trim(),
              example:  r[3] ? String(r[3]).trim() : '',
              category: validCategories.includes(rawCat) ? rawCat : 'custom',
            }
          })

        if (words.length === 0) {
          setErrorMsg('유효한 단어가 없어요. 형식을 확인해 주세요.')
          return
        }

        sounds.click()
        setParsed(words)
        setImportState('preview')
      } catch {
        setErrorMsg('파일을 읽을 수 없어요.')
      }
    }
    reader.readAsArrayBuffer(file)
    // input 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = ''
  }

  // 엑셀 일괄 저장
  const handleImport = async () => {
    setImportState('saving')
    for (const w of parsed) {
      await db.addWord(w.word, w.reading, w.meaning, w.example, w.category)
    }
    const updated = await db.getAll()
    setAllWords(updated)
    sounds.correct()
    setSavedCount(parsed.length)
    setImportState('done')
  }

  const resetImport = () => {
    setParsed([]); setImportState('idle'); setErrorMsg('')
  }

  return (
    <div className="min-h-full flex flex-col font-dot text-lcd-dark select-none">
      {/* 헤더 */}
      <div className="text-center border-b-2 border-lcd-dark/30 pb-1.5 mb-2">
        <div className="text-xl tracking-widest">◆ ADD WORD ◆</div>
      </div>

      {/* 탭 */}
      <div className="flex mb-3 border-b border-lcd-dark/20">
        {(['manual', 'import'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { sounds.click(); setTab(t) }}
            className={`flex-1 py-1 text-[10px] tracking-widest transition-colors
              ${tab === t ? 'bg-lcd-dark text-lcd-bg' : 'opacity-50 hover:opacity-80'}`}
          >
            {t === 'manual' ? '직접 입력' : '엑셀 가져오기'}
          </button>
        ))}
      </div>

      {/* ── 직접 입력 탭 ── */}
      {tab === 'manual' && (
        <div className="flex-1 space-y-2">
          <Field label="WORD (일본어)"  value={word}    onChange={setWord}    placeholder="e.g. 勉強" />
          <Field label="READING (읽기)" value={reading} onChange={setReading} placeholder="e.g. べんきょう" />
          <Field label="MEANING (뜻)"   value={meaning} onChange={setMeaning} placeholder="e.g. 공부" />
          <Field label="EXAMPLE (예문)" value={example} onChange={setExample} placeholder="e.g. 毎日勉強する" />
          <div>
            <div className="text-[9px] opacity-60 mb-0.5 tracking-wider">CATEGORY</div>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-1.5 py-0.5 text-[9px] border transition-colors ${category === c ? 'bg-lcd-dark text-lcd-bg border-lcd-dark' : 'border-lcd-dark/30 hover:bg-lcd-dark/10'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          {saved && <div className="text-center text-sm animate-pixelIn">◆ SAVED! ◆</div>}
          <button
            onClick={handleSave}
            disabled={!word || !reading || !meaning}
            className="w-full py-2 border-2 border-lcd-dark text-sm tracking-wider hover:bg-lcd-dark hover:text-lcd-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            SAVE WORD
          </button>
        </div>
      )}

      {/* ── 엑셀 가져오기 탭 ── */}
      {tab === 'import' && (
        <div className="flex-1 flex flex-col gap-2">

          {/* idle: 파일 선택 전 */}
          {importState === 'idle' && (
            <>
              {/* 형식 안내 */}
              <div className="bg-lcd-dark/8 border border-lcd-dark/20 p-2 text-[9px] leading-relaxed opacity-75">
                <div className="font-bold mb-1 tracking-wider">엑셀 형식 안내</div>
                <div>A열: 단어 (한자)  ← 필수</div>
                <div>B열: 읽기 (히라가나)  ← 필수</div>
                <div>C열: 뜻 (한국어)  ← 필수</div>
                <div>D열: 예문  ← 선택</div>
                <div>E열: 품사  ← 선택</div>
                <div className="mt-1 opacity-60">품사: 동사·명사·형용사·な형용사·부사·custom</div>
                <div className="mt-0.5 opacity-70">※ 1행은 헤더로 자동 스킵</div>
              </div>

              {errorMsg && (
                <div className="text-[10px] text-center opacity-70">{errorMsg}</div>
              )}

              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-2 border-2 border-lcd-dark text-sm tracking-wider hover:bg-lcd-dark hover:text-lcd-bg transition-colors"
              >
                📂 파일 선택
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFile}
                className="hidden"
              />
            </>
          )}

          {/* preview: 파싱 결과 확인 */}
          {importState === 'preview' && (
            <>
              <div className="text-[10px] tracking-wider opacity-70 text-center">
                {parsed.length}개 단어 발견
              </div>
              {/* 미리보기 최대 3개 */}
              <div className="space-y-1">
                {parsed.slice(0, 3).map((w, i) => (
                  <div key={i} className="bg-lcd-dark/10 border border-lcd-dark/20 px-2 py-1 text-[9px]">
                    <span className="font-bold">{w.word}</span>
                    <span className="opacity-60 mx-1">·</span>
                    <span className="opacity-70">{w.reading}</span>
                    <span className="opacity-60 mx-1">·</span>
                    <span>{w.meaning}</span>
                    <span className="opacity-50 mx-1">·</span>
                    <span className="opacity-60">{w.category}</span>
                  </div>
                ))}
                {parsed.length > 3 && (
                  <div className="text-[9px] text-center opacity-50">
                    외 {parsed.length - 3}개...
                  </div>
                )}
              </div>
              <button
                onClick={handleImport}
                className="w-full py-2 border-2 border-lcd-dark text-sm tracking-wider hover:bg-lcd-dark hover:text-lcd-bg transition-colors"
              >
                ▶ {parsed.length}개 저장
              </button>
              <button onClick={resetImport} className="text-[9px] text-center opacity-50 hover:opacity-80">
                취소
              </button>
            </>
          )}

          {/* saving */}
          {importState === 'saving' && (
            <div className="flex-1 flex items-center justify-center text-sm tracking-wider animate-pulse">
              SAVING...
            </div>
          )}

          {/* done */}
          {importState === 'done' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="text-xl tracking-widest">◆ DONE! ◆</div>
              <div className="text-[10px] opacity-70">{savedCount}개 단어가 추가됐어요</div>
              <button
                onClick={resetImport}
                className="px-4 py-1.5 border-2 border-lcd-dark text-sm tracking-wider hover:bg-lcd-dark hover:text-lcd-bg transition-colors"
              >
                더 가져오기
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-[9px] text-center opacity-50 pt-2 border-t border-lcd-dark/20 mt-2">
        B / ESC BACK
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div>
      <div className="text-[9px] opacity-60 mb-0.5 tracking-wider">{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-lcd-dark/10 border border-lcd-dark/40 px-2 py-1 text-sm font-dot text-lcd-dark placeholder:opacity-30 outline-none focus:border-lcd-dark"
      />
    </div>
  )
}
