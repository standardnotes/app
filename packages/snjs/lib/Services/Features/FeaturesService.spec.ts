import { ItemInterface, SNFeatureRepo } from '@standardnotes/models'
import { SNSyncService } from '../Sync/SyncService'
import { SettingName } from '@standardnotes/settings'
import { SNFeaturesService } from '@Lib/Services/Features'
import { ContentType } from '@standardnotes/common'
import { RoleName } from '@standardnotes/domain-core'
import { FeatureDescription, FeatureIdentifier, GetFeatures } from '@standardnotes/features'
import { SNWebSocketsService } from '../Api/WebsocketsService'
import { SNSettingsService } from '../Settings'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { convertTimestampToMilliseconds } from '@standardnotes/utils'
import {
  AlertService,
  ApiServiceInterface,
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
  UserClientInterface,
  UserService,
} from '@standardnotes/services'
import { SNApiService, SNSessionManager } from '../Api'
import { ItemManager } from '../Items'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { SettingsClientInterface } from '../Settings/SettingsClientInterface'

describe('FeaturesService', () => {
  let storageService: StorageServiceInterface
  let itemManager: ItemManagerInterface
  let mutator: MutatorClientInterface
  let subscriptions: SubscriptionManagerInterface
  let apiService: ApiServiceInterface
  let webSocketsService: SNWebSocketsService
  let settingsService: SettingsClientInterface
  let userService: UserClientInterface
  let syncService: SyncServiceInterface
  let alertService: AlertService
  let sessionManager: SessionsClientInterface
  let crypto: PureCryptoInterface
  let roles: string[]
  let features: FeatureDescription[]
  let items: ItemInterface[]
  let now: Date
  let tomorrow_server: number
  let tomorrow_client: number
  let internalEventBus: InternalEventBusInterface

  const createService = () => {
    return new SNFeaturesService(
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
      internalEventBus,
    )
  }

  beforeEach(() => {
    roles = [RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser]

    now = new Date()
    tomorrow_client = now.setDate(now.getDate() + 1)
    tomorrow_server = convertTimestampToMilliseconds(tomorrow_client * 1_000)

    features = [
      {
        ...GetFeatures().find((f) => f.identifier === FeatureIdentifier.MidnightTheme),
        expires_at: tomorrow_server,
      },
      {
        ...GetFeatures().find((f) => f.identifier === FeatureIdentifier.PlusEditor),
        expires_at: tomorrow_server,
      },
    ] as jest.Mocked<FeatureDescription[]>

    items = [] as jest.Mocked<ItemInterface[]>

    storageService = {} as jest.Mocked<DiskStorageService>
    storageService.setValue = jest.fn()
    storageService.getValue = jest.fn()

    apiService = {} as jest.Mocked<SNApiService>
    apiService.addEventObserver = jest.fn()
    apiService.downloadOfflineFeaturesFromRepo = jest.fn().mockReturnValue({
      features,
    })
    apiService.isThirdPartyHostUsed = jest.fn().mockReturnValue(false)

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

    webSocketsService = {} as jest.Mocked<SNWebSocketsService>
    webSocketsService.addEventObserver = jest.fn()

    settingsService = {} as jest.Mocked<SNSettingsService>
    settingsService.updateSetting = jest.fn()

    userService = {} as jest.Mocked<UserService>
    userService.addEventObserver = jest.fn()

    syncService = {} as jest.Mocked<SNSyncService>
    syncService.sync = jest.fn()

    alertService = {} as jest.Mocked<AlertService>
    alertService.confirm = jest.fn().mockReturnValue(true)
    alertService.alert = jest.fn()

    sessionManager = {} as jest.Mocked<SNSessionManager>
    sessionManager.isSignedIntoFirstPartyServer = jest.fn()
    sessionManager.getUser = jest.fn()

    crypto = {} as jest.Mocked<PureCryptoInterface>
    crypto.base64Decode = jest.fn()

    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publish = jest.fn()
  })

  describe('experimental features', () => {
    it('enables/disables an experimental feature', async () => {
      storageService.getValue = jest.fn().mockReturnValue(GetFeatures())

      const featuresService = createService()
      featuresService.getExperimentalFeatures = jest.fn().mockReturnValue([FeatureIdentifier.PlusEditor])
      featuresService.initializeFromDisk()

      featuresService.enableExperimentalFeature(FeatureIdentifier.PlusEditor)

      expect(featuresService.isExperimentalFeatureEnabled(FeatureIdentifier.PlusEditor)).toEqual(true)

      featuresService.disableExperimentalFeature(FeatureIdentifier.PlusEditor)

      expect(featuresService.isExperimentalFeatureEnabled(FeatureIdentifier.PlusEditor)).toEqual(false)
    })
  })

  describe('loadUserRoles()', () => {
    it('retrieves user roles and features from storage', async () => {
      createService().initializeFromDisk()
      expect(storageService.getValue).toHaveBeenCalledWith(StorageKey.UserRoles, undefined, [])
    })
  })

  describe('updateRoles()', () => {
    it('setRoles should notify event if roles changed', async () => {
      storageService.getValue = jest.fn().mockReturnValue(roles)
      const featuresService = createService()
      featuresService.initializeFromDisk()

      const mock = (featuresService['notifyEvent'] = jest.fn())

      const newRoles = [...roles, RoleName.NAMES.PlusUser]
      await featuresService.setOnlineRoles(newRoles)

      expect(mock.mock.calls[0][0]).toEqual(FeaturesEvent.UserRolesChanged)
    })

    it('should notify of subscription purchase', async () => {
      storageService.getValue = jest.fn().mockReturnValue(roles)
      const featuresService = createService()
      featuresService.initializeFromDisk()

      const spy = jest.spyOn(featuresService, 'notifyEvent' as never)

      const newRoles = [...roles, RoleName.NAMES.ProUser]
      await featuresService.updateOnlineRolesWithNewValues(newRoles)

      expect(spy.mock.calls[1][0]).toEqual(FeaturesEvent.DidPurchaseSubscription)
    })

    it('should not notify of subscription purchase on initial roles load after sign in', async () => {
      storageService.getValue = jest.fn().mockReturnValue(roles)
      const featuresService = createService()
      featuresService.initializeFromDisk()
      featuresService['onlineRoles'] = []

      const spy = jest.spyOn(featuresService, 'notifyEvent' as never)

      const newRoles = [...roles, RoleName.NAMES.ProUser]
      await featuresService.updateOnlineRolesWithNewValues(newRoles)

      const triggeredEvents = spy.mock.calls.map((call) => call[0])
      expect(triggeredEvents).not.toContain(FeaturesEvent.DidPurchaseSubscription)
    })

    it('saves new roles to storage and fetches features if a role has been added', async () => {
      const newRoles = [...roles, RoleName.NAMES.PlusUser]

      storageService.getValue = jest.fn().mockReturnValue(roles)
      const featuresService = createService()
      featuresService.initializeFromDisk()

      await featuresService.updateOnlineRolesWithNewValues(newRoles)
      expect(storageService.setValue).toHaveBeenCalledWith(StorageKey.UserRoles, newRoles)
    })

    it('saves new roles to storage and fetches features if a role has been removed', async () => {
      const newRoles = [RoleName.NAMES.CoreUser]

      storageService.getValue = jest.fn().mockReturnValue(roles)
      const featuresService = createService()
      featuresService.initializeFromDisk()
      await featuresService.updateOnlineRolesWithNewValues(newRoles)

      expect(storageService.setValue).toHaveBeenCalledWith(StorageKey.UserRoles, newRoles)
    })

    it('role-based feature status', async () => {
      const featuresService = createService()

      features = [] as jest.Mocked<FeatureDescription[]>

      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser])
      subscriptions.hasValidSubscription = jest.fn().mockReturnValue(true)

      expect(featuresService.getFeatureStatus(FeatureIdentifier.MidnightTheme)).toBe(FeatureStatus.Entitled)
      expect(featuresService.getFeatureStatus(FeatureIdentifier.SuperEditor)).toBe(FeatureStatus.Entitled)
    })

    it('feature status with no paid role', async () => {
      const featuresService = createService()

      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])
      subscriptions.hasValidSubscription = jest.fn().mockReturnValue(false)

      expect(featuresService.getFeatureStatus(FeatureIdentifier.MidnightTheme)).toBe(FeatureStatus.NoUserSubscription)
      expect(featuresService.getFeatureStatus(FeatureIdentifier.PlusEditor)).toBe(FeatureStatus.NoUserSubscription)
      expect(featuresService.getFeatureStatus(FeatureIdentifier.SheetsEditor)).toBe(FeatureStatus.NoUserSubscription)
    })

    it('role-based features while not signed into first party server', async () => {
      const featuresService = createService()

      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(false)

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.ProUser])

      expect(featuresService.getFeatureStatus(FeatureIdentifier.SuperEditor)).toBe(FeatureStatus.NoUserSubscription)
    })

    it('third party feature status', async () => {
      const featuresService = createService()

      itemManager.getDisplayableComponents = jest
        .fn()
        .mockReturnValue([{ identifier: 'third-party-theme' }, { identifier: 'third-party-editor', isExpired: true }])

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])

      expect(featuresService.getFeatureStatus('third-party-theme' as FeatureIdentifier)).toBe(FeatureStatus.Entitled)
      expect(featuresService.getFeatureStatus('third-party-editor' as FeatureIdentifier)).toBe(
        FeatureStatus.InCurrentPlanButExpired,
      )
      expect(featuresService.getFeatureStatus('missing-feature-identifier' as FeatureIdentifier)).toBe(
        FeatureStatus.NoUserSubscription,
      )
    })

    it('feature status should be not entitled if no account or offline repo', async () => {
      const featuresService = createService()

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])

      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(false)

      expect(featuresService.getFeatureStatus(FeatureIdentifier.MidnightTheme)).toBe(FeatureStatus.NoUserSubscription)
      expect(featuresService.getFeatureStatus(FeatureIdentifier.TokenVaultEditor)).toBe(
        FeatureStatus.NoUserSubscription,
      )
    })

    it('feature status for offline subscription', async () => {
      const featuresService = createService()

      featuresService.hasFirstPartyOfflineSubscription = jest.fn().mockReturnValue(true)
      await featuresService.setOfflineRoles([RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser])

      expect(featuresService.getFeatureStatus(FeatureIdentifier.MidnightTheme)).toBe(FeatureStatus.Entitled)
      expect(featuresService.getFeatureStatus(FeatureIdentifier.TokenVaultEditor)).toBe(FeatureStatus.Entitled)
    })

    it('feature status for deprecated feature and no subscription', async () => {
      const featuresService = createService()

      subscriptions.hasValidSubscription = jest.fn().mockReturnValue(false)
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)

      expect(featuresService.getFeatureStatus(FeatureIdentifier.DeprecatedFileSafe as FeatureIdentifier)).toBe(
        FeatureStatus.NoUserSubscription,
      )
    })

    it('feature status for deprecated feature with subscription', async () => {
      const featuresService = createService()

      subscriptions.hasValidSubscription = jest.fn().mockReturnValue(true)
      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser])

      expect(featuresService.getFeatureStatus(FeatureIdentifier.DeprecatedFileSafe as FeatureIdentifier)).toBe(
        FeatureStatus.Entitled,
      )
    })

    it('has paid subscription', async () => {
      const featuresService = createService()

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])

      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)

      expect(featuresService.hasPaidAnyPartyOnlineOrOfflineSubscription()).toBeFalsy

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser])

      expect(featuresService.hasPaidAnyPartyOnlineOrOfflineSubscription()).toEqual(true)
    })

    it('has paid subscription should be true if offline repo and signed into third party server', async () => {
      const featuresService = createService()

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])

      featuresService.hasOfflineRepo = jest.fn().mockReturnValue(true)
      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(false)

      expect(featuresService.hasPaidAnyPartyOnlineOrOfflineSubscription()).toEqual(true)
    })
  })

  describe('migrateFeatureRepoToUserSetting', () => {
    it('should extract key from extension repo url and update user setting', async () => {
      const extensionKey = '129b029707e3470c94a8477a437f9394'
      const extensionRepoItem = new SNFeatureRepo({
        uuid: '456',
        content_type: ContentType.ExtensionRepo,
        content: {
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        },
      } as never)

      const featuresService = createService()
      await featuresService.migrateFeatureRepoToUserSetting([extensionRepoItem])
      expect(settingsService.updateSetting).toHaveBeenCalledWith(
        SettingName.create(SettingName.NAMES.ExtensionKey).getValue(),
        extensionKey,
        true,
      )
    })
  })

  describe('downloadRemoteThirdPartyFeature', () => {
    it('should not allow if identifier matches native identifier', async () => {
      apiService.downloadFeatureUrl = jest.fn().mockReturnValue({
        data: {
          identifier: 'org.standardnotes.bold-editor',
          name: 'Bold Editor',
          content_type: 'SN|Component',
          area: 'editor-editor',
          version: '1.0.0',
          url: 'http://localhost:8005/',
        },
      })

      const installUrl = 'http://example.com'
      crypto.base64Decode = jest.fn().mockReturnValue(installUrl)

      const featuresService = createService()
      const result = await featuresService.downloadRemoteThirdPartyFeature(installUrl)
      expect(result).toBeUndefined()
    })

    it('should not allow if url matches native url', async () => {
      apiService.downloadFeatureUrl = jest.fn().mockReturnValue({
        data: {
          identifier: 'org.foo.bar',
          name: 'Bold Editor',
          content_type: 'SN|Component',
          area: 'editor-editor',
          version: '1.0.0',
          url: 'http://localhost:8005/org.standardnotes.bold-editor/index.html',
        },
      })

      const installUrl = 'http://example.com'
      crypto.base64Decode = jest.fn().mockReturnValue(installUrl)

      const featuresService = createService()
      const result = await featuresService.downloadRemoteThirdPartyFeature(installUrl)
      expect(result).toBeUndefined()
    })
  })

  describe('sortRolesByHierarchy', () => {
    it('should sort given roles according to role hierarchy', () => {
      const featuresService = createService()

      const sortedRoles = featuresService.rolesBySorting([
        RoleName.NAMES.ProUser,
        RoleName.NAMES.CoreUser,
        RoleName.NAMES.PlusUser,
      ])

      expect(sortedRoles).toStrictEqual([RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser])
    })
  })

  describe('hasMinimumRole', () => {
    it('should be false if core user checks for plus role', async () => {
      const featuresService = createService()

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.CoreUser])

      const hasPlusUserRole = featuresService.hasMinimumRole(RoleName.NAMES.PlusUser)

      expect(hasPlusUserRole).toBe(false)
    })

    it('should be false if plus user checks for pro role', async () => {
      const featuresService = createService()

      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)
      subscriptions.hasValidSubscription = jest.fn().mockReturnValue(true)

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.PlusUser, RoleName.NAMES.CoreUser])

      const hasProUserRole = featuresService.hasMinimumRole(RoleName.NAMES.ProUser)

      expect(hasProUserRole).toBe(false)
    })

    it('should be true if pro user checks for core user', async () => {
      const featuresService = createService()

      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)
      subscriptions.hasValidSubscription = jest.fn().mockReturnValue(true)

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.ProUser, RoleName.NAMES.PlusUser])

      const hasCoreUserRole = featuresService.hasMinimumRole(RoleName.NAMES.CoreUser)

      expect(hasCoreUserRole).toBe(true)
    })

    it('should be true if pro user checks for pro user', async () => {
      const featuresService = createService()

      sessionManager.isSignedIntoFirstPartyServer = jest.fn().mockReturnValue(true)
      subscriptions.hasValidSubscription = jest.fn().mockReturnValue(true)

      await featuresService.updateOnlineRolesWithNewValues([RoleName.NAMES.ProUser, RoleName.NAMES.PlusUser])

      const hasProUserRole = featuresService.hasMinimumRole(RoleName.NAMES.ProUser)

      expect(hasProUserRole).toBe(true)
    })
  })
})
