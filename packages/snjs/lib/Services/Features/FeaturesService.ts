import { AccountEvent, UserService } from '../User/UserService'
import { SNApiService } from '../Api/ApiService'
import {
  arraysEqual,
  convertTimestampToMilliseconds,
  removeFromArray,
  Copy,
  lastElement,
  isString,
} from '@standardnotes/utils'
import { ClientDisplayableError, UserFeaturesResponse } from '@standardnotes/responses'
import { ContentType, RoleName } from '@standardnotes/common'
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
import * as Messages from '@Lib/Services/Api/Messages'
import * as Models from '@standardnotes/models'
import {
  AbstractService,
  AlertService,
  ApiServiceEvent,
  ApplicationStage,
  ButtonType,
  DiagnosticInfo,
  FeaturesClientInterface,
  FeaturesEvent,
  FeatureStatus,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  MetaReceivedData,
  OfflineSubscriptionEntitlements,
  SetOfflineFeaturesFunctionResponse,
  StorageKey,
} from '@standardnotes/services'
import { FeatureIdentifier, GetFeatures } from '@standardnotes/features'

type GetOfflineSubscriptionDetailsResponse = OfflineSubscriptionEntitlements | ClientDisplayableError

export class SNFeaturesService
  extends AbstractService<FeaturesEvent>
  implements FeaturesClientInterface, InternalEventHandlerInterface
{
  private deinited = false
  private roles: RoleName[] = []
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
        await this.updateRolesAndFetchFeatures(userUuid, currentRoles)
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

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApiServiceEvent.MetaReceived) {
      if (!this.syncService) {
        this.log('[Features Service] Handling events interrupted. Sync service is not yet initialized.', event)

        return
      }

      /**
       * All user data must be downloaded before we map features. Otherwise, feature mapping
       * may think a component doesn't exist and create a new one, when in reality the component
       * already exists but hasn't been downloaded yet.
       */
      if (!this.syncService.completedOnlineDownloadFirstSync) {
        return
      }

      const { userUuid, userRoles } = event.payload as MetaReceivedData
      await this.updateRolesAndFetchFeatures(
        userUuid,
        userRoles.map((role) => role.name),
      )
    }
  }

  override async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    await super.handleApplicationStage(stage)
    if (stage === ApplicationStage.FullSyncCompleted_13) {
      if (!this.hasOnlineSubscription()) {
        const offlineRepo = this.getOfflineRepo()
        if (offlineRepo) {
          void this.downloadOfflineFeatures(offlineRepo)
        }
      }
    }
  }

  public enableExperimentalFeature(identifier: FeaturesImports.FeatureIdentifier): void {
    const feature = this.getUserFeature(identifier)
    if (!feature) {
      throw Error('Attempting to enable a feature user does not have access to.')
    }

    this.enabledExperimentalFeatures.push(identifier)

    void this.storageService.setValue(StorageKey.ExperimentalFeatures, this.enabledExperimentalFeatures)

    void this.mapRemoteNativeFeaturesToItems([feature])
    void this.notifyEvent(FeaturesEvent.FeaturesUpdated)
  }

  public disableExperimentalFeature(identifier: FeaturesImports.FeatureIdentifier): void {
    const feature = this.getUserFeature(identifier)
    if (!feature) {
      throw Error('Attempting to disable a feature user does not have access to.')
    }

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
      return new ClientDisplayableError(Messages.API_MESSAGE_FAILED_OFFLINE_ACTIVATION)
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
      return new ClientDisplayableError(Messages.API_MESSAGE_FAILED_OFFLINE_ACTIVATION)
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
          await this.settingsService.updateSetting(SettingName.ExtensionKey, userKey, true)
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

  public initializeFromDisk(): void {
    this.roles = this.storageService.getValue<RoleName[]>(StorageKey.UserRoles, undefined, [])

    this.features = this.storageService.getValue(StorageKey.UserFeatures, undefined, [])

    this.enabledExperimentalFeatures = this.storageService.getValue(StorageKey.ExperimentalFeatures, undefined, [])
  }

  public async updateRolesAndFetchFeatures(userUuid: UuidString, roles: RoleName[]): Promise<void> {
    const userRolesChanged = this.haveRolesChanged(roles)

    if (!userRolesChanged && !this.needsInitialFeaturesUpdate) {
      return
    }

    this.needsInitialFeaturesUpdate = false

    await this.setRoles(roles)

    const shouldDownloadRoleBasedFeatures = !this.hasOfflineRepo()

    if (shouldDownloadRoleBasedFeatures) {
      const featuresResponse = await this.apiService.getUserFeatures(userUuid)

      if (!featuresResponse.error && featuresResponse.data && !this.deinited) {
        const features = (featuresResponse as UserFeaturesResponse).data.features
        await this.didDownloadFeatures(features)
      }
    }
  }

  private async setRoles(roles: RoleName[]): Promise<void> {
    this.roles = roles
    if (!arraysEqual(this.roles, roles)) {
      void this.notifyEvent(FeaturesEvent.UserRolesChanged)
    }
    await this.storageService.setValue(StorageKey.UserRoles, this.roles)
  }

  public async didDownloadFeatures(features: FeaturesImports.FeatureDescription[]): Promise<void> {
    features = features
      .concat(GetFeatures().filter((feature) => feature.identifier === FeatureIdentifier.DarkTheme))
      .filter((feature) => !!FeaturesImports.FindNativeFeature(feature.identifier))
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

  public getUserFeature(featureId: FeaturesImports.FeatureIdentifier): FeaturesImports.FeatureDescription | undefined {
    return this.features.find((feature) => feature.identifier === featureId)
  }

  hasOnlineSubscription(): boolean {
    const roles = this.roles
    const unpaidRoles = [RoleName.CoreUser]
    return roles.some((role) => !unpaidRoles.includes(role))
  }

  public hasPaidOnlineOrOfflineSubscription(): boolean {
    return this.hasOnlineSubscription() || this.hasOfflineRepo()
  }

  public rolesBySorting(roles: RoleName[]): RoleName[] {
    return Object.values(RoleName).filter((role) => roles.includes(role))
  }

  public hasMinimumRole(role: RoleName): boolean {
    const sortedAllRoles = Object.values(RoleName)

    const sortedUserRoles = this.rolesBySorting(this.roles)

    const highestUserRoleIndex = sortedAllRoles.indexOf(lastElement(sortedUserRoles) as RoleName)

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

    const isDeprecated = this.isFeatureDeprecated(featureId)
    if (isDeprecated) {
      if (this.hasPaidOnlineOrOfflineSubscription()) {
        return FeatureStatus.Entitled
      } else {
        return FeatureStatus.NoUserSubscription
      }
    }

    const isThirdParty = FeaturesImports.FindNativeFeature(featureId) == undefined
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

    if (this.hasPaidOnlineOrOfflineSubscription()) {
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

    const feature = this.getUserFeature(featureId)
    if (!feature) {
      return FeatureStatus.NotInCurrentPlan
    }

    const expired = feature.expires_at && new Date(feature.expires_at).getTime() < new Date().getTime()
    if (expired) {
      if (!this.roles.includes(feature.role_name as RoleName)) {
        return FeatureStatus.NotInCurrentPlan
      } else {
        return FeatureStatus.InCurrentPlanButExpired
      }
    }

    return FeatureStatus.Entitled
  }

  private haveRolesChanged(roles: RoleName[]): boolean {
    return roles.some((role) => !this.roles.includes(role)) || this.roles.some((role) => !roles.includes(role))
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
      const didChange = await this.mapNativeFeatureToItem(feature, currentItems, itemsToDelete)
      if (didChange) {
        hasChanges = true
      }
    }

    await this.itemManager.setItemsToBeDeleted(itemsToDelete)
    if (hasChanges) {
      void this.syncService.sync()
    }
  }

  private async mapNativeFeatureToItem(
    feature: FeaturesImports.FeatureDescription,
    currentItems: Models.SNComponent[],
    itemsToDelete: Models.SNComponent[],
  ): Promise<boolean> {
    if (!feature.content_type) {
      return false
    }

    if (this.isExperimentalFeature(feature.identifier) && !this.isExperimentalFeatureEnabled(feature.identifier)) {
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
      const hasChange =
        JSON.stringify(feature) !== JSON.stringify(existingItem.package_info) ||
        featureExpiresAt.getTime() !== existingItem.valid_until.getTime()
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
          Messages.API_MESSAGE_UNTRUSTED_EXTENSIONS_WARNING,
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
      void this.alertService.alert(Messages.INVALID_EXTENSION_URL)
    }

    return undefined
  }

  private async performDownloadExternalFeature(url: string): Promise<Models.SNComponent | undefined> {
    const response = await this.apiService.downloadFeatureUrl(url)
    if (response.error) {
      await this.alertService.alert(Messages.API_MESSAGE_FAILED_DOWNLOADING_EXTENSION)
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
      await this.alertService.alert(Messages.API_MESSAGE_FAILED_DOWNLOADING_EXTENSION)
      return
    }

    if (rawFeature.url) {
      for (const nativeFeature of FeaturesImports.GetFeatures()) {
        if (rawFeature.url.includes(nativeFeature.identifier)) {
          await this.alertService.alert(Messages.API_MESSAGE_FAILED_DOWNLOADING_EXTENSION)
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
    ;(this.roles as unknown) = undefined
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
        roles: this.roles,
        features: this.features,
        enabledExperimentalFeatures: this.enabledExperimentalFeatures,
        needsInitialFeaturesUpdate: this.needsInitialFeaturesUpdate,
        completedSuccessfulFeaturesRetrieval: this.completedSuccessfulFeaturesRetrieval,
      },
    })
  }
}
