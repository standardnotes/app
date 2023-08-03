import { ActionsService } from './../../Services/Actions/ActionsService'
import { DeleteRevision } from '../../Domain/UseCase/DeleteRevision/DeleteRevision'
import { GetRevision } from '../../Domain/UseCase/GetRevision/GetRevision'
import { ListRevisions } from '../../Domain/UseCase/ListRevisions/ListRevisions'
import { GetAuthenticatorAuthenticationResponse } from '../../Domain/UseCase/GetAuthenticatorAuthenticationResponse/GetAuthenticatorAuthenticationResponse'
import { GetAuthenticatorAuthenticationOptions } from '../../Domain/UseCase/GetAuthenticatorAuthenticationOptions/GetAuthenticatorAuthenticationOptions'
import { DeleteAuthenticator } from '../../Domain/UseCase/DeleteAuthenticator/DeleteAuthenticator'
import { ListAuthenticators } from '../../Domain/UseCase/ListAuthenticators/ListAuthenticators'
import { AddAuthenticator } from '../../Domain/UseCase/AddAuthenticator/AddAuthenticator'
import { GetRecoveryCodes } from '../../Domain/UseCase/GetRecoveryCodes/GetRecoveryCodes'
import { SignInWithRecoveryCodes } from '../../Domain/UseCase/SignInWithRecoveryCodes/SignInWithRecoveryCodes'
import { ListedService } from '../../Services/Listed/ListedService'
import { MigrationService } from '../../Services/Migration/MigrationService'
import { SNMfaService } from '../../Services/Mfa/MfaService'
import { SNComponentManager } from '../../Services/ComponentManager/ComponentManager'
import { FeaturesService } from '@Lib/Services/Features/FeaturesService'
import { SettingsService } from '../../Services/Settings/SNSettingsService'
import { SNPreferencesService } from '../../Services/Preferences/PreferencesService'
import { SingletonManager } from '../../Services/Singleton/SingletonManager'
import { KeyRecoveryService } from '../../Services/KeyRecovery/KeyRecoveryService'
import { SNProtectionService } from '../../Services/Protection/ProtectionService'
import { SyncService } from '../../Services/Sync/SyncService'
import { HistoryManager } from '../../Services/History/HistoryManager'
import { SessionManager } from '../../Services/Session/SessionManager'
import { WebSocketsService } from '../../Services/Api/WebsocketsService'
import { LegacyApiService } from '../../Services/Api/ApiService'
import { SnjsVersion } from '../../Version'
import { DeprecatedHttpService } from '../../Services/Api/DeprecatedHttpService'
import { ChallengeService } from '../../Services/Challenge/ChallengeService'
import { DiskStorageService } from '../../Services/Storage/DiskStorageService'
import { MutatorService } from '../../Services/Mutator/MutatorService'
import {
  AuthManager,
  AuthenticatorManager,
  ContactService,
  CreateOrEditContact,
  EditContact,
  EncryptionService,
  FileService,
  FilesBackupService,
  FindContact,
  GetAllContacts,
  GetVault,
  HomeServerService,
  ImportDataUseCase,
  InMemoryStore,
  IntegrityService,
  InternalEventBus,
  KeySystemKeyManager,
  DiscardItemsLocally,
  RevisionManager,
  SelfContactManager,
  StatusService,
  SubscriptionManager,
  NotificationService,
  UserService,
  ValidateItemSigner,
  isDesktopDevice,
  ChangeVaultKeyOptions,
  MoveItemsToVault,
  CreateVault,
  RemoveItemFromVault,
  DeleteVault,
  RotateVaultKey,
  VaultService,
  SharedVaultService,
  CreateSharedVault,
  HandleKeyPairChange,
  ReuploadAllInvites,
  ReuploadInvite,
  ResendAllMessages,
  NotifyVaultUsersOfKeyRotation,
  SendVaultDataChangedMessage,
  GetTrustedPayload,
  GetUntrustedPayload,
  GetVaultContacts,
  AcceptVaultInvite,
  InviteToVault,
  LeaveVault,
  DeleteThirdPartyVault,
  ShareContactWithVault,
  ConvertToSharedVault,
  DeleteSharedVault,
  RemoveVaultMember,
  GetVaultUsers,
  AsymmetricMessageService,
  ReplaceContactData,
  DecryptOwnMessage,
  SendVaultInvite,
  EncryptMessage,
  DecryptMessage,
  ResendMessage,
  SendMessage,
  ProcessAcceptedVaultInvite,
  HandleRootKeyChangedMessage,
  SendOwnContactChangeMessage,
  GetOutboundMessages,
  GetInboundMessages,
  SendVaultKeyChangedMessage,
  CreateNewDefaultItemsKey,
  CreateNewItemsKeyWithRollback,
  FindDefaultItemsKey,
  DecryptErroredTypeAPayloads,
  DecryptTypeAPayload,
  DecryptTypeAPayloadWithKeyLookup,
  EncryptTypeAPayload,
  EncryptTypeAPayloadWithKeyLookup,
  RootKeyManager,
  ItemsEncryptionService,
  DecryptBackupFile,
  VaultUserService,
  IsVaultOwner,
  VaultInviteService,
  VaultUserCache,
  GetVaults,
  GetSharedVaults,
  GetOwnedSharedVaults,
  ContactBelongsToVault,
  DeleteContact,
  VaultLockService,
  RemoveItemsFromMemory,
  ReencryptTypeAItems,
} from '@standardnotes/services'
import { ItemManager } from '../../Services/Items/ItemManager'
import { PayloadManager } from '../../Services/Payloads/PayloadManager'
import { LegacySessionStorageMapper } from '@Lib/Services/Mapping/LegacySessionStorageMapper'
import { SessionStorageMapper } from '@Lib/Services/Mapping/SessionStorageMapper'
import {
  AsymmetricMessageServer,
  AuthApiService,
  AuthServer,
  AuthenticatorApiService,
  AuthenticatorServer,
  HttpService,
  RevisionApiService,
  RevisionServer,
  SharedVaultInvitesServer,
  SharedVaultServer,
  SharedVaultUsersServer,
  SubscriptionApiService,
  SubscriptionServer,
  UserApiService,
  UserRequestServer,
  UserServer,
  WebSocketApiService,
  WebSocketServer,
} from '@standardnotes/api'
import { FullyResolvedApplicationOptions } from '../Options/ApplicationOptions'
import { TYPES } from './Types'
import { isDeinitable } from './isDeinitable'
import { Logger, isNotUndefined } from '@standardnotes/utils'
import { EncryptionOperators } from '@standardnotes/encryption'

export class Dependencies {
  private factory = new Map<symbol, () => unknown>()
  private dependencies = new Map<symbol, unknown>()

  constructor(private options: FullyResolvedApplicationOptions) {
    this.dependencies.set(TYPES.DeviceInterface, options.deviceInterface)
    this.dependencies.set(TYPES.AlertService, options.alertService)
    this.dependencies.set(TYPES.Crypto, options.crypto)

    this.registerServiceMakers()
    this.registerUseCaseMakers()
  }

  public deinit() {
    this.factory.clear()

    const deps = this.getAll()
    for (const dep of deps) {
      if (isDeinitable(dep)) {
        dep.deinit()
      }
    }

    this.dependencies.clear()
  }

  public getAll(): unknown[] {
    return Array.from(this.dependencies.values()).filter(isNotUndefined)
  }

  public get<T>(sym: symbol): T {
    const dep = this.dependencies.get(sym)
    if (dep) {
      return dep as T
    }

    const maker = this.factory.get(sym)
    if (!maker) {
      throw new Error(`No dependency maker found for ${sym.toString()}`)
    }

    const instance = maker()
    if (!instance) {
      /** Could be optional */
      return undefined as T
    }

    this.dependencies.set(sym, instance)

    return instance as T
  }

  private registerUseCaseMakers() {
    this.factory.set(TYPES.ReencryptTypeAItems, () => {
      return new ReencryptTypeAItems(this.get(TYPES.ItemManager), this.get(TYPES.MutatorService))
    })

    this.factory.set(TYPES.ImportDataUseCase, () => {
      return new ImportDataUseCase(
        this.get(TYPES.ItemManager),
        this.get(TYPES.SyncService),
        this.get(TYPES.ProtectionService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.HistoryManager),
        this.get(TYPES.DecryptBackupFile),
      )
    })

    this.factory.set(TYPES.IsVaultOwner, () => {
      return new IsVaultOwner()
    })

    this.factory.set(TYPES.DecryptBackupFile, () => {
      return new DecryptBackupFile(this.get(TYPES.EncryptionService), this.get(TYPES.Logger))
    })

    this.factory.set(TYPES.DiscardItemsLocally, () => {
      return new DiscardItemsLocally(this.get(TYPES.ItemManager), this.get(TYPES.DiskStorageService))
    })

    this.factory.set(TYPES.RemoveItemsFromMemory, () => {
      return new RemoveItemsFromMemory(
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.ItemManager),
        this.get(TYPES.PayloadManager),
      )
    })

    this.factory.set(TYPES.FindContact, () => {
      return new FindContact(this.get(TYPES.ItemManager))
    })

    this.factory.set(TYPES.DeleteContact, () => {
      return new DeleteContact(
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.GetOwnedSharedVaults),
        this.get(TYPES.ContactBelongsToVault),
      )
    })

    this.factory.set(TYPES.EditContact, () => {
      return new EditContact(this.get(TYPES.MutatorService))
    })

    this.factory.set(TYPES.GetAllContacts, () => {
      return new GetAllContacts(this.get(TYPES.ItemManager))
    })

    this.factory.set(TYPES.ValidateItemSigner, () => {
      return new ValidateItemSigner(this.get(TYPES.FindContact))
    })

    this.factory.set(TYPES.CreateOrEditContact, () => {
      return new CreateOrEditContact(
        this.get(TYPES.MutatorService),
        this.get(TYPES.FindContact),
        this.get(TYPES.EditContact),
      )
    })

    this.factory.set(TYPES.GetVault, () => {
      return new GetVault(this.get(TYPES.ItemManager))
    })

    this.factory.set(TYPES.GetVaults, () => {
      return new GetVaults(this.get(TYPES.ItemManager))
    })

    this.factory.set(TYPES.GetSharedVaults, () => {
      return new GetSharedVaults(this.get(TYPES.GetVaults))
    })

    this.factory.set(TYPES.GetOwnedSharedVaults, () => {
      return new GetOwnedSharedVaults(this.get(TYPES.GetSharedVaults), this.get(TYPES.IsVaultOwner))
    })

    this.factory.set(TYPES.ContactBelongsToVault, () => {
      return new ContactBelongsToVault(this.get(TYPES.GetVaultUsers))
    })

    this.factory.set(TYPES.ChangeVaultKeyOptions, () => {
      return new ChangeVaultKeyOptions(
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.KeySystemKeyManager),
        this.get(TYPES.GetVault),
      )
    })

    this.factory.set(TYPES.MoveItemsToVault, () => {
      return new MoveItemsToVault(
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.FileService),
      )
    })

    this.factory.set(TYPES.CreateVault, () => {
      return new CreateVault(
        this.get(TYPES.MutatorService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.KeySystemKeyManager),
        this.get(TYPES.SyncService),
      )
    })

    this.factory.set(TYPES.RemoveItemFromVault, () => {
      return new RemoveItemFromVault(
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.FileService),
      )
    })

    this.factory.set(TYPES.DeleteVault, () => {
      return new DeleteVault(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.KeySystemKeyManager),
      )
    })

    this.factory.set(TYPES.RotateVaultKey, () => {
      return new RotateVaultKey(
        this.get(TYPES.MutatorService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.KeySystemKeyManager),
      )
    })

    this.factory.set(TYPES.ReuploadInvite, () => {
      return new ReuploadInvite(
        this.get(TYPES.DecryptOwnMessage),
        this.get(TYPES.SendVaultInvite),
        this.get(TYPES.EncryptMessage),
      )
    })

    this.factory.set(TYPES.ReuploadAllInvites, () => {
      return new ReuploadAllInvites(
        this.get(TYPES.ReuploadInvite),
        this.get(TYPES.FindContact),
        this.get(TYPES.SharedVaultInvitesServer),
      )
    })

    this.factory.set(TYPES.ResendAllMessages, () => {
      return new ResendAllMessages(
        this.get(TYPES.ResendMessage),
        this.get(TYPES.DecryptOwnMessage),
        this.get(TYPES.AsymmetricMessageServer),
        this.get(TYPES.FindContact),
      )
    })

    this.factory.set(TYPES.CreateSharedVault, () => {
      return new CreateSharedVault(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SharedVaultServer),
        this.get(TYPES.CreateVault),
        this.get(TYPES.MoveItemsToVault),
      )
    })

    this.factory.set(TYPES.HandleKeyPairChange, () => {
      return new HandleKeyPairChange(
        this.get(TYPES.SelfContactManager),
        this.get(TYPES.SharedVaultInvitesServer),
        this.get(TYPES.AsymmetricMessageServer),
        this.get(TYPES.ReuploadAllInvites),
        this.get(TYPES.ResendAllMessages),
        this.get(TYPES.GetAllContacts),
        this.get(TYPES.SendOwnContactChangeMessage),
        this.get(TYPES.CreateOrEditContact),
        this.get(TYPES.Logger),
      )
    })

    this.factory.set(TYPES.NotifyVaultUsersOfKeyRotation, () => {
      return new NotifyVaultUsersOfKeyRotation(
        this.get(TYPES.FindContact),
        this.get(TYPES.SendVaultKeyChangedMessage),
        this.get(TYPES.InviteToVault),
        this.get(TYPES.SharedVaultInvitesServer),
        this.get(TYPES.GetVaultContacts),
        this.get(TYPES.DecryptOwnMessage),
      )
    })

    this.factory.set(TYPES.SendVaultKeyChangedMessage, () => {
      return new SendVaultKeyChangedMessage(
        this.get(TYPES.EncryptMessage),
        this.get(TYPES.KeySystemKeyManager),
        this.get(TYPES.FindContact),
        this.get(TYPES.SendMessage),
        this.get(TYPES.GetVaultUsers),
      )
    })

    this.factory.set(TYPES.SendVaultDataChangedMessage, () => {
      return new SendVaultDataChangedMessage(
        this.get(TYPES.EncryptMessage),
        this.get(TYPES.FindContact),
        this.get(TYPES.GetVaultUsers),
        this.get(TYPES.SendMessage),
      )
    })

    this.factory.set(TYPES.ReplaceContactData, () => {
      return new ReplaceContactData(
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.FindContact),
      )
    })

    this.factory.set(TYPES.GetTrustedPayload, () => {
      return new GetTrustedPayload(this.get(TYPES.DecryptMessage))
    })

    this.factory.set(TYPES.GetUntrustedPayload, () => {
      return new GetUntrustedPayload(this.get(TYPES.DecryptMessage))
    })

    this.factory.set(TYPES.GetVaultContacts, () => {
      return new GetVaultContacts(this.get(TYPES.FindContact), this.get(TYPES.GetVaultUsers))
    })

    this.factory.set(TYPES.AcceptVaultInvite, () => {
      return new AcceptVaultInvite(this.get(TYPES.SharedVaultInvitesServer), this.get(TYPES.ProcessAcceptedVaultInvite))
    })

    this.factory.set(TYPES.InviteToVault, () => {
      return new InviteToVault(
        this.get(TYPES.KeySystemKeyManager),
        this.get(TYPES.EncryptMessage),
        this.get(TYPES.SendVaultInvite),
        this.get(TYPES.ShareContactWithVault),
      )
    })

    this.factory.set(TYPES.SendVaultInvite, () => {
      return new SendVaultInvite(this.get(TYPES.SharedVaultInvitesServer))
    })

    this.factory.set(TYPES.DeleteThirdPartyVault, () => {
      return new DeleteThirdPartyVault(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.KeySystemKeyManager),
        this.get(TYPES.SyncService),
        this.get(TYPES.DiscardItemsLocally),
      )
    })

    this.factory.set(TYPES.LeaveVault, () => {
      return new LeaveVault(
        this.get(TYPES.SharedVaultUsersServer),
        this.get(TYPES.ItemManager),
        this.get(TYPES.DeleteThirdPartyVault),
      )
    })

    this.factory.set(TYPES.ShareContactWithVault, () => {
      return new ShareContactWithVault(
        this.get(TYPES.FindContact),
        this.get(TYPES.EncryptMessage),
        this.get(TYPES.SendMessage),
        this.get(TYPES.GetVaultUsers),
      )
    })

    this.factory.set(TYPES.ConvertToSharedVault, () => {
      return new ConvertToSharedVault(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SharedVaultServer),
        this.get(TYPES.MoveItemsToVault),
      )
    })

    this.factory.set(TYPES.DeleteSharedVault, () => {
      return new DeleteSharedVault(
        this.get(TYPES.SharedVaultServer),
        this.get(TYPES.SyncService),
        this.get(TYPES.DeleteVault),
      )
    })

    this.factory.set(TYPES.RemoveVaultMember, () => {
      return new RemoveVaultMember(this.get(TYPES.SharedVaultUsersServer))
    })

    this.factory.set(TYPES.GetVaultUsers, () => {
      return new GetVaultUsers(this.get(TYPES.SharedVaultUsersServer), this.get(TYPES.VaultUserCache))
    })

    this.factory.set(TYPES.DecryptOwnMessage, () => {
      return new DecryptOwnMessage(this.get(TYPES.EncryptionOperators))
    })

    this.factory.set(TYPES.EncryptMessage, () => {
      return new EncryptMessage(this.get(TYPES.EncryptionOperators))
    })

    this.factory.set(TYPES.DecryptMessage, () => {
      return new DecryptMessage(this.get(TYPES.EncryptionOperators))
    })

    this.factory.set(TYPES.ResendMessage, () => {
      return new ResendMessage(this.get(TYPES.SendMessage), this.get(TYPES.EncryptMessage))
    })

    this.factory.set(TYPES.SendMessage, () => {
      return new SendMessage(this.get(TYPES.AsymmetricMessageServer))
    })

    this.factory.set(TYPES.ProcessAcceptedVaultInvite, () => {
      return new ProcessAcceptedVaultInvite(
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.CreateOrEditContact),
      )
    })

    this.factory.set(TYPES.HandleRootKeyChangedMessage, () => {
      return new HandleRootKeyChangedMessage(
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.GetVault),
      )
    })

    this.factory.set(TYPES.SendOwnContactChangeMessage, () => {
      return new SendOwnContactChangeMessage(this.get(TYPES.EncryptMessage), this.get(TYPES.SendMessage))
    })

    this.factory.set(TYPES.GetOutboundMessages, () => {
      return new GetOutboundMessages(this.get(TYPES.AsymmetricMessageServer))
    })

    this.factory.set(TYPES.GetInboundMessages, () => {
      return new GetInboundMessages(this.get(TYPES.AsymmetricMessageServer))
    })

    this.factory.set(TYPES.CreateNewDefaultItemsKey, () => {
      return new CreateNewDefaultItemsKey(
        this.get(TYPES.MutatorService),
        this.get(TYPES.ItemManager),
        this.get(TYPES.EncryptionOperators),
        this.get(TYPES.RootKeyManager),
      )
    })

    this.factory.set(TYPES.CreateNewItemsKeyWithRollback, () => {
      return new CreateNewItemsKeyWithRollback(
        this.get(TYPES.MutatorService),
        this.get(TYPES.ItemManager),
        this.get(TYPES.CreateNewDefaultItemsKey),
        this.get(TYPES.DiscardItemsLocally),
        this.get(TYPES.FindDefaultItemsKey),
      )
    })

    this.factory.set(TYPES.FindDefaultItemsKey, () => {
      return new FindDefaultItemsKey()
    })

    this.factory.set(TYPES.DecryptErroredTypeAPayloads, () => {
      return new DecryptErroredTypeAPayloads(
        this.get(TYPES.PayloadManager),
        this.get(TYPES.EncryptionOperators),
        this.get(TYPES.KeySystemKeyManager),
        this.get(TYPES.RootKeyManager),
      )
    })

    this.factory.set(TYPES.DecryptTypeAPayload, () => {
      return new DecryptTypeAPayload(this.get(TYPES.EncryptionOperators))
    })

    this.factory.set(TYPES.DecryptTypeAPayloadWithKeyLookup, () => {
      return new DecryptTypeAPayloadWithKeyLookup(
        this.get(TYPES.EncryptionOperators),
        this.get(TYPES.KeySystemKeyManager),
        this.get(TYPES.RootKeyManager),
      )
    })

    this.factory.set(TYPES.EncryptTypeAPayload, () => {
      return new EncryptTypeAPayload(this.get(TYPES.EncryptionOperators))
    })

    this.factory.set(TYPES.EncryptTypeAPayloadWithKeyLookup, () => {
      return new EncryptTypeAPayloadWithKeyLookup(
        this.get(TYPES.EncryptionOperators),
        this.get(TYPES.KeySystemKeyManager),
        this.get(TYPES.RootKeyManager),
      )
    })
  }

  private registerServiceMakers() {
    this.factory.set(TYPES.Logger, () => {
      return new Logger(this.options.identifier)
    })

    this.factory.set(TYPES.UserServer, () => {
      return new UserServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.RootKeyManager, () => {
      return new RootKeyManager(
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.EncryptionOperators),
        this.options.identifier,
        this.get(TYPES.ReencryptTypeAItems),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ItemsEncryptionService, () => {
      return new ItemsEncryptionService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.EncryptionOperators),
        this.get(TYPES.KeySystemKeyManager),
        this.get(TYPES.FindDefaultItemsKey),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.EncryptionOperators, () => {
      return new EncryptionOperators(this.get(TYPES.Crypto))
    })

    this.factory.set(TYPES.SharedVaultInvitesServer, () => {
      return new SharedVaultInvitesServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.SharedVaultServer, () => {
      return new SharedVaultServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.AsymmetricMessageServer, () => {
      return new AsymmetricMessageServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.SharedVaultUsersServer, () => {
      return new SharedVaultUsersServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.VaultUserService, () => {
      return new VaultUserService(
        this.get(TYPES.SessionManager),
        this.get(TYPES.VaultService),
        this.get(TYPES.VaultLockService),
        this.get(TYPES.GetVaultUsers),
        this.get(TYPES.RemoveVaultMember),
        this.get(TYPES.IsVaultOwner),
        this.get(TYPES.GetVault),
        this.get(TYPES.LeaveVault),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.VaultUserCache, () => {
      return new VaultUserCache()
    })

    this.factory.set(TYPES.VaultInviteService, () => {
      return new VaultInviteService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.SessionManager),
        this.get(TYPES.VaultUserService),
        this.get(TYPES.SyncService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.SharedVaultInvitesServer),
        this.get(TYPES.GetAllContacts),
        this.get(TYPES.GetVault),
        this.get(TYPES.GetVaultContacts),
        this.get(TYPES.InviteToVault),
        this.get(TYPES.GetTrustedPayload),
        this.get(TYPES.GetUntrustedPayload),
        this.get(TYPES.FindContact),
        this.get(TYPES.AcceptVaultInvite),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.AsymmetricMessageService, () => {
      return new AsymmetricMessageService(
        this.get(TYPES.EncryptionService),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SessionManager),
        this.get(TYPES.SyncService),
        this.get(TYPES.AsymmetricMessageServer),
        this.get(TYPES.CreateOrEditContact),
        this.get(TYPES.FindContact),
        this.get(TYPES.ReplaceContactData),
        this.get(TYPES.GetTrustedPayload),
        this.get(TYPES.GetVault),
        this.get(TYPES.HandleRootKeyChangedMessage),
        this.get(TYPES.GetOutboundMessages),
        this.get(TYPES.GetInboundMessages),
        this.get(TYPES.GetUntrustedPayload),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SharedVaultService, () => {
      return new SharedVaultService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.SessionManager),
        this.get(TYPES.GetVault),
        this.get(TYPES.GetOwnedSharedVaults),
        this.get(TYPES.CreateSharedVault),
        this.get(TYPES.HandleKeyPairChange),
        this.get(TYPES.NotifyVaultUsersOfKeyRotation),
        this.get(TYPES.SendVaultDataChangedMessage),
        this.get(TYPES.FindContact),
        this.get(TYPES.DeleteThirdPartyVault),
        this.get(TYPES.ShareContactWithVault),
        this.get(TYPES.ConvertToSharedVault),
        this.get(TYPES.DeleteSharedVault),
        this.get(TYPES.IsVaultOwner),
        this.get(TYPES.DiscardItemsLocally),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.VaultLockService, () => {
      return new VaultLockService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.KeySystemKeyManager),
        this.get(TYPES.GetVaults),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.VaultService, () => {
      return new VaultService(
        this.get(TYPES.SyncService),
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.VaultLockService),
        this.get(TYPES.AlertService),
        this.get(TYPES.GetVault),
        this.get(TYPES.GetVaults),
        this.get(TYPES.ChangeVaultKeyOptions),
        this.get(TYPES.MoveItemsToVault),
        this.get(TYPES.CreateVault),
        this.get(TYPES.RemoveItemFromVault),
        this.get(TYPES.DeleteVault),
        this.get(TYPES.RotateVaultKey),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SelfContactManager, () => {
      return new SelfContactManager(
        this.get(TYPES.SyncService),
        this.get(TYPES.ItemManager),
        this.get(TYPES.SessionManager),
        this.get(TYPES.SingletonManager),
      )
    })

    this.factory.set(TYPES.ContactService, () => {
      return new ContactService(
        this.get(TYPES.SyncService),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SessionManager),
        this.get(TYPES.Crypto),
        this.get(TYPES.UserService),
        this.get(TYPES.SelfContactManager),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.DeleteContact),
        this.get(TYPES.FindContact),
        this.get(TYPES.GetAllContacts),
        this.get(TYPES.CreateOrEditContact),
        this.get(TYPES.EditContact),
        this.get(TYPES.ValidateItemSigner),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SignInWithRecoveryCodes, () => {
      return new SignInWithRecoveryCodes(
        this.get(TYPES.AuthManager),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.InMemoryStore),
        this.get(TYPES.Crypto),
        this.get(TYPES.SessionManager),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.GetRecoveryCodes, () => {
      return new GetRecoveryCodes(this.get(TYPES.AuthManager), this.get(TYPES.SettingsService))
    })

    this.factory.set(TYPES.AddAuthenticator, () => {
      return new AddAuthenticator(
        this.get(TYPES.AuthenticatorManager),
        this.options.u2fAuthenticatorRegistrationPromptFunction,
      )
    })

    this.factory.set(TYPES.ListAuthenticators, () => {
      return new ListAuthenticators(this.get(TYPES.AuthenticatorManager))
    })

    this.factory.set(TYPES.DeleteAuthenticator, () => {
      return new DeleteAuthenticator(this.get(TYPES.AuthenticatorManager))
    })

    this.factory.set(TYPES.GetAuthenticatorAuthenticationOptions, () => {
      return new GetAuthenticatorAuthenticationOptions(this.get(TYPES.AuthenticatorManager))
    })

    this.factory.set(TYPES.GetAuthenticatorAuthenticationResponse, () => {
      return new GetAuthenticatorAuthenticationResponse(
        this.get(TYPES.GetAuthenticatorAuthenticationOptions),
        this.options.u2fAuthenticatorVerificationPromptFunction,
      )
    })

    this.factory.set(TYPES.ListRevisions, () => {
      return new ListRevisions(this.get(TYPES.RevisionManager))
    })

    this.factory.set(TYPES.GetRevision, () => {
      return new GetRevision(this.get(TYPES.RevisionManager), this.get(TYPES.EncryptionService))
    })

    this.factory.set(TYPES.DeleteRevision, () => {
      return new DeleteRevision(this.get(TYPES.RevisionManager))
    })

    this.factory.set(TYPES.RevisionServer, () => {
      return new RevisionServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.RevisionApiService, () => {
      return new RevisionApiService(this.get(TYPES.RevisionServer))
    })

    this.factory.set(TYPES.RevisionManager, () => {
      return new RevisionManager(this.get(TYPES.RevisionApiService), this.get(TYPES.InternalEventBus))
    })

    this.factory.set(TYPES.AuthServer, () => {
      return new AuthServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.AuthApiService, () => {
      return new AuthApiService(this.get(TYPES.AuthServer))
    })

    this.factory.set(TYPES.AuthManager, () => {
      return new AuthManager(this.get(TYPES.AuthApiService), this.get(TYPES.InternalEventBus))
    })

    this.factory.set(TYPES.AuthenticatorServer, () => {
      return new AuthenticatorServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.AuthenticatorApiService, () => {
      return new AuthenticatorApiService(this.get(TYPES.AuthenticatorServer))
    })

    this.factory.set(TYPES.AuthenticatorManager, () => {
      return new AuthenticatorManager(
        this.get(TYPES.AuthenticatorApiService),
        this.get(TYPES.PreferencesService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ActionsService, () => {
      return new ActionsService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.AlertService),
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.DeprecatedHttpService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ListedService, () => {
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

    this.factory.set(TYPES.IntegrityService, () => {
      return new IntegrityService(
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.Logger),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.FileService, () => {
      return new FileService(
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.HttpService),
        this.get(TYPES.AlertService),
        this.get(TYPES.Crypto),
        this.get(TYPES.InternalEventBus),
        this.get(TYPES.Logger),
        this.get(TYPES.FilesBackupService),
      )
    })

    this.factory.set(TYPES.MigrationService, () => {
      return new MigrationService({
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

    this.factory.set(TYPES.HomeServerService, () => {
      if (!isDesktopDevice(this.get(TYPES.DeviceInterface))) {
        return undefined
      }

      return new HomeServerService(this.get(TYPES.DeviceInterface), this.get(TYPES.InternalEventBus))
    })

    this.factory.set(TYPES.FilesBackupService, () => {
      if (!isDesktopDevice(this.get(TYPES.DeviceInterface))) {
        return undefined
      }

      return new FilesBackupService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.StatusService),
        this.get(TYPES.Crypto),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.SessionManager),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.HistoryManager),
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.StatusService, () => {
      return new StatusService(this.get(TYPES.InternalEventBus))
    })

    this.factory.set(TYPES.MfaService, () => {
      return new SNMfaService(
        this.get(TYPES.SettingsService),
        this.get(TYPES.Crypto),
        this.get(TYPES.FeaturesService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ComponentManager, () => {
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
        this.get(TYPES.Logger),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.FeaturesService, () => {
      return new FeaturesService(
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
        this.get(TYPES.Logger),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SettingsService, () => {
      return new SettingsService(
        this.get(TYPES.SessionManager),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.PreferencesService, () => {
      return new SNPreferencesService(
        this.get(TYPES.SingletonManager),
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.SyncService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SingletonManager, () => {
      return new SingletonManager(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.SyncService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.KeyRecoveryService, () => {
      return new KeyRecoveryService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.AlertService),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.SyncService),
        this.get(TYPES.UserService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.UserService, () => {
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
        this.get(TYPES.ReencryptTypeAItems),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ProtectionService, () => {
      return new SNProtectionService(
        this.get(TYPES.EncryptionService),
        this.get(TYPES.MutatorService),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SyncService, () => {
      return new SyncService(
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
        this.get(TYPES.Logger),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.HistoryManager, () => {
      return new HistoryManager(
        this.get(TYPES.ItemManager),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.DeviceInterface),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SubscriptionManager, () => {
      return new SubscriptionManager(
        this.get(TYPES.SubscriptionApiService),
        this.get(TYPES.SessionManager),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SessionManager, () => {
      return new SessionManager(
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.LegacyApiService),
        this.get(TYPES.UserApiService),
        this.get(TYPES.AlertService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.Crypto),
        this.get(TYPES.ChallengeService),
        this.get(TYPES.WebSocketsService),
        this.get(TYPES.HttpService),
        this.get(TYPES.SessionStorageMapper),
        this.get(TYPES.LegacySessionStorageMapper),
        this.options.identifier,
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.WebSocketsService, () => {
      return new WebSocketsService(
        this.get(TYPES.DiskStorageService),
        this.options.webSocketUrl,
        this.get(TYPES.WebSocketApiService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.WebSocketApiService, () => {
      return new WebSocketApiService(this.get(TYPES.WebSocketServer))
    })

    this.factory.set(TYPES.WebSocketServer, () => {
      return new WebSocketServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.SubscriptionApiService, () => {
      return new SubscriptionApiService(this.get(TYPES.SubscriptionServer))
    })

    this.factory.set(TYPES.UserApiService, () => {
      return new UserApiService(this.get(TYPES.UserServer), this.get(TYPES.UserRequestServer))
    })

    this.factory.set(TYPES.SubscriptionServer, () => {
      return new SubscriptionServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.UserRequestServer, () => {
      return new UserRequestServer(this.get(TYPES.HttpService))
    })

    this.factory.set(TYPES.InternalEventBus, () => {
      return new InternalEventBus()
    })

    this.factory.set(TYPES.PayloadManager, () => {
      return new PayloadManager(this.get(TYPES.Logger), this.get(TYPES.InternalEventBus))
    })

    this.factory.set(TYPES.ItemManager, () => {
      return new ItemManager(this.get(TYPES.PayloadManager), this.get(TYPES.InternalEventBus))
    })

    this.factory.set(TYPES.MutatorService, () => {
      return new MutatorService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.AlertService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.DiskStorageService, () => {
      return new DiskStorageService(
        this.get(TYPES.DeviceInterface),
        this.options.identifier,
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.NotificationService, () => {
      return new NotificationService(this.get(TYPES.InternalEventBus))
    })

    this.factory.set(TYPES.InMemoryStore, () => {
      return new InMemoryStore()
    })

    this.factory.set(TYPES.KeySystemKeyManager, () => {
      return new KeySystemKeyManager(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.RemoveItemsFromMemory),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ChallengeService, () => {
      return new ChallengeService(
        this.get(TYPES.DiskStorageService),
        this.get(TYPES.EncryptionService),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.EncryptionService, () => {
      return new EncryptionService(
        this.get(TYPES.ItemManager),
        this.get(TYPES.MutatorService),
        this.get(TYPES.PayloadManager),
        this.get(TYPES.EncryptionOperators),
        this.get(TYPES.ItemsEncryptionService),
        this.get(TYPES.RootKeyManager),
        this.get(TYPES.Crypto),
        this.get(TYPES.CreateNewItemsKeyWithRollback),
        this.get(TYPES.FindDefaultItemsKey),
        this.get(TYPES.DecryptErroredTypeAPayloads),
        this.get(TYPES.EncryptTypeAPayloadWithKeyLookup),
        this.get(TYPES.EncryptTypeAPayload),
        this.get(TYPES.DecryptTypeAPayload),
        this.get(TYPES.DecryptTypeAPayloadWithKeyLookup),
        this.get(TYPES.CreateNewDefaultItemsKey),
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.DeprecatedHttpService, () => {
      return new DeprecatedHttpService(
        this.options.environment,
        this.options.appVersion,
        this.get(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.HttpService, () => {
      return new HttpService(this.options.environment, this.options.appVersion, SnjsVersion, this.get(TYPES.Logger))
    })

    this.factory.set(TYPES.LegacyApiService, () => {
      return new LegacyApiService(
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

    this.factory.set(TYPES.SessionStorageMapper, () => {
      return new SessionStorageMapper()
    })

    this.factory.set(TYPES.LegacySessionStorageMapper, () => {
      return new LegacySessionStorageMapper()
    })
  }
}
