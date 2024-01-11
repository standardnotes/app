export interface SyncFrequencyGuardInterface {
  incrementCallsPerMinute(): void
  isSyncCallsThresholdReachedThisMinute(): boolean
}
