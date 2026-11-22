import { useApplication } from '@/Components/ApplicationProvider'
import Icon from '@/Components/Icon/Icon'
import { observer } from 'mobx-react-lite'
import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { FreeLlmChatMessage } from './FreeLlmApiController'
import { FREE_LLM_PRESETS } from './config'
import { isWriteTool, ToolExecutionStep } from './noteTools'

const FreeLlmApiPanel = observer(() => {
  const application = useApplication()
  const controller = application.freeLlmApiController

  const [inputValue, setInputValue] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const backupFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [controller?.messages.length, controller?.isLoading])

  if (!controller || !controller.isOpen) {
    return null
  }

  const currentNote = controller.currentNote
  const activeTitle = currentNote?.title || 'Untitled Note'

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!inputValue.trim() || controller.isLoading) {
      return
    }
    const text = inputValue
    setInputValue('')
    void controller.sendMessage(text)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    if (controller.isLoading) {
      return
    }
    void controller.sendMessage(prompt)
  }

  const handleBackupFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      void controller.loadBackupFiles(event.target.files)
      event.target.value = ''
    }
  }

  const renderWritePreview = (step: ToolExecutionStep) => {
    if (step.call.tool === 'create_note') {
      return (
        <pre className="mb-2 max-h-36 overflow-y-auto whitespace-pre-wrap rounded bg-default p-1.5 font-sans text-xs text-text">
          {step.call.args.content}
        </pre>
      )
    }
    if (step.call.tool === 'restore_note') {
      return (
        <div className="mb-2 rounded bg-default p-1.5 text-xs text-neutral">
          {step.call.args.snapshot_id
            ? `Will restore pre-edit snapshot (${step.call.args.snapshot_id})`
            : step.call.args.backup_id
            ? `Will recover note from loaded local backup (${step.call.args.backup_id})`
            : 'Will move note out of Trash/Archive back into your active notes'}
        </div>
      )
    }
    if (step.call.tool === 'edit_note') {
      const { mode, old_text, new_text, content, new_title } = step.call.args
      return (
        <div className="mb-2 flex flex-col gap-1.5 text-xs">
          {new_title && (
            <div className="rounded bg-default px-1.5 py-1">
              <span className="font-semibold text-neutral">Rename title: </span>
              <span>{new_title}</span>
            </div>
          )}
          {mode === 'replace_text' && old_text && (
            <div className="rounded border border-danger bg-default p-1.5">
              <div className="text-[10px] font-bold uppercase text-danger">Remove</div>
              <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-text">{old_text}</pre>
            </div>
          )}
          {(new_text || content) && (
            <div className="rounded border border-success bg-default p-1.5">
              <div className="text-[10px] font-bold uppercase text-success">
                {mode === 'append' ? 'Append Notation' : mode === 'replace_text' ? 'Replace With' : 'New Content'}
              </div>
              <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-text">
                {new_text ?? content}
              </pre>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  const renderToolSteps = (message: FreeLlmChatMessage) => {
    if (!message.toolSteps || message.toolSteps.length === 0) {
      return null
    }

    const readSteps = message.toolSteps.filter((s) => !isWriteTool(s.call))
    const writeSteps = message.toolSteps.filter((s) => isWriteTool(s.call))

    return (
      <div className="mt-2 flex flex-col gap-2">
        {readSteps.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {readSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-1 rounded border border-border bg-default px-1.5 py-0.5 text-[11px] text-neutral"
              >
                <span>{step.summary}</span>
                {step.targetUuid && (
                  <button
                    type="button"
                    onClick={() => void controller.openNote(step.targetUuid!)}
                    className="cursor-pointer font-semibold text-info hover:underline"
                  >
                    Open
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {writeSteps.map((step) => {
          const exportContent =
            step.call.tool === 'create_note'
              ? step.call.args.content
              : step.call.tool === 'edit_note'
              ? step.call.args.new_text || step.call.args.content || message.content
              : message.content

          return (
            <div key={step.id} className="rounded border border-info bg-info-backdrop p-2 text-xs">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-semibold text-text">{step.summary}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    step.status === 'applied'
                      ? 'bg-success text-success-contrast'
                      : step.status === 'error'
                      ? 'bg-danger text-danger-contrast'
                      : step.status === 'rejected'
                      ? 'bg-default text-neutral'
                      : 'bg-info text-info-contrast'
                  }`}
                >
                  {step.status}
                </span>
              </div>

              {renderWritePreview(step)}

              {step.error && <div className="mb-1.5 text-xs text-danger">{step.error}</div>}

              <div className="flex flex-wrap gap-1.5">
                {step.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => void controller.approveToolStep(message.id, step.id)}
                      className="cursor-pointer rounded bg-info px-2.5 py-1 text-xs font-semibold text-info-contrast hover:opacity-90"
                    >
                      Approve & Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => controller.rejectToolStep(message.id, step.id)}
                      className="cursor-pointer rounded border border-border bg-default px-2 py-1 text-xs text-neutral hover:text-text"
                    >
                      Dismiss
                    </button>
                  </>
                )}
                {step.status === 'applied' && step.snapshotId && (
                  <button
                    type="button"
                    onClick={() => void controller.restoreSnapshotById(step.snapshotId!)}
                    className="cursor-pointer rounded border border-warning bg-default px-2 py-1 text-xs font-semibold text-warning hover:bg-contrast"
                  >
                    Undo Edit
                  </button>
                )}
                {step.targetUuid && (
                  <button
                    type="button"
                    onClick={() => void controller.openNote(step.targetUuid!)}
                    className="cursor-pointer rounded border border-border bg-default px-2 py-1 text-xs font-medium text-info hover:border-info"
                  >
                    Open Note
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    controller.saveNotationToFile(
                      step.targetTitle || customTitle.trim() || 'ai-notation',
                      exportContent,
                      'md',
                    )
                  }
                  className="cursor-pointer rounded border border-border bg-default px-2 py-1 text-xs font-medium text-text hover:bg-contrast"
                >
                  Save .md
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderFallbackActions = (message: FreeLlmChatMessage) => {
    if (message.role !== 'assistant') {
      return null
    }
    const defaultNoteTitle = customTitle.trim() || `AI Note - ${activeTitle}`

    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => void controller.createNote(defaultNoteTitle, message.content)}
          className="cursor-pointer rounded border border-border bg-default px-2 py-0.5 text-xs text-text hover:border-info hover:text-info"
        >
          + Create Note
        </button>
        <button
          type="button"
          disabled={!currentNote}
          onClick={() => void controller.appendNotationToCurrentNote(message.content)}
          className="cursor-pointer rounded border border-border bg-default px-2 py-0.5 text-xs text-text hover:border-info hover:text-info disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add Notation
        </button>
        <button
          type="button"
          onClick={() => controller.saveNotationToFile(defaultNoteTitle, message.content, 'md')}
          className="cursor-pointer rounded border border-border bg-default px-2 py-0.5 text-xs text-text hover:border-info hover:text-info"
        >
          Save File (.md)
        </button>
      </div>
    )
  }

  return (
    <aside
      aria-label="Local AI Notes Assistant"
      className="fixed bottom-8 right-0 top-0 z-modal flex w-full max-w-md flex-col border-l border-border bg-default text-text shadow-main"
    >
      {/* Hidden file input for local backup recovery */}
      <input
        ref={backupFileInputRef}
        type="file"
        multiple
        accept=".json,.md,.txt"
        onChange={handleBackupFileSelected}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-contrast px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Icon type="search" size="small" className="text-info" />
          <span className="text-sm font-bold">FreeLLM AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Browse & pick notes"
            onClick={controller.toggleNoteBrowser}
            className={`cursor-pointer rounded px-1.5 py-1 text-xs font-medium hover:bg-default ${
              controller.showNoteBrowser ? 'text-info' : 'text-neutral hover:text-text'
            }`}
          >
            Notes ({controller.readableNotesCount})
          </button>
          <button
            type="button"
            title="Recovery: Undo Snapshots, Local Backups, Trash & Archive"
            onClick={controller.toggleRecoveryDrawer}
            className={`cursor-pointer rounded px-1.5 py-1 text-xs font-medium hover:bg-default ${
              controller.showRecoveryDrawer ? 'text-info' : 'text-neutral hover:text-text'
            }`}
          >
            Recovery
          </button>
          <button
            type="button"
            title="API Settings"
            onClick={controller.toggleSettings}
            className="cursor-pointer rounded p-1 hover:bg-default"
          >
            <Icon type="tune" size="small" />
          </button>
          <button
            type="button"
            title="Clear chat"
            onClick={controller.clearHistory}
            className="cursor-pointer rounded px-1.5 py-1 text-xs text-neutral hover:bg-default hover:text-text"
          >
            Clear
          </button>
          <button
            type="button"
            title="Close"
            onClick={controller.close}
            className="cursor-pointer rounded p-1 hover:bg-default"
          >
            <Icon type="close" size="small" />
          </button>
        </div>
      </div>

      {/* Collapsible API Settings */}
      {controller.showSettings && (
        <div className="flex flex-col gap-2 border-b border-border bg-contrast px-3 py-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-text">FreeLLM API Config</span>
            <button
              type="button"
              onClick={controller.openPreferencesConfig}
              className="cursor-pointer text-[11px] font-semibold text-info hover:underline"
            >
              Open Full Preferences →
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {FREE_LLM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  controller.updateConfig({
                    baseURL: preset.baseURL,
                    model: preset.model,
                  })
                }
                className="cursor-pointer rounded border border-border bg-default px-2 py-0.5 text-[11px] text-text hover:border-info hover:text-info"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-0.5">
            <span className="font-semibold text-neutral">Base URL</span>
            <input
              type="text"
              value={controller.config.baseURL}
              onChange={(e) => controller.updateConfig({ baseURL: e.target.value })}
              placeholder="http://localhost:3001/v1"
              className="rounded border border-border bg-default px-2 py-1 text-xs text-text"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="font-semibold text-neutral">API Key</span>
            <div className="flex items-center gap-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={controller.config.apiKey}
                onChange={(e) => controller.updateConfig({ apiKey: e.target.value })}
                placeholder="freellmapi-..."
                className="flex-1 rounded border border-border bg-default px-2 py-1 text-xs text-text"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="cursor-pointer rounded border border-border bg-default px-2 py-1 text-[11px] text-neutral hover:border-info hover:text-text"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <div className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-0.5">
              <span className="font-semibold text-neutral">Model</span>
              <input
                type="text"
                value={controller.config.model}
                onChange={(e) => controller.updateConfig({ model: e.target.value })}
                placeholder="auto"
                className="rounded border border-border bg-default px-2 py-1 text-xs text-text"
              />
            </label>
            <button
              type="button"
              disabled={controller.isTestingConnection}
              onClick={() => void controller.testConnection()}
              className="cursor-pointer rounded bg-info px-2.5 py-1 text-xs font-semibold text-info-contrast hover:opacity-90 disabled:opacity-50"
            >
              {controller.isTestingConnection ? 'Testing...' : 'Test'}
            </button>
            <button
              type="button"
              onClick={controller.resetConfig}
              className="cursor-pointer rounded border border-border bg-default px-2 py-1 text-xs hover:border-info"
            >
              Reset
            </button>
          </div>
          {controller.connectionTestResult && (
            <div
              className={`rounded border px-2 py-1 text-[11px] ${
                controller.connectionTestResult.ok
                  ? 'border-success bg-default text-success'
                  : 'border-danger bg-default text-danger'
              }`}
            >
              {controller.connectionTestResult.ok
                ? `Connected (${controller.connectionTestResult.latencyMs}ms): "${controller.connectionTestResult.replyPreview}"`
                : `Failed (${controller.connectionTestResult.latencyMs}ms): ${controller.connectionTestResult.error}`}
            </div>
          )}
        </div>
      )}

      {/* Collapsible Recovery Drawer (Snapshots, Local Backups, Trash/Archive) */}
      {controller.showRecoveryDrawer && (
        <div className="flex max-h-60 flex-col gap-2 border-b border-border bg-contrast px-3 py-2 text-xs">
          <div className="flex items-center justify-between gap-1">
            <div className="flex rounded border border-border bg-default p-0.5">
              <button
                type="button"
                onClick={() => controller.setRecoveryTab('snapshots')}
                className={`cursor-pointer rounded px-2 py-0.5 font-medium ${
                  controller.recoveryTab === 'snapshots' ? 'bg-info text-info-contrast' : 'text-text'
                }`}
              >
                Undo ({controller.snapshots.length})
              </button>
              <button
                type="button"
                onClick={() => controller.setRecoveryTab('backups')}
                className={`cursor-pointer rounded px-2 py-0.5 font-medium ${
                  controller.recoveryTab === 'backups' ? 'bg-info text-info-contrast' : 'text-text'
                }`}
              >
                Backups ({controller.backupRecords.length})
              </button>
              <button
                type="button"
                onClick={() => controller.setRecoveryTab('trash')}
                className={`cursor-pointer rounded px-2 py-0.5 font-medium ${
                  controller.recoveryTab === 'trash' ? 'bg-info text-info-contrast' : 'text-text'
                }`}
              >
                Trash/Archive ({controller.trashedAndArchivedNotes.length})
              </button>
            </div>
          </div>

          {controller.recoveryTab === 'snapshots' && (
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {controller.snapshots.length === 0 ? (
                <div className="py-2 text-center text-neutral">
                  No AI edit snapshots yet. Every AI edit saves a restore point automatically.
                </div>
              ) : (
                <>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => controller.clearAllSnapshots()}
                      className="cursor-pointer text-[11px] text-neutral hover:text-danger"
                    >
                      Clear snapshots
                    </button>
                  </div>
                  {controller.snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="flex items-center justify-between gap-2 rounded bg-default px-2 py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-text">{snap.noteTitle}</div>
                        <div className="truncate text-[10px] text-neutral">
                          {new Date(snap.savedAt).toLocaleString()} · {snap.reason}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void controller.restoreSnapshotById(snap.id)}
                          className="cursor-pointer rounded bg-info px-2 py-0.5 text-[11px] font-semibold text-info-contrast hover:opacity-90"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => controller.removeSnapshot(snap.id)}
                          className="cursor-pointer px-1 text-[11px] text-neutral hover:text-danger"
                          title="Delete snapshot"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {controller.recoveryTab === 'backups' && (
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  className="cursor-pointer rounded bg-info px-2 py-1 text-[11px] font-semibold text-info-contrast hover:opacity-90"
                >
                  Load Backup Files (.json/.md/.txt)
                </button>
                {controller.backupRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={controller.clearBackups}
                    className="cursor-pointer text-[11px] text-neutral hover:text-danger"
                  >
                    Clear
                  </button>
                )}
              </div>
              {controller.backupRecords.length > 0 && (
                <input
                  type="text"
                  value={controller.backupFilter}
                  onChange={(e) => controller.setBackupFilter(e.target.value)}
                  placeholder="Search loaded backup notes..."
                  className="rounded border border-border bg-default px-2 py-1 text-xs text-text placeholder:text-neutral"
                />
              )}
              {controller.filteredBackupRecords.length === 0 ? (
                <div className="py-1 text-center text-neutral">
                  Load decrypted Standard Notes backup JSON or `.md`/`.txt` files so both you and the AI can search
                  them.
                </div>
              ) : (
                controller.filteredBackupRecords.slice(0, 40).map((record) => (
                  <div key={record.id} className="flex items-center justify-between gap-2 rounded bg-default px-2 py-1">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-text">{record.title}</div>
                      <div className="truncate text-[10px] text-neutral">{record.sourceFile}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void controller.importBackupRecord(record)}
                      className="cursor-pointer rounded border border-info px-2 py-0.5 text-[11px] font-semibold text-info hover:bg-info-backdrop"
                    >
                      Recover
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {controller.recoveryTab === 'trash' && (
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {controller.trashedAndArchivedNotes.length === 0 ? (
                <div className="py-2 text-center text-neutral">No trashed or archived notes found.</div>
              ) : (
                controller.trashedAndArchivedNotes.map((note) => (
                  <div key={note.uuid} className="flex items-center justify-between gap-2 rounded bg-default px-2 py-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-text">{note.title}</span>
                        <span className="rounded bg-contrast px-1 text-[10px] font-semibold text-warning">
                          {note.trashed ? 'Trash' : 'Archived'}
                        </span>
                      </div>
                      {note.preview && <div className="truncate text-[10px] text-neutral">{note.preview}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => void controller.restoreFromTrashOrArchive(note.uuid)}
                      className="cursor-pointer rounded bg-info px-2 py-0.5 text-[11px] font-semibold text-info-contrast hover:opacity-90"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsible Note Browser & Picker */}
      {controller.showNoteBrowser && (
        <div className="flex max-h-52 flex-col gap-1.5 border-b border-border bg-contrast px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={controller.noteBrowserFilter}
              onChange={(e) => controller.setNoteBrowserFilter(e.target.value)}
              placeholder="Filter notes by title, tag, or text..."
              className="flex-1 rounded border border-border bg-default px-2 py-1 text-xs text-text placeholder:text-neutral"
            />
            {controller.selectedNoteUuids.length > 0 && (
              <button
                type="button"
                onClick={controller.clearSelectedNotes}
                className="cursor-pointer text-[11px] text-neutral hover:text-danger"
              >
                Clear ({controller.selectedNoteUuids.length})
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {controller.browsableNotes.length === 0 ? (
              <div className="py-2 text-center text-neutral">No matching notes</div>
            ) : (
              <div className="flex flex-col gap-1">
                {controller.browsableNotes.map((note) => {
                  const isChecked = controller.selectedNoteUuids.includes(note.uuid)
                  return (
                    <div
                      key={note.uuid}
                      className="flex items-center justify-between gap-2 rounded bg-default px-2 py-1"
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => controller.toggleSelectedNoteUuid(note.uuid)}
                        />
                        <span className="truncate font-medium text-text" title={note.title}>
                          {note.title}
                        </span>
                        {note.archived && <span className="text-[10px] font-semibold text-neutral">Archived</span>}
                        {note.locked && <span className="text-[10px] font-semibold text-warning">Locked</span>}
                      </label>
                      <button
                        type="button"
                        onClick={() => void controller.openNote(note.uuid)}
                        className="cursor-pointer text-[11px] font-semibold text-info hover:underline"
                      >
                        View
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scope selector, Auto-edit toggle & quick actions */}
      <div className="flex flex-col gap-2 border-b border-border px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex rounded border border-border bg-contrast p-0.5">
            <button
              type="button"
              onClick={() => controller.setScope('agent')}
              className={`cursor-pointer rounded px-2 py-0.5 font-medium ${
                controller.scope === 'agent' ? 'bg-info text-info-contrast' : 'text-text'
              }`}
            >
              Agent Browse
            </button>
            <button
              type="button"
              onClick={() => controller.setScope('current')}
              className={`cursor-pointer rounded px-2 py-0.5 font-medium ${
                controller.scope === 'current' ? 'bg-info text-info-contrast' : 'text-text'
              }`}
            >
              Current
            </button>
            <button
              type="button"
              onClick={() => controller.setScope('selected')}
              className={`cursor-pointer rounded px-2 py-0.5 font-medium ${
                controller.scope === 'selected' ? 'bg-info text-info-contrast' : 'text-text'
              }`}
            >
              Picked ({controller.selectedNoteUuids.length})
            </button>
            <button
              type="button"
              onClick={() => controller.setScope('all')}
              className={`cursor-pointer rounded px-2 py-0.5 font-medium ${
                controller.scope === 'all' ? 'bg-info text-info-contrast' : 'text-text'
              }`}
            >
              All
            </button>
          </div>

          <label
            className="flex cursor-pointer select-none items-center gap-1 text-[11px]"
            title="When enabled, the model edits notes immediately without asking for approval (snapshots are still saved)."
          >
            <input
              type="checkbox"
              checked={controller.autoApplyEdits}
              onChange={(e) => controller.setAutoApplyEdits(e.target.checked)}
            />
            <span className={controller.autoApplyEdits ? 'font-bold text-warning' : 'text-neutral'}>Auto-edit</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={controller.isLoading}
            onClick={() => setInputValue('I forgot where I saved information about: ')}
            className="cursor-pointer rounded border border-info bg-info-backdrop px-2 py-1 text-xs font-semibold text-info hover:opacity-90 disabled:opacity-40"
          >
            Find Lost Info
          </button>
          <button
            type="button"
            disabled={controller.isLoading}
            onClick={() =>
              handleQuickPrompt(
                'Run audit_missing_info across my notes and tell me which notes have missing details, empty sections, or unfinished TODOs.',
              )
            }
            className="cursor-pointer rounded border border-border bg-contrast px-2 py-1 text-xs hover:border-info disabled:opacity-40"
          >
            Find Missing Gaps
          </button>
          <button
            type="button"
            disabled={controller.isLoading || !currentNote}
            onClick={() =>
              handleQuickPrompt(
                'Check the revision/edit history of the current note using get_note_history and tell me if any important text was previously removed or changed.',
              )
            }
            className="cursor-pointer rounded border border-border bg-contrast px-2 py-1 text-xs hover:border-info disabled:opacity-40"
          >
            Check History
          </button>
          <button
            type="button"
            disabled={controller.isLoading || !currentNote}
            onClick={() =>
              handleQuickPrompt(
                'Read the current note, check it for clarity/typos/structure, and propose edits using edit_note.',
              )
            }
            className="cursor-pointer rounded border border-border bg-contrast px-2 py-1 text-xs hover:border-info disabled:opacity-40"
          >
            Review & Edit
          </button>
        </div>

        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Optional title when saving replies as note/file..."
          className="rounded border border-border bg-default px-2 py-1 text-xs text-text placeholder:text-neutral"
        />
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {controller.messages.length === 0 ? (
          <div className="mt-5 text-center text-xs text-neutral">
            <p className="mb-1 font-semibold text-text">Find lost info, browse, edit & recover notes</p>
            <p className="mb-2">
              Describe something you forgot where you saved—the AI will search your <strong>Active notes</strong>,{' '}
              <strong>Archive</strong>, <strong>Trash</strong>, <strong>History/Snapshots</strong>, and any{' '}
              <strong>Backup files</strong> loaded in <strong>Recovery</strong>.
            </p>
            <p className="text-[11px]">
              Example: <em>&ldquo;I forgot where I saved my server SSH steps from an old note—find it for me&rdquo;</em>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {controller.messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-md p-2.5 text-xs ${
                  message.role === 'user'
                    ? 'ml-6 bg-info-backdrop text-text'
                    : 'mr-2 border border-border bg-contrast text-text'
                }`}
              >
                <div className="mb-1 text-[10px] font-bold uppercase text-neutral">
                  {message.role === 'user' ? 'You' : 'AI Agent'}
                </div>
                <div className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>
                {renderToolSteps(message)}
                {renderFallbackActions(message)}
              </div>
            ))}
          </div>
        )}

        {controller.isLoading && (
          <div className="mt-3 flex items-center justify-between rounded border border-border bg-contrast px-2.5 py-2 text-xs text-neutral">
            <span>{controller.loadingStatus}</span>
            <button
              type="button"
              onClick={controller.cancelActiveRequest}
              className="cursor-pointer font-semibold text-danger hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        {controller.errorMessage && (
          <div className="mt-3 rounded border border-danger bg-contrast p-2 text-xs text-danger">
            {controller.errorMessage}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt input */}
      <form onSubmit={handleSubmit} className="border-t border-border bg-contrast p-2.5">
        <textarea
          rows={3}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask where you saved old info, or ask the AI to view/edit/recover a note... (Enter to send)"
          className="w-full resize-none rounded border border-border bg-default p-2 text-xs text-text placeholder:text-neutral focus:border-info focus:outline-none"
        />
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[10px] text-neutral">
            {controller.autoApplyEdits ? 'Auto-edit ON (snapshots auto-saved)' : 'Review mode (approve edits first)'}
          </span>
          <button
            type="submit"
            disabled={controller.isLoading || !inputValue.trim()}
            className="cursor-pointer rounded bg-info px-3 py-1 text-xs font-semibold text-info-contrast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  )
})

export default FreeLlmApiPanel
