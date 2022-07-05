/* istanbul ignore file */

export enum SyncSource {
  External = 1,
  SpawnQueue = 2,
  ResolveQueue = 3,
  MoreDirtyItems = 4,
  AfterDownloadFirst = 5,
  IntegrityCheck = 6,
  ResolveOutOfSync = 7,
}
