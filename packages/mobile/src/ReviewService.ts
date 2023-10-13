import { ApplicationEvent } from '@standardnotes/snjs'
import { MobileDevice } from 'Lib/MobileDevice'
import * as StoreReview from 'react-native-store-review'

const RUN_COUNTS_BEFORE_REVIEW = [18, 45, 105]

export class ReviewService {
  constructor(private device: MobileDevice) {
    this.device.addApplicationEventReceiver(this.onApplicationEvent.bind(this))
  }
  async onApplicationEvent(event: ApplicationEvent) {
    if (event !== ApplicationEvent.Launched) {
      return
    }
    const runCount = await this.getRunCount()
    void this.setRunCount(runCount + 1)
    if (RUN_COUNTS_BEFORE_REVIEW.includes(runCount)) {
      setTimeout(function () {
        try {
          StoreReview.requestReview()
        } catch (error) {
          console.error(error)
        }
      }, 1000)
    }
  }
  async getRunCount() {
    const value = await this.device.getJsonParsedRawStorageValue('runCount')
    return Number(value) || 0
  }
  async setRunCount(runCount: number) {
    return this.device.setRawStorageValue('runCount', runCount.toString())
  }
}
