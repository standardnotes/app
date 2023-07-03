/* istanbul ignore file */

export enum SyncSource {
  External = 'External',
  SpawnQueue = 'SpawnQueue',
  ResolveQueue = 'ResolveQueue',
  MoreDirtyItems = 'MoreDirtyItems',
  DownloadFirst = 'DownloadFirst',
  AfterDownloadFirst = 'AfterDownloadFirst',
  IntegrityCheck = 'IntegrityCheck',
  ResolveOutOfSync = 'ResolveOutOfSync',
}
