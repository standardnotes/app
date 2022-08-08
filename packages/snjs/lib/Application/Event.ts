import { ApplicationEvent, SyncEvent } from '@standardnotes/services'
export { SyncEvent }

export function applicationEventForSyncEvent(syncEvent: SyncEvent) {
  return (
    {
      [SyncEvent.SyncCompletedWithAllItemsUploaded]: ApplicationEvent.CompletedFullSync,
      [SyncEvent.SingleRoundTripSyncCompleted]: ApplicationEvent.CompletedIncrementalSync,
      [SyncEvent.SyncError]: ApplicationEvent.FailedSync,
      [SyncEvent.SyncTakingTooLong]: ApplicationEvent.HighLatencySync,
      [SyncEvent.EnterOutOfSync]: ApplicationEvent.EnteredOutOfSync,
      [SyncEvent.ExitOutOfSync]: ApplicationEvent.ExitedOutOfSync,
      [SyncEvent.LocalDataLoaded]: ApplicationEvent.LocalDataLoaded,
      [SyncEvent.MajorDataChange]: ApplicationEvent.MajorDataChange,
      [SyncEvent.LocalDataIncrementalLoad]: ApplicationEvent.LocalDataIncrementalLoad,
      [SyncEvent.StatusChanged]: ApplicationEvent.SyncStatusChanged,
      [SyncEvent.SyncWillBegin]: ApplicationEvent.WillSync,
      [SyncEvent.InvalidSession]: ApplicationEvent.InvalidSyncSession,
      [SyncEvent.DatabaseReadError]: ApplicationEvent.LocalDatabaseReadError,
      [SyncEvent.DatabaseWriteError]: ApplicationEvent.LocalDatabaseWriteError,
      [SyncEvent.DownloadFirstSyncCompleted]: ApplicationEvent.CompletedInitialSync,
    } as any
  )[syncEvent]
}
