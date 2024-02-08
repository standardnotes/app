import { MigrateFeatureRepoToUserSettingUseCase } from './UseCase/MigrateFeatureRepoToUserSetting'
import { arraysEqual, removeFromArray, lastElement, LoggerInterface } from '@standardnotes/utils'
import { ClientDisplayableError } from '@standardnotes/responses'
import { RoleName, ContentType, Uuid } from '@standardnotes/domain-core'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { UserRolesChangedEvent } from '@standardnotes/domain-events'
import { ExperimentalFeatures, FindNativeFeature, NativeFeatureIdentifier } from '@standardnotes/features'
import {
  SNFeatureRepo,
  FeatureRepoContent,
  FillItemContent,
  PayloadEmitSource,
  ComponentInterface,
  DecryptedItemInterface,
} from '@standardnotes/models'
import {
  AbstractService,
  AlertService,
  ApiServiceEvent,
  API_MESSAGE_FAILED_OFFLINE_ACTIVATION,
  ApplicationStage,
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
  MutatorClientInterface,
  StorageServiceInterface,
  LegacyApiServiceInterface,
  ItemManagerInterface,
  SyncServiceInterface,
  SessionsClientInterface,
  UserServiceInterface,
  SubscriptionManagerInterface,
  AccountEvent,
  SubscriptionManagerEvent,
  ApplicationEvent,
  ApplicationStageChangedEventPayload,
  IsApplicationUsingThirdPartyHost,
  WebSocketsServiceEvent,
  WebSocketsService,
} from '@standardnotes/services'

import { MigrateFeatureRepoToOfflineEntitlementsUseCase } from './UseCase/MigrateFeatureRepoToOfflineEntitlements'
import { GetFeatureStatusUseCase } from './UseCase/GetFeatureStatus'
import { SettingsClientInterface } from '../Settings/SettingsClientInterface'

export class FeaturesService
  extends AbstractService<FeaturesEvent>
  implements FeaturesClientInterface, InternalEventHandlerInterface
{
  private onlineRoles: string[] = []
  private offlineRoles: string[] = []
  private enabledExperimentalFeatures: string[] = []

  private getFeatureStatusUseCase = new GetFeatureStatusUseCase(this.items)

  private readonly PROD_OFFLINE_FEATURES_URL = 'https://api.standardnotes.com/v1/offline/features'

  constructor(
    private storage: StorageServiceInterface,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private subscriptions: SubscriptionManagerInterface,
    private api: LegacyApiServiceInterface,
    sockets: WebSocketsService,
    private settings: SettingsClientInterface,
    private user: UserServiceInterface,
    private sync: SyncServiceInterface,
    private alerts: AlertService,
    private sessions: SessionsClientInterface,
    private crypto: PureCryptoInterface,
    private logger: LoggerInterface,
    private isApplicationUsingThirdPartyHostUseCase: IsApplicationUsingThirdPartyHost,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.eventDisposers.push(
      sockets.addEventObserver(async (eventName, data) => {
        if (eventName === WebSocketsServiceEvent.UserRoleMessageReceived) {
          const currentRoles = (data as UserRolesChangedEvent).payload.currentRoles
          void this.updateOnlineRolesWithNewValues(currentRoles)
        }
      }),
    )

    this.eventDisposers.push(
      subscriptions.addEventObserver((event) => {
        if (event === SubscriptionManagerEvent.DidFetchSubscription) {
          void this.notifyEvent(FeaturesEvent.FeaturesAvailabilityChanged)
        }
      }),
    )

    this.eventDisposers.push(
      this.items.addObserver(ContentType.TYPES.ExtensionRepo, async ({ changed, inserted, source }) => {
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
            void this.migrateFeatureRepoToUserSetting(items)
          } else {
            void this.migrateFeatureRepoToOfflineEntitlements(items)
          }
        }
      }),
    )

    this.eventDisposers.push(
      this.user.addEventObserver((eventName: AccountEvent) => {
        if (eventName === AccountEvent.SignedInOrRegistered) {
          const featureRepos = this.items.getItems(ContentType.TYPES.ExtensionRepo) as SNFeatureRepo[]

          const isThirdPartyHostUsedOrError = this.isApplicationUsingThirdPartyHostUseCase.execute()
          if (isThirdPartyHostUsedOrError.isFailed()) {
            return
          }
          const isThirdPartyHostUsed = isThirdPartyHostUsedOrError.getValue()
          if (!isThirdPartyHostUsed) {
            void this.migrateFeatureRepoToUserSetting(featureRepos)
          }
        }
      }),
    )
  }

  initializeFromDisk(): void {
    this.onlineRoles = this.storage.getValue<string[]>(StorageKey.UserRoles, undefined, [])
    this.offlineRoles = this.storage.getValue<string[]>(StorageKey.OfflineUserRoles, undefined, [])
    this.enabledExperimentalFeatures = this.storage.getValue(StorageKey.ExperimentalFeatures, undefined, [])
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApiServiceEvent.MetaReceived: {
        if (!this.sync) {
          this.logger.warn('Handling events interrupted. Sync service is not yet initialized.', event)
          return
        }

        const { userRoles } = event.payload as MetaReceivedData
        void this.updateOnlineRolesWithNewValues(userRoles.map((role) => role.name))
        break
      }

      case ApplicationEvent.ApplicationStageChanged: {
        const stage = (event.payload as ApplicationStageChangedEventPayload).stage
        switch (stage) {
          case ApplicationStage.StorageDecrypted_09: {
            this.initializeFromDisk()
            break
          }
          case ApplicationStage.FullSyncCompleted_13: {
            if (!this.hasFirstPartyOnlineSubscription()) {
              const offlineRepo = this.getOfflineRepo()
              if (offlineRepo) {
                void this.downloadOfflineRoles(offlineRepo)
              }
            }
            break
          }
        }
      }
    }
  }

  public enableExperimentalFeature(identifier: string): void {
    this.enabledExperimentalFeatures.push(identifier)

    void this.storage.setValue(StorageKey.ExperimentalFeatures, this.enabledExperimentalFeatures)

    void this.notifyEvent(FeaturesEvent.FeaturesAvailabilityChanged)
  }

  public disableExperimentalFeature(identifier: string): void {
    removeFromArray(this.enabledExperimentalFeatures, identifier)

    void this.storage.setValue(StorageKey.ExperimentalFeatures, this.enabledExperimentalFeatures)

    const component = this.items
      .getItems<ComponentInterface>([ContentType.TYPES.Component, ContentType.TYPES.Theme])
      .find((component) => component.identifier === identifier)
    if (!component) {
      return
    }

    void this.mutator.setItemToBeDeleted(component).then(() => {
      void this.sync.sync()
    })
    void this.notifyEvent(FeaturesEvent.FeaturesAvailabilityChanged)
  }

  public toggleExperimentalFeature(identifier: string): void {
    if (this.isExperimentalFeatureEnabled(identifier)) {
      this.disableExperimentalFeature(identifier)
    } else {
      this.enableExperimentalFeature(identifier)
    }
  }

  public getExperimentalFeatures(): string[] {
    return ExperimentalFeatures
  }

  public isExperimentalFeature(featureId: string): boolean {
    return this.getExperimentalFeatures().includes(featureId)
  }

  public getEnabledExperimentalFeatures(): string[] {
    return this.enabledExperimentalFeatures
  }

  public isExperimentalFeatureEnabled(featureId: string): boolean {
    return this.enabledExperimentalFeatures.includes(featureId)
  }

  public async setOfflineFeaturesCode(code: string): Promise<SetOfflineFeaturesFunctionResponse> {
    try {
      const result = this.parseOfflineEntitlementsCode(code)

      if (result instanceof ClientDisplayableError) {
        return result
      }

      const offlineRepo = (await this.mutator.createItem(
        ContentType.TYPES.ExtensionRepo,
        FillItemContent({
          offlineFeaturesUrl: result.featuresUrl,
          offlineKey: result.extensionKey,
          migratedToOfflineEntitlements: true,
        } as FeatureRepoContent),
        true,
      )) as SNFeatureRepo

      void this.sync.sync()

      return this.downloadOfflineRoles(offlineRepo)
    } catch (err) {
      return new ClientDisplayableError(`${API_MESSAGE_FAILED_OFFLINE_ACTIVATION}, ${JSON.stringify(err)}`)
    }
  }

  private getOfflineRepo(): SNFeatureRepo | undefined {
    const repos = this.items.getItems(ContentType.TYPES.ExtensionRepo) as SNFeatureRepo[]
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

  parseOfflineEntitlementsCode(code: string): OfflineSubscriptionEntitlements | ClientDisplayableError {
    try {
      const activationCodeWithoutSpaces = code.replace(/\s/g, '')
      const decodedData = this.crypto.base64Decode(activationCodeWithoutSpaces)

      const { featuresUrl, extensionKey, subscriptionId } = JSON.parse(decodedData)
      return {
        featuresUrl,
        extensionKey,
        subscriptionId,
      }
    } catch (error) {
      return new ClientDisplayableError(API_MESSAGE_FAILED_OFFLINE_ACTIVATION)
    }
  }

  private async downloadOfflineRoles(repo: SNFeatureRepo): Promise<SetOfflineFeaturesFunctionResponse> {
    const result = await this.api.downloadOfflineFeaturesFromRepo({
      repo,
    })

    if (result instanceof ClientDisplayableError) {
      return result
    }

    this.setOfflineRoles(result.roles)
  }

  public async migrateFeatureRepoToUserSetting(featureRepos: SNFeatureRepo[] = []): Promise<void> {
    const usecase = new MigrateFeatureRepoToUserSettingUseCase(this.mutator, this.settings)
    await usecase.execute(featureRepos)
  }

  public async migrateFeatureRepoToOfflineEntitlements(featureRepos: SNFeatureRepo[] = []): Promise<void> {
    const usecase = new MigrateFeatureRepoToOfflineEntitlementsUseCase(this.mutator)
    const updatedRepos = await usecase.execute({ featureRepos, prodOfflineFeaturesUrl: this.PROD_OFFLINE_FEATURES_URL })

    if (updatedRepos.length > 0) {
      await this.downloadOfflineRoles(updatedRepos[0])
    }

    for (const repo of featureRepos) {
      await this.downloadOfflineRoles(repo)
    }
  }

  hasPaidAnyPartyOnlineOrOfflineSubscription(): boolean {
    return this.onlineRolesIncludePaidSubscription() || this.hasOfflineRepo() || this.hasFirstPartyOnlineSubscription()
  }

  hasFirstPartyOnlineSubscription(): boolean {
    return this.sessions.isSignedIntoFirstPartyServer() && this.subscriptions.hasOnlineSubscription()
  }

  public hasFirstPartyOfflineSubscription(): boolean {
    const offlineRepo = this.getOfflineRepo()
    if (!offlineRepo || !offlineRepo.content.offlineFeaturesUrl) {
      return false
    }

    const hasFirstPartyOfflineSubscription = offlineRepo.content.offlineFeaturesUrl === this.PROD_OFFLINE_FEATURES_URL
    return hasFirstPartyOfflineSubscription || new URL(offlineRepo.content.offlineFeaturesUrl).hostname === 'localhost'
  }

  async updateOnlineRolesWithNewValues(roles: string[]): Promise<void> {
    const previousRoles = this.onlineRoles

    const userRolesChanged =
      roles.some((role) => !this.onlineRoles.includes(role)) || this.onlineRoles.some((role) => !roles.includes(role))

    if (!userRolesChanged) {
      return
    }

    this.setOnlineRoles(roles)

    const isInitialLoadRolesChange = previousRoles.length === 0
    if (!isInitialLoadRolesChange) {
      const changedRoles = roles.filter((role) => !previousRoles.includes(role))
      const changedRolesIncludePaidSubscription = this.rolesIncludePaidSubscription(changedRoles)

      if (changedRolesIncludePaidSubscription) {
        await this.notifyEvent(FeaturesEvent.DidPurchaseSubscription)
      }
    }
  }

  setOnlineRoles(roles: string[]): void {
    const rolesChanged = !arraysEqual(this.onlineRoles, roles)

    this.onlineRoles = roles

    if (rolesChanged) {
      void this.notifyEvent(FeaturesEvent.UserRolesChanged)
    }

    this.storage.setValue(StorageKey.UserRoles, this.onlineRoles)
  }

  setOfflineRoles(roles: string[]): void {
    const rolesChanged = !arraysEqual(this.offlineRoles, roles)

    this.offlineRoles = roles

    if (rolesChanged) {
      void this.notifyEvent(FeaturesEvent.UserRolesChanged)
    }

    this.storage.setValue(StorageKey.OfflineUserRoles, this.offlineRoles)
  }

  public isThirdPartyFeature(identifier: string): boolean {
    const isNativeFeature = !!FindNativeFeature(identifier)
    return !isNativeFeature
  }

  private rolesIncludePaidSubscription(roles: string[]) {
    const paidRoles = [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser]

    return roles.some((role) => paidRoles.includes(role))
  }

  onlineRolesIncludePaidSubscription(): boolean {
    return this.rolesIncludePaidSubscription(this.onlineRoles)
  }

  public rolesBySorting(roles: string[]): string[] {
    return Object.values(RoleName.NAMES).filter((role) => roles.includes(role))
  }

  hasRole(roleName: RoleName): boolean {
    return this.onlineRoles.includes(roleName.value) || this.offlineRoles.includes(roleName.value)
  }

  public hasMinimumRole(role: string): boolean {
    const sortedAllRoles = Object.values(RoleName.NAMES)

    const sortedUserRoles = this.rolesBySorting(
      this.hasFirstPartyOnlineSubscription() ? this.onlineRoles : this.offlineRoles,
    )

    const highestUserRoleIndex = sortedAllRoles.indexOf(lastElement(sortedUserRoles) as string)

    const indexOfRoleToCheck = sortedAllRoles.indexOf(role)

    return indexOfRoleToCheck <= highestUserRoleIndex
  }

  public getFeatureStatus(
    featureId: NativeFeatureIdentifier | Uuid,
    options: { inContextOfItem?: DecryptedItemInterface } = {},
  ): FeatureStatus {
    return this.getFeatureStatusUseCase.execute({
      featureId,
      firstPartyRoles: this.hasFirstPartyOnlineSubscription()
        ? { online: this.onlineRoles }
        : this.hasFirstPartyOfflineSubscription()
        ? { offline: this.offlineRoles }
        : undefined,
      hasPaidAnyPartyOnlineOrOfflineSubscription: this.hasPaidAnyPartyOnlineOrOfflineSubscription(),
      firstPartyOnlineSubscription: this.hasFirstPartyOnlineSubscription()
        ? this.subscriptions.getOnlineSubscription()
        : undefined,
      inContextOfItem: options.inContextOfItem,
    })
  }

  override deinit(): void {
    super.deinit()
    ;(this.onlineRoles as unknown) = undefined
    ;(this.offlineRoles as unknown) = undefined
    ;(this.storage as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this.api as unknown) = undefined
    ;(this.subscriptions as unknown) = undefined
    ;(this.settings as unknown) = undefined
    ;(this.user as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.alerts as unknown) = undefined
    ;(this.sessions as unknown) = undefined
    ;(this.crypto as unknown) = undefined
  }
}
