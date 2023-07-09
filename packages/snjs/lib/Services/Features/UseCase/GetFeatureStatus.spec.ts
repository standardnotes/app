import { FeatureIdentifier } from '@standardnotes/features'
import { FeatureStatus, ItemManagerInterface } from '@standardnotes/services'
import { GetFeatureStatusUseCase } from './GetFeatureStatus'
import { ComponentInterface } from '@standardnotes/models'

jest.mock('@standardnotes/features', () => ({
  FeatureIdentifier: {
    DarkTheme: 'darkTheme',
  },
  FindNativeFeature: jest.fn(), // Mocked function
}))

import { FindNativeFeature } from '@standardnotes/features'

describe('GetFeatureStatusUseCase', () => {
  let items: ItemManagerInterface

  beforeEach(() => {
    items = {
      getDisplayableComponents: jest.fn(),
    } as unknown as ItemManagerInterface
  })

  describe('execute', () => {
    it('should return entitled if feature is free', () => {
      const useCase = new GetFeatureStatusUseCase(items)
      const result = useCase.execute({
        featureId: FeatureIdentifier.DarkTheme,
        hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        hasFirstPartySubscription: false,
        roles: [],
      })
      expect(result).toBe(FeatureStatus.Entitled)
    })

    it('should return entitled if feature is deprecated and user has paid subscription', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({ deprecated: true })

      const useCase = new GetFeatureStatusUseCase(items)
      const result = useCase.execute({
        featureId: 'deprecatedFeature' as FeatureIdentifier,
        hasPaidAnyPartyOnlineOrOfflineSubscription: true,
        hasFirstPartySubscription: false,
        roles: [],
      })
      expect(result).toBe(FeatureStatus.Entitled)
    })

    it('should return NoUserSubscription if feature is deprecated and user has no subscription', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({ deprecated: true })

      const useCase = new GetFeatureStatusUseCase(items)
      const result = useCase.execute({
        featureId: 'deprecatedFeature',
        hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        hasFirstPartySubscription: false,
        roles: [],
      })
      expect(result).toBe(FeatureStatus.NoUserSubscription)
    })

    it('should return NoUserSubscription if feature is third party and there is no component', () => {
      jest.spyOn(items, 'getDisplayableComponents').mockReturnValue([])
      const useCase = new GetFeatureStatusUseCase(items)
      const result = useCase.execute({
        featureId: 'thirdPartyFeature',
        hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        hasFirstPartySubscription: false,
        roles: [],
      })
      expect(result).toBe(FeatureStatus.NoUserSubscription)
    })

    it('should return InCurrentPlanButExpired if feature is third party and component is expired', () => {
      jest
        .spyOn(items, 'getDisplayableComponents')
        .mockReturnValue([
          <ComponentInterface>{ identifier: 'thirdPartyFeature' as FeatureIdentifier, isExpired: true },
        ])

      const useCase = new GetFeatureStatusUseCase(items)
      const result = useCase.execute({
        featureId: 'thirdPartyFeature',
        hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        hasFirstPartySubscription: false,
        roles: [],
      })
      expect(result).toBe(FeatureStatus.InCurrentPlanButExpired)
    })

    it('should return Entitled if feature is third party and component is not expired', () => {
      jest
        .spyOn(items, 'getDisplayableComponents')
        .mockReturnValue([
          <ComponentInterface>{ identifier: 'thirdPartyFeature' as FeatureIdentifier, isExpired: false },
        ])

      const useCase = new GetFeatureStatusUseCase(items)
      const result = useCase.execute({
        featureId: 'thirdPartyFeature' as FeatureIdentifier,
        hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        hasFirstPartySubscription: false,
        roles: [],
      })
      expect(result).toBe(FeatureStatus.Entitled)
    })

    it('should return NoUserSubscription if feature is native and user has no first party subscription', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({})

      const useCase = new GetFeatureStatusUseCase(items)
      const result = useCase.execute({
        featureId: FeatureIdentifier.SuperEditor,
        hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        hasFirstPartySubscription: false,
        roles: [],
      })
      expect(result).toBe(FeatureStatus.NoUserSubscription)
    })

    it('should return NotInCurrentPlan if feature is native and user has no matching role', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({ availableInRoles: ['role1'] })

      const useCase = new GetFeatureStatusUseCase(items)
      const result = useCase.execute({
        featureId: FeatureIdentifier.SuperEditor,
        hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        hasFirstPartySubscription: true,
        roles: ['role2'],
      })
      expect(result).toBe(FeatureStatus.NotInCurrentPlan)
    })

    it('should return Entitled if feature is native and user has a matching role', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({ availableInRoles: ['role1'] })

      const useCase = new GetFeatureStatusUseCase(items)
      const result = useCase.execute({
        featureId: FeatureIdentifier.SuperEditor,
        hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        hasFirstPartySubscription: true,
        roles: ['role1'],
      })
      expect(result).toBe(FeatureStatus.Entitled)
    })

    it('should return Entitled if feature is native and there are no specific roles required', () => {
      ;(FindNativeFeature as jest.Mock).mockReturnValue({})

      const useCase = new GetFeatureStatusUseCase(items)
      const result = useCase.execute({
        featureId: FeatureIdentifier.SuperEditor,
        hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        hasFirstPartySubscription: true,
        roles: ['role1'],
      })
      expect(result).toBe(FeatureStatus.Entitled)
    })
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})
