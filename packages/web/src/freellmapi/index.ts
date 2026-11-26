export { FreeLlmApiController } from './FreeLlmApiController'
export type {
  FreeLlmChatMessage,
  FreeLlmScope,
  OutboundContextDisclosure,
  OutboundNoteDisclosure,
  RecoveryTab,
} from './FreeLlmApiController'
export { FreeLlmApiClient, extractResponseText } from './client'
export type { ConnectionTestResult, ResponsesCreateParams } from './client'
export {
  analyzeEndpointPolicy,
  DEFAULT_FREE_LLM_API_CONFIG,
  FREE_LLM_PRESETS,
  IMMUTABLE_OPERATION_LIMITS,
  isLoopbackHostname,
  loadFreeLlmApiConfig,
  saveFreeLlmApiConfig,
  SECURE_CONFIG_STORAGE_KEY,
  validateFreeLlmApiConfig,
} from './config'
export type { EndpointPolicyResult, FreeLlmApiConfig, FreeLlmProviderPreset } from './config'
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
  escapeHtml,
  openNoteInEditor,
  parseAiActionBlock,
  restoreTrashedOrArchivedNote,
} from './noteOperations'
export type { AiProposedAction, EditNoteMode, EditNoteOptions } from './noteOperations'
export {
  describeWriteCall,
  evaluateWriteSafetyPolicy,
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
  SECURE_SNAPSHOTS_STORAGE_KEY,
  syncPersistedSnapshotsOptIn,
} from './recoveryStore'
export type { BackupNoteRecord, NoteEditSnapshot, SnapshotPersistenceOptions } from './recoveryStore'
export { default as FreeLlmApiPanel } from './FreeLlmApiPanel'
export { default as FreeLlmApiFooterButton } from './FreeLlmApiFooterButton'
export { default as FreeLlmApiPreferencesPane } from './FreeLlmApiPreferencesPane'
