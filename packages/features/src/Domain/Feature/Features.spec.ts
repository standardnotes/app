import { SubscriptionName } from '@standardnotes/common'
import { GetFeatures, GetFeaturesForSubscription } from './Features'

describe('features', () => {
  it('all features should have availableInSubscriptions populated', () => {
    const features = GetFeatures()

    for (const feature of features) {
      expect(feature.availableInSubscriptions.length).toBeGreaterThan(0)
    }
  })
  it('gets features for plus plan', () => {
    const features = GetFeaturesForSubscription(SubscriptionName.PlusPlan)

    for (const feature of features) {
      expect(feature.availableInSubscriptions.includes(SubscriptionName.PlusPlan))
    }
  })
})
