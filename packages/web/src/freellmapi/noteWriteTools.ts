import { WebApplication } from '@/Application/WebApplication'
import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import { IMMUTABLE_OPERATION_LIMITS } from './config'
import {
  createNoteFromAi,
  editNoteContent,
  EditNoteMode,
  openNoteInEditor,
  restoreTrashedOrArchivedNote,
} from './noteOperations'
import { NoteToolCall, resolveNoteByUuidOrTitle, ToolRuntimeContext } from './noteReadTools'
import { loadNoteSnapshots, restoreNoteFromSnapshot } from './recoveryStore'

export function isWriteTool(call: NoteToolCall): boolean {
  return call.tool === 'edit_note' || call.tool === 'create_note' || call.tool === 'restore_note'
}

export function evaluateWriteSafetyPolicy(
  writeCalls: NoteToolCall[],
  options: {
    autoApplyEdits: boolean
    autoEditsAlreadyExecutedThisTurn: number
  },
): {
  allowedCalls: NoteToolCall[]
  droppedCount: number
  mustRequireConfirmation: boolean
  confirmationReason?: string
} {
  const maxPerTurn = IMMUTABLE_OPERATION_LIMITS.MAX_WRITES_PER_TURN
  const allowedCalls = writeCalls.slice(0, maxPerTurn)
  const droppedCount = Math.max(0, writeCalls.length - allowedCalls.length)

  if (allowedCalls.some((c) => c.tool === 'restore_note')) {
    return {
      allowedCalls,
      droppedCount,
      mustRequireConfirmation: true,
      confirmationReason: 'Restore operations always require explicit confirmation.',
    }
  }

  if (allowedCalls.length >= IMMUTABLE_OPERATION_LIMITS.BULK_EDIT_CONFIRM_THRESHOLD) {
    return {
      allowedCalls,
      droppedCount,
      mustRequireConfirmation: true,
      confirmationReason: `Bulk edits (${allowedCalls.length} write operations) always require explicit confirmation.`,
    }
  }

  if (!options.autoApplyEdits) {
    return {
      allowedCalls,
      droppedCount,
      mustRequireConfirmation: true,
      confirmationReason: 'Review mode is active.',
    }
  }

  if (
    options.autoEditsAlreadyExecutedThisTurn + allowedCalls.length >
    IMMUTABLE_OPERATION_LIMITS.MAX_AUTO_EDITS_PER_TURN
  ) {
    return {
      allowedCalls,
      droppedCount,
      mustRequireConfirmation: true,
      confirmationReason: `Reached immutable limit of ${IMMUTABLE_OPERATION_LIMITS.MAX_AUTO_EDITS_PER_TURN} auto-edits per turn.`,
    }
  }

  return {
    allowedCalls,
    droppedCount,
    mustRequireConfirmation: false,
  }
}

export async function executeWriteTool(
  application: WebApplication,
  superConverter: HeadlessSuperConverter,
  call: NoteToolCall,
  runtimeContext: ToolRuntimeContext,
): Promise<{
  resultJson: string
  summary: string
  targetUuid: string
  targetTitle: string
  snapshotId?: string
}> {
  if (call.tool === 'create_note') {
    const created = await createNoteFromAi(application, call.args.title, call.args.content)
    return {
      resultJson: JSON.stringify({ ok: true, action: 'created', uuid: created.uuid, title: created.title }),
      summary: `Created note "${created.title}"`,
      targetUuid: created.uuid,
      targetTitle: created.title,
    }
  }

  if (call.tool === 'restore_note') {
    if (call.args.snapshot_id) {
      const snap = loadNoteSnapshots(application.identifier).find((s) => s.id === call.args.snapshot_id)
      if (!snap) {
        throw new Error(`Snapshot "${call.args.snapshot_id}" not found.`)
      }
      const restored = await restoreNoteFromSnapshot(application, snap)
      return {
        resultJson: JSON.stringify({
          ok: true,
          action: 'restored_snapshot',
          uuid: restored.uuid,
          title: restored.title,
        }),
        summary: `Restored "${restored.title || 'Untitled Note'}" from snapshot`,
        targetUuid: restored.uuid,
        targetTitle: restored.title || 'Untitled Note',
      }
    }

    if (call.args.backup_id) {
      const backup = runtimeContext.backupRecords.find((b) => b.id === call.args.backup_id)
      if (!backup) {
        throw new Error(`Backup note "${call.args.backup_id}" not found.`)
      }
      const imported = await createNoteFromAi(application, backup.title, backup.text)
      return {
        resultJson: JSON.stringify({
          ok: true,
          action: 'restored_from_backup',
          uuid: imported.uuid,
          title: imported.title,
        }),
        summary: `Recovered "${imported.title}" from ${backup.sourceFile}`,
        targetUuid: imported.uuid,
        targetTitle: imported.title,
      }
    }

    const note = resolveNoteByUuidOrTitle(application, call.args.uuid, call.args.title, true)
    if (!note) {
      throw new Error('Could not find note to restore from Trash/Archive.')
    }
    const restored = await restoreTrashedOrArchivedNote(application, note)
    return {
      resultJson: JSON.stringify({
        ok: true,
        action: 'restored_from_trash',
        uuid: restored.uuid,
        title: restored.title,
      }),
      summary: `Restored "${restored.title || 'Untitled Note'}" to active notes`,
      targetUuid: restored.uuid,
      targetTitle: restored.title || 'Untitled Note',
    }
  }

  if (call.tool === 'edit_note') {
    const note =
      resolveNoteByUuidOrTitle(application, call.args.uuid, call.args.title, false) ||
      (!call.args.uuid && !call.args.title ? application.notesController.firstSelectedNote : undefined)

    if (!note) {
      throw new Error(`Target note not found (uuid=${call.args.uuid ?? ''}, title=${call.args.title ?? ''}).`)
    }

    const mode: EditNoteMode = call.args.mode ?? 'overwrite'
    const { note: updated, snapshot } = await editNoteContent(application, note, superConverter, {
      mode,
      content: call.args.content,
      oldText: call.args.old_text,
      newText: call.args.new_text,
      newTitle: call.args.new_title,
      heading: call.args.heading,
      snapshotPersistence: runtimeContext.snapshotPersistence,
    })

    runtimeContext.onSnapshotsChanged?.()
    await openNoteInEditor(application, updated.uuid)

    const actionVerb = mode === 'append' ? 'Added notation to' : mode === 'replace_text' ? 'Edited' : 'Updated'

    return {
      resultJson: JSON.stringify({
        ok: true,
        action: 'edited',
        mode,
        uuid: updated.uuid,
        title: updated.title || 'Untitled Note',
        snapshot_id: snapshot.id,
      }),
      summary: `${actionVerb} "${updated.title || 'Untitled Note'}"`,
      targetUuid: updated.uuid,
      targetTitle: updated.title || 'Untitled Note',
      snapshotId: snapshot.id,
    }
  }

  throw new Error(`Tool "${call.tool}" is not a write tool.`)
}

export function describeWriteCall(
  application: WebApplication,
  call: NoteToolCall,
  runtimeContext: ToolRuntimeContext,
): {
  summary: string
  targetUuid?: string
  targetTitle?: string
} {
  if (call.tool === 'create_note') {
    return {
      summary: `Create note "${call.args.title || 'AI Note'}"`,
      targetTitle: call.args.title || 'AI Note',
    }
  }
  if (call.tool === 'restore_note') {
    if (call.args.snapshot_id) {
      const snap = loadNoteSnapshots(application.identifier).find((s) => s.id === call.args.snapshot_id)
      return {
        summary: `Restore "${snap?.noteTitle || 'note'}" from snapshot`,
        targetUuid: snap?.noteUuid,
        targetTitle: snap?.noteTitle,
      }
    }
    if (call.args.backup_id) {
      const bkp = runtimeContext.backupRecords.find((b) => b.id === call.args.backup_id)
      return {
        summary: `Recover "${bkp?.title || 'backup note'}" from ${bkp?.sourceFile || 'backup'}`,
        targetTitle: bkp?.title,
      }
    }
    const resolved = resolveNoteByUuidOrTitle(application, call.args.uuid, call.args.title, true)
    return {
      summary: `Restore "${resolved?.title || call.args.title || 'note'}" from Trash/Archive`,
      targetUuid: resolved?.uuid || call.args.uuid,
      targetTitle: resolved?.title || call.args.title,
    }
  }
  if (call.tool === 'edit_note') {
    const resolved =
      resolveNoteByUuidOrTitle(application, call.args.uuid, call.args.title, false) ||
      (!call.args.uuid && !call.args.title ? application.notesController.firstSelectedNote : undefined)
    const label = resolved?.title || call.args.title || call.args.uuid || 'current note'
    const verb =
      call.args.mode === 'append'
        ? 'Add notation to'
        : call.args.mode === 'replace_text'
        ? 'Replace text in'
        : 'Overwrite'
    return {
      summary: `${verb} "${label}"`,
      targetUuid: resolved?.uuid || call.args.uuid,
      targetTitle: label,
    }
  }
  return { summary: call.tool }
}
