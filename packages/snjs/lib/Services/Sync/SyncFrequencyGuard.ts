import { SyncFrequencyGuardInterface } from './SyncFrequencyGuardInterface'

export class SyncFrequencyGuard implements SyncFrequencyGuardInterface {
  private callsPerMinuteMap: Map<string, number>

  constructor(private syncCallsThresholdPerMinute: number) {
    this.callsPerMinuteMap = new Map<string, number>()
  }

  isSyncCallsThresholdReachedThisMinute(): boolean {
    const stringDateToTheMinute = this.getCallsPerMinuteKey()
    const persistedCallsCount = this.callsPerMinuteMap.get(stringDateToTheMinute) || 0

    return persistedCallsCount >= this.syncCallsThresholdPerMinute
  }

  incrementCallsPerMinute(): void {
    const stringDateToTheMinute = this.getCallsPerMinuteKey()
    const persistedCallsCount = this.callsPerMinuteMap.get(stringDateToTheMinute)
    const newMinuteStarted = persistedCallsCount === undefined

    if (newMinuteStarted) {
      this.clear()

      this.callsPerMinuteMap.set(stringDateToTheMinute, 1)
    } else {
      this.callsPerMinuteMap.set(stringDateToTheMinute, persistedCallsCount + 1)
    }
  }

  clear(): void {
    this.callsPerMinuteMap.clear()
  }

  private getCallsPerMinuteKey(): string {
    const now = new Date()

    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}T${now.getHours()}:${now.getMinutes()}`
  }
}
