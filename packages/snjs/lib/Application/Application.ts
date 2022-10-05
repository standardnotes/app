import {
  HttpService,
  HttpServiceInterface,
  SubscriptionApiService,
  SubscriptionApiServiceInterface,
  SubscriptionServer,
  SubscriptionServerInterface,
  UserApiService,
  UserApiServiceInterface,
  UserRegistrationResponseBody,
  UserServer,
  UserServerInterface,
  WebSocketApiService,
  WebSocketApiServiceInterface,
  WebSocketServer,
  WebSocketServerInterface,
} from '@standardnotes/api'
import * as Common from '@standardnotes/common'
import * as ExternalServices from '@standardnotes/services'
import * as Models from '@standardnotes/models'
import * as Responses from '@standardnotes/responses'
import * as InternalServices from '../Services'
import * as Utils from '@standardnotes/utils'
import * as Settings from '@standardnotes/settings'
import { Subscription } from '@standardnotes/security'
import { UuidString, ApplicationEventPayload } from '../Types'
import { applicationEventForSyncEvent } from '@Lib/Application/Event'
import {
  ApplicationEvent,
  ApplicationEventCallback,
  ChallengeValidation,
  ComponentManagerInterface,
  DiagnosticInfo,
  isDesktopDevice,
  ChallengeValue,
  StorageKey,
  ChallengeReason,
  DeinitMode,
  DeinitSource,
  AppGroupManagedApplication,
  ApplicationInterface,
  EncryptionService,
  EncryptionServiceEvent,
  FilesBackupService,
  FileService,
  SubscriptionClientInterface,
  SubscriptionManager,
} from '@standardnotes/services'
import { FilesClientInterface } from '@standardnotes/files'
import { ComputePrivateWorkspaceIdentifier } from '@standardnotes/encryption'
import { useBoolean } from '@standardnotes/utils'
import {
  BackupFile,
  DecryptedItemInterface,
  EncryptedItemInterface,
  Environment,
  ItemStream,
  Platform,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'

import { SnjsVersion } from './../Version'
import { SNLog } from '../Log'
import { Challenge, ChallengeResponse } from '../Services'
import { ApplicationConstructorOptions, FullyResolvedApplicationOptions } from './Options/ApplicationOptions'
import { ApplicationOptionsDefaults } from './Options/Defaults'

/** How often to automatically sync, in milliseconds */
const DEFAULT_AUTO_SYNC_INTERVAL = 30_000

type LaunchCallback = {
  receiveChallenge: (challenge: Challenge) => void
}

type ApplicationObserver = {
  singleEvent?: ApplicationEvent
  callback: ApplicationEventCallback
}

type ObserverRemover = () => void

export class SNApplication
  implements ApplicationInterface, AppGroupManagedApplication, InternalServices.ListedClientInterface
{
  onDeinit!: ExternalServices.DeinitCallback

  /**
   * A runtime based identifier for each dynamic instantiation of the application instance.
   * This differs from the persistent application.identifier which persists in storage
   * across instantiations.
   */
  public readonly ephemeralIdentifier = Utils.nonSecureRandomIdentifier()

  private migrationService!: InternalServices.SNMigrationService
  /**
   * @deprecated will be fully replaced by @standardnotes/api::HttpService
   */
  private deprecatedHttpService!: InternalServices.SNHttpService
  private declare httpService: HttpServiceInterface
  private payloadManager!: InternalServices.PayloadManager
  public protocolService!: EncryptionService
  private diskStorageService!: InternalServices.DiskStorageService
  private inMemoryStore!: ExternalServices.KeyValueStoreInterface<string>
  /**
   * @deprecated will be fully replaced by @standardnotes/api services
   */
  private apiService!: InternalServices.SNApiService
  private declare userApiService: UserApiServiceInterface
  private declare userServer: UserServerInterface
  private declare subscriptionApiService: SubscriptionApiServiceInterface
  private declare subscriptionServer: SubscriptionServerInterface
  private declare subscriptionManager: SubscriptionClientInterface
  private declare webSocketApiService: WebSocketApiServiceInterface
  private declare webSocketServer: WebSocketServerInterface
  private sessionManager!: InternalServices.SNSessionManager
  private syncService!: InternalServices.SNSyncService
  private challengeService!: InternalServices.ChallengeService
  public singletonManager!: InternalServices.SNSingletonManager
  public componentManagerService!: InternalServices.SNComponentManager
  public protectionService!: InternalServices.SNProtectionService
  public actionsManager!: InternalServices.SNActionsService
  public historyManager!: InternalServices.SNHistoryManager
  private itemManager!: InternalServices.ItemManager
  private keyRecoveryService!: InternalServices.SNKeyRecoveryService
  private preferencesService!: InternalServices.SNPreferencesService
  private featuresService!: InternalServices.SNFeaturesService
  private userService!: InternalServices.UserService
  private webSocketsService!: InternalServices.SNWebSocketsService
  private settingsService!: InternalServices.SNSettingsService
  private mfaService!: InternalServices.SNMfaService
  private listedService!: InternalServices.ListedService
  private fileService!: FileService
  private mutatorService!: InternalServices.MutatorService
  private integrityService!: ExternalServices.IntegrityService
  private statusService!: ExternalServices.StatusService
  private filesBackupService?: FilesBackupService

  private internalEventBus!: ExternalServices.InternalEventBusInterface

  private eventHandlers: ApplicationObserver[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private services: ExternalServices.ServiceInterface<any, any>[] = []
  private streamRemovers: ObserverRemover[] = []
  private serviceObservers: ObserverRemover[] = []
  private managedSubscribers: ObserverRemover[] = []
  private autoSyncInterval!: ReturnType<typeof setInterval>

  /** True if the result of deviceInterface.openDatabase yields a new database being created */
  private createdNewDatabase = false
  /** True if the application has started (but not necessarily launched) */
  private started = false
  /** True if the application has launched */
  private launched = false
  /** Whether the application has been destroyed via .deinit() */
  public dealloced = false
  private revokingSession = false
  private handledFullSyncStage = false

  public readonly environment: Environment
  public readonly platform: Platform
  public deviceInterface: ExternalServices.DeviceInterface
  public alertService: ExternalServices.AlertService
  public readonly identifier: Common.ApplicationIdentifier
  public readonly options: FullyResolvedApplicationOptions

  constructor(options: ApplicationConstructorOptions) {
    const allOptions: FullyResolvedApplicationOptions = {
      ...ApplicationOptionsDefaults,
      ...options,
    }

    if (!SNLog.onLog) {
      throw Error('SNLog.onLog must be set.')
    }
    if (!SNLog.onError) {
      throw Error('SNLog.onError must be set.')
    }

    const requiredOptions: (keyof FullyResolvedApplicationOptions)[] = [
      'deviceInterface',
      'environment',
      'platform',
      'crypto',
      'alertService',
      'identifier',
      'defaultHost',
      'appVersion',
    ]

    for (const optionName of requiredOptions) {
      if (!allOptions[optionName]) {
        throw Error(`${optionName} must be supplied when creating an application.`)
      }
    }

    this.environment = options.environment
    this.platform = options.platform
    this.deviceInterface = options.deviceInterface
    this.alertService = options.alertService
    this.identifier = options.identifier
    this.options = Object.freeze(allOptions)

    this.constructInternalEventBus()

    this.constructServices()

    this.defineInternalEventHandlers()
  }

  get subscriptions(): ExternalServices.SubscriptionClientInterface {
    return this.subscriptionManager
  }

  public get files(): FilesClientInterface {
    return this.fileService
  }

  public get features(): ExternalServices.FeaturesClientInterface {
    return this.featuresService
  }

  public get items(): ExternalServices.ItemsClientInterface {
    return this.itemManager
  }

  public get protections(): InternalServices.ProtectionsClientInterface {
    return this.protectionService
  }

  public get sync(): InternalServices.SyncClientInterface {
    return this.syncService
  }

  public get user(): ExternalServices.UserClientInterface {
    return this.userService
  }

  public get settings(): InternalServices.SNSettingsService {
    return this.settingsService
  }

  public get mutator(): ExternalServices.MutatorClientInterface {
    return this.mutatorService
  }

  public get sessions(): InternalServices.SessionsClientInterface {
    return this.sessionManager
  }

  public get status(): ExternalServices.StatusServiceInterface {
    return this.statusService
  }

  public get fileBackups(): FilesBackupService | undefined {
    return this.filesBackupService
  }

  public get componentManager(): ComponentManagerInterface {
    return this.componentManagerService
  }

  public computePrivateWorkspaceIdentifier(userphrase: string, name: string): Promise<string | undefined> {
    return ComputePrivateWorkspaceIdentifier(this.options.crypto, userphrase, name)
  }

  /**
   * The first thing consumers should call when starting their app.
   * This function will load all services in their correct order.
   */
  async prepareForLaunch(callback: LaunchCallback): Promise<void> {
    await this.options.crypto.initialize()

    this.setLaunchCallback(callback)

    const databaseResult = await this.deviceInterface.openDatabase(this.identifier).catch((error) => {
      void this.notifyEvent(ApplicationEvent.LocalDatabaseReadError, error)
      return undefined
    })

    this.createdNewDatabase = useBoolean(databaseResult?.isNewDatabase, false)

    await this.migrationService.initialize()

    await this.notifyEvent(ApplicationEvent.MigrationsLoaded)
    await this.handleStage(ExternalServices.ApplicationStage.PreparingForLaunch_0)

    await this.diskStorageService.initializeFromDisk()
    await this.notifyEvent(ApplicationEvent.StorageReady)

    await this.protocolService.initialize()

    await this.handleStage(ExternalServices.ApplicationStage.ReadyForLaunch_05)

    this.started = true
    await this.notifyEvent(ApplicationEvent.Started)
  }

  private setLaunchCallback(callback: LaunchCallback) {
    this.challengeService.sendChallenge = callback.receiveChallenge
  }

  /**
   * Handles device authentication, unlocks application, and
   * issues a callback if a device activation requires user input
   * (i.e local passcode or fingerprint).
   * @param awaitDatabaseLoad
   * Option to await database load before marking the app as ready.
   */
  public async launch(awaitDatabaseLoad = false): Promise<void> {
    this.launched = false

    const launchChallenge = this.getLaunchChallenge()
    if (launchChallenge) {
      const response = await this.challengeService.promptForChallengeResponse(launchChallenge)
      if (!response) {
        throw Error('Launch challenge was cancelled.')
      }
      await this.handleLaunchChallengeResponse(response)
    }

    if (this.diskStorageService.isStorageWrapped()) {
      try {
        await this.diskStorageService.decryptStorage()
      } catch (_error) {
        void this.alertService.alert(
          InternalServices.ErrorAlertStrings.StorageDecryptErrorBody,
          InternalServices.ErrorAlertStrings.StorageDecryptErrorTitle,
        )
      }
    }

    await this.handleStage(ExternalServices.ApplicationStage.StorageDecrypted_09)

    this.apiService.loadHost()
    this.webSocketsService.loadWebSocketUrl()
    await this.sessionManager.initializeFromDisk()

    this.settingsService.initializeFromDisk()

    this.featuresService.initializeFromDisk()

    this.launched = true
    await this.notifyEvent(ApplicationEvent.Launched)
    await this.handleStage(ExternalServices.ApplicationStage.Launched_10)

    const databasePayloads = await this.syncService.getDatabasePayloads()
    await this.handleStage(ExternalServices.ApplicationStage.LoadingDatabase_11)

    if (this.createdNewDatabase) {
      await this.syncService.onNewDatabaseCreated()
    }
    /**
     * We don't want to await this, as we want to begin allowing the app to function
     * before local data has been loaded fully. We await only initial
     * `getDatabasePayloads` to lock in on database state.
     */
    const loadPromise = this.syncService.loadDatabasePayloads(databasePayloads).then(async () => {
      if (this.dealloced) {
        throw 'Application has been destroyed.'
      }
      await this.handleStage(ExternalServices.ApplicationStage.LoadedDatabase_12)
      this.beginAutoSyncTimer()
      await this.syncService.sync({
        mode: ExternalServices.SyncMode.DownloadFirst,
        source: ExternalServices.SyncSource.External,
      })
    })
    if (awaitDatabaseLoad) {
      await loadPromise
    }
  }

  public onStart(): void {
    // optional override
  }

  public onLaunch(): void {
    // optional override
  }

  public getLaunchChallenge(): Challenge | undefined {
    return this.protectionService.createLaunchChallenge()
  }

  private async handleLaunchChallengeResponse(response: ChallengeResponse) {
    if (response.challenge.hasPromptForValidationType(ChallengeValidation.LocalPasscode)) {
      let wrappingKey = response.artifacts?.wrappingKey
      if (!wrappingKey) {
        const value = response.getValueForType(ChallengeValidation.LocalPasscode)
        wrappingKey = await this.protocolService.computeWrappingKey(value.value as string)
      }
      await this.protocolService.unwrapRootKey(wrappingKey)
    }
  }

  private beginAutoSyncTimer() {
    this.autoSyncInterval = setInterval(() => {
      this.syncService.log('Syncing from autosync')
      void this.sync.sync()
    }, DEFAULT_AUTO_SYNC_INTERVAL)
  }

  private async handleStage(stage: ExternalServices.ApplicationStage) {
    for (const service of this.services) {
      await service.handleApplicationStage(stage)
    }
  }

  /**
   * @param singleEvent Whether to only listen for a particular event.
   */
  public addEventObserver(callback: ApplicationEventCallback, singleEvent?: ApplicationEvent): () => void {
    const observer = { callback, singleEvent }
    this.eventHandlers.push(observer)
    return () => {
      Utils.removeFromArray(this.eventHandlers, observer)
    }
  }

  public addSingleEventObserver(event: ApplicationEvent, callback: ApplicationEventCallback): () => void {
    // eslint-disable-next-line @typescript-eslint/require-await
    const filteredCallback = async (firedEvent: ApplicationEvent) => {
      if (firedEvent === event) {
        void callback(event)
      }
    }
    return this.addEventObserver(filteredCallback, event)
  }

  public async getDiagnostics(): Promise<DiagnosticInfo> {
    let result: DiagnosticInfo = {
      application: {
        snjsVersion: SnjsVersion,
        appVersion: this.options.appVersion,
        environment: this.options.environment,
        platform: this.options.platform,
      },
    }

    for (const service of this.services) {
      const diagnostics = await service.getDiagnostics()

      if (diagnostics) {
        result = {
          ...result,
          ...diagnostics,
        }
      }
    }

    return result
  }

  private async notifyEvent(event: ApplicationEvent, data?: ApplicationEventPayload) {
    if (event === ApplicationEvent.Started) {
      this.onStart()
    } else if (event === ApplicationEvent.Launched) {
      this.onLaunch()
    }
    for (const observer of this.eventHandlers.slice()) {
      if ((observer.singleEvent && observer.singleEvent === event) || !observer.singleEvent) {
        await observer.callback(event, data || {})
      }
    }
    void this.migrationService.handleApplicationEvent(event)
  }

  /**
   * Whether the local database has completed loading local items.
   */
  public isDatabaseLoaded(): boolean {
    return this.syncService.isDatabaseLoaded()
  }

  public getSessions(): Promise<
    (Responses.HttpResponse & { data: InternalServices.RemoteSession[] }) | Responses.HttpResponse
  > {
    return this.sessionManager.getSessionsList()
  }

  public async revokeSession(sessionId: UuidString): Promise<Responses.HttpResponse | undefined> {
    if (await this.protectionService.authorizeSessionRevoking()) {
      return this.sessionManager.revokeSession(sessionId)
    }
    return undefined
  }

  /**
   * Revokes all sessions except the current one.
   */
  public async revokeAllOtherSessions(): Promise<void> {
    return this.sessionManager.revokeAllOtherSessions()
  }

  public userCanManageSessions(): boolean {
    const userVersion = this.getUserVersion()
    if (Utils.isNullOrUndefined(userVersion)) {
      return false
    }
    return Common.compareVersions(userVersion, Common.ProtocolVersion.V004) >= 0
  }

  public async getUserSubscription(): Promise<Subscription | Responses.ClientDisplayableError> {
    return this.sessionManager.getSubscription()
  }

  public async getAvailableSubscriptions(): Promise<
    Responses.AvailableSubscriptions | Responses.ClientDisplayableError
  > {
    return this.sessionManager.getAvailableSubscriptions()
  }

  /**
   * Begin streaming items to display in the UI. The stream callback will be called
   * immediately with the present items that match the constraint, and over time whenever
   * items matching the constraint are added, changed, or deleted.
   */
  public streamItems<I extends DecryptedItemInterface = DecryptedItemInterface>(
    contentType: Common.ContentType | Common.ContentType[],
    stream: ItemStream<I>,
  ): () => void {
    const removeItemManagerObserver = this.itemManager.addObserver<I>(
      contentType,
      ({ changed, inserted, removed, source }) => {
        stream({ changed, inserted, removed, source })
      },
    )

    const matches = this.itemManager.getItems<I>(contentType)
    stream({
      inserted: matches,
      changed: [],
      removed: [],
      source: Models.PayloadEmitSource.InitialObserverRegistrationPush,
    })

    this.streamRemovers.push(removeItemManagerObserver)

    return () => {
      removeItemManagerObserver()

      Utils.removeFromArray(this.streamRemovers, removeItemManagerObserver)
    }
  }

  /**
   * Set the server's URL
   */
  public async setHost(host: string): Promise<void> {
    this.httpService.setHost(host)

    await this.apiService.setHost(host)
  }

  public getHost(): string | undefined {
    return this.apiService.getHost()
  }

  public async setCustomHost(host: string): Promise<void> {
    await this.setHost(host)
    this.webSocketsService.setWebSocketUrl(undefined)
  }

  public getUser(): Responses.User | undefined {
    if (!this.launched) {
      throw Error('Attempting to access user before application unlocked')
    }
    return this.sessionManager.getUser()
  }

  public getUserPasswordCreationDate(): Date | undefined {
    return this.protocolService.getPasswordCreatedDate()
  }

  public getProtocolEncryptionDisplayName(): Promise<string | undefined> {
    return this.protocolService.getEncryptionDisplayName()
  }

  public getUserVersion(): Common.ProtocolVersion | undefined {
    return this.protocolService.getUserVersion()
  }

  /**
   * Returns true if there is an upgrade available for the account or passcode
   */
  public protocolUpgradeAvailable(): Promise<boolean> {
    return this.protocolService.upgradeAvailable()
  }

  /**
   * Returns true if there is an encryption source available
   */
  public isEncryptionAvailable(): boolean {
    return this.hasAccount() || this.hasPasscode()
  }

  public async upgradeProtocolVersion(): Promise<{
    success?: true
    canceled?: true
    error?: {
      message: string
    }
  }> {
    const result = await this.userService.performProtocolUpgrade()
    if (result.success) {
      if (this.hasAccount()) {
        void this.alertService.alert(InternalServices.ProtocolUpgradeStrings.SuccessAccount)
      } else {
        void this.alertService.alert(InternalServices.ProtocolUpgradeStrings.SuccessPasscodeOnly)
      }
    } else if (result.error) {
      void this.alertService.alert(InternalServices.ProtocolUpgradeStrings.Fail)
    }
    return result
  }

  public noAccount(): boolean {
    return !this.hasAccount()
  }

  public hasAccount(): boolean {
    return this.protocolService.hasAccount()
  }

  /**
   * @returns true if the user has a source of protection available, such as a
   * passcode, password, or biometrics.
   */
  public hasProtectionSources(): boolean {
    return this.protectionService.hasProtectionSources()
  }

  public hasUnprotectedAccessSession(): boolean {
    return this.protectionService.hasUnprotectedAccessSession()
  }

  /**
   * When a user specifies a non-zero remember duration on a protection
   * challenge, a session will be started during which protections are disabled.
   */
  public getProtectionSessionExpiryDate(): Date {
    return this.protectionService.getSessionExpiryDate()
  }

  public clearProtectionSession(): Promise<void> {
    return this.protectionService.clearSession()
  }

  public async authorizeProtectedActionForNotes(
    notes: Models.SNNote[],
    challengeReason: ChallengeReason,
  ): Promise<Models.SNNote[]> {
    return await this.protectionService.authorizeProtectedActionForItems(notes, challengeReason)
  }

  /**
   * @returns whether note access has been granted or not
   */
  public authorizeNoteAccess(note: Models.SNNote): Promise<boolean> {
    return this.protectionService.authorizeItemAccess(note)
  }

  public authorizeAutolockIntervalChange(): Promise<boolean> {
    return this.protectionService.authorizeAutolockIntervalChange()
  }

  public authorizeSearchingProtectedNotesText(): Promise<boolean> {
    return this.protectionService.authorizeSearchingProtectedNotesText()
  }

  public canRegisterNewListedAccount(): boolean {
    return this.listedService.canRegisterNewListedAccount()
  }

  public async requestNewListedAccount(): Promise<Responses.ListedAccount | undefined> {
    return this.listedService.requestNewListedAccount()
  }

  public async getListedAccounts(): Promise<Responses.ListedAccount[]> {
    return this.listedService.getListedAccounts()
  }

  public getListedAccountInfo(
    account: Responses.ListedAccount,
    inContextOfItem?: UuidString,
  ): Promise<Responses.ListedAccountInfo | undefined> {
    return this.listedService.getListedAccountInfo(account, inContextOfItem)
  }

  public async createEncryptedBackupFileForAutomatedDesktopBackups(): Promise<BackupFile | undefined> {
    return this.protocolService.createEncryptedBackupFile()
  }

  public async createEncryptedBackupFile(): Promise<BackupFile | undefined> {
    if (!(await this.protectionService.authorizeBackupCreation())) {
      return
    }

    return this.protocolService.createEncryptedBackupFile()
  }

  public async createDecryptedBackupFile(): Promise<BackupFile | undefined> {
    if (!(await this.protectionService.authorizeBackupCreation())) {
      return
    }

    return this.protocolService.createDecryptedBackupFile()
  }

  public isEphemeralSession(): boolean {
    return this.diskStorageService.isEphemeralSession()
  }

  public setValue(key: string, value: unknown, mode?: ExternalServices.StorageValueModes): void {
    return this.diskStorageService.setValue(key, value, mode)
  }

  public getValue(key: string, mode?: ExternalServices.StorageValueModes): unknown {
    return this.diskStorageService.getValue(key, mode)
  }

  public async removeValue(key: string, mode?: ExternalServices.StorageValueModes): Promise<void> {
    return this.diskStorageService.removeValue(key, mode)
  }

  public getPreference<K extends Models.PrefKey>(key: K): Models.PrefValue[K] | undefined
  public getPreference<K extends Models.PrefKey>(key: K, defaultValue: Models.PrefValue[K]): Models.PrefValue[K]
  public getPreference<K extends Models.PrefKey>(
    key: K,
    defaultValue?: Models.PrefValue[K],
  ): Models.PrefValue[K] | undefined {
    return this.preferencesService.getValue(key, defaultValue)
  }

  public async setPreference<K extends Models.PrefKey>(key: K, value: Models.PrefValue[K]): Promise<void> {
    return this.preferencesService.setValue(key, value)
  }

  /**
   * Gives services a chance to complete any sensitive operations before yielding
   * @param maxWait The maximum number of milliseconds to wait for services
   * to finish tasks. 0 means no limit.
   */
  private async prepareForDeinit(maxWait = 0): Promise<void> {
    const promise = Promise.all(this.services.map((service) => service.blockDeinit()))
    if (maxWait === 0) {
      await promise
    } else {
      /** Await up to maxWait. If not resolved by then, return. */
      await Promise.race([promise, Utils.sleep(maxWait)])
    }
  }

  public promptForCustomChallenge(challenge: Challenge): Promise<ChallengeResponse | undefined> {
    return this.challengeService?.promptForChallengeResponse(challenge)
  }

  public addChallengeObserver(challenge: Challenge, observer: InternalServices.ChallengeObserver): () => void {
    return this.challengeService.addChallengeObserver(challenge, observer)
  }

  public submitValuesForChallenge(challenge: Challenge, values: ChallengeValue[]): Promise<void> {
    return this.challengeService.submitValuesForChallenge(challenge, values)
  }

  public cancelChallenge(challenge: Challenge): void {
    this.challengeService.cancelChallenge(challenge)
  }

  public setOnDeinit(onDeinit: ExternalServices.DeinitCallback): void {
    this.onDeinit = onDeinit
  }

  /**
   * Destroys the application instance.
   */
  public deinit(mode: DeinitMode, source: DeinitSource): void {
    this.dealloced = true

    clearInterval(this.autoSyncInterval)
    ;(this.autoSyncInterval as unknown) = undefined

    for (const uninstallObserver of this.serviceObservers) {
      uninstallObserver()
    }

    for (const uninstallSubscriber of this.managedSubscribers) {
      uninstallSubscriber()
    }

    for (const service of this.services) {
      service.deinit()
    }

    this.options.crypto.deinit()
    ;(this.options as unknown) = undefined

    this.createdNewDatabase = false
    this.services.length = 0
    this.serviceObservers.length = 0
    this.managedSubscribers.length = 0
    this.streamRemovers.length = 0

    this.clearInternalEventBus()
    this.clearServices()

    this.started = false

    this.onDeinit?.(this, mode, source)
    ;(this.onDeinit as unknown) = undefined
  }

  /**
   *  @param mergeLocal  Whether to merge existing offline data into account. If false,
   *                     any pre-existing data will be fully deleted upon success.
   */
  public async register(
    email: string,
    password: string,
    ephemeral = false,
    mergeLocal = true,
  ): Promise<UserRegistrationResponseBody> {
    return this.userService.register(email, password, ephemeral, mergeLocal)
  }

  /**
   * @param mergeLocal  Whether to merge existing offline data into account.
   * If false, any pre-existing data will be fully deleted upon success.
   */
  public async signIn(
    email: string,
    password: string,
    strict = false,
    ephemeral = false,
    mergeLocal = true,
    awaitSync = false,
  ): Promise<Responses.HttpResponse | Responses.SignInResponse> {
    return this.userService.signIn(email, password, strict, ephemeral, mergeLocal, awaitSync)
  }

  public async changeEmail(
    newEmail: string,
    currentPassword: string,
    passcode?: string,
    origination = Common.KeyParamsOrigination.EmailChange,
  ): Promise<InternalServices.CredentialsChangeFunctionResponse> {
    return this.userService.changeCredentials({
      currentPassword,
      newEmail,
      passcode,
      origination,
      validateNewPasswordStrength: false,
    })
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string,
    passcode?: string,
    origination = Common.KeyParamsOrigination.PasswordChange,
    validateNewPasswordStrength = true,
  ): Promise<InternalServices.CredentialsChangeFunctionResponse> {
    return this.userService.changeCredentials({
      currentPassword,
      newPassword,
      passcode,
      origination,
      validateNewPasswordStrength,
    })
  }

  private async handleRevokedSession(): Promise<void> {
    /**
     * Because multiple API requests can come back at the same time
     * indicating revoked session we only want to do this once.
     */
    if (this.revokingSession) {
      return
    }
    this.revokingSession = true
    /** Keep a reference to the soon-to-be-cleared alertService */
    const alertService = this.alertService
    await this.user.signOut(true)
    void alertService.alert(InternalServices.SessionStrings.CurrentSessionRevoked)
  }

  public async validateAccountPassword(password: string): Promise<boolean> {
    const { valid } = await this.protocolService.validateAccountPassword(password)
    return valid
  }

  public isStarted(): boolean {
    return this.started
  }

  public isLaunched(): boolean {
    return this.launched
  }

  public hasPasscode(): boolean {
    return this.protocolService.hasPasscode()
  }

  isLocked(): Promise<boolean> {
    if (!this.started) {
      return Promise.resolve(true)
    }
    return this.challengeService.isPasscodeLocked()
  }

  public async lock(): Promise<void> {
    /** Because locking is a critical operation, we want to try to do it safely,
     * but only up to a certain limit. */
    const MaximumWaitTime = 500
    await this.prepareForDeinit(MaximumWaitTime)
    return this.deinit(this.getDeinitMode(), DeinitSource.Lock)
  }

  isNativeMobileWeb() {
    return this.environment === Environment.NativeMobileWeb
  }

  getDeinitMode(): DeinitMode {
    const value = this.getValue(StorageKey.DeinitMode)
    if (value === 'hard') {
      return DeinitMode.Hard
    }

    return DeinitMode.Soft
  }

  public addPasscode(passcode: string): Promise<boolean> {
    return this.userService.addPasscode(passcode)
  }

  /**
   * @returns whether the passcode was successfuly removed
   */
  public async removePasscode(): Promise<boolean> {
    return this.userService.removePasscode()
  }

  public async changePasscode(
    newPasscode: string,
    origination = Common.KeyParamsOrigination.PasscodeChange,
  ): Promise<boolean> {
    return this.userService.changePasscode(newPasscode, origination)
  }

  public getStorageEncryptionPolicy(): ExternalServices.StorageEncryptionPolicy {
    return this.diskStorageService.getStorageEncryptionPolicy()
  }

  public setStorageEncryptionPolicy(encryptionPolicy: ExternalServices.StorageEncryptionPolicy): Promise<void> {
    this.diskStorageService.setEncryptionPolicy(encryptionPolicy)
    return this.protocolService.repersistAllItems()
  }

  public enableEphemeralPersistencePolicy(): Promise<void> {
    return this.diskStorageService.setPersistencePolicy(ExternalServices.StoragePersistencePolicies.Ephemeral)
  }

  public hasPendingMigrations(): Promise<boolean> {
    return this.migrationService.hasPendingMigrations()
  }

  public generateUuid(): string {
    return Utils.UuidGenerator.GenerateUuid()
  }

  public presentKeyRecoveryWizard(): void {
    return this.keyRecoveryService.presentKeyRecoveryWizard()
  }

  public canAttemptDecryptionOfItem(item: EncryptedItemInterface): ClientDisplayableError | true {
    return this.keyRecoveryService.canAttemptDecryptionOfItem(item)
  }

  /**
   * Dynamically change the device interface, i.e when Desktop wants to override
   * default web interface.
   */
  public changeDeviceInterface(deviceInterface: ExternalServices.DeviceInterface): void {
    this.deviceInterface = deviceInterface

    for (const service of this.services) {
      if ('deviceInterface' in service) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(service as any)['deviceInterface'] = deviceInterface
      }
    }
  }

  public isMfaFeatureAvailable(): boolean {
    return this.mfaService.isMfaFeatureAvailable()
  }

  public async isMfaActivated(): Promise<boolean> {
    return this.mfaService.isMfaActivated()
  }

  public async generateMfaSecret(): Promise<string> {
    return this.mfaService.generateMfaSecret()
  }

  public async getOtpToken(secret: string): Promise<string> {
    return this.mfaService.getOtpToken(secret)
  }

  public async enableMfa(secret: string, otpToken: string): Promise<void> {
    return this.mfaService.enableMfa(secret, otpToken)
  }

  public async disableMfa(): Promise<void> {
    if (await this.protectionService.authorizeMfaDisable()) {
      return this.mfaService.disableMfa()
    }
  }

  public getNewSubscriptionToken(): Promise<string | undefined> {
    return this.apiService.getNewSubscriptionToken()
  }

  public isThirdPartyHostUsed(): boolean {
    return this.apiService.isThirdPartyHostUsed()
  }

  public getCloudProviderIntegrationUrl(cloudProviderName: Settings.CloudProvider, isDevEnvironment: boolean): string {
    return this.settingsService.getCloudProviderIntegrationUrl(cloudProviderName, isDevEnvironment)
  }

  private constructServices() {
    this.createPayloadManager()
    this.createItemManager()
    this.createDiskStorageManager()
    this.createInMemoryStorageManager()
    this.createProtocolService()
    this.diskStorageService.provideEncryptionProvider(this.protocolService)
    this.createChallengeService()
    this.createHttpManager()
    this.createApiService()
    this.createHttpService()
    this.createUserServer()
    this.createUserApiService()
    this.createSubscriptionServer()
    this.createSubscriptionApiService()
    this.createWebSocketServer()
    this.createWebSocketApiService()
    this.createSubscriptionManager()
    this.createWebSocketsService()
    this.createSessionManager()
    this.createHistoryManager()
    this.createSyncManager()
    this.createProtectionService()
    this.createUserService()
    this.createKeyRecoveryService()
    this.createSingletonManager()
    this.createPreferencesService()
    this.createSettingsService()
    this.createFeaturesService()
    this.createComponentManager()
    this.createMigrationService()
    this.createMfaService()
    this.createListedService()
    this.createActionsManager()
    this.createFileService()
    this.createIntegrityService()
    this.createMutatorService()
    this.createStatusService()

    if (isDesktopDevice(this.deviceInterface)) {
      this.createFilesBackupService(this.deviceInterface)
    }
  }

  private clearServices() {
    ;(this.migrationService as unknown) = undefined
    ;(this.alertService as unknown) = undefined
    ;(this.deprecatedHttpService as unknown) = undefined
    ;(this.httpService as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined
    ;(this.protocolService as unknown) = undefined
    ;(this.diskStorageService as unknown) = undefined
    ;(this.inMemoryStore as unknown) = undefined
    ;(this.apiService as unknown) = undefined
    ;(this.userApiService as unknown) = undefined
    ;(this.userServer as unknown) = undefined
    ;(this.subscriptionApiService as unknown) = undefined
    ;(this.subscriptionServer as unknown) = undefined
    ;(this.webSocketApiService as unknown) = undefined
    ;(this.webSocketServer as unknown) = undefined
    ;(this.subscriptionManager as unknown) = undefined
    ;(this.sessionManager as unknown) = undefined
    ;(this.syncService as unknown) = undefined
    ;(this.challengeService as unknown) = undefined
    ;(this.singletonManager as unknown) = undefined
    ;(this.componentManagerService as unknown) = undefined
    ;(this.protectionService as unknown) = undefined
    ;(this.actionsManager as unknown) = undefined
    ;(this.historyManager as unknown) = undefined
    ;(this.itemManager as unknown) = undefined
    ;(this.keyRecoveryService as unknown) = undefined
    ;(this.preferencesService as unknown) = undefined
    ;(this.featuresService as unknown) = undefined
    ;(this.userService as unknown) = undefined
    ;(this.webSocketsService as unknown) = undefined
    ;(this.settingsService as unknown) = undefined
    ;(this.mfaService as unknown) = undefined
    ;(this.listedService as unknown) = undefined
    ;(this.fileService as unknown) = undefined
    ;(this.integrityService as unknown) = undefined
    ;(this.mutatorService as unknown) = undefined
    ;(this.filesBackupService as unknown) = undefined
    ;(this.statusService as unknown) = undefined

    this.services = []
  }

  private constructInternalEventBus(): void {
    this.internalEventBus = new ExternalServices.InternalEventBus()
  }

  private defineInternalEventHandlers(): void {
    this.internalEventBus.addEventHandler(this.featuresService, ExternalServices.ApiServiceEvent.MetaReceived)
    this.internalEventBus.addEventHandler(this.integrityService, ExternalServices.SyncEvent.SyncRequestsIntegrityCheck)
    this.internalEventBus.addEventHandler(this.syncService, ExternalServices.IntegrityEvent.IntegrityCheckCompleted)
  }

  private clearInternalEventBus(): void {
    this.internalEventBus.deinit()
    ;(this.internalEventBus as unknown) = undefined
  }

  private createListedService(): void {
    this.listedService = new InternalServices.ListedService(
      this.apiService,
      this.itemManager,
      this.settingsService,
      this.deprecatedHttpService,
      this.internalEventBus,
    )
    this.services.push(this.listedService)
  }

  private createFileService() {
    this.fileService = new FileService(
      this.apiService,
      this.itemManager,
      this.syncService,
      this.protocolService,
      this.challengeService,
      this.alertService,
      this.options.crypto,
      this.internalEventBus,
    )

    this.services.push(this.fileService)
  }

  private createIntegrityService() {
    this.integrityService = new ExternalServices.IntegrityService(
      this.apiService,
      this.apiService,
      this.payloadManager,
      this.internalEventBus,
    )

    this.services.push(this.integrityService)
  }

  private createFeaturesService() {
    this.featuresService = new InternalServices.SNFeaturesService(
      this.diskStorageService,
      this.apiService,
      this.itemManager,
      this.webSocketsService,
      this.settingsService,
      this.userService,
      this.syncService,
      this.alertService,
      this.sessionManager,
      this.options.crypto,
      this.internalEventBus,
    )
    this.serviceObservers.push(
      this.featuresService.addEventObserver((event) => {
        switch (event) {
          case ExternalServices.FeaturesEvent.UserRolesChanged: {
            void this.notifyEvent(ApplicationEvent.UserRolesChanged)
            break
          }
          case ExternalServices.FeaturesEvent.FeaturesUpdated: {
            void this.notifyEvent(ApplicationEvent.FeaturesUpdated)
            break
          }
          default: {
            Utils.assertUnreachable(event)
          }
        }
      }),
    )
    this.services.push(this.featuresService)
  }

  private createWebSocketsService() {
    this.webSocketsService = new InternalServices.SNWebSocketsService(
      this.diskStorageService,
      this.options.webSocketUrl,
      this.webSocketApiService,
      this.internalEventBus,
    )
    this.services.push(this.webSocketsService)
  }

  private createMigrationService() {
    this.migrationService = new InternalServices.SNMigrationService({
      protocolService: this.protocolService,
      deviceInterface: this.deviceInterface,
      storageService: this.diskStorageService,
      sessionManager: this.sessionManager,
      challengeService: this.challengeService,
      itemManager: this.itemManager,
      singletonManager: this.singletonManager,
      featuresService: this.featuresService,
      environment: this.environment,
      identifier: this.identifier,
      internalEventBus: this.internalEventBus,
    })
    this.services.push(this.migrationService)
  }

  private createUserService(): void {
    this.userService = new InternalServices.UserService(
      this.sessionManager,
      this.syncService,
      this.diskStorageService,
      this.itemManager,
      this.protocolService,
      this.alertService,
      this.challengeService,
      this.protectionService,
      this.apiService,
      this.internalEventBus,
    )
    this.serviceObservers.push(
      this.userService.addEventObserver(async (event, data) => {
        switch (event) {
          case InternalServices.AccountEvent.SignedInOrRegistered: {
            void this.notifyEvent(ApplicationEvent.SignedIn)
            break
          }
          case InternalServices.AccountEvent.SignedOut: {
            await this.notifyEvent(ApplicationEvent.SignedOut)
            await this.prepareForDeinit()
            this.deinit(this.getDeinitMode(), data?.source || DeinitSource.SignOut)
            break
          }
          default: {
            Utils.assertUnreachable(event)
          }
        }
      }),
    )
    this.services.push(this.userService)
  }

  private createApiService() {
    this.apiService = new InternalServices.SNApiService(
      this.deprecatedHttpService,
      this.diskStorageService,
      this.options.defaultHost,
      this.inMemoryStore,
      this.options.crypto,
      this.internalEventBus,
    )
    this.services.push(this.apiService)
  }

  private createUserApiService() {
    this.userApiService = new UserApiService(this.userServer)
  }

  private createUserServer() {
    this.userServer = new UserServer(this.httpService)
  }

  private createSubscriptionApiService() {
    this.subscriptionApiService = new SubscriptionApiService(this.subscriptionServer)
  }

  private createSubscriptionServer() {
    this.subscriptionServer = new SubscriptionServer(this.httpService)
  }

  private createWebSocketApiService() {
    this.webSocketApiService = new WebSocketApiService(this.webSocketServer)
  }

  private createWebSocketServer() {
    this.webSocketServer = new WebSocketServer(this.httpService)
  }

  private createSubscriptionManager() {
    this.subscriptionManager = new SubscriptionManager(this.subscriptionApiService, this.internalEventBus)
  }

  private createItemManager() {
    this.itemManager = new InternalServices.ItemManager(this.payloadManager, this.options, this.internalEventBus)
    this.services.push(this.itemManager)
  }

  private createComponentManager() {
    const MaybeSwappedComponentManager = this.getClass<typeof InternalServices.SNComponentManager>(
      InternalServices.SNComponentManager,
    )
    this.componentManagerService = new MaybeSwappedComponentManager(
      this.itemManager,
      this.syncService,
      this.featuresService,
      this.preferencesService,
      this.alertService,
      this.environment,
      this.platform,
      this.internalEventBus,
    )
    this.services.push(this.componentManagerService)
  }

  private createHttpManager() {
    this.deprecatedHttpService = new InternalServices.SNHttpService(
      this.environment,
      this.options.appVersion,
      this.internalEventBus,
    )
    this.services.push(this.deprecatedHttpService)
  }

  private createHttpService() {
    this.httpService = new HttpService(
      this.environment,
      this.options.appVersion,
      SnjsVersion,
      this.options.defaultHost,
      this.apiService.processMetaObject.bind(this.apiService),
    )
  }

  private createPayloadManager() {
    this.payloadManager = new InternalServices.PayloadManager(this.internalEventBus)
    this.services.push(this.payloadManager)
  }

  private createSingletonManager() {
    this.singletonManager = new InternalServices.SNSingletonManager(
      this.itemManager,
      this.payloadManager,
      this.syncService,
      this.internalEventBus,
    )
    this.services.push(this.singletonManager)
  }

  private createDiskStorageManager() {
    this.diskStorageService = new InternalServices.DiskStorageService(
      this.deviceInterface,
      this.identifier,
      this.environment,
      this.internalEventBus,
    )
    this.services.push(this.diskStorageService)
  }

  private createInMemoryStorageManager() {
    this.inMemoryStore = new ExternalServices.InMemoryStore()
  }

  private createProtocolService() {
    this.protocolService = new EncryptionService(
      this.itemManager,
      this.payloadManager,
      this.deviceInterface,
      this.diskStorageService,
      this.identifier,
      this.options.crypto,
      this.internalEventBus,
    )
    this.serviceObservers.push(
      this.protocolService.addEventObserver(async (event) => {
        if (event === EncryptionServiceEvent.RootKeyStatusChanged) {
          await this.notifyEvent(ApplicationEvent.KeyStatusChanged)
        }
      }),
    )
    this.services.push(this.protocolService)
  }

  private createKeyRecoveryService() {
    this.keyRecoveryService = new InternalServices.SNKeyRecoveryService(
      this.itemManager,
      this.payloadManager,
      this.apiService,
      this.protocolService,
      this.challengeService,
      this.alertService,
      this.diskStorageService,
      this.syncService,
      this.userService,
      this.internalEventBus,
    )
    this.services.push(this.keyRecoveryService)
  }

  private createSessionManager() {
    this.sessionManager = new InternalServices.SNSessionManager(
      this.diskStorageService,
      this.apiService,
      this.userApiService,
      this.alertService,
      this.protocolService,
      this.challengeService,
      this.webSocketsService,
      this.httpService,
      this.internalEventBus,
    )
    this.serviceObservers.push(
      this.sessionManager.addEventObserver(async (event) => {
        switch (event) {
          case InternalServices.SessionEvent.Restored: {
            void (async () => {
              await this.sync.sync()
              if (this.protocolService.needsNewRootKeyBasedItemsKey()) {
                void this.protocolService.createNewDefaultItemsKey().then(() => {
                  void this.sync.sync()
                })
              }
            })()
            break
          }
          case InternalServices.SessionEvent.Revoked: {
            await this.handleRevokedSession()
            break
          }
          default: {
            Utils.assertUnreachable(event)
          }
        }
      }),
    )
    this.services.push(this.sessionManager)
  }

  private createSyncManager() {
    this.syncService = new InternalServices.SNSyncService(
      this.itemManager,
      this.sessionManager,
      this.protocolService,
      this.diskStorageService,
      this.payloadManager,
      this.apiService,
      this.historyManager,
      {
        loadBatchSize: this.options.loadBatchSize,
      },
      this.internalEventBus,
    )
    const syncEventCallback = async (eventName: ExternalServices.SyncEvent) => {
      const appEvent = applicationEventForSyncEvent(eventName)
      if (appEvent) {
        await this.notifyEvent(appEvent)
        if (appEvent === ApplicationEvent.CompletedFullSync) {
          if (!this.handledFullSyncStage) {
            this.handledFullSyncStage = true
            await this.handleStage(ExternalServices.ApplicationStage.FullSyncCompleted_13)
          }
        }
      }
      await this.protocolService.onSyncEvent(eventName)
    }
    const uninstall = this.syncService.addEventObserver(syncEventCallback)
    this.serviceObservers.push(uninstall)
    this.services.push(this.syncService)
  }

  private createChallengeService() {
    this.challengeService = new InternalServices.ChallengeService(
      this.diskStorageService,
      this.protocolService,
      this.internalEventBus,
    )
    this.services.push(this.challengeService)
  }

  private createProtectionService() {
    this.protectionService = new InternalServices.SNProtectionService(
      this.protocolService,
      this.challengeService,
      this.diskStorageService,
      this.internalEventBus,
    )
    this.serviceObservers.push(
      this.protectionService.addEventObserver((event) => {
        if (event === InternalServices.ProtectionEvent.UnprotectedSessionBegan) {
          void this.notifyEvent(ApplicationEvent.UnprotectedSessionBegan)
        } else if (event === InternalServices.ProtectionEvent.UnprotectedSessionExpired) {
          void this.notifyEvent(ApplicationEvent.UnprotectedSessionExpired)
        }
      }),
    )
    this.services.push(this.protectionService)
  }

  private createHistoryManager() {
    this.historyManager = new InternalServices.SNHistoryManager(
      this.itemManager,
      this.diskStorageService,
      this.apiService,
      this.protocolService,
      this.deviceInterface,
      this.internalEventBus,
    )
    this.services.push(this.historyManager)
  }

  private createActionsManager() {
    this.actionsManager = new InternalServices.SNActionsService(
      this.itemManager,
      this.alertService,
      this.deviceInterface,
      this.deprecatedHttpService,
      this.payloadManager,
      this.protocolService,
      this.syncService,
      this.challengeService,
      this.listedService,
      this.internalEventBus,
    )
    this.services.push(this.actionsManager)
  }

  private createPreferencesService() {
    this.preferencesService = new InternalServices.SNPreferencesService(
      this.singletonManager,
      this.itemManager,
      this.syncService,
      this.internalEventBus,
    )
    this.serviceObservers.push(
      this.preferencesService.addEventObserver(() => {
        void this.notifyEvent(ApplicationEvent.PreferencesChanged)
      }),
    )
    this.services.push(this.preferencesService)
  }

  private createSettingsService() {
    this.settingsService = new InternalServices.SNSettingsService(
      this.sessionManager,
      this.apiService,
      this.internalEventBus,
    )
    this.services.push(this.settingsService)
  }

  private createMfaService() {
    this.mfaService = new InternalServices.SNMfaService(
      this.settingsService,
      this.options.crypto,
      this.featuresService,
      this.internalEventBus,
    )
    this.services.push(this.mfaService)
  }

  private createMutatorService() {
    this.mutatorService = new InternalServices.MutatorService(
      this.itemManager,
      this.syncService,
      this.protectionService,
      this.protocolService,
      this.payloadManager,
      this.challengeService,
      this.componentManagerService,
      this.historyManager,
      this.internalEventBus,
    )
    this.services.push(this.mutatorService)
  }

  private createFilesBackupService(device: ExternalServices.DesktopDeviceInterface): void {
    this.filesBackupService = new FilesBackupService(
      this.itemManager,
      this.apiService,
      this.protocolService,
      device,
      this.statusService,
      this.internalEventBus,
    )
    this.services.push(this.filesBackupService)
  }

  private createStatusService(): void {
    this.statusService = new ExternalServices.StatusService(this.internalEventBus)
    this.services.push(this.statusService)
  }

  private getClass<T>(base: T) {
    const swapClass = this.options.swapClasses?.find((candidate) => candidate.swap === base)
    if (swapClass) {
      return swapClass.with as T
    } else {
      return base
    }
  }
}
