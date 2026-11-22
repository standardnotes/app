import { WebApplication } from '@/Application/WebApplication'
import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import { MutationType, NativeFeatureIdentifier, NoteMutator, NoteType, SNNote } from '@standardnotes/snjs'
import { isNoteSafeForAi } from './noteConverter'

const LEGACY_SNAPSHOTS_STORAGE_KEY = 'sn.freellmapi.snapshots.v1'
const MAX_SNAPSHOTS = 50
const MAX_BACKUP_FILE_BYTES = 25 * 1024 * 1024
const MAX_BACKUP_RECORDS = 5000

export interface NoteEditSnapshot {
  id: string
  noteUuid: string
  noteTitle: string
  previousTitle: string
  previousText: string
  previousNoteType: NoteType | undefined
  previousPreviewPlain: string
  savedAt: string
  reason: string
}

export interface BackupNoteRecord {
  id: string
  sourceFile: string
  uuid?: string
  title: string
  text: string
  noteType?: string
  updatedAt?: string
}

/**
 * Snapshots are kept strictly in memory (keyed by workspace identifier) and never written
 * unencrypted to localStorage so locked or signed-out sessions cannot leak note plaintext on disk.
 */
const inMemorySnapshotsByWorkspace = new Map<string, NoteEditSnapshot[]>()

export function purgeLegacyLocalStorageSnapshots(): void {
  try {
    window.localStorage.removeItem(LEGACY_SNAPSHOTS_STORAGE_KEY)
  } catch {
    // Ignore storage availability errors
  }
}

export function loadNoteSnapshots(workspaceId = 'default'): NoteEditSnapshot[] {
  return [...(inMemorySnapshotsByWorkspace.get(workspaceId) || [])]
}

export function saveNoteSnapshots(snapshots: NoteEditSnapshot[], workspaceId = 'default'): void {
  inMemorySnapshotsByWorkspace.set(workspaceId, snapshots.slice(0, MAX_SNAPSHOTS))
}

export function captureNoteSnapshot(note: SNNote, reason: string, workspaceId = 'default'): NoteEditSnapshot {
  const snapshot: NoteEditSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    noteUuid: note.uuid,
    noteTitle: note.title || 'Untitled Note',
    previousTitle: note.title || '',
    previousText: note.text || '',
    previousNoteType: note.noteType,
    previousPreviewPlain: note.preview_plain || '',
    savedAt: new Date().toISOString(),
    reason,
  }

  const existing = loadNoteSnapshots(workspaceId)
  saveNoteSnapshots([snapshot, ...existing], workspaceId)
  return snapshot
}

export function deleteNoteSnapshot(snapshotId: string, workspaceId = 'default'): NoteEditSnapshot[] {
  const next = loadNoteSnapshots(workspaceId).filter((s) => s.id !== snapshotId)
  saveNoteSnapshots(next, workspaceId)
  return next
}

export function clearAllNoteSnapshots(workspaceId = 'default'): void {
  inMemorySnapshotsByWorkspace.delete(workspaceId)
}

export async function restoreNoteFromSnapshot(
  application: WebApplication,
  snapshot: NoteEditSnapshot,
): Promise<SNNote> {
  const existingNote = application.items.findItem<SNNote>(snapshot.noteUuid)

  if (!existingNote) {
    const recreated = await application.notesController.createNoteWithContent(
      NativeFeatureIdentifier.TYPES.PlainEditor,
      snapshot.previousTitle || snapshot.noteTitle || 'Restored Note',
      snapshot.previousText,
    )
    void application.sync.sync()
    await application.itemListController.selectItem(recreated.uuid, true).catch(console.error)
    return recreated
  }

  if (!isNoteSafeForAi(existingNote, { includeTrashed: true, includeArchived: true })) {
    throw new Error('Cannot restore this note because it is protected or an authenticator note.')
  }

  if (existingNote.locked) {
    throw new Error(`Cannot restore "${existingNote.title || 'Untitled Note'}" because it is locked.`)
  }

  const restored = await application.mutator.changeItem<NoteMutator, SNNote>(
    existingNote,
    (mutator) => {
      mutator.title = snapshot.previousTitle
      mutator.text = snapshot.previousText
      mutator.preview_plain = snapshot.previousPreviewPlain
      mutator.preview_html = undefined
      mutator.trashed = false
    },
    MutationType.UpdateUserTimestamps,
  )

  void application.sync.sync()
  await application.itemListController.selectItem(restored.uuid, true).catch(console.error)
  return restored
}

interface StandardNotesBackupJson {
  items?: Array<{
    uuid?: string
    content_type?: string
    deleted?: boolean
    updated_at?: string
    created_at?: string
    content?:
      | {
          title?: string
          text?: string
          noteType?: string
          preview_plain?: string
          protected?: boolean
        }
      | string
  }>
}

function stripHtmlBasic(html: string): string {
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

export async function parseLocalBackupFiles(
  files: File[],
  superConverter: HeadlessSuperConverter,
): Promise<{ records: BackupNoteRecord[]; skippedEncryptedCount: number; skippedOversizedFiles: string[] }> {
  const records: BackupNoteRecord[] = []
  let skippedEncryptedCount = 0
  const skippedOversizedFiles: string[] = []

  for (const file of files) {
    if (records.length >= MAX_BACKUP_RECORDS) {
      break
    }

    if (file.size > MAX_BACKUP_FILE_BYTES) {
      skippedOversizedFiles.push(file.name)
      continue
    }

    const raw = await file.text()
    const lowerName = file.name.toLowerCase()

    if (lowerName.endsWith('.json')) {
      try {
        const parsed = JSON.parse(raw) as StandardNotesBackupJson
        if (Array.isArray(parsed.items)) {
          for (const item of parsed.items) {
            if (records.length >= MAX_BACKUP_RECORDS) {
              break
            }
            if (item.content_type !== 'Note' || item.deleted) {
              continue
            }
            if (typeof item.content === 'string') {
              skippedEncryptedCount += 1
              continue
            }
            if (!item.content || typeof item.content !== 'object') {
              continue
            }
            if (item.content.protected || item.content.noteType === NoteType.Authentication) {
              continue
            }

            let text = String(item.content.text || '')
            if (item.content.noteType === NoteType.Super && text && superConverter.isValidSuperString(text)) {
              try {
                text = await superConverter.convertSuperStringToOtherFormat(text, 'md')
              } catch {
                text = item.content.preview_plain || text
              }
            } else if (item.content.noteType === NoteType.RichText) {
              text = stripHtmlBasic(text)
            }

            records.push({
              id: `bkp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              sourceFile: file.name,
              uuid: item.uuid,
              title: String(item.content.title || 'Untitled Backup Note'),
              text: text.trim(),
              noteType: item.content.noteType,
              updatedAt: item.updated_at || item.created_at,
            })
          }
          continue
        }
      } catch {
        // Fall through and treat as plain text file
      }
    }

    const baseTitle = file.name.replace(/\.(md|txt|json)$/i, '')
    records.push({
      id: `bkp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceFile: file.name,
      title: baseTitle || file.name,
      text: raw.trim(),
      updatedAt: new Date(file.lastModified).toISOString(),
    })
  }

  return { records, skippedEncryptedCount, skippedOversizedFiles }
}
