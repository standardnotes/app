import { MfaService } from './../Services/Mfa/MfaService'
import { KeyRecoveryService } from './../Services/KeyRecovery/KeyRecoveryService'
import { MigrationService } from './../Services/Migration/MigrationService'
import { LegacyApiService } from './../Services/Api/ApiService'
import { FeaturesService } from '@Lib/Services/Features/FeaturesService'
import { PreferencesService } from './../Services/Preferences/PreferencesService'
import { ProtectionService } from './../Services/Protection/ProtectionService'
import { SessionManager } from './../Services/Session/SessionManager'
import { HttpService, HttpServiceInterface, UserRegistrationResponseBody } from '@standardnotes/api'
import { ApplicationIdentifier, compareVersions, ProtocolVersion, KeyParamsOrigination } from '@standardnotes/common'
import {
  DeinitCallback,
  SessionEvent,
  SyncEvent,
  ApplicationStage,
  FeaturesEvent,
  SyncMode,
  SyncSource,
  ApplicationStageChangedEventPayload,
  StorageValueModes,
  ChallengeObserver,
  ImportDataResult,
  ImportData,
  StoragePersistencePolicies,
  HomeServerServiceInterface,
  DeviceInterface,
  SubscriptionManagerInterface,
  FeaturesClientInterface,
  ItemManagerInterface,
  SyncServiceInterface,
  UserServiceInterface,
  MutatorClientInterface,
  StatusServiceInterface,
  AlertService,
  StorageServiceInterface,
  ChallengeServiceInterface,
  AsymmetricMessageServiceInterface,
  VaultServiceInterface,
  ContactServiceInterface,
  SharedVaultServiceInterface,
  PreferenceServiceInterface,
  InternalEventBusInterface,
  ApplicationEvent,
  ApplicationEventCallback,
  ChallengeValidation,
  ComponentManagerInterface,
  ChallengeValue,
  StorageKey,
  ChallengeReason,
  DeinitMode,
  DeinitSource,
  AppGroupManagedApplication,
  ApplicationInterface,
  EncryptionService,
  EncryptionServiceEvent,
  Challenge,
  ErrorAlertStrings,
  SessionsClientInterface,
  ProtectionsClientInterface,
  UserService,
  ProtocolUpgradeStrings,
  CredentialsChangeFunctionResponse,
  SessionStrings,
  AccountEvent,
  PayloadManagerInterface,
  HistoryServiceInterface,
  InternalEventPublishStrategy,
  EncryptionProviderInterface,
  VaultUserServiceInterface,
  VaultInviteServiceInterface,
  VaultLockServiceInterface,
  ApplicationConstructorOptions,
  FullyResolvedApplicationOptions,
  ApplicationOptionsDefaults,
  ChangeAndSaveItem,
  ProtectionEvent,
  GetHost,
  SetHost,
  MfaServiceInterface,
  GenerateUuid,
  CreateDecryptedBackupFile,
  CreateEncryptedBackupFile,
  WebSocketsService,
  PreferencesServiceEvent,
} from '@standardnotes/services'
import {
  SNNote,
  PrefKey,
  PrefValue,
  BackupFile,
  EncryptedItemInterface,
  Environment,
  Platform,
} from '@standardnotes/models'
import {
  HttpResponse,
  SessionListResponse,
  SignInResponse,
  ClientDisplayableError,
  SessionListEntry,
  MetaEndpointResponse,
} from '@standardnotes/responses'
import {
  SyncService,
  SettingsService,
  ActionsService,
  ChallengeResponse,
  ListedClientInterface,
  DiskStorageService,
} from '../Services'
import {
  nonSecureRandomIdentifier,
  assertUnreachable,
  removeFromArray,
  isNullOrUndefined,
  sleep,
  useBoolean,
  LoggerInterface,
  canBlockDeinit,
} from '@standardnotes/utils'
import { UuidString } from '../Types'
import { applicationEventForSyncEvent } from '@Lib/Application/Event'
import { BackupServiceInterface, FilesClientInterface } from '@standardnotes/files'
import { ComputePrivateUsername } from '@standardnotes/encryption'
import { SNLog } from '../Log'
import { SignInWithRecoveryCodes } from '@Lib/Domain/UseCase/SignInWithRecoveryCodes/SignInWithRecoveryCodes'
import { UseCaseContainerInterface } from '@Lib/Domain/UseCase/UseCaseContainerInterface'
import { GetRecoveryCodes } from '@Lib/Domain/UseCase/GetRecoveryCodes/GetRecoveryCodes'
import { AddAuthenticator } from '@Lib/Domain/UseCase/AddAuthenticator/AddAuthenticator'
import { ListAuthenticators } from '@Lib/Domain/UseCase/ListAuthenticators/ListAuthenticators'
import { DeleteAuthenticator } from '@Lib/Domain/UseCase/DeleteAuthenticator/DeleteAuthenticator'
import { ListRevisions } from '@Lib/Domain/UseCase/ListRevisions/ListRevisions'
import { GetRevision } from '@Lib/Domain/UseCase/GetRevision/GetRevision'
import { DeleteRevision } from '@Lib/Domain/UseCase/DeleteRevision/DeleteRevision'
import { GetAuthenticatorAuthenticationResponse } from '@Lib/Domain/UseCase/GetAuthenticatorAuthenticationResponse/GetAuthenticatorAuthenticationResponse'
import { GetAuthenticatorAuthenticationOptions } from '@Lib/Domain/UseCase/GetAuthenticatorAuthenticationOptions/GetAuthenticatorAuthenticationOptions'
import { Dependencies } from './Dependencies/Dependencies'
import { TYPES } from './Dependencies/Types'
import { RegisterApplicationServicesEvents } from './Dependencies/DependencyEvents'
import { Result } from '@standardnotes/domain-core'

type LaunchCallback = {
  receiveChallenge: (challenge: Challenge) => void
}

type ApplicationObserver = {
  singleEvent?: ApplicationEvent
  callback: ApplicationEventCallback
}

type ObserverRemover = () => void

export class SNApplication implements ApplicationInterface, AppGroupManagedApplication, UseCaseContainerInterface {
  onDeinit!: DeinitCallback

  /**
   * A runtime based identifier for each dynamic instantiation of the application instance.
   * This differs from the persistent application.identifier which persists in storage
   * across instantiations.
   */
  public readonly ephemeralIdentifier = nonSecureRandomIdentifier()

  private eventHandlers: ApplicationObserver[] = []

  private serviceObservers: ObserverRemover[] = []
  private managedSubscribers: ObserverRemover[] = []

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

  public readonly identifier: ApplicationIdentifier
  public readonly options: FullyResolvedApplicationOptions

  private dependencies: Dependencies

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
      'apiVersion',
    ]

    for (const optionName of requiredOptions) {
      if (!allOptions[optionName]) {
        throw Error(`${optionName} must be supplied when creating an application.`)
      }
    }

    this.environment = options.environment
    this.platform = options.platform

    this.identifier = options.identifier
    this.options = Object.freeze(allOptions)

    this.dependencies = new Dependencies(this.options)

    const logger = this.dependencies.get<LoggerInterface>(TYPES.Logger)
    logger.setLevel('error')

    this.registerServiceObservers()

    RegisterApplicationServicesEvents(this.dependencies, this.events)
  }

  private registerServiceObservers() {
    const encryptionService = this.dependencies.get<EncryptionService>(TYPES.EncryptionService)
    this.serviceObservers.push(
      encryptionService.addEventObserver(async (event) => {
        if (event === EncryptionServiceEvent.RootKeyStatusChanged) {
          await this.notifyEvent(ApplicationEvent.KeyStatusChanged)
        }
      }),
    )

    this.dependencies.get<DiskStorageService>(TYPES.DiskStorageService).provideEncryptionProvider(encryptionService)

    const apiService = this.dependencies.get<LegacyApiService>(TYPES.LegacyApiService)
    this.dependencies
      .get<HttpService>(TYPES.HttpService)
      .setCallbacks(apiService.processMetaObject.bind(apiService), apiService.setSession.bind(apiService))

    this.serviceObservers.push(
      this.dependencies.get<SessionManager>(TYPES.SessionManager).addEventObserver(async (event) => {
        switch (event) {
          case SessionEvent.Restored: {
            void (async () => {
              await this.sync.sync({ sourceDescription: 'Session restored pre key creation' })
              if (encryptionService.needsNewRootKeyBasedItemsKey()) {
                void encryptionService.createNewDefaultItemsKey().then(() => {
                  void this.sync.sync({ sourceDescription: 'Session restored post key creation' })
                })
              }
            })()
            break
          }
          case SessionEvent.Revoked: {
            await this.handleRevokedSession()
            break
          }
          case SessionEvent.UserKeyPairChanged:
            break
          default: {
            assertUnreachable(event)
          }
        }
      }),
    )

    const syncEventCallback = async (eventName: SyncEvent, data?: unknown) => {
      const appEvent = applicationEventForSyncEvent(eventName)
      if (appEvent) {
        await encryptionService.onSyncEvent(eventName)

        await this.notifyEvent(appEvent, data)

        if (appEvent === ApplicationEvent.CompletedFullSync) {
          if (!this.handledFullSyncStage) {
            this.handledFullSyncStage = true
            await this.handleStage(ApplicationStage.FullSyncCompleted_13)
          }
        }
      }
    }
    const syncService = this.dependencies.get<SyncService>(TYPES.SyncService)
    const uninstall = syncService.addEventObserver(syncEventCallback)
    this.serviceObservers.push(uninstall)

    const protectionService = this.dependencies.get<ProtectionService>(TYPES.ProtectionService)
    this.serviceObservers.push(
      protectionService.addEventObserver((event) => {
        if (event === ProtectionEvent.UnprotectedSessionBegan) {
          void this.notifyEvent(ApplicationEvent.UnprotectedSessionBegan)
        } else if (event === ProtectionEvent.UnprotectedSessionExpired) {
          void this.notifyEvent(ApplicationEvent.UnprotectedSessionExpired)
        }
      }),
    )

    const userService = this.dependencies.get<UserService>(TYPES.UserService)
    this.serviceObservers.push(
      userService.addEventObserver(async (event, data) => {
        switch (event) {
          case AccountEvent.SignedInOrRegistered: {
            void this.notifyEvent(ApplicationEvent.SignedIn)
            break
          }
          case AccountEvent.SignedOut: {
            await this.notifyEvent(ApplicationEvent.SignedOut)
            await this.prepareForDeinit()
            this.deinit(this.getDeinitMode(), data?.payload.source || DeinitSource.SignOut)
            break
          }
          default: {
            assertUnreachable(event)
          }
        }
      }),
    )

    const preferencesService = this.dependencies.get<PreferencesService>(TYPES.PreferencesService)
    this.serviceObservers.push(
      preferencesService.addEventObserver((event) => {
        if (event === PreferencesServiceEvent.PreferencesChanged) {
          void this.notifyEvent(ApplicationEvent.PreferencesChanged)
        } else if (event === PreferencesServiceEvent.LocalPreferencesChanged) {
          void this.notifyEvent(ApplicationEvent.LocalPreferencesChanged)
        }
      }),
    )

    const featuresService = this.dependencies.get<FeaturesService>(TYPES.FeaturesService)
    this.serviceObservers.push(
      featuresService.addEventObserver((event) => {
        switch (event) {
          case FeaturesEvent.UserRolesChanged: {
            void this.notifyEvent(ApplicationEvent.UserRolesChanged)
            break
          }
          case FeaturesEvent.FeaturesAvailabilityChanged: {
            void this.notifyEvent(ApplicationEvent.FeaturesAvailabilityChanged)
            break
          }
          case FeaturesEvent.DidPurchaseSubscription: {
            void this.notifyEvent(ApplicationEvent.DidPurchaseSubscription)
            break
          }
          default: {
            assertUnreachable(event)
          }
        }
      }),
    )
  }

  public computePrivateUsername(username: string): Promise<string | undefined> {
    return ComputePrivateUsername(this.options.crypto, username)
  }

  /**
   * The first thing consumers should call when starting their app.
   * This function will load all services in their correct order.
   */
  async prepareForLaunch(callback: LaunchCallback): Promise<void> {
    if (this.launched) {
      throw new Error('Attempting to prelaunch already launched application')
    }

    await this.options.crypto.initialize()

    this.setLaunchCallback(callback)

    const databaseResult = await this.device.openDatabase(this.identifier).catch((error) => {
      void this.notifyEvent(ApplicationEvent.LocalDatabaseReadError, error)
      return undefined
    })

    this.createdNewDatabase = useBoolean(databaseResult?.isNewDatabase, false)

    await this.migrations.initialize()

    await this.notifyEvent(ApplicationEvent.MigrationsLoaded)
    await this.handleStage(ApplicationStage.PreparingForLaunch_0)

    await this.storage.initializeFromDisk()
    await this.notifyEvent(ApplicationEvent.StorageReady)

    await this.encryption.initialize()

    await this.handleStage(ApplicationStage.ReadyForLaunch_05)

    this.started = true
    await this.notifyEvent(ApplicationEvent.Started)
  }

  private setLaunchCallback(callback: LaunchCallback) {
    this.challenges.sendChallenge = callback.receiveChallenge
  }

  /**
   * Handles device authentication, unlocks application, and
   * issues a callback if a device activation requires user input
   * (i.e local passcode or fingerprint).
   * @param awaitDatabaseLoad
   * Option to await database load before marking the app as ready.
   */
  public async launch(awaitDatabaseLoad = false): Promise<void> {
    if (this.launched) {
      throw new Error('Attempting to launch already launched application')
    }

    this.launched = false

    const launchChallenge = this.getLaunchChallenge()
    if (launchChallenge) {
      const response = await this.challenges.promptForChallengeResponse(launchChallenge)
      if (!response) {
        throw Error('Launch challenge was cancelled.')
      }
      await this.handleLaunchChallengeResponse(response)
    }

    if (this.storage.isStorageWrapped()) {
      try {
        await this.storage.decryptStorage()
      } catch (_error) {
        void this.alerts.alert(ErrorAlertStrings.StorageDecryptErrorBody, ErrorAlertStrings.StorageDecryptErrorTitle)
      }
    }

    await this.handleStage(ApplicationStage.StorageDecrypted_09)

    const host = this.legacyApi.loadHost()

    this.http.setHost(host)

    this.sockets.loadWebSocketUrl()

    this.settings.initializeFromDisk()

    this.launched = true
    await this.notifyEvent(ApplicationEvent.Launched)
    await this.handleStage(ApplicationStage.Launched_10)

    await this.handleStage(ApplicationStage.LoadingDatabase_11)
    if (this.createdNewDatabase) {
      await this.sync.onNewDatabaseCreated()
    }
    /**
     * We don't want to await this, as we want to begin allowing the app to function
     * before local data has been loaded fully.
     */
    const loadPromise = this.sync
      .loadDatabasePayloads()
      .then(async () => {
        if (this.dealloced) {
          throw 'Application has been destroyed.'
        }
        await this.handleStage(ApplicationStage.LoadedDatabase_12)
        this.sync.beginAutoSyncTimer()
        await this.sync.sync({
          mode: SyncMode.DownloadFirst,
          source: SyncSource.External,
          sourceDescription: 'Application Launch',
        })
        this.vaultUsers.invalidateVaultUsersCache().catch(console.error)
      })
      .catch((error) => {
        void this.notifyEvent(ApplicationEvent.LocalDatabaseReadError, error)
        throw error
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
    return this.protections.createLaunchChallenge()
  }

  private async handleLaunchChallengeResponse(response: ChallengeResponse) {
    if (response.challenge.hasPromptForValidationType(ChallengeValidation.LocalPasscode)) {
      let wrappingKey = response.artifacts?.wrappingKey
      if (!wrappingKey) {
        const value = response.getValueForType(ChallengeValidation.LocalPasscode)
        wrappingKey = await this.encryption.computeWrappingKey(value.value as string)
      }
      await this.encryption.unwrapRootKey(wrappingKey)
    }
  }

  private async handleStage(stage: ApplicationStage) {
    await this.events.publishSync(
      {
        type: ApplicationEvent.ApplicationStageChanged,
        payload: { stage } as ApplicationStageChangedEventPayload,
      },
      InternalEventPublishStrategy.SEQUENCE,
    )
  }

  /**
   * @param singleEvent Whether to only listen for a particular event.
   */
  public addEventObserver(callback: ApplicationEventCallback, singleEvent?: ApplicationEvent): () => void {
    const observer = { callback, singleEvent }
    this.eventHandlers.push(observer)
    return () => {
      removeFromArray(this.eventHandlers, observer)
    }
  }

  public addSingleEventObserver(event: ApplicationEvent, callback: ApplicationEventCallback): () => void {
    const filteredCallback = async (firedEvent: ApplicationEvent) => {
      if (firedEvent === event) {
        void callback(event)
      }
    }
    return this.addEventObserver(filteredCallback, event)
  }

  private async notifyEvent(event: ApplicationEvent, data?: unknown) {
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

    this.events.publish({
      type: event,
      payload: data,
    })

    void this.migrations.handleApplicationEvent(event)
  }

  public getSessions(): Promise<HttpResponse<SessionListEntry[]>> {
    return this.sessions.getSessionsList()
  }

  public async revokeSession(sessionId: UuidString): Promise<HttpResponse<SessionListResponse> | undefined> {
    if (await this.protections.authorizeSessionRevoking()) {
      return this.sessions.revokeSession(sessionId)
    }
    return undefined
  }

  /**
   * Revokes all sessions except the current one.
   */
  public async revokeAllOtherSessions(): Promise<void> {
    return this.sessions.revokeAllOtherSessions()
  }

  public userCanManageSessions(): boolean {
    const userVersion = this.getUserVersion()
    if (isNullOrUndefined(userVersion)) {
      return false
    }
    return compareVersions(userVersion, ProtocolVersion.V004) >= 0
  }

  public async setCustomHost(host: string, websocketUrl?: string): Promise<void> {
    await this.setHost.execute(host)

    this.sockets.setWebSocketUrl(websocketUrl)
  }

  public getUserPasswordCreationDate(): Date | undefined {
    return this.encryption.getPasswordCreatedDate()
  }

  public getProtocolEncryptionDisplayName(): Promise<string | undefined> {
    return this.encryption.getEncryptionDisplayName()
  }

  public getUserVersion(): ProtocolVersion | undefined {
    return this.encryption.getUserVersion()
  }

  /**
   * Returns true if there is an upgrade available for the account or passcode
   */
  public protocolUpgradeAvailable(): Promise<boolean> {
    return this.encryption.upgradeAvailable()
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
    const result = await this.user.performProtocolUpgrade()
    if (result.success) {
      if (this.hasAccount()) {
        void this.alerts.alert(ProtocolUpgradeStrings.SuccessAccount)
      } else {
        void this.alerts.alert(ProtocolUpgradeStrings.SuccessPasscodeOnly)
      }
    } else if (result.error) {
      void this.alerts.alert(ProtocolUpgradeStrings.Fail)
    }
    return result
  }

  public hasAccount(): boolean {
    return this.encryption.hasAccount()
  }

  /**
   * @returns true if the user has a source of protection available, such as a
   * passcode, password, or biometrics.
   */
  public hasProtectionSources(): boolean {
    return this.protections.hasProtectionSources()
  }

  /**
   * When a user specifies a non-zero remember duration on a protection
   * challenge, a session will be started during which protections are disabled.
   */
  public getProtectionSessionExpiryDate(): Date {
    return this.protections.getSessionExpiryDate()
  }

  public clearProtectionSession(): Promise<void> {
    return this.protections.clearSession()
  }

  public async authorizeProtectedActionForNotes(notes: SNNote[], challengeReason: ChallengeReason): Promise<SNNote[]> {
    return await this.protections.authorizeProtectedActionForItems(notes, challengeReason)
  }

  /**
   * @returns whether note access has been granted or not
   */
  public authorizeNoteAccess(note: SNNote): Promise<boolean> {
    return this.protections.authorizeItemAccess(note)
  }

  public authorizeAutolockIntervalChange(): Promise<boolean> {
    return this.protections.authorizeAutolockIntervalChange()
  }

  public isEphemeralSession(): boolean {
    return this.storage.isEphemeralSession()
  }

  public setValue(key: string, value: unknown, mode?: StorageValueModes): void {
    return this.storage.setValue(key, value, mode)
  }

  public getValue<T>(key: string, mode?: StorageValueModes): T {
    return this.storage.getValue<T>(key, mode)
  }

  public async removeValue(key: string, mode?: StorageValueModes): Promise<void> {
    return this.storage.removeValue(key, mode)
  }

  public getPreference<K extends PrefKey>(key: K): PrefValue[K] | undefined
  public getPreference<K extends PrefKey>(key: K, defaultValue: PrefValue[K]): PrefValue[K]
  public getPreference<K extends PrefKey>(key: K, defaultValue?: PrefValue[K]): PrefValue[K] | undefined {
    return this.preferences.getValue(key, defaultValue)
  }

  public async setPreference<K extends PrefKey>(key: K, value: PrefValue[K]): Promise<void> {
    return this.preferences.setValue(key, value)
  }

  /**
   * Gives services a chance to complete any sensitive operations before yielding
   * @param maxWait The maximum number of milliseconds to wait for services
   * to finish tasks. 0 means no limit.
   */
  private async prepareForDeinit(maxWait = 0): Promise<void> {
    const deps = this.dependencies.getAll().filter(canBlockDeinit)
    const promise = Promise.all(deps.map((service) => service.blockDeinit()))
    if (maxWait === 0) {
      await promise
    } else {
      /** Await up to maxWait. If not resolved by then, return. */
      await Promise.race([promise, sleep(maxWait, false, 'Preparing for deinit...')])
    }
  }

  public addChallengeObserver(challenge: Challenge, observer: ChallengeObserver): () => void {
    return this.challenges.addChallengeObserver(challenge, observer)
  }

  public submitValuesForChallenge(challenge: Challenge, values: ChallengeValue[]): Promise<void> {
    return this.challenges.submitValuesForChallenge(challenge, values)
  }

  public cancelChallenge(challenge: Challenge): void {
    this.challenges.cancelChallenge(challenge)
  }

  public setOnDeinit(onDeinit: DeinitCallback): void {
    this.onDeinit = onDeinit
  }

  /**
   * Destroys the application instance.
   */
  public deinit(mode: DeinitMode, source: DeinitSource): void {
    this.dealloced = true

    for (const uninstallObserver of this.serviceObservers) {
      uninstallObserver()
    }

    for (const uninstallSubscriber of this.managedSubscribers) {
      uninstallSubscriber()
    }

    this.options.crypto.deinit()
    ;(this.options as unknown) = undefined

    this.createdNewDatabase = false

    this.serviceObservers.length = 0
    this.managedSubscribers.length = 0

    this.started = false

    this.dependencies.deinit()

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
    hvmToken: string,
    ephemeral = false,
    mergeLocal = true,
  ): Promise<UserRegistrationResponseBody> {
    return this.user.register(email, password, hvmToken, ephemeral, mergeLocal)
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
    hvmToken?: string,
  ): Promise<HttpResponse<SignInResponse>> {
    return this.user.signIn(email, password, strict, ephemeral, mergeLocal, awaitSync, hvmToken)
  }

  public async getCaptchaUrl(): Promise<HttpResponse<MetaEndpointResponse>> {
    return this.legacyApi.getCaptchaUrl()
  }

  public async changeEmail(
    newEmail: string,
    currentPassword: string,
    passcode?: string,
    origination = KeyParamsOrigination.EmailChange,
  ): Promise<CredentialsChangeFunctionResponse> {
    return this.user.changeCredentials({
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
    origination = KeyParamsOrigination.PasswordChange,
    validateNewPasswordStrength = true,
  ): Promise<CredentialsChangeFunctionResponse> {
    return this.user.changeCredentials({
      currentPassword,
      newPassword,
      passcode,
      origination,
      validateNewPasswordStrength,
    })
  }

  public async importData(data: BackupFile, awaitSync = false): Promise<Result<ImportDataResult>> {
    const usecase = this.dependencies.get<ImportData>(TYPES.ImportData)
    return usecase.execute(data, awaitSync)
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
    const alertService = this.alerts
    await this.user.signOut(true)
    void alertService.alert(SessionStrings.CurrentSessionRevoked)
  }

  public async validateAccountPassword(password: string): Promise<boolean> {
    const { valid } = await this.encryption.validateAccountPassword(password)
    return valid
  }

  public isStarted(): boolean {
    return this.started
  }

  public isLaunched(): boolean {
    return this.launched
  }

  public hasPasscode(): boolean {
    return this.encryption.hasPasscode()
  }

  public async lock(): Promise<void> {
    /**
     * Because locking is a critical operation, we want to try to do it safely,
     * but only up to a certain limit.
     */
    const MaximumWaitTime = 500

    await this.prepareForDeinit(MaximumWaitTime)

    return this.deinit(this.getDeinitMode(), DeinitSource.Lock)
  }

  isNativeMobileWeb() {
    return this.environment === Environment.Mobile
  }

  getDeinitMode(): DeinitMode {
    const value = this.getValue(StorageKey.DeinitMode)
    if (value === 'hard') {
      return DeinitMode.Hard
    }

    return DeinitMode.Soft
  }

  public addPasscode(passcode: string): Promise<boolean> {
    return this.user.addPasscode(passcode)
  }

  /**
   * @returns whether the passcode was successfuly removed
   */
  public async removePasscode(): Promise<boolean> {
    return this.user.removePasscode()
  }

  public async changePasscode(
    newPasscode: string,
    origination = KeyParamsOrigination.PasscodeChange,
  ): Promise<boolean> {
    return this.user.changePasscode(newPasscode, origination)
  }

  public enableEphemeralPersistencePolicy(): Promise<void> {
    return this.storage.setPersistencePolicy(StoragePersistencePolicies.Ephemeral)
  }

  public hasPendingMigrations(): Promise<boolean> {
    return this.migrations.hasPendingMigrations()
  }

  public presentKeyRecoveryWizard(): void {
    const service = this.dependencies.get<KeyRecoveryService>(TYPES.KeyRecoveryService)
    return service.presentKeyRecoveryWizard()
  }

  public canAttemptDecryptionOfItem(item: EncryptedItemInterface): ClientDisplayableError | true {
    const service = this.dependencies.get<KeyRecoveryService>(TYPES.KeyRecoveryService)
    return service.canAttemptDecryptionOfItem(item)
  }

  async isUsingHomeServer(): Promise<boolean> {
    const homeServerService = this.dependencies.get<HomeServerServiceInterface>(TYPES.HomeServerService)

    if (!homeServerService) {
      return false
    }

    return this.getHost.execute().getValue() === (await homeServerService.getHomeServerUrl())
  }

  get device(): DeviceInterface {
    return this.dependencies.get<DeviceInterface>(TYPES.DeviceInterface)
  }

  get subscriptions(): SubscriptionManagerInterface {
    return this.dependencies.get<SubscriptionManagerInterface>(TYPES.SubscriptionManager)
  }

  get signInWithRecoveryCodes(): SignInWithRecoveryCodes {
    return this.dependencies.get<SignInWithRecoveryCodes>(TYPES.SignInWithRecoveryCodes)
  }

  get getRecoveryCodes(): GetRecoveryCodes {
    return this.dependencies.get<GetRecoveryCodes>(TYPES.GetRecoveryCodes)
  }

  get addAuthenticator(): AddAuthenticator {
    return this.dependencies.get<AddAuthenticator>(TYPES.AddAuthenticator)
  }

  get listAuthenticators(): ListAuthenticators {
    return this.dependencies.get<ListAuthenticators>(TYPES.ListAuthenticators)
  }

  get deleteAuthenticator(): DeleteAuthenticator {
    return this.dependencies.get<DeleteAuthenticator>(TYPES.DeleteAuthenticator)
  }

  get getAuthenticatorAuthenticationOptions(): GetAuthenticatorAuthenticationOptions {
    return this.dependencies.get<GetAuthenticatorAuthenticationOptions>(TYPES.GetAuthenticatorAuthenticationOptions)
  }

  get getAuthenticatorAuthenticationResponse(): GetAuthenticatorAuthenticationResponse {
    return this.dependencies.get<GetAuthenticatorAuthenticationResponse>(TYPES.GetAuthenticatorAuthenticationResponse)
  }

  get listRevisions(): ListRevisions {
    return this.dependencies.get<ListRevisions>(TYPES.ListRevisions)
  }

  get getRevision(): GetRevision {
    return this.dependencies.get<GetRevision>(TYPES.GetRevision)
  }

  get deleteRevision(): DeleteRevision {
    return this.dependencies.get<DeleteRevision>(TYPES.DeleteRevision)
  }

  public get files(): FilesClientInterface {
    return this.dependencies.get<FilesClientInterface>(TYPES.FileService)
  }

  public get features(): FeaturesClientInterface {
    return this.dependencies.get<FeaturesClientInterface>(TYPES.FeaturesService)
  }

  public get items(): ItemManagerInterface {
    return this.dependencies.get<ItemManagerInterface>(TYPES.ItemManager)
  }

  public get payloads(): PayloadManagerInterface {
    return this.dependencies.get<PayloadManagerInterface>(TYPES.PayloadManager)
  }

  public get protections(): ProtectionsClientInterface {
    return this.dependencies.get<ProtectionsClientInterface>(TYPES.ProtectionService)
  }

  public get sync(): SyncServiceInterface {
    return this.dependencies.get<SyncServiceInterface>(TYPES.SyncService)
  }

  public get user(): UserServiceInterface {
    return this.dependencies.get<UserServiceInterface>(TYPES.UserService)
  }

  public get settings(): SettingsService {
    return this.dependencies.get<SettingsService>(TYPES.SettingsService)
  }

  public get mutator(): MutatorClientInterface {
    return this.dependencies.get<MutatorClientInterface>(TYPES.MutatorService)
  }

  public get sessions(): SessionsClientInterface {
    return this.dependencies.get<SessionsClientInterface>(TYPES.SessionManager)
  }

  public get status(): StatusServiceInterface {
    return this.dependencies.get<StatusServiceInterface>(TYPES.StatusService)
  }

  public get fileBackups(): BackupServiceInterface | undefined {
    return this.dependencies.get<BackupServiceInterface | undefined>(TYPES.FilesBackupService)
  }

  public get componentManager(): ComponentManagerInterface {
    return this.dependencies.get<ComponentManagerInterface>(TYPES.ComponentManager)
  }

  public get listed(): ListedClientInterface {
    return this.dependencies.get<ListedClientInterface>(TYPES.ListedService)
  }

  public get alerts(): AlertService {
    return this.dependencies.get<AlertService>(TYPES.AlertService)
  }

  public get storage(): StorageServiceInterface {
    return this.dependencies.get<StorageServiceInterface>(TYPES.DiskStorageService)
  }

  public get actions(): ActionsService {
    return this.dependencies.get<ActionsService>(TYPES.ActionsService)
  }

  public get challenges(): ChallengeServiceInterface {
    return this.dependencies.get<ChallengeServiceInterface>(TYPES.ChallengeService)
  }

  public get asymmetric(): AsymmetricMessageServiceInterface {
    return this.dependencies.get<AsymmetricMessageServiceInterface>(TYPES.AsymmetricMessageService)
  }

  get homeServer(): HomeServerServiceInterface | undefined {
    return this.dependencies.get<HomeServerServiceInterface | undefined>(TYPES.HomeServerService)
  }

  public get preferences(): PreferenceServiceInterface {
    return this.dependencies.get<PreferenceServiceInterface>(TYPES.PreferencesService)
  }

  public get history(): HistoryServiceInterface {
    return this.dependencies.get<HistoryServiceInterface>(TYPES.HistoryManager)
  }

  public get encryption(): EncryptionProviderInterface {
    return this.dependencies.get<EncryptionProviderInterface>(TYPES.EncryptionService)
  }

  public get events(): InternalEventBusInterface {
    return this.dependencies.get<InternalEventBusInterface>(TYPES.InternalEventBus)
  }

  public get vaults(): VaultServiceInterface {
    return this.dependencies.get<VaultServiceInterface>(TYPES.VaultService)
  }

  public get vaultLocks(): VaultLockServiceInterface {
    return this.dependencies.get<VaultLockServiceInterface>(TYPES.VaultLockService)
  }

  public get vaultUsers(): VaultUserServiceInterface {
    return this.dependencies.get<VaultUserServiceInterface>(TYPES.VaultUserService)
  }

  public get vaultInvites(): VaultInviteServiceInterface {
    return this.dependencies.get<VaultInviteServiceInterface>(TYPES.VaultInviteService)
  }

  public get contacts(): ContactServiceInterface {
    return this.dependencies.get<ContactServiceInterface>(TYPES.ContactService)
  }

  public get sharedVaults(): SharedVaultServiceInterface {
    return this.dependencies.get<SharedVaultServiceInterface>(TYPES.SharedVaultService)
  }

  public get changeAndSaveItem(): ChangeAndSaveItem {
    return this.dependencies.get<ChangeAndSaveItem>(TYPES.ChangeAndSaveItem)
  }

  public get getHost(): GetHost {
    return this.dependencies.get<GetHost>(TYPES.GetHost)
  }

  public get setHost(): SetHost {
    return this.dependencies.get<SetHost>(TYPES.SetHost)
  }

  public get legacyApi(): LegacyApiService {
    return this.dependencies.get<LegacyApiService>(TYPES.LegacyApiService)
  }

  public get mfa(): MfaServiceInterface {
    return this.dependencies.get<MfaService>(TYPES.MfaService)
  }

  public get generateUuid(): GenerateUuid {
    return this.dependencies.get<GenerateUuid>(TYPES.GenerateUuid)
  }

  public get createDecryptedBackupFile(): CreateDecryptedBackupFile {
    return this.dependencies.get<CreateDecryptedBackupFile>(TYPES.CreateDecryptedBackupFile)
  }

  public get createEncryptedBackupFile(): CreateEncryptedBackupFile {
    return this.dependencies.get<CreateEncryptedBackupFile>(TYPES.CreateEncryptedBackupFile)
  }

  private get migrations(): MigrationService {
    return this.dependencies.get<MigrationService>(TYPES.MigrationService)
  }

  private get http(): HttpServiceInterface {
    return this.dependencies.get<HttpServiceInterface>(TYPES.HttpService)
  }

  private get sockets(): WebSocketsService {
    return this.dependencies.get<WebSocketsService>(TYPES.WebSocketsService)
  }
}
