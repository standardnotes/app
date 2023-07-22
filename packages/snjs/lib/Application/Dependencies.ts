import { DeleteRevision } from './../Domain/UseCase/DeleteRevision/DeleteRevision'
import { GetRevision } from './../Domain/UseCase/GetRevision/GetRevision'
import { ListRevisions } from './../Domain/UseCase/ListRevisions/ListRevisions'
import { GetAuthenticatorAuthenticationResponse } from './../Domain/UseCase/GetAuthenticatorAuthenticationResponse/GetAuthenticatorAuthenticationResponse'
import { GetAuthenticatorAuthenticationOptions } from './../Domain/UseCase/GetAuthenticatorAuthenticationOptions/GetAuthenticatorAuthenticationOptions'
import { DeleteAuthenticator } from './../Domain/UseCase/DeleteAuthenticator/DeleteAuthenticator'
import { ListAuthenticators } from './../Domain/UseCase/ListAuthenticators/ListAuthenticators'
import { AddAuthenticator } from './../Domain/UseCase/AddAuthenticator/AddAuthenticator'
import { GetRecoveryCodes } from './../Domain/UseCase/GetRecoveryCodes/GetRecoveryCodes'
import { SignInWithRecoveryCodes } from './../Domain/UseCase/SignInWithRecoveryCodes/SignInWithRecoveryCodes'
import { ListedService } from './../Services/Listed/ListedService'
import { SNMigrationService } from './../Services/Migration/MigrationService'
import { SNMfaService } from './../Services/Mfa/MfaService'
import { SNComponentManager } from './../Services/ComponentManager/ComponentManager'
import { SNFeaturesService } from '@Lib/Services/Features/FeaturesService'
import { SNSettingsService } from './../Services/Settings/SNSettingsService'
import { SNPreferencesService } from './../Services/Preferences/PreferencesService'
import { SNSingletonManager } from './../Services/Singleton/SingletonManager'
import { SNKeyRecoveryService } from './../Services/KeyRecovery/KeyRecoveryService'
import { SNProtectionService } from './../Services/Protection/ProtectionService'
import { SNSyncService } from './../Services/Sync/SyncService'
import { SNHistoryManager } from './../Services/History/HistoryManager'
import { SNSessionManager } from './../Services/Session/SessionManager'
import { SNWebSocketsService } from './../Services/Api/WebsocketsService'
import { SNApiService } from './../Services/Api/ApiService'
import { SnjsVersion } from './../Version'
import { DeprecatedHttpService } from './../Services/Api/DeprecatedHttpService'
import { ChallengeService } from './../Services/Challenge/ChallengeService'
import { DiskStorageService } from './../Services/Storage/DiskStorageService'
import { MutatorService } from './../Services/Mutator/MutatorService'
import {
  AuthManager,
  AuthenticatorManager,
  EncryptionService,
  FileService,
  FilesBackupService,
  HomeServerService,
  ImportDataUseCase,
  InMemoryStore,
  IntegrityService,
  InternalEventBus,
  KeySystemKeyManager,
  RevisionManager,
  StatusService,
  SubscriptionManager,
  UserEventService,
  UserService,
  isDesktopDevice,
} from '@standardnotes/services'
import { ItemManager } from './../Services/Items/ItemManager'
import { PayloadManager } from './../Services/Payloads/PayloadManager'
import { LegacySessionStorageMapper } from '@Lib/Services/Mapping/LegacySessionStorageMapper'
import { SessionStorageMapper } from '@Lib/Services/Mapping/SessionStorageMapper'
import {
  AuthApiService,
  AuthServer,
  AuthenticatorApiService,
  AuthenticatorServer,
  HttpService,
  RevisionApiService,
  RevisionServer,
  SubscriptionApiService,
  SubscriptionServer,
  UserApiService,
  UserServer,
  WebSocketApiService,
  WebSocketServer,
} from '@standardnotes/api'
import { FullyResolvedApplicationOptions } from './Options/ApplicationOptions'
import { SNActionsService } from '../../dist/@types'

export function isDeinitable(service: unknown): service is { deinit(): void } {
  return typeof (service as { deinit(): void }).deinit === 'function'
}

export const TYPES = {
  // System
  DeviceInterface: Symbol.for('DeviceInterface'),
  AlertService: Symbol.for('AlertService'),
  Crypto: Symbol.for('Crypto'),

  // Services
  InternalEventBus: Symbol.for('InternalEventBus'),
  PayloadManager: Symbol.for('PayloadManager'),
  ItemManager: Symbol.for('ItemManager'),
  MutatorService: Symbol.for('MutatorService'),
  DiskStorageService: Symbol.for('DiskStorageService'),
  UserEventService: Symbol.for('UserEventService'),
  InMemoryStore: Symbol.for('InMemoryStore'),
  KeySystemKeyManager: Symbol.for('KeySystemKeyManager'),
  EncryptionService: Symbol.for('EncryptionService'),
  ChallengeService: Symbol.for('ChallengeService'),
  DeprecatedHttpService: Symbol.for('DeprecatedHttpService'),
  HttpService: Symbol.for('HttpService'),
  LegacyApiService: Symbol.for('LegacyApiService'),
  UserServer: Symbol.for('UserServer'),
  UserRequestServer: Symbol.for('UserRequestServer'),
  UserApiService: Symbol.for('UserApiService'),
  SubscriptionServer: Symbol.for('SubscriptionServer'),
  SubscriptionApiService: Symbol.for('SubscriptionApiService'),
  WebSocketServer: Symbol.for('WebSocketServer'),
  WebSocketApiService: Symbol.for('WebSocketApiService'),
  WebSocketsService: Symbol.for('WebSocketsService'),
  SessionManager: Symbol.for('SessionManager'),
  SubscriptionManager: Symbol.for('SubscriptionManager'),
  HistoryManager: Symbol.for('HistoryManager'),
  SyncService: Symbol.for('SyncService'),
  ProtectionService: Symbol.for('ProtectionService'),
  UserService: Symbol.for('UserService'),
  KeyRecoveryService: Symbol.for('KeyRecoveryService'),
  SingletonManager: Symbol.for('SingletonManager'),
  PreferencesService: Symbol.for('PreferencesService'),
  SettingsService: Symbol.for('SettingsService'),
  FeaturesService: Symbol.for('FeaturesService'),
  ComponentManager: Symbol.for('ComponentManager'),
  MfaService: Symbol.for('MfaService'),
  StatusService: Symbol.for('StatusService'),
  MigrationService: Symbol.for('MigrationService'),
  FileService: Symbol.for('FileService'),
  IntegrityService: Symbol.for('IntegrityService'),
  ListedService: Symbol.for('ListedService'),
  ActionsService: Symbol.for('ActionsService'),
  AuthenticatorServer: Symbol.for('AuthenticatorServer'),
  AuthenticatorApiService: Symbol.for('AuthenticatorApiService'),
  AuthenticatorManager: Symbol.for('AuthenticatorManager'),
  AuthServer: Symbol.for('AuthServer'),
  AuthApiService: Symbol.for('AuthApiService'),
  AuthManager: Symbol.for('AuthManager'),
  RevisionServer: Symbol.for('RevisionServer'),
  RevisionApiService: Symbol.for('RevisionApiService'),
  RevisionManager: Symbol.for('RevisionManager'),
  ContactService: Symbol.for('ContactService'),
  VaultService: Symbol.for('VaultService'),
  SharedVaultService: Symbol.for('SharedVaultService'),
  AsymmetricMessageService: Symbol.for('AsymmetricMessageService'),

  // Desktop Services
  FilesBackupService: Symbol.for('FilesBackupService'),
  HomeServerService: Symbol.for('HomeServerService'),

  // Usecases
  SignInWithRecoveryCodes: Symbol.for('SignInWithRecoveryCodes'),
  GetRecoveryCodes: Symbol.for('GetRecoveryCodes'),
  AddAuthenticator: Symbol.for('AddAuthenticator'),
  ListAuthenticators: Symbol.for('ListAuthenticators'),
  DeleteAuthenticator: Symbol.for('DeleteAuthenticator'),
  GetAuthenticatorAuthenticationOptions: Symbol.for('GetAuthenticatorAuthenticationOptions'),
  GetAuthenticatorAuthenticationResponse: Symbol.for('GetAuthenticatorAuthenticationResponse'),
  ListRevisions: Symbol.for('ListRevisions'),
  GetRevision: Symbol.for('GetRevision'),
  DeleteRevision: Symbol.for('DeleteRevision'),
  ImportDataUseCase: Symbol.for('ImportDataUseCase'),

  // Mappers
  SessionStorageMapper: Symbol.for('SessionStorageMapper'),
  LegacySessionStorageMapper: Symbol.for('LegacySessionStorageMapper'),
}

const DependencyInitOrder = [
  TYPES.InternalEventBus,
  TYPES.SessionStorageMapper,
  TYPES.LegacySessionStorageMapper,
  TYPES.PayloadManager,
  TYPES.ItemManager,
  TYPES.MutatorService,
  TYPES.DiskStorageService,
  TYPES.UserEventService,
  TYPES.InMemoryStore,
  TYPES.KeySystemKeyManager,
  TYPES.EncryptionService,
  TYPES.ChallengeService,
  TYPES.DeprecatedHttpService,
  TYPES.HttpService,
  TYPES.LegacyApiService,
  TYPES.UserServer,
  TYPES.UserRequestServer,
  TYPES.UserApiService,
  TYPES.SubscriptionServer,
  TYPES.SubscriptionApiService,
  TYPES.WebSocketServer,
  TYPES.WebSocketApiService,
  TYPES.WebSocketsService,
  TYPES.SessionManager,
  TYPES.SubscriptionManager,
  TYPES.HistoryManager,
  TYPES.SyncService,
  TYPES.ProtectionService,
  TYPES.UserService,
  TYPES.KeyRecoveryService,
  TYPES.SingletonManager,
  TYPES.PreferencesService,
  TYPES.SettingsService,
  TYPES.FeaturesService,
  TYPES.ComponentManager,
  TYPES.MfaService,
  TYPES.StatusService,
  TYPES.FilesBackupService,
  TYPES.HomeServerService,
  TYPES.MigrationService,
  TYPES.FileService,
  TYPES.IntegrityService,
  TYPES.ListedService,
  TYPES.ActionsService,
  TYPES.AuthenticatorServer,
  TYPES.AuthenticatorApiService,
  TYPES.AuthenticatorManager,
  TYPES.AuthServer,
  TYPES.AuthApiService,
  TYPES.AuthManager,
  TYPES.RevisionServer,
  TYPES.RevisionApiService,
  TYPES.RevisionManager,
  TYPES.SignInWithRecoveryCodes,
  TYPES.GetRecoveryCodes,
  TYPES.AddAuthenticator,
  TYPES.ListAuthenticators,
  TYPES.DeleteAuthenticator,
  TYPES.GetAuthenticatorAuthenticationOptions,
  TYPES.GetAuthenticatorAuthenticationResponse,
  TYPES.ListRevisions,
  TYPES.GetRevision,
  TYPES.DeleteRevision,
  TYPES.ContactService,
  TYPES.VaultService,
  TYPES.SharedVaultService,
  TYPES.AsymmetricMessageService,
  TYPES.ImportDataUseCase,
]

export class Dependencies {
  private dependencyMakers = new Map<symbol, () => unknown>()
  private dependencies = new Map<symbol, unknown>()

  constructor(private options: FullyResolvedApplicationOptions) {
    this.registerMakers()
    this.makeDependencies()
  }

  public deinit() {
    this.dependencyMakers.clear()

    const deps = this.getAll()
    for (const dep of deps) {
      if (isDeinitable(dep)) {
        dep.deinit()
      }
    }

    this.dependencies.clear()
  }

  public getAll(): unknown[] {
    return Array.from(this.dependencies.values())
  }

  private registerMakers() {
    this.dependencyMakers.set(TYPES.UserServer, () => {
      return new UserServer(this.get(TYPES.HttpService))
    })

    this.dependencyMakers.set(TYPES.ImportDataUseCase, () => {
      return new ImportDataUseCase(
        this.get(TYPES.ItemManager),
        this.get(TYPES.SyncService),
        this.get(TYPES.ProtectionService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.HistoryManager),
      )
    })

    this.dependencyMakers.set(TYPES.SignInWithRecoveryCodes, () => {
      return new SignInWithRecoveryCodes(
        this.get(TYPES.AuthManager),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.InMemoryStore),
        this.options.crypto,
        this.get(TYPES.SessionManager),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.GetRecoveryCodes, () => {
      return new GetRecoveryCodes(this.get(TYPES.AuthManager), this.get(TYPES.SettingsService))
    })

    this.dependencyMakers.set(TYPES.AddAuthenticator, () => {
      return new AddAuthenticator(
        this.get(TYPES.AuthenticatorManager),
        this.options.u2fAuthenticatorRegistrationPromptFunction,
      )
    })

    this.dependencyMakers.set(TYPES.ListAuthenticators, () => {
      return new ListAuthenticators(this.get(TYPES.AuthenticatorManager))
    })

    this.dependencyMakers.set(TYPES.DeleteAuthenticator, () => {
      return new DeleteAuthenticator(this.get(TYPES.AuthenticatorManager))
    })

    this.dependencyMakers.set(TYPES.GetAuthenticatorAuthenticationOptions, () => {
      return new GetAuthenticatorAuthenticationOptions(this.get(TYPES.AuthenticatorManager))
    })

    this.dependencyMakers.set(TYPES.GetAuthenticatorAuthenticationResponse, () => {
      return new GetAuthenticatorAuthenticationResponse(
        this.get(TYPES.GetAuthenticatorAuthenticationOptions),
        this.options.u2fAuthenticatorVerificationPromptFunction,
      )
    })

    this.dependencyMakers.set(TYPES.ListRevisions, () => {
      return new ListRevisions(this.get(TYPES.RevisionManager))
    })

    this.dependencyMakers.set(TYPES.GetRevision, () => {
      return new GetRevision(this.get(TYPES.RevisionManager), this.get(TYPES.EncryptionService))
    })

    this.dependencyMakers.set(TYPES.DeleteRevision, () => {
      return new DeleteRevision(this.get(TYPES.RevisionManager))
    })

    this.dependencyMakers.set(TYPES.RevisionServer, () => {
      return new RevisionServer(this.get(TYPES.HttpService))
    })

    this.dependencyMakers.set(TYPES.RevisionApiService, () => {
      return new RevisionApiService(this.get(TYPES.RevisionServer))
    })

    this.dependencyMakers.set(TYPES.RevisionManager, () => {
      return new RevisionManager(this.get(TYPES.RevisionApiService), this.get(TYPES.InternalEventBus))
    })

    this.dependencyMakers.set(TYPES.AuthServer, () => {
      return new AuthServer(this.get(TYPES.HttpService))
    })

    this.dependencyMakers.set(TYPES.AuthApiService, () => {
      return new AuthApiService(this.get(TYPES.AuthServer))
    })

    this.dependencyMakers.set(TYPES.AuthManager, () => {
      return new AuthManager(this.get(TYPES.AuthApiService), this.get(TYPES.InternalEventBus))
    })

    this.dependencyMakers.set(TYPES.AuthenticatorServer, () => {
      return new AuthenticatorServer(this.get(TYPES.HttpService))
    })

    this.dependencyMakers.set(TYPES.AuthenticatorApiService, () => {
      return new AuthenticatorApiService(this.get(TYPES.AuthenticatorServer))
    })

    this.dependencyMakers.set(TYPES.AuthenticatorManager, () => {
      return new AuthenticatorManager(
        this.get(TYPES.AuthenticatorApiService),
        this.get(TYPES.PreferencesService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.ActionsService, () => {
      return new SNActionsService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.AlertService),
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.DeprecatedHttpService),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.SyncService),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.ListedService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.ListedService, () => {
      return new ListedService(
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.ItemManager),
        this.get(TYPES.SettingsService),
        this.get(TYPES.DeprecatedHttpService),
        this.get(TYPES.ProtectionService),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.IntegrityService, () => {
      return new IntegrityService(
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.FileService, () => {
      return new FileService(
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.HttpService),
        this.get(TYPES.AlertService),
        this.options.crypto,
        this.get(TYPES.InternalEventBus),
        this.get(TYPES.FilesBackupService),
      )
    })

    this.dependencyMakers.set(TYPES.MigrationService, () => {
      return new SNMigrationService({
        encryptionService: this.get(TYPES.EncryptionService),
        deviceInterface: this.get(TYPES.DeviceInterface),
        storageService: this.get(TYPES.DiskStorageService),
        sessionManager: this.get(TYPES.SessionManager),
        challengeService: this.get(TYPES.ChallengeService),
        itemManager: this.get(TYPES.ItemManager),
        mutator: this.get(TYPES.MutatorService),
        singletonManager: this.get(TYPES.SingletonManager),
        featuresService: this.get(TYPES.FeaturesService),
        environment: this.options.environment,
        platform: this.options.platform,
        identifier: this.options.identifier,
        internalEventBus: this.get(TYPES.InternalEventBus),
        legacySessionStorageMapper: this.get(TYPES.LegacySessionStorageMapper),
        backups: this.get(TYPES.FilesBackupService),
        preferences: this.get(TYPES.PreferencesService),
      })
    })

    this.dependencyMakers.set(TYPES.HomeServerService, () => {
      if (!isDesktopDevice(this.get(TYPES.DeviceInterface))) {
        return undefined
      }

      return new HomeServerService(this.get(TYPES.DeviceInterface), this.get(TYPES.InternalEventBus))
    })

    this.dependencyMakers.set(TYPES.FilesBackupService, () => {
      if (!isDesktopDevice(this.get(TYPES.DeviceInterface))) {
        return undefined
      }

      return new FilesBackupService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.StatusService),
        this.options.crypto,
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.SessionManager),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.HistoryManager),
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.StatusService, () => {
      return new StatusService(this.get(TYPES.InternalEventBus))
    })

    this.dependencyMakers.set(TYPES.MfaService, () => {
      return new SNMfaService(
        this.get(TYPES.SettingsService),
        this.options.crypto,
        this.get(TYPES.FeaturesService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.ComponentManager, () => {
      return new SNComponentManager(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.FeaturesService),
        this.get(TYPES.PreferencesService),
        this.get(TYPES.AlertService),
        this.options.environment,
        this.options.platform,
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.FeaturesService, () => {
      return new SNFeaturesService(
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SubscriptionManager),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.WebSocketsService),
        this.get(TYPES.SettingsService),
        this.get(TYPES.UserService),
        this.get(TYPES.SyncService),
        this.get(TYPES.AlertService),
        this.get(TYPES.SessionManager),
        this.get(TYPES.Crypto),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.SettingsService, () => {
      return new SNSettingsService(
        this.get(TYPES.SessionManager),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.PreferencesService, () => {
      return new SNPreferencesService(
        this.get(TYPES.SingletonManager),
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.SingletonManager, () => {
      return new SNSingletonManager(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.SyncService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.KeyRecoveryService, () => {
      return new SNKeyRecoveryService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.UserApiService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.AlertService),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.SyncService),
        this.get(TYPES.UserService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.UserService, () => {
      return new UserService(
        this.get(TYPES.SessionManager),
        this.get(TYPES.SyncService),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.ItemManager),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.AlertService),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.ProtectionService),
        this.get(TYPES.UserApiService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.ProtectionService, () => {
      return new SNProtectionService(
        this.get(TYPES.EncryptionService),
        this.get(TYPES.MutatorService),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.SyncService, () => {
      return new SNSyncService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.SessionManager),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.HistoryManager),
        this.get(TYPES.DeviceInterface),
        this.options.identifier,
        {
          loadBatchSize: this.options.loadBatchSize,
          sleepBetweenBatches: this.options.sleepBetweenBatches,
        },
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.HistoryManager, () => {
      return new SNHistoryManager(
        this.get(TYPES.ItemManager),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.SubscriptionManager, () => {
      return new SubscriptionManager(
        this.get(TYPES.SubscriptionApiService),
        this.get(TYPES.SessionManager),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.SessionManager, () => {
      return new SNSessionManager(
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.UserApiService),
        this.get(TYPES.AlertService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.WebSocketsService),
        this.get(TYPES.HttpService),
        this.get(TYPES.SessionStorageMapper),
        this.get(TYPES.LegacySessionStorageMapper),
        this.options.identifier,
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.WebSocketsService, () => {
      return new SNWebSocketsService(
        this.get(TYPES.DiskStorageService),
        this.options.webSocketUrl,
        this.get(TYPES.WebSocketApiService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.WebSocketApiService, () => {
      return new WebSocketApiService(this.get(TYPES.WebSocketServer))
    })

    this.dependencyMakers.set(TYPES.WebSocketServer, () => {
      return new WebSocketServer(this.get(TYPES.HttpService))
    })

    this.dependencyMakers.set(TYPES.SubscriptionApiService, () => {
      return new SubscriptionApiService(this.get(TYPES.SubscriptionServer))
    })

    this.dependencyMakers.set(TYPES.UserApiService, () => {
      return new UserApiService(this.get(TYPES.UserServer), this.get(TYPES.UserRequestServer))
    })

    this.dependencyMakers.set(TYPES.SubscriptionServer, () => {
      return new SubscriptionServer(this.get(TYPES.HttpService))
    })

    this.dependencyMakers.set(TYPES.UserRequestServer, () => {
      return new UserServer(this.get(TYPES.HttpService))
    })

    this.dependencyMakers.set(TYPES.InternalEventBus, () => {
      return new InternalEventBus()
    })

    this.dependencyMakers.set(TYPES.PayloadManager, () => {
      return new PayloadManager(this.get(TYPES.InternalEventBus))
    })

    this.dependencyMakers.set(TYPES.ItemManager, () => {
      return new ItemManager(this.get(TYPES.PayloadManager), this.get(TYPES.InternalEventBus))
    })

    this.dependencyMakers.set(TYPES.MutatorService, () => {
      return new MutatorService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.AlertService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.DiskStorageService, () => {
      return new DiskStorageService(
        this.get(TYPES.DeviceInterface),
        this.options.identifier,
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.UserEventService, () => {
      return new UserEventService(this.get(TYPES.InternalEventBus))
    })

    this.dependencyMakers.set(TYPES.InMemoryStore, () => {
      return new InMemoryStore()
    })

    this.dependencyMakers.set(TYPES.KeySystemKeyManager, () => {
      return new KeySystemKeyManager(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.ChallengeService, () => {
      return new ChallengeService(
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.EncryptionService, () => {
      return new EncryptionService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.KeySystemKeyManager),
        this.options.identifier,
        this.get(TYPES.Crypto),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.DeprecatedHttpService, () => {
      return new DeprecatedHttpService(
        this.options.environment,
        this.options.appVersion,
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.HttpService, () => {
      return new HttpService(this.options.environment, this.options.appVersion, SnjsVersion)
    })

    this.dependencyMakers.set(TYPES.LegacyApiService, () => {
      return new SNApiService(
        this.get(TYPES.HttpService),
        this.get(TYPES.DiskStorageService),
        this.options.defaultHost,
        this.get(TYPES.InMemoryStore),
        this.get(TYPES.Crypto),
        this.get(TYPES.SessionStorageMapper),
        this.get(TYPES.LegacySessionStorageMapper),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.dependencyMakers.set(TYPES.SessionStorageMapper, () => {
      return new SessionStorageMapper()
    })

    this.dependencyMakers.set(TYPES.LegacySessionStorageMapper, () => {
      return new LegacySessionStorageMapper()
    })
  }

  public get<T>(dependency: symbol): T {
    const dependencyInstance = this.dependencies.get(dependency)
    if (!dependencyInstance) {
      throw new Error(`Dependency ${dependency.toString()} not found`)
    }

    return dependencyInstance as T
  }

  public set<T>(dependency: symbol, instance: T): void {
    this.dependencies.set(dependency, instance)
  }

  private makeDependencies() {
    for (const dependency of DependencyInitOrder) {
      const maker = this.dependencyMakers.get(dependency)
      if (!maker) {
        throw new Error(`No dependency maker found for ${dependency.toString()}`)
      }

      this.dependencies.set(dependency, maker())
    }
  }
}
