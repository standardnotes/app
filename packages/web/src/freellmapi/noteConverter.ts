import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import { ContentType, ItemManagerInterface, NoteType, SNNote } from '@standardnotes/snjs'

export interface ConvertedNote {
  uuid: string
  title: string
  text: string
  noteType: NoteType | undefined
  updatedAt: string
  trashed: boolean
  archived: boolean
}

export interface NoteAccessOptions {
  includeTrashed?: boolean
  includeArchived?: boolean
}

const DEFAULT_MAX_CONTEXT_CHARS = 40000
const DEFAULT_MAX_NOTE_CHARS = 8000

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'where',
  'what',
  'when',
  'about',
  'have',
  'saved',
  'note',
  'notes',
  'find',
  'lost',
  'old',
  'into',
  'your',
  'mine',
])

function stripHtmlToText(html: string): string {
  if (!html) {
    return ''
  }
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
  } catch {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}

function flattenSpreadsheetToText(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      sheets?: Array<{
        name?: string
        rows?: Array<{
          cells?: Array<{ value?: unknown }>
        }>
      }>
    }
    if (!Array.isArray(parsed.sheets)) {
      return raw
    }
    const lines: string[] = []
    for (const sheet of parsed.sheets) {
      if (sheet.name) {
        lines.push(`## ${sheet.name}`)
      }
      if (!Array.isArray(sheet.rows)) {
        continue
      }
      for (const row of sheet.rows) {
        if (!Array.isArray(row.cells)) {
          continue
        }
        const vals = row.cells
          .map((cell) => (cell.value == undefined ? '' : String(cell.value)))
          .filter((v) => v.length > 0)
        if (vals.length > 0) {
          lines.push(vals.join(' | '))
        }
      }
    }
    return lines.join('\n')
  } catch {
    return raw
  }
}

export function isNoteSafeForAi(note: SNNote, options?: NoteAccessOptions): boolean {
  if (!options?.includeTrashed && note.trashed) {
    return false
  }
  if (options?.includeArchived === false && note.archived) {
    return false
  }
  if (note.protected) {
    return false
  }
  // Never expose 2FA / TOTP secrets to an AI model
  if (note.noteType === NoteType.Authentication) {
    return false
  }
  return true
}

export async function convertNoteToText(note: SNNote, superConverter: HeadlessSuperConverter): Promise<ConvertedNote> {
  let plainText = note.text || ''

  if (note.noteType === NoteType.Super) {
    try {
      if (plainText.length > 0 && superConverter.isValidSuperString(plainText)) {
        plainText = await superConverter.convertSuperStringToOtherFormat(plainText, 'md')
      } else if (note.preview_plain) {
        plainText = note.preview_plain
      }
    } catch {
      plainText = note.preview_plain || plainText
    }
  } else if (note.noteType === NoteType.RichText) {
    plainText = stripHtmlToText(plainText)
  } else if (note.noteType === NoteType.Spreadsheet) {
    plainText = flattenSpreadsheetToText(plainText)
  }

  return {
    uuid: note.uuid,
    title: note.title || 'Untitled Note',
    text: plainText.trim(),
    noteType: note.noteType,
    updatedAt: note.userModifiedDate ? note.userModifiedDate.toISOString() : note.created_at.toISOString(),
    trashed: Boolean(note.trashed),
    archived: Boolean(note.archived),
  }
}

export function getReadableNotes(items: ItemManagerInterface, options?: NoteAccessOptions): SNNote[] {
  const allNotes = items.getItems<SNNote>(ContentType.TYPES.Note)
  return allNotes
    .filter((note) => isNoteSafeForAi(note, options))
    .sort((a, b) => b.userModifiedDate.getTime() - a.userModifiedDate.getTime())
}

export function tokenizeSearchQuery(query: string, extraKeywords?: string[]): string[] {
  const rawTokens = [query, ...(extraKeywords || [])]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9_\u00c0-\u024f\u0600-\u06ff]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)

  const filtered = rawTokens.filter((t) => !STOP_WORDS.has(t))
  const unique = Array.from(new Set(filtered.length > 0 ? filtered : rawTokens))
  return unique
}

export function scoreTextMatch(
  title: string,
  tags: string[],
  body: string,
  rawQuery: string,
  extraKeywords?: string[],
): { score: number; matchedTerms: string[]; snippet: string } {
  const phrase = rawQuery.trim().toLowerCase()
  const tokens = tokenizeSearchQuery(rawQuery, extraKeywords)
  const titleLower = title.toLowerCase()
  const tagsLower = tags.map((t) => t.toLowerCase())
  const bodyLower = body.toLowerCase()

  let score = 0
  const matchedTerms: string[] = []
  let bestHitIndex = -1

  if (phrase.length >= 2) {
    if (titleLower.includes(phrase)) {
      score += 12
    }
    const phraseBodyIdx = bodyLower.indexOf(phrase)
    if (phraseBodyIdx !== -1) {
      score += 10
      bestHitIndex = phraseBodyIdx
    }
  }

  for (const token of tokens) {
    let tokenMatched = false
    if (titleLower.includes(token)) {
      score += 5
      tokenMatched = true
    }
    if (tagsLower.some((t) => t.includes(token))) {
      score += 4
      tokenMatched = true
    }
    const bodyIdx = bodyLower.indexOf(token)
    if (bodyIdx !== -1) {
      score += 3
      tokenMatched = true
      if (bestHitIndex === -1) {
        bestHitIndex = bodyIdx
      }
    }
    if (tokenMatched) {
      matchedTerms.push(token)
    }
  }

  if (score === 0) {
    return { score: 0, matchedTerms: [], snippet: '' }
  }

  let snippet = body.slice(0, 240)
  if (bestHitIndex !== -1) {
    const start = Math.max(0, bestHitIndex - 90)
    const end = Math.min(body.length, bestHitIndex + 170)
    snippet = `${start > 0 ? '...' : ''}${body.slice(start, end)}${end < body.length ? '...' : ''}`
  }

  return {
    score,
    matchedTerms,
    snippet: snippet.replace(/\s+/g, ' ').trim(),
  }
}

export async function buildNotesContext(
  notes: SNNote[],
  superConverter: HeadlessSuperConverter,
  options?: {
    maxTotalChars?: number
    maxNoteChars?: number
    includeTrashed?: boolean
  },
): Promise<{ contextText: string; includedNotes: ConvertedNote[]; truncatedCount: number }> {
  const maxTotalChars = options?.maxTotalChars ?? DEFAULT_MAX_CONTEXT_CHARS
  const maxNoteChars = options?.maxNoteChars ?? DEFAULT_MAX_NOTE_CHARS

  const safeNotes = notes.filter((n) => isNoteSafeForAi(n, { includeTrashed: options?.includeTrashed }))
  const sections: string[] = []
  const includedNotes: ConvertedNote[] = []
  let usedChars = 0
  let truncatedCount = 0

  for (const note of safeNotes) {
    const converted = await convertNoteToText(note, superConverter)
    const body =
      converted.text.length > maxNoteChars ? `${converted.text.slice(0, maxNoteChars)}\n...[truncated]` : converted.text

    const statusFlags = [converted.archived ? 'ARCHIVED' : '', converted.trashed ? 'TRASHED' : '']
      .filter(Boolean)
      .join(', ')

    const block = [
      '=== NOTE ===',
      `UUID: ${converted.uuid}`,
      `Title: ${converted.title}`,
      ...(statusFlags ? [`Status: ${statusFlags}`] : []),
      `Updated: ${converted.updatedAt}`,
      'Content:',
      body || '(empty note)',
      '=== END NOTE ===',
    ].join('\n')

    if (usedChars + block.length > maxTotalChars && includedNotes.length > 0) {
      truncatedCount += 1
      continue
    }

    sections.push(block)
    includedNotes.push(converted)
    usedChars += block.length
  }

  return {
    contextText: sections.join('\n\n'),
    includedNotes,
    truncatedCount,
  }
}
