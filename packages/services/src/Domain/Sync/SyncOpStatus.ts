/* eslint-disable @typescript-eslint/no-explicit-any */

import { SyncEventReceiver } from './../Event/SyncEventReceiver'
import { SyncEvent } from './../Event/SyncEvent'

const HEALTHY_SYNC_DURATION_THRESHOLD_S = 5
const TIMING_MONITOR_POLL_FREQUENCY_MS = 500

export class SyncOpStatus {
  error?: any
  private interval: any
  private receiver: SyncEventReceiver
  private completedUpload = 0
  private totalUpload = 0
  private downloaded = 0
  private databaseLoadCurrent = 0
  private databaseLoadTotal = 0
  private databaseLoadDone = false
  private syncing = false
  private syncStart!: Date
  private timingMonitor?: any

  constructor(interval: any, receiver: SyncEventReceiver) {
    this.interval = interval
    this.receiver = receiver
  }

  public deinit() {
    this.stopTimingMonitor()
  }

  public setUploadStatus(completed: number, total: number) {
    this.completedUpload = completed
    this.totalUpload = total
    this.receiver(SyncEvent.StatusChanged)
  }

  public setDownloadStatus(downloaded: number) {
    this.downloaded += downloaded
    this.receiver(SyncEvent.StatusChanged)
  }

  public setDatabaseLoadStatus(current: number, total: number, done: boolean) {
    this.databaseLoadCurrent = current
    this.databaseLoadTotal = total
    this.databaseLoadDone = done
    if (done) {
      this.receiver(SyncEvent.LocalDataLoaded)
    } else {
      this.receiver(SyncEvent.LocalDataIncrementalLoad)
    }
  }

  public getStats() {
    return {
      uploadCompletionCount: this.completedUpload,
      uploadTotalCount: this.totalUpload,
      downloadCount: this.downloaded,
      localDataDone: this.databaseLoadDone,
      localDataCurrent: this.databaseLoadCurrent,
      localDataTotal: this.databaseLoadTotal,
    }
  }

  public setDidBegin() {
    this.syncing = true
    this.syncStart = new Date()
  }

  public setDidEnd() {
    this.syncing = false
  }

  get syncInProgress() {
    return this.syncing === true
  }

  get secondsSinceSyncStart() {
    return (new Date().getTime() - this.syncStart.getTime()) / 1000
  }

  /**
   * Notifies receiver if current sync request is taking too long to complete.
   */
  startTimingMonitor(): void {
    if (this.timingMonitor) {
      this.stopTimingMonitor()
    }

    this.timingMonitor = this.interval(() => {
      if (this.secondsSinceSyncStart > HEALTHY_SYNC_DURATION_THRESHOLD_S) {
        this.receiver(SyncEvent.SyncTakingTooLong)
        this.stopTimingMonitor()
      }
    }, TIMING_MONITOR_POLL_FREQUENCY_MS)
  }

  stopTimingMonitor(): void {
    if (Object.prototype.hasOwnProperty.call(this.interval, 'cancel')) {
      this.interval.cancel(this.timingMonitor)
    } else {
      clearInterval(this.timingMonitor)
    }
    this.timingMonitor = null
  }

  hasError(): boolean {
    return !!this.error
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError(error: any): void {
    this.error = error
  }

  clearError() {
    this.error = null
  }

  reset() {
    this.downloaded = 0
    this.completedUpload = 0
    this.totalUpload = 0
    this.syncing = false
    this.error = null
    this.stopTimingMonitor()
    this.receiver(SyncEvent.StatusChanged)
  }
}
