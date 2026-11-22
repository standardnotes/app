export { FreeLlmApiController } from './FreeLlmApiController'
export type { FreeLlmChatMessage, FreeLlmScope, RecoveryTab } from './FreeLlmApiController'
export { FreeLlmApiClient, extractResponseText } from './client'
export type { ConnectionTestResult, ResponsesCreateParams } from './client'
export {
  DEFAULT_FREE_LLM_API_CONFIG,
  FREE_LLM_PRESETS,
  loadFreeLlmApiConfig,
  saveFreeLlmApiConfig,
  validateFreeLlmApiConfig,
} from './config'
export type { FreeLlmApiConfig, FreeLlmProviderPreset } from './config'
export {
  buildNotesContext,
  convertNoteToText,
  getReadableNotes,
  isNoteSafeForAi,
  scoreTextMatch,
  tokenizeSearchQuery,
} from './noteConverter'
export type { ConvertedNote, NoteAccessOptions } from './noteConverter'
export {
  appendNotationToNote,
  createNoteFromAi,
  downloadNotationAsFile,
  editNoteContent,
  openNoteInEditor,
  parseAiActionBlock,
  restoreTrashedOrArchivedNote,
} from './noteOperations'
export type { AiProposedAction, EditNoteMode, EditNoteOptions } from './noteOperations'
export {
  describeWriteCall,
  executeReadTool,
  executeWriteTool,
  getTagsForNote,
  isWriteTool,
  parseToolCalls,
  resolveNoteByUuidOrTitle,
  summarizeNote,
} from './noteTools'
export type { NoteSummaryItem, NoteToolCall, NoteToolName, ToolExecutionStep, ToolRuntimeContext } from './noteTools'
export {
  captureNoteSnapshot,
  clearAllNoteSnapshots,
  deleteNoteSnapshot,
  loadNoteSnapshots,
  parseLocalBackupFiles,
  purgeLegacyLocalStorageSnapshots,
  restoreNoteFromSnapshot,
  saveNoteSnapshots,
} from './recoveryStore'
export type { BackupNoteRecord, NoteEditSnapshot } from './recoveryStore'
export { default as FreeLlmApiPanel } from './FreeLlmApiPanel'
export { default as FreeLlmApiFooterButton } from './FreeLlmApiFooterButton'
export { default as FreeLlmApiPreferencesPane } from './FreeLlmApiPreferencesPane'
