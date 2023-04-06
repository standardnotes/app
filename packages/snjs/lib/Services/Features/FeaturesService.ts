import { SNApiService } from '../Api/ApiService'
import {
  arraysEqual,
  convertTimestampToMilliseconds,
  removeFromArray,
  Copy,
  lastElement,
  isString,
} from '@standardnotes/utils'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { ContentType } from '@standardnotes/common'
import { RoleName } from '@standardnotes/domain-core'
import { FillItemContent, PayloadEmitSource } from '@standardnotes/models'
import { ItemManager } from '../Items/ItemManager'
import { LEGACY_PROD_EXT_ORIGIN, PROD_OFFLINE_FEATURES_URL } from '../../Hosts'
import { SettingName } from '@standardnotes/settings'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SNSessionManager } from '@Lib/Services/Session/SessionManager'
import { SNSettingsService } from '../Settings'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { SNSyncService } from '../Sync/SyncService'
import { SNWebSocketsService, WebSocketsServiceEvent } from '../Api/WebsocketsService'
import { TRUSTED_CUSTOM_EXTENSIONS_HOSTS, TRUSTED_FEATURE_HOSTS } from '@Lib/Hosts'
import { UserRolesChangedEvent } from '@standardnotes/domain-events'
import { UuidString } from '@Lib/Types/UuidString'
import * as FeaturesImports from '@standardnotes/features'
import * as Models from '@standardnotes/models'
import {
  AbstractService,
  AccountEvent,
  AlertService,
  ApiServiceEvent,
  API_MESSAGE_FAILED_DOWNLOADING_EXTENSION,
  API_MESSAGE_FAILED_OFFLINE_ACTIVATION,
  API_MESSAGE_UNTRUSTED_EXTENSIONS_WARNING,
  ApplicationStage,
  ButtonType,
  DiagnosticInfo,
  FeaturesClientInterface,
  FeaturesEvent,
  FeatureStatus,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  INVALID_EXTENSION_URL,
  MetaReceivedData,
  OfflineSubscriptionEntitlements,
  SetOfflineFeaturesFunctionResponse,
  StorageKey,
  UserService,
} from '@standardnotes/services'
import { FeatureIdentifier } from '@standardnotes/features'

type GetOfflineSubscriptionDetailsResponse = OfflineSubscriptionEntitlements | ClientDisplayableError

export class SNFeaturesService
  extends AbstractService<FeaturesEvent>
  implements FeaturesClientInterface, InternalEventHandlerInterface
{
  private deinited = false
  private onlineRoles: string[] = []
  private offlineRoles: string[] = []
  private features: FeaturesImports.FeatureDescription[] = []
  private enabledExperimentalFeatures: FeaturesImports.FeatureIdentifier[] = []
  private removeWebSocketsServiceObserver: () => void
  private removefeatureReposObserver: () => void
  private removeSignInObserver: () => void
  private needsInitialFeaturesUpdate = true
  private completedSuccessfulFeaturesRetrieval = false

  constructor(
    private storageService: DiskStorageService,
    private apiService: SNApiService,
    private itemManager: ItemManager,
    private webSocketsService: SNWebSocketsService,
    private settingsService: SNSettingsService,
    private userService: UserService,
    private syncService: SNSyncService,
    private alertService: AlertService,
    private sessionManager: SNSessionManager,
    private crypto: PureCryptoInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.removeWebSocketsServiceObserver = webSocketsService.addEventObserver(async (eventName, data) => {
      if (eventName === WebSocketsServiceEvent.UserRoleMessageReceived) {
        const {
          payload: { userUuid, currentRoles },
        } = data as UserRolesChangedEvent
        const { didChangeRoles } = await this.updateOnlineRoles(currentRoles)
        await this.fetchFeatures(userUuid, didChangeRoles)
      }
    })

    this.removefeatureReposObserver = this.itemManager.addObserver(
      ContentType.ExtensionRepo,
      async ({ changed, inserted, source }) => {
        const sources = [
          PayloadEmitSource.InitialObserverRegistrationPush,
          PayloadEmitSource.LocalInserted,
          PayloadEmitSource.LocalDatabaseLoaded,
          PayloadEmitSource.RemoteRetrieved,
          PayloadEmitSource.FileImport,
        ]

        if (sources.includes(source)) {
          const items = [...changed, ...inserted] as Models.SNFeatureRepo[]
          if (this.sessionManager.isSignedIntoFirstPartyServer()) {
            await this.migrateFeatureRepoToUserSetting(items)
          } else {
            await this.migrateFeatureRepoToOfflineEntitlements(items)
          }
        }
      },
    )

    this.removeSignInObserver = this.userService.addEventObserver((eventName: AccountEvent) => {
      if (eventName === AccountEvent.SignedInOrRegistered) {
        const featureRepos = this.itemManager.getItems(ContentType.ExtensionRepo) as Models.SNFeatureRepo[]

        if (!this.apiService.isThirdPartyHostUsed()) {
          void this.migrateFeatureRepoToUserSetting(featureRepos)
        }
      }
    })
  }

  public initializeFromDisk(): void {
    this.onlineRoles = this.storageService.getValue<string[]>(StorageKey.UserRoles, undefined, [])

    this.offlineRoles = this.storageService.getValue<string[]>(StorageKey.OfflineUserRoles, undefined, [])

    this.features = this.storageService.getValue(StorageKey.UserFeatures, undefined, [])

    this.enabledExperimentalFeatures = this.storageService.getValue(StorageKey.ExperimentalFeatures, undefined, [])
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApiServiceEvent.MetaReceived) {
      if (!this.syncService) {
        this.log('[Features Service] Handling events interrupted. Sync service is not yet initialized.', event)

        return
      }

      const { userUuid, userRoles } = event.payload as MetaReceivedData
      const { didChangeRoles } = await this.updateOnlineRoles(userRoles.map((role) => role.name))

      /**
       * All user data must be downloaded before we map features. Otherwise, feature mapping
       * may think a component doesn't exist and create a new one, when in reality the component
       * already exists but hasn't been downloaded yet.
       */
      if (!this.syncService.completedOnlineDownloadFirstSync) {
        return
      }

      await this.fetchFeatures(userUuid, didChangeRoles)
    }
  }

  override async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    await super.handleApplicationStage(stage)

    if (stage === ApplicationStage.FullSyncCompleted_13) {
      void this.mapClientControlledFeaturesToItems()

      if (!this.hasFirstPartyOnlineSubscription()) {
        const offlineRepo = this.getOfflineRepo()
        if (offlineRepo) {
          void this.downloadOfflineFeatures(offlineRepo)
        }
      }
    }
  }

  private async mapClientControlledFeaturesToItems() {
    const clientFeatures = FeaturesImports.GetFeatures().filter((feature) => feature.clientControlled)
    const currentItems = this.itemManager.getItems<Models.SNComponent>([ContentType.Component, ContentType.Theme])

    for (const feature of clientFeatures) {
      if (!feature.content_type) {
        continue
      }

      const existingItem = currentItems.find((item) => item.identifier === feature.identifier)
      if (existingItem) {
        const hasChange = JSON.stringify(feature) !== JSON.stringify(existingItem.package_info)
        if (hasChange) {
          await this.itemManager.changeComponent(existingItem, (mutator) => {
            mutator.package_info = feature
          })
        }

        continue
      }

      await this.itemManager.createItem(
        feature.content_type,
        this.componentContentForNativeFeatureDescription(feature),
        true,
      )
    }
  }

  public enableExperimentalFeature(identifier: FeaturesImports.FeatureIdentifier): void {
    const feature = this.getFeatureThatOriginallyCameFromServer(identifier)

    this.enabledExperimentalFeatures.push(identifier)

    void this.storageService.setValue(StorageKey.ExperimentalFeatures, this.enabledExperimentalFeatures)

    if (feature) {
      void this.mapRemoteNativeFeaturesToItems([feature])
    }

    void this.notifyEvent(FeaturesEvent.FeaturesUpdated)
  }

  public disableExperimentalFeature(identifier: FeaturesImports.FeatureIdentifier): void {
    removeFromArray(this.enabledExperimentalFeatures, identifier)

    void this.storageService.setValue(StorageKey.ExperimentalFeatures, this.enabledExperimentalFeatures)

    const component = this.itemManager
      .getItems<Models.SNComponent | Models.SNTheme>([ContentType.Component, ContentType.Theme])
      .find((component) => component.identifier === identifier)
    if (!component) {
      return
    }

    void this.itemManager.setItemToBeDeleted(component).then(() => {
      void this.syncService.sync()
    })
    void this.notifyEvent(FeaturesEvent.FeaturesUpdated)
  }

  public toggleExperimentalFeature(identifier: FeaturesImports.FeatureIdentifier): void {
    if (this.isExperimentalFeatureEnabled(identifier)) {
      this.disableExperimentalFeature(identifier)
    } else {
      this.enableExperimentalFeature(identifier)
    }
  }

  public getExperimentalFeatures(): FeaturesImports.FeatureIdentifier[] {
    return FeaturesImports.ExperimentalFeatures
  }

  public isExperimentalFeature(featureId: FeaturesImports.FeatureIdentifier): boolean {
    return this.getExperimentalFeatures().includes(featureId)
  }

  public getEnabledExperimentalFeatures(): FeaturesImports.FeatureIdentifier[] {
    return this.enabledExperimentalFeatures
  }

  public isExperimentalFeatureEnabled(featureId: FeaturesImports.FeatureIdentifier): boolean {
    return this.enabledExperimentalFeatures.includes(featureId)
  }

  public async setOfflineFeaturesCode(code: string): Promise<SetOfflineFeaturesFunctionResponse> {
    try {
      const activationCodeWithoutSpaces = code.replace(/\s/g, '')
      const decodedData = this.crypto.base64Decode(activationCodeWithoutSpaces)
      const result = this.parseOfflineEntitlementsCode(decodedData)

      if (result instanceof ClientDisplayableError) {
        return result
      }

      const offlineRepo = (await this.itemManager.createItem(
        ContentType.ExtensionRepo,
        FillItemContent({
          offlineFeaturesUrl: result.featuresUrl,
          offlineKey: result.extensionKey,
          migratedToOfflineEntitlements: true,
        } as Models.FeatureRepoContent),
        true,
      )) as Models.SNFeatureRepo
      void this.syncService.sync()
      return this.downloadOfflineFeatures(offlineRepo)
    } catch (err) {
      return new ClientDisplayableError(`${API_MESSAGE_FAILED_OFFLINE_ACTIVATION}, ${err}`)
    }
  }

  private getOfflineRepo(): Models.SNFeatureRepo | undefined {
    const repos = this.itemManager.getItems(ContentType.ExtensionRepo) as Models.SNFeatureRepo[]
    return repos.filter((repo) => repo.migratedToOfflineEntitlements)[0]
  }

  public hasOfflineRepo(): boolean {
    return this.getOfflineRepo() != undefined
  }

  public async deleteOfflineFeatureRepo(): Promise<void> {
    const repo = this.getOfflineRepo()
    if (repo) {
      await this.itemManager.setItemToBeDeleted(repo)
      void this.syncService.sync()
    }
    await this.storageService.removeValue(StorageKey.UserFeatures)
  }

  private parseOfflineEntitlementsCode(code: string): GetOfflineSubscriptionDetailsResponse | ClientDisplayableError {
    try {
      const { featuresUrl, extensionKey } = JSON.parse(code)
      return {
        featuresUrl,
        extensionKey,
      }
    } catch (error) {
      return new ClientDisplayableError(API_MESSAGE_FAILED_OFFLINE_ACTIVATION)
    }
  }

  private async downloadOfflineFeatures(
    repo: Models.SNFeatureRepo,
  ): Promise<SetOfflineFeaturesFunctionResponse | ClientDisplayableError> {
    const result = await this.apiService.downloadOfflineFeaturesFromRepo(repo)

    if (result instanceof ClientDisplayableError) {
      return result
    }

    await this.didDownloadFeatures(result.features)
    await this.setOfflineRoles(result.roles)

    return undefined
  }

  public async migrateFeatureRepoToUserSetting(featureRepos: Models.SNFeatureRepo[] = []): Promise<void> {
    for (const item of featureRepos) {
      if (item.migratedToUserSetting) {
        continue
      }
      if (item.onlineUrl) {
        const repoUrl: string = item.onlineUrl
        const userKeyMatch = repoUrl.match(/\w{32,64}/)
        if (userKeyMatch && userKeyMatch.length > 0) {
          const userKey = userKeyMatch[0]
          await this.settingsService.updateSetting(
            SettingName.create(SettingName.NAMES.ExtensionKey).getValue(),
            userKey,
            true,
          )
          await this.itemManager.changeFeatureRepo(item, (m) => {
            m.migratedToUserSetting = true
          })
        }
      }
    }
  }

  public async migrateFeatureRepoToOfflineEntitlements(featureRepos: Models.SNFeatureRepo[] = []): Promise<void> {
    for (const item of featureRepos) {
      if (item.migratedToOfflineEntitlements) {
        continue
      }

      if (item.onlineUrl) {
        const repoUrl = item.onlineUrl
        const { origin } = new URL(repoUrl)

        if (!origin.includes(LEGACY_PROD_EXT_ORIGIN)) {
          continue
        }

        const userKeyMatch = repoUrl.match(/\w{32,64}/)
        if (userKeyMatch && userKeyMatch.length > 0) {
          const userKey = userKeyMatch[0]
          const updatedRepo = await this.itemManager.changeFeatureRepo(item, (m) => {
            m.offlineFeaturesUrl = PROD_OFFLINE_FEATURES_URL
            m.offlineKey = userKey
            m.migratedToOfflineEntitlements = true
          })
          await this.downloadOfflineFeatures(updatedRepo)
        }
      }
    }
  }

  hasFirstPartyOnlineSubscription(): boolean {
    return this.sessionManager.isSignedIntoFirstPartyServer() && this.onlineRolesIncludePaidSubscription()
  }

  hasFirstPartySubscription(): boolean {
    if (this.hasFirstPartyOnlineSubscription()) {
      return true
    }

    const offlineRepo = this.getOfflineRepo()
    if (!offlineRepo || !offlineRepo.content.offlineFeaturesUrl) {
      return false
    }

    const hasFirstPartyOfflineSubscription = offlineRepo.content.offlineFeaturesUrl === PROD_OFFLINE_FEATURES_URL
    return hasFirstPartyOfflineSubscription || new URL(offlineRepo.content.offlineFeaturesUrl).hostname === 'localhost'
  }

  async updateOnlineRoles(roles: string[]): Promise<{
    didChangeRoles: boolean
  }> {
    const previousRoles = this.onlineRoles

    const userRolesChanged =
      roles.some((role) => !this.onlineRoles.includes(role)) || this.onlineRoles.some((role) => !roles.includes(role))

    const isInitialLoadRolesChange = previousRoles.length === 0 && userRolesChanged

    if (!userRolesChanged && !this.needsInitialFeaturesUpdate) {
      return {
        didChangeRoles: false,
      }
    }

    if (userRolesChanged && !isInitialLoadRolesChange) {
      if (this.onlineRolesIncludePaidSubscription()) {
        await this.notifyEvent(FeaturesEvent.DidPurchaseSubscription)
      }
    }

    await this.setOnlineRoles(roles)

    return {
      didChangeRoles: true,
    }
  }

  async fetchFeatures(userUuid: UuidString, didChangeRoles: boolean): Promise<void> {
    if (!didChangeRoles && !this.needsInitialFeaturesUpdate) {
      return
    }

    this.needsInitialFeaturesUpdate = false

    const shouldDownloadRoleBasedFeatures = !this.hasOfflineRepo()

    if (shouldDownloadRoleBasedFeatures) {
      const featuresResponse = await this.apiService.getUserFeatures(userUuid)

      if (!isErrorResponse(featuresResponse) && !this.deinited) {
        const features = featuresResponse.data.features
        await this.didDownloadFeatures(features)
      }
    }
  }

  async setOnlineRoles(roles: string[]): Promise<void> {
    const rolesChanged = !arraysEqual(this.onlineRoles, roles)

    this.onlineRoles = roles

    if (rolesChanged) {
      void this.notifyEvent(FeaturesEvent.UserRolesChanged)
    }

    this.storageService.setValue(StorageKey.UserRoles, this.onlineRoles)
  }

  async setOfflineRoles(roles: string[]): Promise<void> {
    const rolesChanged = !arraysEqual(this.offlineRoles, roles)

    this.offlineRoles = roles

    if (rolesChanged) {
      void this.notifyEvent(FeaturesEvent.UserRolesChanged)
    }

    this.storageService.setValue(StorageKey.OfflineUserRoles, this.offlineRoles)
  }

  public async didDownloadFeatures(features: FeaturesImports.FeatureDescription[]): Promise<void> {
    features = features
      .filter((feature) => {
        const nativeFeature = FeaturesImports.FindNativeFeature(feature.identifier)
        return nativeFeature != undefined && !nativeFeature.clientControlled
      })
      .map((feature) => this.mapRemoteNativeFeatureToStaticFeature(feature))

    this.features = features
    this.completedSuccessfulFeaturesRetrieval = true
    void this.notifyEvent(FeaturesEvent.FeaturesUpdated)
    void this.storageService.setValue(StorageKey.UserFeatures, this.features)

    await this.mapRemoteNativeFeaturesToItems(features)
  }

  public isThirdPartyFeature(identifier: string): boolean {
    const isNativeFeature = !!FeaturesImports.FindNativeFeature(identifier as FeaturesImports.FeatureIdentifier)
    return !isNativeFeature
  }

  private mapRemoteNativeFeatureToStaticFeature(
    remoteFeature: FeaturesImports.FeatureDescription,
  ): FeaturesImports.FeatureDescription {
    const remoteFields: (keyof FeaturesImports.FeatureDescription)[] = [
      'expires_at',
      'role_name',
      'no_expire',
      'permission_name',
    ]

    const nativeFeature = FeaturesImports.FindNativeFeature(remoteFeature.identifier)
    if (!nativeFeature) {
      throw Error(`Attempting to map remote native to unfound static feature ${remoteFeature.identifier}`)
    }

    const nativeFeatureCopy = Copy(nativeFeature) as FeaturesImports.FeatureDescription

    for (const field of remoteFields) {
      nativeFeatureCopy[field] = remoteFeature[field] as never
    }

    if (nativeFeatureCopy.expires_at) {
      nativeFeatureCopy.expires_at = convertTimestampToMilliseconds(nativeFeatureCopy.expires_at)
    }

    return nativeFeatureCopy
  }

  public getFeatureThatOriginallyCameFromServer(
    featureId: FeaturesImports.FeatureIdentifier,
  ): FeaturesImports.FeatureDescription | undefined {
    return this.features.find((feature) => feature.identifier === featureId)
  }

  onlineRolesIncludePaidSubscription(): boolean {
    const unpaidRoles = [RoleName.NAMES.CoreUser]
    return this.onlineRoles.some((role) => !unpaidRoles.includes(role))
  }

  hasPaidAnyPartyOnlineOrOfflineSubscription(): boolean {
    return this.onlineRolesIncludePaidSubscription() || this.hasOfflineRepo()
  }

  public rolesBySorting(roles: string[]): string[] {
    return Object.values(RoleName.NAMES).filter((role) => roles.includes(role))
  }

  public hasMinimumRole(role: string): boolean {
    const sortedAllRoles = Object.values(RoleName.NAMES)

    const sortedUserRoles = this.rolesBySorting(this.rolesToUseForFeatureCheck())

    const highestUserRoleIndex = sortedAllRoles.indexOf(lastElement(sortedUserRoles) as string)

    const indexOfRoleToCheck = sortedAllRoles.indexOf(role)

    return indexOfRoleToCheck <= highestUserRoleIndex
  }

  public isFeatureDeprecated(featureId: FeaturesImports.FeatureIdentifier): boolean {
    return FeaturesImports.FindNativeFeature(featureId)?.deprecated === true
  }

  public isFreeFeature(featureId: FeaturesImports.FeatureIdentifier) {
    return [FeatureIdentifier.DarkTheme].includes(featureId)
  }

  public getFeatureStatus(featureId: FeaturesImports.FeatureIdentifier): FeatureStatus {
    if (this.isFreeFeature(featureId)) {
      return FeatureStatus.Entitled
    }

    const nativeFeature = FeaturesImports.FindNativeFeature(featureId)

    const isDeprecated = this.isFeatureDeprecated(featureId)
    if (isDeprecated) {
      if (this.hasPaidAnyPartyOnlineOrOfflineSubscription()) {
        return FeatureStatus.Entitled
      } else {
        return FeatureStatus.NoUserSubscription
      }
    }

    const isThirdParty = nativeFeature == undefined
    if (isThirdParty) {
      const component = this.itemManager
        .getDisplayableComponents()
        .find((candidate) => candidate.identifier === featureId)
      if (!component) {
        return FeatureStatus.NoUserSubscription
      }
      if (component.isExpired) {
        return FeatureStatus.InCurrentPlanButExpired
      }
      return FeatureStatus.Entitled
    }

    if (this.hasPaidAnyPartyOnlineOrOfflineSubscription()) {
      if (!this.completedSuccessfulFeaturesRetrieval) {
        const hasCachedFeatures = this.features.length > 0
        const temporarilyAllowUntilServerUpdates = !hasCachedFeatures
        if (temporarilyAllowUntilServerUpdates) {
          return FeatureStatus.Entitled
        }
      }
    } else {
      return FeatureStatus.NoUserSubscription
    }

    if (nativeFeature) {
      if (!this.hasFirstPartySubscription()) {
        return FeatureStatus.NotInCurrentPlan
      }

      const roles = this.rolesToUseForFeatureCheck()
      if (nativeFeature.availableInRoles) {
        const hasRole = roles.some((role) => {
          return nativeFeature.availableInRoles?.includes(role)
        })
        if (!hasRole) {
          return FeatureStatus.NotInCurrentPlan
        }
      }
    }

    return FeatureStatus.Entitled
  }

  private rolesToUseForFeatureCheck(): string[] {
    return this.hasFirstPartyOnlineSubscription() ? this.onlineRoles : this.offlineRoles
  }

  private componentContentForNativeFeatureDescription(feature: FeaturesImports.FeatureDescription): Models.ItemContent {
    const componentContent: Partial<Models.ComponentContent> = {
      area: feature.area,
      name: feature.name,
      package_info: feature,
      valid_until: new Date(feature.expires_at || 0),
    }
    return FillItemContent(componentContent)
  }

  private async mapRemoteNativeFeaturesToItems(features: FeaturesImports.FeatureDescription[]): Promise<void> {
    const currentItems = this.itemManager.getItems<Models.SNComponent>([ContentType.Component, ContentType.Theme])
    const itemsToDelete: Models.SNComponent[] = []
    let hasChanges = false

    for (const feature of features) {
      const didChange = await this.mapRemoteNativeFeatureToItem(feature, currentItems, itemsToDelete)
      if (didChange) {
        hasChanges = true
      }
    }

    await this.itemManager.setItemsToBeDeleted(itemsToDelete)

    if (hasChanges) {
      void this.syncService.sync()
    }
  }

  private async mapRemoteNativeFeatureToItem(
    feature: FeaturesImports.FeatureDescription,
    currentItems: Models.SNComponent[],
    itemsToDelete: Models.SNComponent[],
  ): Promise<boolean> {
    if (feature.clientControlled) {
      throw new Error('Attempted to map client controlled feature as remote item')
    }

    if (!feature.content_type) {
      return false
    }

    const isDisabledExperimentalFeature =
      this.isExperimentalFeature(feature.identifier) && !this.isExperimentalFeatureEnabled(feature.identifier)

    if (isDisabledExperimentalFeature) {
      return false
    }

    let hasChanges = false

    const now = new Date()
    const expired = this.isFreeFeature(feature.identifier)
      ? false
      : new Date(feature.expires_at || 0).getTime() < now.getTime()

    const existingItem = currentItems.find((item) => {
      if (item.content.package_info) {
        const itemIdentifier = item.content.package_info.identifier
        return itemIdentifier === feature.identifier
      }

      return false
    })

    if (feature.deprecated && !existingItem) {
      return false
    }

    let resultingItem: Models.SNComponent | undefined = existingItem

    if (existingItem) {
      const featureExpiresAt = new Date(feature.expires_at || 0)
      const hasChangeInPackageInfo = JSON.stringify(feature) !== JSON.stringify(existingItem.package_info)
      const hasChangeInExpiration = featureExpiresAt.getTime() !== existingItem.valid_until.getTime()

      const hasChange = hasChangeInPackageInfo || hasChangeInExpiration

      if (hasChange) {
        resultingItem = await this.itemManager.changeComponent(existingItem, (mutator) => {
          mutator.package_info = feature
          mutator.valid_until = featureExpiresAt
        })

        hasChanges = true
      } else {
        resultingItem = existingItem
      }
    } else if (!expired || feature.content_type === ContentType.Component) {
      resultingItem = (await this.itemManager.createItem(
        feature.content_type,
        this.componentContentForNativeFeatureDescription(feature),
        true,
      )) as Models.SNComponent
      hasChanges = true
    }

    if (expired && resultingItem) {
      if (feature.content_type !== ContentType.Component) {
        itemsToDelete.push(resultingItem)
        hasChanges = true
      }
    }

    return hasChanges
  }

  public async downloadExternalFeature(urlOrCode: string): Promise<Models.SNComponent | undefined> {
    let url = urlOrCode
    try {
      url = this.crypto.base64Decode(urlOrCode)
      // eslint-disable-next-line no-empty
    } catch (err) {}

    try {
      const trustedCustomExtensionsUrls = [...TRUSTED_FEATURE_HOSTS, ...TRUSTED_CUSTOM_EXTENSIONS_HOSTS]
      const { host } = new URL(url)
      if (!trustedCustomExtensionsUrls.includes(host)) {
        const didConfirm = await this.alertService.confirm(
          API_MESSAGE_UNTRUSTED_EXTENSIONS_WARNING,
          'Install extension from an untrusted source?',
          'Proceed to install',
          ButtonType.Danger,
          'Cancel',
        )
        if (didConfirm) {
          return this.performDownloadExternalFeature(url)
        }
      } else {
        return this.performDownloadExternalFeature(url)
      }
    } catch (err) {
      void this.alertService.alert(INVALID_EXTENSION_URL)
    }

    return undefined
  }

  private async performDownloadExternalFeature(url: string): Promise<Models.SNComponent | undefined> {
    const response = await this.apiService.downloadFeatureUrl(url)
    if (response.data?.error) {
      await this.alertService.alert(API_MESSAGE_FAILED_DOWNLOADING_EXTENSION)
      return undefined
    }

    let rawFeature = response.data as FeaturesImports.ThirdPartyFeatureDescription

    if (isString(rawFeature)) {
      try {
        rawFeature = JSON.parse(rawFeature)
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }

    if (!rawFeature.content_type) {
      return
    }

    const isValidContentType = [
      ContentType.Component,
      ContentType.Theme,
      ContentType.ActionsExtension,
      ContentType.ExtensionRepo,
    ].includes(rawFeature.content_type)

    if (!isValidContentType) {
      return
    }

    const nativeFeature = FeaturesImports.FindNativeFeature(rawFeature.identifier)
    if (nativeFeature) {
      await this.alertService.alert(API_MESSAGE_FAILED_DOWNLOADING_EXTENSION)
      return
    }

    if (rawFeature.url) {
      for (const nativeFeature of FeaturesImports.GetFeatures()) {
        if (rawFeature.url.includes(nativeFeature.identifier)) {
          await this.alertService.alert(API_MESSAGE_FAILED_DOWNLOADING_EXTENSION)
          return
        }
      }
    }

    const content = FillItemContent({
      area: rawFeature.area,
      name: rawFeature.name,
      package_info: rawFeature,
      valid_until: new Date(rawFeature.expires_at || 0),
      hosted_url: rawFeature.url,
    } as Partial<Models.ComponentContent>)

    const component = this.itemManager.createTemplateItem(rawFeature.content_type, content) as Models.SNComponent

    return component
  }

  override deinit(): void {
    super.deinit()
    this.removeSignInObserver()
    ;(this.removeSignInObserver as unknown) = undefined
    this.removeWebSocketsServiceObserver()
    ;(this.removeWebSocketsServiceObserver as unknown) = undefined
    this.removefeatureReposObserver()
    ;(this.removefeatureReposObserver as unknown) = undefined
    ;(this.onlineRoles as unknown) = undefined
    ;(this.offlineRoles as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    ;(this.apiService as unknown) = undefined
    ;(this.itemManager as unknown) = undefined
    ;(this.webSocketsService as unknown) = undefined
    ;(this.settingsService as unknown) = undefined
    ;(this.userService as unknown) = undefined
    ;(this.syncService as unknown) = undefined
    ;(this.alertService as unknown) = undefined
    ;(this.sessionManager as unknown) = undefined
    ;(this.crypto as unknown) = undefined
    this.deinited = true
  }

  override getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    return Promise.resolve({
      features: {
        roles: this.onlineRoles,
        features: this.features,
        enabledExperimentalFeatures: this.enabledExperimentalFeatures,
        needsInitialFeaturesUpdate: this.needsInitialFeaturesUpdate,
        completedSuccessfulFeaturesRetrieval: this.completedSuccessfulFeaturesRetrieval,
      },
    })
  }
}
