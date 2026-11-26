import { WebApplication } from '@/Application/WebApplication'
import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import { MutationType, NativeFeatureIdentifier, NoteMutator, NoteType, SNNote } from '@standardnotes/snjs'
import { sanitizeFileName } from '@standardnotes/utils'
import { IMMUTABLE_OPERATION_LIMITS } from './config'
import { convertNoteToText, isNoteSafeForAi } from './noteConverter'
import { captureNoteSnapshot, NoteEditSnapshot, SnapshotPersistenceOptions } from './recoveryStore'

const PREVIEW_CHAR_LIMIT = 160

export type EditNoteMode = 'overwrite' | 'replace_text' | 'append'

export interface EditNoteOptions {
  mode: EditNoteMode
  content?: string
  oldText?: string
  newText?: string
  newTitle?: string
  heading?: string
  snapshotPersistence?: SnapshotPersistenceOptions
}

export type AiProposedAction =
  | {
      action: 'create_note'
      title: string
      content: string
    }
  | {
      action: 'append_notation'
      title?: string
      content: string
    }

export function parseAiActionBlock(responseText: string): {
  displayText: string
  proposedAction?: AiProposedAction
} {
  const actionRegex = /```sn-action\s*([\s\S]*?)```/i
  const match = responseText.match(actionRegex)
  if (!match) {
    return { displayText: responseText.trim() }
  }

  const displayText = responseText.replace(actionRegex, '').trim()

  try {
    const parsed = JSON.parse(match[1].trim()) as Partial<AiProposedAction>
    if (parsed.action === 'create_note' && typeof parsed.title === 'string' && typeof parsed.content === 'string') {
      return {
        displayText,
        proposedAction: {
          action: 'create_note',
          title: parsed.title.trim() || 'AI Note',
          content: parsed.content.trim(),
        },
      }
    }

    if (parsed.action === 'append_notation' && typeof parsed.content === 'string') {
      return {
        displayText,
        proposedAction: {
          action: 'append_notation',
          title: typeof parsed.title === 'string' ? parsed.title.trim() : undefined,
          content: parsed.content.trim(),
        },
      }
    }
  } catch {
    // Ignore malformed action JSON and fall back to showing full text
  }

  return { displayText: responseText.trim() }
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')
}

function makePreviewPlain(source: string): string {
  const cleaned = source.trim()
  return cleaned.length > PREVIEW_CHAR_LIMIT ? `${cleaned.slice(0, PREVIEW_CHAR_LIMIT)}...` : cleaned
}

function assertEditSizeWithinLimit(text: string): void {
  if (text.length > IMMUTABLE_OPERATION_LIMITS.MAX_SINGLE_EDIT_CHARS) {
    throw new Error(
      `Edit exceeds the immutable safety limit of ${IMMUTABLE_OPERATION_LIMITS.MAX_SINGLE_EDIT_CHARS.toLocaleString()} characters.`,
    )
  }
}

export async function openNoteInEditor(application: WebApplication, uuid: string): Promise<void> {
  await application.itemListController.selectItem(uuid, true).catch(console.error)
}

export async function createNoteFromAi(application: WebApplication, title: string, content: string): Promise<SNNote> {
  assertEditSizeWithinLimit(content)
  const cleanTitle = title.trim() || 'AI Note'
  const note = await application.notesController.createNoteWithContent(
    NativeFeatureIdentifier.TYPES.PlainEditor,
    cleanTitle,
    content,
  )

  void application.sync.sync()
  await openNoteInEditor(application, note.uuid)

  return note
}

export async function restoreTrashedOrArchivedNote(application: WebApplication, note: SNNote): Promise<SNNote> {
  if (!isNoteSafeForAi(note, { includeTrashed: true, includeArchived: true })) {
    throw new Error('Cannot restore this note because it is protected or an authenticator note.')
  }

  const restored = await application.mutator.changeItem<NoteMutator, SNNote>(
    note,
    (mutator) => {
      mutator.trashed = false
      mutator.archived = false
    },
    MutationType.UpdateUserTimestamps,
  )

  void application.sync.sync()
  await openNoteInEditor(application, restored.uuid)
  return restored
}

export async function editNoteContent(
  application: WebApplication,
  note: SNNote,
  superConverter: HeadlessSuperConverter,
  options: EditNoteOptions,
): Promise<{ note: SNNote; snapshot: NoteEditSnapshot }> {
  if (!isNoteSafeForAi(note)) {
    throw new Error('Cannot edit this note because it is trashed, protected, or an authenticator note.')
  }
  if (note.locked) {
    throw new Error(`Cannot edit "${note.title || 'Untitled Note'}" because it is locked.`)
  }

  if (options.content) {
    assertEditSizeWithinLimit(options.content)
  }
  if (options.newText) {
    assertEditSizeWithinLimit(options.newText)
  }

  const snapshot = captureNoteSnapshot(
    note,
    `Before AI ${options.mode}${options.newTitle ? ` (rename to "${options.newTitle}")` : ''}`,
    application.identifier,
    options.snapshotPersistence,
  )

  if (options.mode === 'append') {
    const notationContent = options.content ?? options.newText ?? ''
    if (!notationContent.trim() && !options.newTitle) {
      throw new Error('Nothing to append or rename.')
    }
    const updated = notationContent.trim()
      ? await appendNotationToNote(application, note, notationContent, superConverter, options.heading, {
          skipSnapshot: true,
        })
      : note

    if (options.newTitle && options.newTitle.trim() && options.newTitle.trim() !== updated.title) {
      const renamed = await application.mutator.changeItem<NoteMutator, SNNote>(
        updated,
        (mutator) => {
          mutator.title = options.newTitle!.trim()
        },
        MutationType.UpdateUserTimestamps,
      )
      void application.sync.sync()
      return { note: renamed, snapshot }
    }
    return { note: updated, snapshot }
  }

  const converted = await convertNoteToText(note, superConverter)
  let nextPlainText = converted.text

  if (options.mode === 'overwrite') {
    if (typeof options.content !== 'string') {
      throw new Error('Overwrite mode requires a "content" string.')
    }
    nextPlainText = options.content
  } else if (options.mode === 'replace_text') {
    if (typeof options.oldText !== 'string' || options.oldText.length === 0) {
      throw new Error('replace_text mode requires a non-empty "old_text" string.')
    }
    if (typeof options.newText !== 'string') {
      throw new Error('replace_text mode requires a "new_text" string.')
    }
    if (!nextPlainText.includes(options.oldText)) {
      throw new Error(
        `Could not find the target text in "${
          note.title || 'Untitled Note'
        }". Read the note first to copy the exact substring.`,
      )
    }
    nextPlainText = nextPlainText.replace(options.oldText, options.newText)
  }

  assertEditSizeWithinLimit(nextPlainText)

  let storedText: string
  if (note.noteType === NoteType.Super) {
    storedText = superConverter.convertOtherFormatToSuperString(nextPlainText, 'md')
  } else if (note.noteType === NoteType.RichText) {
    storedText = `<p>${escapeHtml(nextPlainText)}</p>`
  } else {
    storedText = nextPlainText
  }

  const updatedNote = await application.mutator.changeItem<NoteMutator, SNNote>(
    note,
    (mutator) => {
      if (options.newTitle && options.newTitle.trim()) {
        mutator.title = options.newTitle.trim()
      }
      mutator.text = storedText
      mutator.preview_plain = makePreviewPlain(nextPlainText)
      mutator.preview_html = undefined
    },
    MutationType.UpdateUserTimestamps,
  )

  void application.sync.sync()
  return { note: updatedNote, snapshot }
}

export async function appendNotationToNote(
  application: WebApplication,
  note: SNNote,
  notationText: string,
  superConverter: HeadlessSuperConverter,
  heading?: string,
  options?: { skipSnapshot?: boolean; snapshotPersistence?: SnapshotPersistenceOptions },
): Promise<SNNote> {
  if (!isNoteSafeForAi(note)) {
    throw new Error('Cannot add notation because this note is trashed, protected, or an authenticator note.')
  }
  if (note.locked) {
    throw new Error('Cannot add notation because this note is locked.')
  }

  assertEditSizeWithinLimit(notationText)

  if (!options?.skipSnapshot) {
    captureNoteSnapshot(
      note,
      `Before appending AI notation${heading ? `: ${heading}` : ''}`,
      application.identifier,
      options?.snapshotPersistence,
    )
  }

  const timestamp = new Date().toLocaleString()
  const sectionTitle = heading?.trim() ? `### ${heading.trim()} (${timestamp})` : `### AI Notation (${timestamp})`
  const notationBlock = `${sectionTitle}\n${notationText.trim()}`

  let updatedText: string
  let previewPlainSource: string

  if (note.noteType === NoteType.Super) {
    let existingMarkdown = ''
    if (note.text && superConverter.isValidSuperString(note.text)) {
      existingMarkdown = await superConverter.convertSuperStringToOtherFormat(note.text, 'md')
    } else {
      existingMarkdown = note.preview_plain || note.text || ''
    }
    const combinedMarkdown = existingMarkdown
      ? `${existingMarkdown.trimEnd()}\n\n---\n\n${notationBlock}`
      : notationBlock

    updatedText = superConverter.convertOtherFormatToSuperString(combinedMarkdown, 'md')
    previewPlainSource = combinedMarkdown
  } else if (note.noteType === NoteType.RichText) {
    const htmlHeading = escapeHtml(heading?.trim() ? `${heading.trim()} (${timestamp})` : `AI Notation (${timestamp})`)
    updatedText = `${note.text || ''}<hr/><h3>${htmlHeading}</h3><p>${escapeHtml(notationText.trim())}</p>`
    previewPlainSource = `${note.preview_plain || ''}\n${notationText}`.trim()
  } else {
    updatedText = note.text ? `${note.text.trimEnd()}\n\n---\n\n${notationBlock}` : notationBlock
    previewPlainSource = updatedText
  }

  const updatedNote = await application.mutator.changeItem<NoteMutator, SNNote>(
    note,
    (mutator) => {
      mutator.text = updatedText
      mutator.preview_plain = makePreviewPlain(previewPlainSource)
      mutator.preview_html = undefined
    },
    MutationType.UpdateUserTimestamps,
  )

  void application.sync.sync()

  return updatedNote
}

export function downloadNotationAsFile(filenameBase: string, content: string, extension: 'md' | 'txt' = 'md'): string {
  const safeBase = sanitizeFileName(filenameBase.trim() || 'ai-notation') || 'ai-notation'
  const filename = `${safeBase}.${extension}`
  const mimeType = extension === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8'

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  return filename
}
