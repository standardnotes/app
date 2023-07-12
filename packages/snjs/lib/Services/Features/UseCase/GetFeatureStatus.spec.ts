import { FeatureIdentifier } from '@standardnotes/features'
import { FeatureStatus, ItemManagerInterface } from '@standardnotes/services'
import { GetFeatureStatusUseCase } from './GetFeatureStatus'
import { ComponentInterface } from '@standardnotes/models'

jest.mock('@standardnotes/features', () => ({
  FeatureIdentifier: {
    DarkTheme: 'darkTheme',
  },
  FindNativeFeature: jest.fn(),
}))

import { FindNativeFeature } from '@standardnotes/features'
import { Subscription } from '@standardnotes/security'

describe('GetFeatureStatusUseCase', () => {
  let items: jest.Mocked<ItemManagerInterface>
  let usecase: GetFeatureStatusUseCase

  beforeEach(() => {
    items = {
      getDisplayableComponents: jest.fn(),
    } as unknown as jest.Mocked<ItemManagerInterface>
    usecase = new GetFeatureStatusUseCase(items)
    ;(FindNativeFeature as jest.Mock).mockReturnValue(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('free features', () => {
    it('should return entitled for free features', () => {
      expect(
        usecase.execute({
          featureId: FeatureIdentifier.DarkTheme,
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.Entitled)
    })
  })

  describe('deprecated features', () => {
    it('should return entitled for deprecated paid features if any subscription is active', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({ deprecated: true })

      expect(
        usecase.execute({
          featureId: 'deprecatedFeature',
          hasPaidAnyPartyOnlineOrOfflineSubscription: true,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.Entitled)
    })

    it('should return NoUserSubscription for deprecated paid features if no subscription is active', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({ deprecated: true })

      expect(
        usecase.execute({
          featureId: 'deprecatedFeature',
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.NoUserSubscription)
    })
  })

  describe('native features', () => {
    it('should return NoUserSubscription for native features without subscription and roles', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({ deprecated: false })

      expect(
        usecase.execute({
          featureId: 'nativeFeature',
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        }),
      ).toEqual(FeatureStatus.NoUserSubscription)
    })

    it('should return NotInCurrentPlan for native features with roles not in available roles', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({
        deprecated: false,
        availableInRoles: ['notInRole'],
      })

      expect(
        usecase.execute({
          featureId: 'nativeFeature',
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: { online: ['inRole'] },
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        }),
      ).toEqual(FeatureStatus.NotInCurrentPlan)
    })

    it('should return Entitled for native features with roles in available roles and active subscription', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({
        deprecated: false,
        availableInRoles: ['inRole'],
      })

      expect(
        usecase.execute({
          featureId: 'nativeFeature',
          firstPartyOnlineSubscription: {
            endsAt: new Date(Date.now() + 10000).getTime(),
          } as jest.Mocked<Subscription>,
          firstPartyRoles: { online: ['inRole'] },
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        }),
      ).toEqual(FeatureStatus.Entitled)
    })

    it('should return InCurrentPlanButExpired for native features with roles in available roles and expired subscription', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({
        deprecated: false,
        availableInRoles: ['inRole'],
      })

      expect(
        usecase.execute({
          featureId: 'nativeFeature',
          firstPartyOnlineSubscription: {
            endsAt: new Date(Date.now() - 10000).getTime(),
          } as jest.Mocked<Subscription>,
          firstPartyRoles: { online: ['inRole'] },
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        }),
      ).toEqual(FeatureStatus.InCurrentPlanButExpired)
    })
  })

  describe('third party features', () => {
    it('should return Entitled for third-party features', () => {
      const mockComponent = {
        identifier: 'thirdPartyFeature',
        isExpired: false,
      } as unknown as jest.Mocked<ComponentInterface>

      items.getDisplayableComponents.mockReturnValue([mockComponent])

      expect(
        usecase.execute({
          featureId: 'thirdPartyFeature',
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.Entitled)
    })

    it('should return NoUserSubscription for non-existing third-party features', () => {
      ;(items.getDisplayableComponents as jest.Mock).mockReturnValue([])

      expect(
        usecase.execute({
          featureId: 'nonExistingThirdPartyFeature',
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.NoUserSubscription)
    })

    it('should return InCurrentPlanButExpired for expired third-party features', () => {
      const mockComponent = {
        identifier: 'thirdPartyFeature',
        isExpired: true,
      } as unknown as jest.Mocked<ComponentInterface>

      items.getDisplayableComponents.mockReturnValue([mockComponent])

      expect(
        usecase.execute({
          featureId: 'thirdPartyFeature',
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.InCurrentPlanButExpired)
    })
  })
})
