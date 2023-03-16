import { SubscriptionName } from '@standardnotes/common'
import { GetFeatures, GetFeaturesForSubscription } from './Features'

describe('features', () => {
  it('all features should have either availableInSubscriptions or availableInRoles populated', () => {
    const features = GetFeatures()

    for (const feature of features) {
      expect(feature.availableInSubscriptions.length > 0 || feature.availableInRoles !== undefined && feature.availableInRoles.length > 0).toBeTruthy()
    }
  })
  it('gets features for plus plan', () => {
    const features = GetFeaturesForSubscription(SubscriptionName.PlusPlan)

    for (const feature of features) {
      expect(feature.availableInSubscriptions.includes(SubscriptionName.PlusPlan))
    }
  })
})
