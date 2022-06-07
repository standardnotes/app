import { ApplicationService, Platform } from '@standardnotes/snjs'
import * as StoreReview from 'react-native-store-review'

const RUN_COUNTS_BEFORE_REVIEW = [18, 45, 105]

export class ReviewService extends ApplicationService {
  override async onAppLaunch() {
    if (this.application?.platform === Platform.Android || !StoreReview.isAvailable) {
      return
    }
    const runCount = await this.getRunCount()
    void this.setRunCount(runCount + 1)
    if (RUN_COUNTS_BEFORE_REVIEW.includes(runCount)) {
      setTimeout(function () {
        StoreReview.requestReview()
      }, 1000)
    }
  }
  async getRunCount() {
    return Number(this.application?.getValue('runCount'))
  }
  async setRunCount(runCount: number) {
    return this.application?.setValue('runCount', runCount)
  }
}
