import { MigrateFeatureRepoToUserSettingUseCase } from './UseCase/MigrateFeatureRepoToUserSetting'
import { SNApiService } from '../Api/ApiService'
import { arraysEqual, removeFromArray, lastElement } from '@standardnotes/utils'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ContentType } from '@standardnotes/common'
import { RoleName } from '@standardnotes/domain-core'
import { ItemManager } from '../Items/ItemManager'
import { PROD_OFFLINE_FEATURES_URL } from '../../Hosts'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SNSessionManager } from '@Lib/Services/Session/SessionManager'
import { SNSettingsService } from '../Settings'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { SNSyncService } from '../Sync/SyncService'
import { SNWebSocketsService, WebSocketsServiceEvent } from '../Api/WebsocketsService'
import { TRUSTED_CUSTOM_EXTENSIONS_HOSTS, TRUSTED_FEATURE_HOSTS } from '@Lib/Hosts'
import { UserRolesChangedEvent } from '@standardnotes/domain-events'
import { ExperimentalFeatures, FindNativeFeature, FeatureIdentifier } from '@standardnotes/features'
import {
  SNFeatureRepo,
  SNComponent,
  SNTheme,
  FeatureRepoContent,
  FillItemContent,
  PayloadEmitSource,
  ComponentInterface,
} from '@standardnotes/models'
import {
  AbstractService,
  AccountEvent,
  AlertService,
  ApiServiceEvent,
  API_MESSAGE_FAILED_OFFLINE_ACTIVATION,
  API_MESSAGE_UNTRUSTED_EXTENSIONS_WARNING,
  ApplicationStage,
  ButtonType,
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
  MutatorClientInterface,
} from '@standardnotes/services'

import { DownloadRemoteThirdPartyFeatureUseCase } from './UseCase/DownloadRemoteThirdPartyFeature'
import { MigrateFeatureRepoToOfflineEntitlementsUseCase } from './UseCase/MigrateFeatureRepoToOfflineEntitlements'
import { GetFeatureStatusUseCase } from './UseCase/GetFeatureStatus'

type GetOfflineSubscriptionDetailsResponse = OfflineSubscriptionEntitlements | ClientDisplayableError

export class SNFeaturesService
  extends AbstractService<FeaturesEvent>
  implements FeaturesClientInterface, InternalEventHandlerInterface
{
  private onlineRoles: string[] = []
  private offlineRoles: string[] = []
  private enabledExperimentalFeatures: FeatureIdentifier[] = []
  private removeWebSocketsServiceObserver: () => void
  private removefeatureReposObserver: () => void
  private removeSignInObserver: () => void
  private needsInitialFeaturesUpdate = true

  private getFeatureStatusUseCase = new GetFeatureStatusUseCase(this.items)

  constructor(
    private storage: DiskStorageService,
    private api: SNApiService,
    private items: ItemManager,
    private mutator: MutatorClientInterface,
    sockets: SNWebSocketsService,
    private settings: SNSettingsService,
    private user: UserService,
    private sync: SNSyncService,
    private alerts: AlertService,
    private sessions: SNSessionManager,
    private crypto: PureCryptoInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.removeWebSocketsServiceObserver = sockets.addEventObserver(async (eventName, data) => {
      if (eventName === WebSocketsServiceEvent.UserRoleMessageReceived) {
        const {
          payload: { currentRoles },
        } = data as UserRolesChangedEvent
        await this.updateOnlineRoles(currentRoles)
      }
    })

    this.removefeatureReposObserver = this.items.addObserver(
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
          const items = [...changed, ...inserted] as SNFeatureRepo[]
          if (this.sessions.isSignedIntoFirstPartyServer()) {
            await this.migrateFeatureRepoToUserSetting(items)
          } else {
            await this.migrateFeatureRepoToOfflineEntitlements(items)
          }
        }
      },
    )

    this.removeSignInObserver = this.user.addEventObserver((eventName: AccountEvent) => {
      if (eventName === AccountEvent.SignedInOrRegistered) {
        const featureRepos = this.items.getItems(ContentType.ExtensionRepo) as SNFeatureRepo[]

        if (!this.api.isThirdPartyHostUsed()) {
          void this.migrateFeatureRepoToUserSetting(featureRepos)
        }
      }
    })
  }

  public initializeFromDisk(): void {
    this.onlineRoles = this.storage.getValue<string[]>(StorageKey.UserRoles, undefined, [])

    this.offlineRoles = this.storage.getValue<string[]>(StorageKey.OfflineUserRoles, undefined, [])

    this.enabledExperimentalFeatures = this.storage.getValue(StorageKey.ExperimentalFeatures, undefined, [])
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApiServiceEvent.MetaReceived) {
      if (!this.sync) {
        this.log('[Features Service] Handling events interrupted. Sync service is not yet initialized.', event)

        return
      }

      const { userRoles } = event.payload as MetaReceivedData
      await this.updateOnlineRoles(userRoles.map((role) => role.name))
    }
  }

  override async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    await super.handleApplicationStage(stage)

    if (stage === ApplicationStage.FullSyncCompleted_13) {
      if (!this.hasFirstPartyOnlineSubscription()) {
        const offlineRepo = this.getOfflineRepo()
        if (offlineRepo) {
          void this.downloadOfflineEntitlements(offlineRepo)
        }
      }
    }
  }

  public enableExperimentalFeature(identifier: FeatureIdentifier): void {
    this.enabledExperimentalFeatures.push(identifier)

    void this.storage.setValue(StorageKey.ExperimentalFeatures, this.enabledExperimentalFeatures)

    void this.notifyEvent(FeaturesEvent.FeaturesUpdated)
  }

  public disableExperimentalFeature(identifier: FeatureIdentifier): void {
    removeFromArray(this.enabledExperimentalFeatures, identifier)

    void this.storage.setValue(StorageKey.ExperimentalFeatures, this.enabledExperimentalFeatures)

    const component = this.items
      .getItems<SNComponent | SNTheme>([ContentType.Component, ContentType.Theme])
      .find((component) => component.identifier === identifier)
    if (!component) {
      return
    }

    void this.mutator.setItemToBeDeleted(component).then(() => {
      void this.sync.sync()
    })
    void this.notifyEvent(FeaturesEvent.FeaturesUpdated)
  }

  public toggleExperimentalFeature(identifier: FeatureIdentifier): void {
    if (this.isExperimentalFeatureEnabled(identifier)) {
      this.disableExperimentalFeature(identifier)
    } else {
      this.enableExperimentalFeature(identifier)
    }
  }

  public getExperimentalFeatures(): FeatureIdentifier[] {
    return ExperimentalFeatures
  }

  public isExperimentalFeature(featureId: FeatureIdentifier): boolean {
    return this.getExperimentalFeatures().includes(featureId)
  }

  public getEnabledExperimentalFeatures(): FeatureIdentifier[] {
    return this.enabledExperimentalFeatures
  }

  public isExperimentalFeatureEnabled(featureId: FeatureIdentifier): boolean {
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

      const offlineRepo = (await this.mutator.createItem(
        ContentType.ExtensionRepo,
        FillItemContent({
          offlineFeaturesUrl: result.featuresUrl,
          offlineKey: result.extensionKey,
          migratedToOfflineEntitlements: true,
        } as FeatureRepoContent),
        true,
      )) as SNFeatureRepo
      void this.sync.sync()
      return this.downloadOfflineEntitlements(offlineRepo)
    } catch (err) {
      return new ClientDisplayableError(`${API_MESSAGE_FAILED_OFFLINE_ACTIVATION}, ${err}`)
    }
  }

  private getOfflineRepo(): SNFeatureRepo | undefined {
    const repos = this.items.getItems(ContentType.ExtensionRepo) as SNFeatureRepo[]
    return repos.filter((repo) => repo.migratedToOfflineEntitlements)[0]
  }

  public hasOfflineRepo(): boolean {
    return this.getOfflineRepo() != undefined
  }

  public async deleteOfflineFeatureRepo(): Promise<void> {
    const repo = this.getOfflineRepo()

    if (repo) {
      await this.mutator.setItemToBeDeleted(repo)
      void this.sync.sync()
    }
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

  private async downloadOfflineEntitlements(repo: SNFeatureRepo): Promise<SetOfflineFeaturesFunctionResponse> {
    const result = await this.api.downloadOfflineFeaturesFromRepo(repo)

    if (result instanceof ClientDisplayableError) {
      return result
    }

    await this.setOfflineRoles(result.roles)
  }

  public async migrateFeatureRepoToUserSetting(featureRepos: SNFeatureRepo[] = []): Promise<void> {
    const usecase = new MigrateFeatureRepoToUserSettingUseCase(this.mutator, this.settings)
    await usecase.execute(featureRepos)
  }

  public async migrateFeatureRepoToOfflineEntitlements(featureRepos: SNFeatureRepo[] = []): Promise<void> {
    const usecase = new MigrateFeatureRepoToOfflineEntitlementsUseCase(this.mutator)
    const updatedRepos = await usecase.execute(featureRepos)

    if (updatedRepos.length > 0) {
      await this.downloadOfflineEntitlements(updatedRepos[0])
    }
  }

  hasFirstPartyOnlineSubscription(): boolean {
    return this.sessions.isSignedIntoFirstPartyServer() && this.onlineRolesIncludePaidSubscription()
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

    await this.setOnlineRoles(roles)

    if (userRolesChanged && !isInitialLoadRolesChange) {
      if (this.onlineRolesIncludePaidSubscription()) {
        await this.notifyEvent(FeaturesEvent.DidPurchaseSubscription)
      }
    }

    return {
      didChangeRoles: true,
    }
  }

  async setOnlineRoles(roles: string[]): Promise<void> {
    const rolesChanged = !arraysEqual(this.onlineRoles, roles)

    this.onlineRoles = roles

    if (rolesChanged) {
      void this.notifyEvent(FeaturesEvent.UserRolesChanged)
    }

    this.storage.setValue(StorageKey.UserRoles, this.onlineRoles)
  }

  async setOfflineRoles(roles: string[]): Promise<void> {
    const rolesChanged = !arraysEqual(this.offlineRoles, roles)

    this.offlineRoles = roles

    if (rolesChanged) {
      void this.notifyEvent(FeaturesEvent.UserRolesChanged)
    }

    this.storage.setValue(StorageKey.OfflineUserRoles, this.offlineRoles)
  }

  public isThirdPartyFeature(identifier: string): boolean {
    const isNativeFeature = !!FindNativeFeature(identifier as FeatureIdentifier)
    return !isNativeFeature
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

  public getFeatureStatus(featureId: FeatureIdentifier): FeatureStatus {
    return this.getFeatureStatusUseCase.execute({
      featureId,
      hasPaidAnyPartyOnlineOrOfflineSubscription: this.hasPaidAnyPartyOnlineOrOfflineSubscription(),
      roles: this.rolesToUseForFeatureCheck(),
      hasFirstPartySubscription: this.hasFirstPartySubscription(),
    })
  }

  private rolesToUseForFeatureCheck(): string[] {
    return this.hasFirstPartyOnlineSubscription() ? this.onlineRoles : this.offlineRoles
  }

  public async downloadRemoteThirdPartyFeature(urlOrCode: string): Promise<ComponentInterface | undefined> {
    let url = urlOrCode
    try {
      url = this.crypto.base64Decode(urlOrCode)
    } catch (err) {
      void err
    }

    try {
      const trustedCustomExtensionsUrls = [...TRUSTED_FEATURE_HOSTS, ...TRUSTED_CUSTOM_EXTENSIONS_HOSTS]
      const { host } = new URL(url)

      const usecase = new DownloadRemoteThirdPartyFeatureUseCase(this.api, this.items, this.alerts)

      if (!trustedCustomExtensionsUrls.includes(host)) {
        const didConfirm = await this.alerts.confirm(
          API_MESSAGE_UNTRUSTED_EXTENSIONS_WARNING,
          'Install extension from an untrusted source?',
          'Proceed to install',
          ButtonType.Danger,
          'Cancel',
        )
        if (didConfirm) {
          return usecase.execute(url)
        }
      } else {
        return usecase.execute(url)
      }
    } catch (err) {
      void this.alerts.alert(INVALID_EXTENSION_URL)
    }

    return undefined
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
    ;(this.storage as unknown) = undefined
    ;(this.api as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this.settings as unknown) = undefined
    ;(this.user as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.alerts as unknown) = undefined
    ;(this.sessions as unknown) = undefined
    ;(this.crypto as unknown) = undefined
  }
}
