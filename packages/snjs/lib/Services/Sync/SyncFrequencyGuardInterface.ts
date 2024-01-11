export interface SyncFrequencyGuardInterface {
  incrementCallsPerMinute(): void
  isSyncCallsThresholdReachedThisMinute(): boolean
  clear(): void
}
