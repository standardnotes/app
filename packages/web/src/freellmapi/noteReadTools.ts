import { WebApplication } from '@/Application/WebApplication'
import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import { ContentType, NoteHistoryEntry, NoteType, SNNote, SNTag } from '@standardnotes/snjs'
import { convertNoteToText, getReadableNotes, isNoteSafeForAi, scoreTextMatch } from './noteConverter'
import { EditNoteMode, openNoteInEditor } from './noteOperations'
import { BackupNoteRecord, loadNoteSnapshots, SnapshotPersistenceOptions } from './recoveryStore'

export type NoteToolName =
  | 'list_notes'
  | 'search_notes'
  | 'find_lost_info'
  | 'read_note'
  | 'get_note_history'
  | 'audit_missing_info'
  | 'open_note'
  | 'edit_note'
  | 'create_note'
  | 'restore_note'

export interface ListNotesArgs {
  limit?: number
  offset?: number
  tag?: string
  include_trash?: boolean
  include_archived?: boolean
}

export interface SearchNotesArgs {
  query: string
  keywords?: string[]
  limit?: number
  include_trash?: boolean
  include_archived?: boolean
}

export interface FindLostInfoArgs {
  query: string
  keywords?: string[]
  include_history?: boolean
  limit?: number
}

export interface ReadNoteArgs {
  uuid?: string
  title?: string
  open_in_ui?: boolean
}

export interface GetNoteHistoryArgs {
  uuid?: string
  title?: string
  limit?: number
}

export interface AuditMissingInfoArgs {
  limit?: number
}

export interface OpenNoteArgs {
  uuid?: string
  title?: string
}

export interface EditNoteArgs {
  uuid?: string
  title?: string
  mode?: EditNoteMode
  content?: string
  old_text?: string
  new_text?: string
  new_title?: string
  heading?: string
}

export interface CreateNoteArgs {
  title: string
  content: string
}

export interface RestoreNoteArgs {
  uuid?: string
  title?: string
  snapshot_id?: string
  backup_id?: string
}

export type NoteToolCall =
  | { tool: 'list_notes'; args: ListNotesArgs }
  | { tool: 'search_notes'; args: SearchNotesArgs }
  | { tool: 'find_lost_info'; args: FindLostInfoArgs }
  | { tool: 'read_note'; args: ReadNoteArgs }
  | { tool: 'get_note_history'; args: GetNoteHistoryArgs }
  | { tool: 'audit_missing_info'; args: AuditMissingInfoArgs }
  | { tool: 'open_note'; args: OpenNoteArgs }
  | { tool: 'edit_note'; args: EditNoteArgs }
  | { tool: 'create_note'; args: CreateNoteArgs }
  | { tool: 'restore_note'; args: RestoreNoteArgs }

export interface NoteSummaryItem {
  uuid: string
  title: string
  tags: string[]
  noteType: NoteType | undefined
  locked: boolean
  trashed: boolean
  archived: boolean
  updatedAt: string
  preview: string
}

export interface ToolExecutionStep {
  id: string
  tool: NoteToolName
  summary: string
  status: 'executed' | 'pending' | 'applied' | 'rejected' | 'error'
  targetUuid?: string
  targetTitle?: string
  snapshotId?: string
  error?: string
  requiresConfirmationReason?: string
  call: NoteToolCall
}

export interface ToolRuntimeContext {
  backupRecords: BackupNoteRecord[]
  snapshotPersistence?: SnapshotPersistenceOptions
  onSnapshotsChanged?: () => void
}

export function getTagsForNote(application: WebApplication, note: SNNote): string[] {
  return application.items
    .itemsReferencingItem<SNTag>(note)
    .filter((ref) => ref.content_type === ContentType.TYPES.Tag)
    .map((tag) => tag.title)
    .filter(Boolean)
}

export function summarizeNote(application: WebApplication, note: SNNote): NoteSummaryItem {
  const rawPreview = note.preview_plain || (note.noteType === NoteType.Super ? '' : note.text || '')
  return {
    uuid: note.uuid,
    title: note.title || 'Untitled Note',
    tags: getTagsForNote(application, note),
    noteType: note.noteType,
    locked: note.locked,
    trashed: Boolean(note.trashed),
    archived: Boolean(note.archived),
    updatedAt: note.userModifiedDate ? note.userModifiedDate.toISOString() : note.created_at.toISOString(),
    preview: rawPreview.replace(/\s+/g, ' ').trim().slice(0, 140),
  }
}

export function resolveNoteByUuidOrTitle(
  application: WebApplication,
  uuid?: string,
  title?: string,
  includeTrashed = true,
): SNNote | undefined {
  const readable = getReadableNotes(application.items, {
    includeTrashed,
    includeArchived: true,
  })

  if (uuid && uuid.trim()) {
    const byId = readable.find((note) => note.uuid === uuid.trim())
    if (byId) {
      return byId
    }
  }

  if (title && title.trim()) {
    const needle = title.trim().toLowerCase()
    const exact = readable.find((note) => (note.title || '').trim().toLowerCase() === needle)
    if (exact) {
      return exact
    }
    const partial = readable.find((note) => (note.title || '').toLowerCase().includes(needle))
    if (partial) {
      return partial
    }
  }

  return undefined
}

function normalizeParsedTool(raw: unknown): NoteToolCall | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }

  const obj = raw as Record<string, unknown>

  if (typeof obj.action === 'string' && !obj.tool) {
    if (obj.action === 'create_note' && typeof obj.title === 'string' && typeof obj.content === 'string') {
      return {
        tool: 'create_note',
        args: { title: obj.title, content: obj.content },
      }
    }
    if (obj.action === 'append_notation' && typeof obj.content === 'string') {
      return {
        tool: 'edit_note',
        args: {
          mode: 'append',
          heading: typeof obj.title === 'string' ? obj.title : undefined,
          content: obj.content,
        },
      }
    }
  }

  const toolName = obj.tool
  const args = (obj.args && typeof obj.args === 'object' ? obj.args : obj) as Record<string, unknown>

  switch (toolName) {
    case 'list_notes':
      return {
        tool: 'list_notes',
        args: {
          limit: typeof args.limit === 'number' ? args.limit : undefined,
          offset: typeof args.offset === 'number' ? args.offset : undefined,
          tag: typeof args.tag === 'string' ? args.tag : undefined,
          include_trash: typeof args.include_trash === 'boolean' ? args.include_trash : undefined,
          include_archived: typeof args.include_archived === 'boolean' ? args.include_archived : undefined,
        },
      }
    case 'search_notes':
      if (typeof args.query !== 'string' || !args.query.trim()) {
        return undefined
      }
      return {
        tool: 'search_notes',
        args: {
          query: args.query,
          keywords: Array.isArray(args.keywords)
            ? args.keywords.filter((k): k is string => typeof k === 'string')
            : undefined,
          limit: typeof args.limit === 'number' ? args.limit : undefined,
          include_trash: typeof args.include_trash === 'boolean' ? args.include_trash : undefined,
          include_archived: typeof args.include_archived === 'boolean' ? args.include_archived : undefined,
        },
      }
    case 'find_lost_info':
      if (typeof args.query !== 'string' || !args.query.trim()) {
        return undefined
      }
      return {
        tool: 'find_lost_info',
        args: {
          query: args.query,
          keywords: Array.isArray(args.keywords)
            ? args.keywords.filter((k): k is string => typeof k === 'string')
            : undefined,
          include_history: typeof args.include_history === 'boolean' ? args.include_history : undefined,
          limit: typeof args.limit === 'number' ? args.limit : undefined,
        },
      }
    case 'read_note':
      return {
        tool: 'read_note',
        args: {
          uuid: typeof args.uuid === 'string' ? args.uuid : undefined,
          title: typeof args.title === 'string' ? args.title : undefined,
          open_in_ui: typeof args.open_in_ui === 'boolean' ? args.open_in_ui : undefined,
        },
      }
    case 'get_note_history':
      return {
        tool: 'get_note_history',
        args: {
          uuid: typeof args.uuid === 'string' ? args.uuid : undefined,
          title: typeof args.title === 'string' ? args.title : undefined,
          limit: typeof args.limit === 'number' ? args.limit : undefined,
        },
      }
    case 'audit_missing_info':
      return {
        tool: 'audit_missing_info',
        args: {
          limit: typeof args.limit === 'number' ? args.limit : undefined,
        },
      }
    case 'open_note':
      return {
        tool: 'open_note',
        args: {
          uuid: typeof args.uuid === 'string' ? args.uuid : undefined,
          title: typeof args.title === 'string' ? args.title : undefined,
        },
      }
    case 'edit_note': {
      const mode =
        args.mode === 'overwrite' || args.mode === 'replace_text' || args.mode === 'append'
          ? args.mode
          : typeof args.old_text === 'string'
          ? 'replace_text'
          : 'overwrite'
      return {
        tool: 'edit_note',
        args: {
          uuid: typeof args.uuid === 'string' ? args.uuid : undefined,
          title: typeof args.title === 'string' ? args.title : undefined,
          mode,
          content: typeof args.content === 'string' ? args.content : undefined,
          old_text: typeof args.old_text === 'string' ? args.old_text : undefined,
          new_text: typeof args.new_text === 'string' ? args.new_text : undefined,
          new_title: typeof args.new_title === 'string' ? args.new_title : undefined,
          heading: typeof args.heading === 'string' ? args.heading : undefined,
        },
      }
    }
    case 'create_note':
      if (typeof args.title !== 'string' && typeof args.content !== 'string') {
        return undefined
      }
      return {
        tool: 'create_note',
        args: {
          title: typeof args.title === 'string' ? args.title : 'AI Note',
          content: typeof args.content === 'string' ? args.content : '',
        },
      }
    case 'restore_note':
      if (
        typeof args.uuid !== 'string' &&
        typeof args.title !== 'string' &&
        typeof args.snapshot_id !== 'string' &&
        typeof args.backup_id !== 'string'
      ) {
        return undefined
      }
      return {
        tool: 'restore_note',
        args: {
          uuid: typeof args.uuid === 'string' ? args.uuid : undefined,
          title: typeof args.title === 'string' ? args.title : undefined,
          snapshot_id: typeof args.snapshot_id === 'string' ? args.snapshot_id : undefined,
          backup_id: typeof args.backup_id === 'string' ? args.backup_id : undefined,
        },
      }
    default:
      return undefined
  }
}

export function parseToolCalls(responseText: string): {
  displayText: string
  toolCalls: NoteToolCall[]
  malformedBlocksCount: number
} {
  const blockRegex = /```(?:sn-tool|sn-action)\s*([\s\S]*?)```/gi
  const toolCalls: NoteToolCall[] = []
  let malformedBlocksCount = 0

  let match: RegExpExecArray | null
  while ((match = blockRegex.exec(responseText)) !== null) {
    const rawJson = match[1].trim()
    try {
      const parsed = JSON.parse(rawJson) as unknown
      let acceptedInBlock = 0
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          const normalized = normalizeParsedTool(entry)
          if (normalized) {
            toolCalls.push(normalized)
            acceptedInBlock += 1
          }
        }
      } else {
        const normalized = normalizeParsedTool(parsed)
        if (normalized) {
          toolCalls.push(normalized)
          acceptedInBlock += 1
        }
      }
      if (acceptedInBlock === 0) {
        malformedBlocksCount += 1
      }
    } catch {
      malformedBlocksCount += 1
    }
  }

  const displayText = toolCalls.length > 0 ? responseText.replace(blockRegex, '').trim() : responseText.trim()

  return { displayText, toolCalls, malformedBlocksCount }
}

async function runDeepLostInfoSearch(
  application: WebApplication,
  superConverter: HeadlessSuperConverter,
  query: string,
  options: {
    keywords?: string[]
    includeTrash: boolean
    includeArchived: boolean
    includeHistory: boolean
    limit: number
    backupRecords: BackupNoteRecord[]
  },
) {
  const readable = getReadableNotes(application.items, {
    includeTrashed: options.includeTrash,
    includeArchived: options.includeArchived,
  })

  interface RankedHit {
    source: 'active_note' | 'archived_note' | 'trashed_note' | 'session_history' | 'ai_snapshot' | 'backup_file'
    score: number
    uuid?: string
    snapshotId?: string
    backupId?: string
    sourceFile?: string
    title: string
    tags: string[]
    updatedAt: string
    matchedTerms: string[]
    snippet: string
  }

  const hits: RankedHit[] = []

  for (const note of readable) {
    const tags = getTagsForNote(application, note)
    const converted = await convertNoteToText(note, superConverter)
    const match = scoreTextMatch(converted.title, tags, converted.text, query, options.keywords)
    if (match.score > 0) {
      hits.push({
        source: note.trashed ? 'trashed_note' : note.archived ? 'archived_note' : 'active_note',
        score: match.score,
        uuid: converted.uuid,
        title: converted.title,
        tags,
        updatedAt: converted.updatedAt,
        matchedTerms: match.matchedTerms,
        snippet: match.snippet,
      })
    }

    if (options.includeHistory) {
      const historyEntries = (application.history.sessionHistoryForItem(note) || []) as NoteHistoryEntry[]
      for (const entry of historyEntries.slice(0, 6)) {
        const entryNote = entry.itemFromPayload() as SNNote
        const entryConverted = await convertNoteToText(entryNote, superConverter)
        const hMatch = scoreTextMatch(entryConverted.title, tags, entryConverted.text, query, options.keywords)
        if (hMatch.score > match.score) {
          hits.push({
            source: 'session_history',
            score: hMatch.score - 0.5,
            uuid: note.uuid,
            title: `${entryConverted.title} (past session version)`,
            tags,
            updatedAt: entry.payload.updated_at.toISOString(),
            matchedTerms: hMatch.matchedTerms,
            snippet: hMatch.snippet,
          })
          break
        }
      }
    }
  }

  if (options.includeHistory) {
    const snapshots = loadNoteSnapshots(application.identifier)
    for (const snap of snapshots) {
      const sMatch = scoreTextMatch(
        snap.previousTitle || snap.noteTitle,
        [],
        snap.previousText,
        query,
        options.keywords,
      )
      if (sMatch.score > 0) {
        hits.push({
          source: 'ai_snapshot',
          score: sMatch.score - 0.5,
          uuid: snap.noteUuid,
          snapshotId: snap.id,
          title: `${snap.noteTitle} (snapshot before edit)`,
          tags: [],
          updatedAt: snap.savedAt,
          matchedTerms: sMatch.matchedTerms,
          snippet: sMatch.snippet,
        })
      }
    }
  }

  for (const record of options.backupRecords) {
    const bMatch = scoreTextMatch(record.title, [record.sourceFile], record.text, query, options.keywords)
    if (bMatch.score > 0) {
      hits.push({
        source: 'backup_file',
        score: bMatch.score,
        uuid: record.uuid,
        backupId: record.id,
        sourceFile: record.sourceFile,
        title: record.title,
        tags: [],
        updatedAt: record.updatedAt || '',
        matchedTerms: bMatch.matchedTerms,
        snippet: bMatch.snippet,
      })
    }
  }

  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, options.limit)
}

export async function executeReadTool(
  application: WebApplication,
  superConverter: HeadlessSuperConverter,
  call: NoteToolCall,
  runtimeContext: ToolRuntimeContext,
): Promise<{
  resultJson: string
  summary: string
  targetUuid?: string
  targetTitle?: string
}> {
  if (call.tool === 'list_notes') {
    const all = getReadableNotes(application.items, {
      includeTrashed: Boolean(call.args.include_trash),
      includeArchived: call.args.include_archived !== false,
    })
    const filtered = call.args.tag
      ? all.filter((note) =>
          getTagsForNote(application, note).some((t) => t.toLowerCase() === call.args.tag!.trim().toLowerCase()),
        )
      : all
    const offset = Math.max(0, call.args.offset ?? 0)
    const limit = Math.min(100, Math.max(1, call.args.limit ?? 40))
    const slice = filtered.slice(offset, offset + limit).map((n) => summarizeNote(application, n))

    return {
      resultJson: JSON.stringify({ total: filtered.length, offset, count: slice.length, notes: slice }, null, 2),
      summary: `Browsed ${slice.length} of ${filtered.length} notes${call.args.include_trash ? ' (incl. Trash)' : ''}`,
    }
  }

  if (call.tool === 'search_notes' || call.tool === 'find_lost_info') {
    const isLostInfo = call.tool === 'find_lost_info'
    const limit = Math.min(30, Math.max(1, call.args.limit ?? 15))
    const includeTrash = isLostInfo ? true : call.args.include_trash !== false
    const includeArchived = isLostInfo ? true : call.args.include_archived !== false
    const includeHistory = isLostInfo ? call.args.include_history !== false : false

    const matches = await runDeepLostInfoSearch(application, superConverter, call.args.query, {
      keywords: call.args.keywords,
      includeTrash,
      includeArchived,
      includeHistory,
      limit,
      backupRecords: runtimeContext.backupRecords,
    })

    return {
      resultJson: JSON.stringify(
        {
          query: call.args.query,
          searchedSources: [
            'active_notes',
            ...(includeArchived ? ['archived_notes'] : []),
            ...(includeTrash ? ['trashed_notes'] : []),
            ...(includeHistory ? ['session_history', 'ai_snapshots'] : []),
            ...(runtimeContext.backupRecords.length > 0 ? ['loaded_backup_files'] : []),
          ],
          count: matches.length,
          matches,
        },
        null,
        2,
      ),
      summary: `${isLostInfo ? 'Deep-searched lost info' : 'Searched'} "${call.args.query}" → ${matches.length} match${
        matches.length === 1 ? '' : 'es'
      }`,
      targetUuid: matches[0]?.uuid,
      targetTitle: matches[0]?.title,
    }
  }

  if (call.tool === 'read_note') {
    const note =
      resolveNoteByUuidOrTitle(application, call.args.uuid, call.args.title, true) ||
      (!call.args.uuid && !call.args.title ? application.notesController.firstSelectedNote : undefined)

    if (!note || !isNoteSafeForAi(note, { includeTrashed: true, includeArchived: true })) {
      return {
        resultJson: JSON.stringify({
          error: `Note not found or not accessible (uuid=${call.args.uuid ?? ''}, title=${
            call.args.title ?? ''
          }). Call list_notes or find_lost_info to locate valid UUIDs.`,
        }),
        summary: `Note not found (${call.args.title || call.args.uuid || 'unknown'})`,
      }
    }

    const converted = await convertNoteToText(note, superConverter)
    const tags = getTagsForNote(application, note)

    if (call.args.open_in_ui && !note.trashed) {
      await openNoteInEditor(application, note.uuid)
    }

    const maxChars = 16000
    const body =
      converted.text.length > maxChars
        ? `${converted.text.slice(0, maxChars)}\n...[truncated at ${maxChars} chars]`
        : converted.text

    return {
      resultJson: JSON.stringify(
        {
          uuid: converted.uuid,
          title: converted.title,
          tags,
          noteType: converted.noteType,
          locked: note.locked,
          trashed: converted.trashed,
          archived: converted.archived,
          updatedAt: converted.updatedAt,
          content: body,
        },
        null,
        2,
      ),
      summary: `Read "${converted.title}"${converted.trashed ? ' (Trash)' : converted.archived ? ' (Archived)' : ''}`,
      targetUuid: converted.uuid,
      targetTitle: converted.title,
    }
  }

  if (call.tool === 'get_note_history') {
    const note =
      resolveNoteByUuidOrTitle(application, call.args.uuid, call.args.title, true) ||
      (!call.args.uuid && !call.args.title ? application.notesController.firstSelectedNote : undefined)

    if (!note || !isNoteSafeForAi(note, { includeTrashed: true, includeArchived: true })) {
      return {
        resultJson: JSON.stringify({ error: 'Note not found or not accessible for history lookup.' }),
        summary: 'History lookup: note not found',
      }
    }

    const limit = Math.min(10, Math.max(1, call.args.limit ?? 5))
    const versions: Array<{
      source: 'ai_snapshot' | 'session_history' | 'remote_revision'
      id?: string
      savedAt: string
      title: string
      excerpt: string
    }> = []

    const snapshots = loadNoteSnapshots(application.identifier)
      .filter((s) => s.noteUuid === note.uuid)
      .slice(0, limit)
    for (const snap of snapshots) {
      versions.push({
        source: 'ai_snapshot',
        id: snap.id,
        savedAt: snap.savedAt,
        title: snap.previousTitle || snap.noteTitle,
        excerpt: snap.previousText.slice(0, 2000),
      })
    }

    const sessionEntries = ((application.history.sessionHistoryForItem(note) || []) as NoteHistoryEntry[]).slice(
      0,
      limit,
    )
    for (const entry of sessionEntries) {
      const entryNote = entry.itemFromPayload() as SNNote
      const converted = await convertNoteToText(entryNote, superConverter)
      versions.push({
        source: 'session_history',
        savedAt: entry.payload.updated_at.toISOString(),
        title: converted.title,
        excerpt: converted.text.slice(0, 2000),
      })
    }

    try {
      const listRes = await application.listRevisions.execute({ itemUuid: note.uuid })
      if (!listRes.isFailed()) {
        const revMeta = listRes.getValue().slice(0, Math.min(3, limit))
        for (const meta of revMeta) {
          const revRes = await application.getRevision.execute({
            itemUuid: note.uuid,
            revisionUuid: meta.uuid,
          })
          if (!revRes.isFailed()) {
            const revEntry = revRes.getValue()
            const revNote = revEntry.itemFromPayload() as SNNote
            const converted = await convertNoteToText(revNote, superConverter)
            versions.push({
              source: 'remote_revision',
              id: meta.uuid,
              savedAt: revEntry.payload.updated_at.toISOString(),
              title: converted.title,
              excerpt: converted.text.slice(0, 2000),
            })
          }
        }
      }
    } catch {
      // Offline or unauthenticated
    }

    return {
      resultJson: JSON.stringify(
        {
          uuid: note.uuid,
          title: note.title || 'Untitled Note',
          versionsCount: versions.length,
          versions,
        },
        null,
        2,
      ),
      summary: `Checked history of "${note.title || 'Untitled Note'}" (${versions.length} version${
        versions.length === 1 ? '' : 's'
      })`,
      targetUuid: note.uuid,
      targetTitle: note.title || 'Untitled Note',
    }
  }

  if (call.tool === 'audit_missing_info') {
    const limit = Math.min(60, Math.max(1, call.args.limit ?? 30))
    const notes = getReadableNotes(application.items, { includeTrashed: false, includeArchived: false }).slice(0, limit)

    const findings: Array<{
      uuid: string
      title: string
      updatedAt: string
      issues: string[]
      excerpt: string
    }> = []

    const placeholderRegex = /\b(TODO|TBD|FIXME|TBA|WIP|MISSING|PENDING)\b|\?\?\?|\[ \]|_{3,}/gi

    for (const note of notes) {
      const converted = await convertNoteToText(note, superConverter)
      const issues: string[] = []

      if (!note.title || !note.title.trim()) {
        issues.push('Untitled note')
      }
      if (converted.text.length === 0) {
        issues.push('Empty body')
      } else if (converted.text.length < 30) {
        issues.push('Very short stub (< 30 chars)')
      }

      const markers = converted.text.match(placeholderRegex)
      if (markers && markers.length > 0) {
        const uniqueMarkers = Array.from(new Set(markers.map((m) => m.trim()))).slice(0, 5)
        issues.push(`Open placeholders/tasks (${markers.length}): ${uniqueMarkers.join(', ')}`)
      }

      if (issues.length > 0) {
        findings.push({
          uuid: converted.uuid,
          title: converted.title,
          updatedAt: converted.updatedAt,
          issues,
          excerpt: converted.text.slice(0, 200).replace(/\s+/g, ' ').trim(),
        })
      }
    }

    return {
      resultJson: JSON.stringify({ scannedNotes: notes.length, notesWithGaps: findings.length, findings }, null, 2),
      summary: `Audited ${notes.length} notes → ${findings.length} with missing/incomplete info`,
    }
  }

  if (call.tool === 'open_note') {
    const note = resolveNoteByUuidOrTitle(application, call.args.uuid, call.args.title, true)
    if (!note || !isNoteSafeForAi(note, { includeTrashed: true, includeArchived: true })) {
      return {
        resultJson: JSON.stringify({ error: 'Note not found or not accessible to open.' }),
        summary: `Could not open note (${call.args.title || call.args.uuid || 'unknown'})`,
      }
    }
    await openNoteInEditor(application, note.uuid)
    return {
      resultJson: JSON.stringify({ ok: true, uuid: note.uuid, title: note.title || 'Untitled Note' }),
      summary: `Opened "${note.title || 'Untitled Note'}" in editor`,
      targetUuid: note.uuid,
      targetTitle: note.title || 'Untitled Note',
    }
  }

  throw new Error(`Tool "${call.tool}" is not a read-only tool.`)
}
