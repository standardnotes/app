import { NativeFeatureIdentifier } from '@standardnotes/features'
import { FeatureStatus, ItemManagerInterface } from '@standardnotes/services'
import { GetFeatureStatusUseCase } from './GetFeatureStatus'
import { ComponentInterface, DecryptedItemInterface } from '@standardnotes/models'
import { Subscription } from '@standardnotes/responses'
import { Uuid } from '@standardnotes/domain-core'

describe('GetFeatureStatusUseCase', () => {
  let items: jest.Mocked<ItemManagerInterface>
  let usecase: GetFeatureStatusUseCase
  let findNativeFeature: jest.Mock<any, any>

  beforeEach(() => {
    items = {
      getDisplayableComponents: jest.fn(),
    } as unknown as jest.Mocked<ItemManagerInterface>
    usecase = new GetFeatureStatusUseCase(items)
    findNativeFeature = jest.fn()
    usecase.findNativeFeature = findNativeFeature
    findNativeFeature.mockReturnValue(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('free features', () => {
    it('should return entitled for free features', () => {
      expect(
        usecase.execute({
          featureId: NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.DarkTheme).getValue(),
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.Entitled)
    })
  })

  describe('deprecated features', () => {
    it('should return entitled for deprecated paid features if any subscription is active', () => {
      findNativeFeature.mockReturnValue({ deprecated: true })

      expect(
        usecase.execute({
          featureId: Uuid.create('00000000-0000-0000-0000-000000000000').getValue(),
          hasPaidAnyPartyOnlineOrOfflineSubscription: true,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.Entitled)
    })

    it('should return NoUserSubscription for deprecated paid features if no subscription is active', () => {
      findNativeFeature.mockReturnValue({ deprecated: true })

      expect(
        usecase.execute({
          featureId: Uuid.create('00000000-0000-0000-0000-000000000000').getValue(),
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.NoUserSubscription)
    })
  })

  describe('native features', () => {
    it('should return Entitled if the context item belongs to a shared vault and user does not have subscription', () => {
      findNativeFeature.mockReturnValue({ deprecated: false })

      expect(
        usecase.execute({
          featureId: NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.AutobiographyTheme).getValue(),
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          inContextOfItem: { shared_vault_uuid: 'sharedVaultUuid' } as jest.Mocked<DecryptedItemInterface>,
        }),
      ).toEqual(FeatureStatus.Entitled)
    })

    it('should return NoUserSubscription if the context item does not belong to a shared vault and user does not have subscription', () => {
      findNativeFeature.mockReturnValue({ deprecated: false })

      expect(
        usecase.execute({
          featureId: NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.AutobiographyTheme).getValue(),
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          inContextOfItem: { shared_vault_uuid: undefined } as jest.Mocked<DecryptedItemInterface>,
        }),
      ).toEqual(FeatureStatus.NoUserSubscription)
    })

    it('should return NoUserSubscription for native features without subscription and roles', () => {
      findNativeFeature.mockReturnValue({ deprecated: false })

      expect(
        usecase.execute({
          featureId: NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.AutobiographyTheme).getValue(),
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        }),
      ).toEqual(FeatureStatus.NoUserSubscription)
    })

    it('should return NotInCurrentPlan for native features with roles not in available roles', () => {
      findNativeFeature.mockReturnValue({
        deprecated: false,
        availableInRoles: ['notInRole'],
      })

      expect(
        usecase.execute({
          featureId: NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.AutobiographyTheme).getValue(),
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: { online: ['inRole'] },
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        }),
      ).toEqual(FeatureStatus.NotInCurrentPlan)
    })

    it('should return Entitled for native features with roles in available roles and active subscription', () => {
      findNativeFeature.mockReturnValue({
        deprecated: false,
        availableInRoles: ['inRole'],
      })

      expect(
        usecase.execute({
          featureId: NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.AutobiographyTheme).getValue(),
          firstPartyOnlineSubscription: {
            endsAt: new Date(Date.now() + 10000).getTime(),
          } as jest.Mocked<Subscription>,
          firstPartyRoles: { online: ['inRole'] },
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
        }),
      ).toEqual(FeatureStatus.Entitled)
    })

    it('should return InCurrentPlanButExpired for native features with roles in available roles and expired subscription', () => {
      findNativeFeature.mockReturnValue({
        deprecated: false,
        availableInRoles: ['inRole'],
      })

      expect(
        usecase.execute({
          featureId: NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.AutobiographyTheme).getValue(),
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
        uuid: '00000000-0000-0000-0000-000000000000',
        isExpired: false,
      } as unknown as jest.Mocked<ComponentInterface>

      items.getDisplayableComponents.mockReturnValue([mockComponent])

      expect(
        usecase.execute({
          featureId: Uuid.create('00000000-0000-0000-0000-000000000000').getValue(),
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
          featureId: Uuid.create('00000000-0000-0000-0000-000000000000').getValue(),
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.NoUserSubscription)
    })

    it('should return InCurrentPlanButExpired for expired third-party features', () => {
      const mockComponent = {
        uuid: '00000000-0000-0000-0000-000000000000',
        isExpired: true,
      } as unknown as jest.Mocked<ComponentInterface>

      items.getDisplayableComponents.mockReturnValue([mockComponent])

      expect(
        usecase.execute({
          featureId: Uuid.create('00000000-0000-0000-0000-000000000000').getValue(),
          hasPaidAnyPartyOnlineOrOfflineSubscription: false,
          firstPartyOnlineSubscription: undefined,
          firstPartyRoles: undefined,
        }),
      ).toEqual(FeatureStatus.InCurrentPlanButExpired)
    })
  })
})
