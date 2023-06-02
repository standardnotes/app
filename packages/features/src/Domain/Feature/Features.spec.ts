import { GetFeatures } from './Features'

describe('features', () => {
  it('all features should have availableInRoles populated', () => {
    const features = GetFeatures()

    for (const feature of features) {
      expect(feature.availableInRoles !== undefined && feature.availableInRoles.length > 0).toBeTruthy()
    }
  })
})
