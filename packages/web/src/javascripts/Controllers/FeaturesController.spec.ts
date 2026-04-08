import * as FeatureTrunk from '@/FeatureTrunk'
import { FeaturesClientInterface } from '@standardnotes/services'
import { NativeFeatureIdentifier, FeatureStatus, InternalEventBusInterface } from '@standardnotes/snjs'
import { FeaturesController } from './FeaturesController'

describe('FeaturesController', () => {
  describe('isUniversalSearchEnabled', () => {
    let features: jest.Mocked<Pick<FeaturesClientInterface, 'getFeatureStatus' | 'hasRole'>>
    let eventBus: jest.Mocked<Pick<InternalEventBusInterface, 'addEventHandler'>>
    let controller: FeaturesController
    let featureTrunkSpy: jest.SpyInstance

    beforeEach(() => {
      featureTrunkSpy = jest.spyOn(FeatureTrunk, 'featureTrunkUniversalSearchEnabled').mockReturnValue(false)

      features = {
        getFeatureStatus: jest.fn().mockImplementation((id: { value: string }) => {
          if (id.value === NativeFeatureIdentifier.TYPES.UniversalSearch) {
            return FeatureStatus.NoUserSubscription
          }
          return FeatureStatus.Entitled
        }),
        hasRole: jest.fn(),
      }
      eventBus = {
        addEventHandler: jest.fn(),
      }
      controller = new FeaturesController(
        features as unknown as FeaturesClientInterface,
        eventBus as unknown as InternalEventBusInterface,
      )
    })

    afterEach(() => {
      controller.deinit()
      jest.restoreAllMocks()
    })

    it('returns true when internal feature trunk is enabled', () => {
      featureTrunkSpy.mockReturnValue(true)

      expect(controller.isUniversalSearchEnabled()).toBe(true)
    })

    it('returns true when user has internal team role', () => {
      features.hasRole.mockReturnValue(true)

      expect(controller.isUniversalSearchEnabled()).toBe(true)
    })

    it('returns true when getFeatureStatus is Entitled (e.g. after Universal Search is added to free features)', () => {
      features.hasRole.mockReturnValue(false)
      features.getFeatureStatus.mockImplementation((id: { value: string }) => {
        if (id.value === NativeFeatureIdentifier.TYPES.UniversalSearch) {
          return FeatureStatus.Entitled
        }
        return FeatureStatus.Entitled
      })

      expect(controller.isUniversalSearchEnabled()).toBe(true)
    })

    it('returns false when trunk, internal role, and entitlement do not apply', () => {
      features.hasRole.mockReturnValue(false)
      features.getFeatureStatus.mockImplementation((id: { value: string }) => {
        if (id.value === NativeFeatureIdentifier.TYPES.UniversalSearch) {
          return FeatureStatus.NoUserSubscription
        }
        return FeatureStatus.Entitled
      })

      expect(controller.isUniversalSearchEnabled()).toBe(false)
    })
  })
})
