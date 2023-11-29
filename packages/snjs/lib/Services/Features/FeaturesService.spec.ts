import { ItemInterface, SNFeatureRepo } from '@standardnotes/models'
import { SyncService } from '../Sync/SyncService'
import { FeaturesService } from '@Lib/Services/Features'
import { RoleName, ContentType, Uuid, Result, SettingName } from '@standardnotes/domain-core'
import { NativeFeatureIdentifier, GetFeatures } from '@standardnotes/features'
import { SettingsService } from '../Settings'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  AlertService,
  LegacyApiServiceInterface,
  FeaturesEvent,
  FeatureStatus,
  InternalEventBusInterface,
  ItemManagerInterface,
  MutatorClientInterface,
  SessionsClientInterface,
  StorageKey,
  StorageServiceInterface,
  SubscriptionManagerInterface,
  SyncServiceInterface,
  UserServiceInterface,
  UserService,
  IsApplicationUsingThirdPartyHost,
  WebSocketsService,
} from '@standardnotes/services'
import { LegacyApiService, SessionManager } from '../Api'
import { ItemManager } from '../Items'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { SettingsClientInterface } from '../Settings/SettingsClientInterface'
import { LoggerInterface } from '@standardnotes/utils'

describe('FeaturesService', () => {
  let storageService: StorageServiceInterface
  let itemManager: ItemManagerInterface
  let mutator: MutatorClientInterface
  let subscriptions: SubscriptionManagerInterface
  let apiService: LegacyApiServiceInterface
  let webSocketsService: WebSocketsService
  let settingsService: SettingsClientInterface
  let userService: UserServiceInterface
  let syncService: SyncServiceInterface
  let alertService: AlertService
  let sessionManager: SessionsClientInterface
  let crypto: PureCryptoInterface
  let roles: string[]
  let items: ItemInterface[]
  let internalEventBus: InternalEventBusInterface
  let featureService: FeaturesService
  let logger: LoggerInterface
  let isApplicationUsingThirdPartyHostUseCase: IsApplicationUsingThirdPartyHost

  beforeEach(() => {
    logger = {} as jest.Mocked<LoggerInterface>
    logger.info = jest.fn()

    roles = [RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser]

    items = [] as jest.Mocked<ItemInterface[]>

    storageService = {} as jest.Mocked<DiskStorageService>
    storageService.setValue = jest.fn()
    storageService.getValue = jest.fn()

    apiService = {} as jest.Mocked<LegacyApiService>
    apiService.addEventObserver = jest.fn()

    itemManager = {} as jest.Mocked<ItemManager>
    itemManager.getItems = jest.fn().mockReturnValue(items)
    itemManager.createTemplateItem = jest.fn().mockReturnValue({})
    itemManager.addObserver = jest.fn()

    mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.createItem = jest.fn()
    mutator.changeComponent = jest.fn().mockReturnValue({} as jest.Mocked<ItemInterface>)
    mutator.setItemsToBeDeleted = jest.fn()
    mutator.changeItem = jest.fn()
    mutator.changeFeatureRepo = jest.fn()

    subscriptions = {} as jest.Mocked<SubscriptionManagerInterface>
    subscriptions.getOnlineSubscription = jest.fn()
    subscriptions.addEventObserver = jest.fn()

    webSocketsService = {} as jest.Mocked<WebSocketsService>
    webSocketsService.addEventObserver = jest.fn()

    settingsService = {} as jest.Mocked<SettingsService>
    settingsService.updateSetting = jest.fn()

    userService = {} as jest.Mocked<UserService>
    userService.addEventObserver = jest.fn()

    syncService = {} as jest.Mocked<SyncService>
    syncService.sync = jest.fn()

    alertService = {} as jest.Mocked<AlertService>
    alertService.confirm = jest.fn().mockReturnValue(true)
    alertService.alert = jest.fn()

    sessionManager = {} as jest.Mocked<SessionManager>
    sessionManager.isSignedIntoFirstPartyServer = jest.fn()
    sessionManager.getUser = jest.fn()

    crypto = {} as jest.Mocked<PureCryptoInterface>
    crypto.base64Decode = jest.fn()

    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publish = jest.fn()
    internalEventBus.addEventHandler = jest.fn()

    isApplicationUsingThirdPartyHostUseCase = {} as jest.Mocked<IsApplicationUsingThirdPartyHost>
    isApplicationUsingThirdPartyHostUseCase.execute = jest.fn().mockReturnValue(Result.ok(false))

    featureService = new FeaturesService(
      storageService,
      itemManager,
      mutator,
      subscriptions,
      apiService,
      webSocketsService,
      settingsService,
      userService,
      syncService,
      alertService,
      sessionManager,
      crypto,
      logger,
      isApplicationUsingThirdPartyHostUseCase,
      internalEventBus,
    )
  })

  describe('experimental features', () => {
    it('enables/disables an experimental feature', async () => {
      storageService.getValue = jest.fn().mockReturnValue(GetFeatures())

      featureService.getExperimentalFeatures = jest
        .fn()
        .mockReturnValue([NativeFeatureIdentifier.TYPES.DeprecatedPlusEditor])
      featureService.initializeFromDisk()

      featureService.enableExperimentalFeature(NativeFeatureIdentifier.TYPES.DeprecatedPlusEditor)

      expect(featureService.isExperimentalFeatureEnabled(NativeFeatureIdentifier.TYPES.DeprecatedPlusEditor)).toEqual(
        true,
      )

      featureService.disableExperimentalFeature(NativeFeatureIdentifier.TYPES.DeprecatedPlusEditor)

      expect(featureService.isExperimentalFeatureEnabled(NativeFeatureIdentifier.TYPES.DeprecatedPlusEditor)).toEqual(
        false,
      )
    })
  })

  describe('hasFirstPartyOnlineSubscription', () => {
    it('should be true if signed into first party server and has online subscription', () => {
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(true)

      expect(featureService.hasFirstPartyOnlineSubscription()).toEqual(true)
    })

    it('should not be true if not signed into first party server', () => {
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(false)
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(true)

      expect(featureService.hasFirstPartyOnlineSubscription()).toEqual(false)
    })

    it('should not be true if no online subscription', () => {
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(false)

      expect(featureService.hasFirstPartyOnlineSubscription()).toEqual(false)
    })
  })

  describe('hasPaidAnyPartyOnlineOrOfflineSubscription', () => {
    it('should return true if onlineRolesIncludePaidSubscription', () => {
      featureService.onlineRolesIncludePaidSubscription = jest.fn().mockReturnValue(true)

      expect(featureService.hasPaidAnyPartyOnlineOrOfflineSubscription()).toEqual(true)
    })

    it('should return true if hasOfflineRepo', () => {
      featureService.hasOfflineRepo = jest.fn().mockReturnValue(true)

      expect(featureService.hasPaidAnyPartyOnlineOrOfflineSubscription()).toEqual(true)
    })

    it('should return true if hasFirstPartyOnlineSubscription', () => {
      featureService.hasFirstPartyOnlineSubscription = jest.fn().mockReturnValue(true)

      expect(featureService.hasPaidAnyPartyOnlineOrOfflineSubscription()).toEqual(true)
    })
  })

  describe('loadUserRoles()', () => {
    it('retrieves user roles and features from storage', async () => {
      const createService = () => {
        return new FeaturesService(
          storageService,
          itemManager,
          mutator,
          subscriptions,
          apiService,
          webSocketsService,
          settingsService,
          userService,
          syncService,
          alertService,
          sessionManager,
          crypto,
          logger,
          isApplicationUsingThirdPartyHostUseCase,
          internalEventBus,
        )
      }

      createService().initializeFromDisk()
      expect(storageService.getValue).toHaveBeenCalledWith(StorageKey.UserRoles, undefined, [])
    })
  })

  describe('updateRoles()', () => {
    it('setRoles should notify event if roles changed', async () => {
      storageService.getValue = jest.fn().mockReturnValue(roles)

      featureService.initializeFromDisk()

      const mock = (featureService['notifyEvent'] = jest.fn())

      const newRoles = [...roles, RoleName.NAMES.PlusUser]
      featureService.setOnlineRoles(newRoles)

      expect(mock.mock.calls[0][0]).toEqual(FeaturesEvent.UserRolesChanged)
    })

    it('should notify of subscription purchase', async () => {
      storageService.getValue = jest.fn().mockReturnValue(roles)

      featureService.initializeFromDisk()

      const spy = jest.spyOn(featureService, 'notifyEvent' as never)

      const newRoles = [...roles, RoleName.NAMES.ProUser]
      await featureService.updateOnlineRolesWithNewValues(newRoles)

      expect(spy.mock.calls[1][0]).toEqual(FeaturesEvent.DidPurchaseSubscription)
    })

    it('should not notify of subscription purchase on initial roles load after sign in', async () => {
      storageService.getValue = jest.fn().mockReturnValue(roles)

      featureService.initializeFromDisk()
      featureService['onlineRoles'] = []

      const spy = jest.spyOn(featureService, 'notifyEvent' as never)

      const newRoles = [...roles, RoleName.NAMES.ProUser]
      await featureService.updateOnlineRolesWithNewValues(newRoles)

      const triggeredEvents = spy.mock.calls.map((call) => call[0])
      expect(triggeredEvents).not.toContain(FeaturesEvent.DidPurchaseSubscription)
    })

    it('should not notify of subscription purchase if new roles are not paid', async () => {
      storageService.getValue = jest.fn().mockReturnValue(roles)

      featureService.initializeFromDisk()

      const spy = jest.spyOn(featureService, 'notifyEvent' as never)

      const newRoles = [...roles, 'TRANSITION_USER']
      await featureService.updateOnlineRolesWithNewValues(newRoles)

      const triggeredEvents = spy.mock.calls.map((call) => call[0])
      expect(triggeredEvents).not.toContain(FeaturesEvent.DidPurchaseSubscription)
    })

    it('saves new roles to storage if a role has been added', async () => {
      storageService.getValue = jest.fn().mockReturnValue(roles)

      featureService.initializeFromDisk()

      const newRoles = [...roles, RoleName.NAMES.ProUser]
      await featureService.updateOnlineRolesWithNewValues(newRoles)
      expect(storageService.setValue).toHaveBeenCalledWith(StorageKey.UserRoles, newRoles)
    })

    it('saves new roles to storage if a role has been removed', async () => {
      const newRoles = [RoleName.NAMES.CoreUser]

      storageService.getValue = jest.fn().mockReturnValue(roles)

      featureService.initializeFromDisk()
      await featureService.updateOnlineRolesWithNewValues(newRoles)

      expect(storageService.setValue).toHaveBeenCalledWith(StorageKey.UserRoles, newRoles)
    })

    it('role-based feature status', async () => {
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)

      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser])
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(true)

      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.MidnightTheme).getValue(),
        ),
      ).toBe(FeatureStatus.Entitled)
      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SuperEditor).getValue(),
        ),
      ).toBe(FeatureStatus.Entitled)
    })

    it('feature status with no paid role', async () => {
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)

      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(false)

      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.MidnightTheme).getValue(),
        ),
      ).toBe(FeatureStatus.NoUserSubscription)
      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.DeprecatedPlusEditor).getValue(),
        ),
      ).toBe(FeatureStatus.NoUserSubscription)
      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SheetsEditor).getValue(),
        ),
      ).toBe(FeatureStatus.NoUserSubscription)
    })

    it('role-based features while not signed into first party server', async () => {
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(false)

      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.ProUser])

      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SuperEditor).getValue(),
        ),
      ).toBe(FeatureStatus.NoUserSubscription)
    })

    it('third party feature status', async () => {
      itemManager.getDisplayableComponents = jest
        .fn()
        .mockReturnValue([
          { uuid: '00000000-0000-0000-0000-000000000001' },
          { uuid: '00000000-0000-0000-0000-000000000002', isExpired: true },
        ])

      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])

      expect(featureService.getFeatureStatus(Uuid.create('00000000-0000-0000-0000-000000000001').getValue())).toBe(
        FeatureStatus.Entitled,
      )
      expect(featureService.getFeatureStatus(Uuid.create('00000000-0000-0000-0000-000000000002').getValue())).toBe(
        FeatureStatus.InCurrentPlanButExpired,
      )
      expect(featureService.getFeatureStatus(Uuid.create('00000000-0000-0000-0000-000000000003').getValue())).toBe(
        FeatureStatus.NoUserSubscription,
      )
    })

    it('feature status should be not entitled if no account or offline repo', async () => {
      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])

      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(false)

      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.MidnightTheme).getValue(),
        ),
      ).toBe(FeatureStatus.NoUserSubscription)
      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.TokenVaultEditor).getValue(),
        ),
      ).toBe(FeatureStatus.NoUserSubscription)
    })

    it('feature status for offline subscription', async () => {
      featureService.hasFirstPartyOfflineSubscription = jest.fn().mockReturnValue(true)
      featureService.setOfflineRoles([RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser])

      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.MidnightTheme).getValue(),
        ),
      ).toBe(FeatureStatus.Entitled)
      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.TokenVaultEditor).getValue(),
        ),
      ).toBe(FeatureStatus.Entitled)
    })

    it('feature status for deprecated feature and no subscription', async () => {
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(false)
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)

      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.DeprecatedFileSafe).getValue(),
        ),
      ).toBe(FeatureStatus.NoUserSubscription)
    })

    it('feature status for deprecated feature with subscription', async () => {
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(true)
      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser])

      expect(
        featureService.getFeatureStatus(
          NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.DeprecatedFileSafe).getValue(),
        ),
      ).toBe(FeatureStatus.Entitled)
    })

    it('has paid subscription', async () => {
      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])

      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(true)

      expect(featureService.hasPaidAnyPartyOnlineOrOfflineSubscription()).toBeFalsy

      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser])

      expect(featureService.hasPaidAnyPartyOnlineOrOfflineSubscription()).toEqual(true)
    })

    it('has paid subscription should be true if offline repo and signed into third party server', async () => {
      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])

      featureService.hasOfflineRepo = jest.fn().mockReturnValue(true)
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(false)

      expect(featureService.hasPaidAnyPartyOnlineOrOfflineSubscription()).toEqual(true)
    })
  })

  describe('migrateFeatureRepoToUserSetting', () => {
    it('should extract key from extension repo url and update user setting', async () => {
      const extensionKey = '129b029707e3470c94a8477a437f9394'
      const extensionRepoItem = new SNFeatureRepo({
        uuid: '456',
        content_type: ContentType.TYPES.ExtensionRepo,
        content: {
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        },
      } as never)

      await featureService.migrateFeatureRepoToUserSetting([extensionRepoItem])
      expect(settingsService.updateSetting).toHaveBeenCalledWith(
        SettingName.create(SettingName.NAMES.ExtensionKey).getValue(),
        extensionKey,
        true,
      )
    })
  })

  describe('sortRolesByHierarchy', () => {
    it('should sort given roles according to role hierarchy', () => {
      const sortedRoles = featureService.rolesBySorting([
        RoleName.NAMES.ProUser,
        RoleName.NAMES.CoreUser,
        RoleName.NAMES.PlusUser,
      ])

      expect(sortedRoles).toStrictEqual([RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser])
    })
  })

  describe('hasMinimumRole', () => {
    it('should be false if core user checks for plus role', async () => {
      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])

      const hasPlusUserRole = featureService.hasMinimumRole(RoleName.NAMES.PlusUser)

      expect(hasPlusUserRole).toBe(false)
    })

    it('should be false if plus user checks for pro role', async () => {
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(true)

      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.PlusUser, RoleName.NAMES.CoreUser])

      const hasProUserRole = featureService.hasMinimumRole(RoleName.NAMES.ProUser)

      expect(hasProUserRole).toBe(false)
    })

    it('should be true if pro user checks for core user', async () => {
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(true)

      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.ProUser, RoleName.NAMES.PlusUser])

      const hasCoreUserRole = featureService.hasMinimumRole(RoleName.NAMES.CoreUser)

      expect(hasCoreUserRole).toBe(true)
    })

    it('should be true if pro user checks for pro user', async () => {
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)
      subscriptions.hasOnlineSubscription = jest.fn().mockReturnValue(true)

      await featureService.updateOnlineRolesWithNewValues([RoleName.NAMES.ProUser, RoleName.NAMES.PlusUser])

      const hasProUserRole = featureService.hasMinimumRole(RoleName.NAMES.ProUser)

      expect(hasProUserRole).toBe(true)
    })
  })
})
