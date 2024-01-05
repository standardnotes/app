import { ApplicationEvent, SyncEvent } from '@standardnotes/services'

const map: Record<string, ApplicationEvent> = {
  [SyncEvent.SyncCompletedWithAllItemsUploaded]: ApplicationEvent.CompletedFullSync,
  [SyncEvent.PaginatedSyncRequestCompleted]: ApplicationEvent.CompletedIncrementalSync,
  [SyncEvent.SyncError]: ApplicationEvent.FailedSync,
  [SyncEvent.SyncTakingTooLong]: ApplicationEvent.HighLatencySync,
  [SyncEvent.EnterOutOfSync]: ApplicationEvent.EnteredOutOfSync,
  [SyncEvent.ExitOutOfSync]: ApplicationEvent.ExitedOutOfSync,
  [SyncEvent.LocalDataLoaded]: ApplicationEvent.LocalDataLoaded,
  [SyncEvent.MajorDataChange]: ApplicationEvent.MajorDataChange,
  [SyncEvent.LocalDataIncrementalLoad]: ApplicationEvent.LocalDataIncrementalLoad,
  [SyncEvent.StatusChanged]: ApplicationEvent.SyncStatusChanged,
  [SyncEvent.SyncDidBeginProcessing]: ApplicationEvent.WillSync,
  [SyncEvent.InvalidSession]: ApplicationEvent.InvalidSyncSession,
  [SyncEvent.DatabaseReadError]: ApplicationEvent.LocalDatabaseReadError,
  [SyncEvent.DatabaseWriteError]: ApplicationEvent.LocalDatabaseWriteError,
  [SyncEvent.DownloadFirstSyncCompleted]: ApplicationEvent.CompletedInitialSync,
  [SyncEvent.TooManyRequests]: ApplicationEvent.SyncTooManyRequests,
}

export function applicationEventForSyncEvent(syncEvent: SyncEvent): ApplicationEvent | undefined {
  return map[syncEvent]
}
