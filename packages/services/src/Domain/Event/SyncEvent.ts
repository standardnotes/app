/* istanbul ignore file */
export enum SyncEvent {
  /**
   * A potentially multi-round trip that keeps syncing until all items have been uploaded.
   * However, this event will still trigger if there are more items waiting to be downloaded on the
   * server
   */
  SyncCompletedWithAllItemsUploaded = 'SyncCompletedWithAllItemsUploaded',
  SyncCompletedWithAllItemsUploadedAndDownloaded = 'SyncCompletedWithAllItemsUploadedAndDownloaded',
  SingleRoundTripSyncCompleted = 'SingleRoundTripSyncCompleted',
  SyncWillBegin = 'sync:will-begin',
  DownloadFirstSyncCompleted = 'sync:download-first-completed',
  SyncTakingTooLong = 'sync:taking-too-long',
  SyncError = 'sync:error',
  InvalidSession = 'sync:invalid-session',
  MajorDataChange = 'major-data-change',
  LocalDataIncrementalLoad = 'local-data-incremental-load',
  LocalDataLoaded = 'local-data-loaded',
  EnterOutOfSync = 'enter-out-of-sync',
  ExitOutOfSync = 'exit-out-of-sync',
  StatusChanged = 'status-changed',
  DatabaseWriteError = 'database-write-error',
  DatabaseReadError = 'database-read-error',
  SyncRequestsIntegrityCheck = 'sync:requests-integrity-check',
}
