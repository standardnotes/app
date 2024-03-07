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
import { MfaService } from '../../Services/Mfa/MfaService'
import { ComponentManager } from '../../Services/ComponentManager/ComponentManager'
import { FeaturesService } from '@Lib/Services/Features/FeaturesService'
import { SettingsService } from '../../Services/Settings/SNSettingsService'
import { PreferencesService } from '../../Services/Preferences/PreferencesService'
import { SingletonManager } from '../../Services/Singleton/SingletonManager'
import { KeyRecoveryService } from '../../Services/KeyRecovery/KeyRecoveryService'
import { ProtectionService } from '../../Services/Protection/ProtectionService'
import { SyncService } from '../../Services/Sync/SyncService'
import { HistoryManager } from '../../Services/History/HistoryManager'
import { SessionManager } from '../../Services/Session/SessionManager'
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
  ImportData,
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
  DecryptErroredPayloads,
  GetKeyPairs,
  DeviceInterface,
  AlertService,
  DesktopDeviceInterface,
  ChangeVaultStorageMode,
  ChangeAndSaveItem,
  FullyResolvedApplicationOptions,
  GetHost,
  SetHost,
  GenerateUuid,
  GetVaultItems,
  ValidateVaultPassword,
  DecryptBackupPayloads,
  DetermineKeyToUse,
  GetBackupFileType,
  GetFilePassword,
  IsApplicationUsingThirdPartyHost,
  CreateDecryptedBackupFile,
  CreateEncryptedBackupFile,
  SyncLocalVaultsWithRemoteSharedVaults,
  WebSocketsService,
  AuthorizeVaultDeletion,
  IsVaultAdmin,
  IsReadonlyVaultMember,
  DesignateSurvivor,
  SyncBackoffService,
  SyncBackoffServiceInterface,
  StorageServiceInterface,
  ProtectionsClientInterface,
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
  SharedVaultUsersServerInterface,
  SubscriptionApiService,
  SubscriptionServer,
  UserApiService,
  UserRequestServer,
  UserServer,
  WebSocketApiService,
  WebSocketServer,
} from '@standardnotes/api'
import { TYPES } from './Types'
import { Logger, isNotUndefined, isDeinitable, LoggerInterface } from '@standardnotes/utils'
import { EncryptionOperators } from '@standardnotes/encryption'
import { AsymmetricMessagePayload, AsymmetricMessageSharedVaultInvite } from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SyncFrequencyGuard } from '@Lib/Services/Sync/SyncFrequencyGuard'
import { SyncFrequencyGuardInterface } from '@Lib/Services/Sync/SyncFrequencyGuardInterface'

export class Dependencies {
  private factory = new Map<symbol, () => unknown>()
  private dependencies = new Map<symbol, unknown>()

  private DEFAULT_SYNC_CALLS_THRESHOLD_PER_MINUTE = 200

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
    this.factory.set(TYPES.DecryptBackupPayloads, () => {
      return new DecryptBackupPayloads(
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<DetermineKeyToUse>(TYPES.DetermineKeyToUse),
        this.get<LoggerInterface>(TYPES.Logger),
      )
    })

    this.factory.set(TYPES.DetermineKeyToUse, () => {
      return new DetermineKeyToUse(
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
      )
    })

    this.factory.set(TYPES.GetBackupFileType, () => {
      return new GetBackupFileType()
    })

    this.factory.set(TYPES.GetFilePassword, () => {
      return new GetFilePassword(this.get<ChallengeService>(TYPES.ChallengeService))
    })

    this.factory.set(TYPES.ValidateVaultPassword, () => {
      return new ValidateVaultPassword(
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
      )
    })

    this.factory.set(TYPES.AuthorizeVaultDeletion, () => {
      return new AuthorizeVaultDeletion(
        this.get<VaultLockService>(TYPES.VaultLockService),
        this.get<ProtectionService>(TYPES.ProtectionService),
        this.get<ChallengeService>(TYPES.ChallengeService),
        this.get<ValidateVaultPassword>(TYPES.ValidateVaultPassword),
      )
    })

    this.factory.set(TYPES.GenerateUuid, () => {
      return new GenerateUuid(this.get<PureCryptoInterface>(TYPES.Crypto))
    })

    this.factory.set(TYPES.GetVaultItems, () => {
      return new GetVaultItems(this.get<ItemManager>(TYPES.ItemManager))
    })

    this.factory.set(TYPES.DecryptErroredPayloads, () => {
      return new DecryptErroredPayloads(
        this.get<ItemsEncryptionService>(TYPES.ItemsEncryptionService),
        this.get<DecryptErroredTypeAPayloads>(TYPES.DecryptErroredTypeAPayloads),
      )
    })

    this.factory.set(TYPES.GetHost, () => {
      return new GetHost(this.get<LegacyApiService>(TYPES.LegacyApiService))
    })

    this.factory.set(TYPES.IsApplicationUsingThirdPartyHost, () => {
      return new IsApplicationUsingThirdPartyHost(this.get<GetHost>(TYPES.GetHost))
    })

    this.factory.set(TYPES.SetHost, () => {
      return new SetHost(this.get<HttpService>(TYPES.HttpService), this.get<LegacyApiService>(TYPES.LegacyApiService))
    })

    this.factory.set(TYPES.GetKeyPairs, () => {
      return new GetKeyPairs(this.get<RootKeyManager>(TYPES.RootKeyManager))
    })

    this.factory.set(TYPES.ReencryptTypeAItems, () => {
      return new ReencryptTypeAItems(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<MutatorService>(TYPES.MutatorService),
      )
    })

    this.factory.set(TYPES.CreateDecryptedBackupFile, () => {
      return new CreateDecryptedBackupFile(
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<ProtectionService>(TYPES.ProtectionService),
      )
    })

    this.factory.set(TYPES.CreateEncryptedBackupFile, () => {
      return new CreateEncryptedBackupFile(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<ProtectionService>(TYPES.ProtectionService),
        this.get<EncryptionService>(TYPES.EncryptionService),
      )
    })

    this.factory.set(TYPES.ImportData, () => {
      return new ImportData(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<SyncService>(TYPES.SyncService),
        this.get<ProtectionService>(TYPES.ProtectionService),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<HistoryManager>(TYPES.HistoryManager),
        this.get<DecryptBackupFile>(TYPES.DecryptBackupFile),
        this.get<GetFilePassword>(TYPES.GetFilePassword),
      )
    })

    this.factory.set(TYPES.IsVaultOwner, () => {
      return new IsVaultOwner(this.get<UserService>(TYPES.UserService))
    })

    this.factory.set(TYPES.IsVaultAdmin, () => {
      return new IsVaultAdmin(this.get<UserService>(TYPES.UserService), this.get<VaultUserCache>(TYPES.VaultUserCache))
    })

    this.factory.set(TYPES.IsReadonlyVaultMember, () => {
      return new IsReadonlyVaultMember(
        this.get<UserService>(TYPES.UserService),
        this.get<VaultUserCache>(TYPES.VaultUserCache),
      )
    })

    this.factory.set(TYPES.DecryptBackupFile, () => {
      return new DecryptBackupFile(
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<GetBackupFileType>(TYPES.GetBackupFileType),
        this.get<DecryptBackupPayloads>(TYPES.DecryptBackupPayloads),
      )
    })

    this.factory.set(TYPES.DiscardItemsLocally, () => {
      return new DiscardItemsLocally(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
      )
    })

    this.factory.set(TYPES.RemoveItemsFromMemory, () => {
      return new RemoveItemsFromMemory(
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<PayloadManager>(TYPES.PayloadManager),
      )
    })

    this.factory.set(TYPES.FindContact, () => {
      return new FindContact(this.get<ItemManager>(TYPES.ItemManager))
    })

    this.factory.set(TYPES.DeleteContact, () => {
      return new DeleteContact(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<GetOwnedSharedVaults>(TYPES.GetOwnedSharedVaults),
        this.get<ContactBelongsToVault>(TYPES.ContactBelongsToVault),
      )
    })

    this.factory.set(TYPES.EditContact, () => {
      return new EditContact(this.get<MutatorService>(TYPES.MutatorService))
    })

    this.factory.set(TYPES.GetAllContacts, () => {
      return new GetAllContacts(this.get<ItemManager>(TYPES.ItemManager))
    })

    this.factory.set(TYPES.ValidateItemSigner, () => {
      return new ValidateItemSigner(this.get<FindContact>(TYPES.FindContact))
    })

    this.factory.set(TYPES.CreateOrEditContact, () => {
      return new CreateOrEditContact(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<FindContact>(TYPES.FindContact),
        this.get<EditContact>(TYPES.EditContact),
      )
    })

    this.factory.set(TYPES.GetVault, () => {
      return new GetVault(this.get<ItemManager>(TYPES.ItemManager))
    })

    this.factory.set(TYPES.GetVaults, () => {
      return new GetVaults(this.get<ItemManager>(TYPES.ItemManager))
    })

    this.factory.set(TYPES.SyncLocalVaultsWithRemoteSharedVaults, () => {
      return new SyncLocalVaultsWithRemoteSharedVaults(
        this.get<SharedVaultServer>(TYPES.SharedVaultServer),
        this.get<MutatorService>(TYPES.MutatorService),
      )
    })

    this.factory.set(TYPES.ChangeAndSaveItem, () => {
      return new ChangeAndSaveItem(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
      )
    })

    this.factory.set(TYPES.GetSharedVaults, () => {
      return new GetSharedVaults(this.get<GetVaults>(TYPES.GetVaults))
    })

    this.factory.set(TYPES.GetOwnedSharedVaults, () => {
      return new GetOwnedSharedVaults(
        this.get<GetSharedVaults>(TYPES.GetSharedVaults),
        this.get<IsVaultOwner>(TYPES.IsVaultOwner),
      )
    })

    this.factory.set(TYPES.ContactBelongsToVault, () => {
      return new ContactBelongsToVault(this.get<GetVaultUsers>(TYPES.GetVaultUsers))
    })

    this.factory.set(TYPES.ChangeVaultStorageMode, () => {
      return new ChangeVaultStorageMode(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<GetVault>(TYPES.GetVault),
      )
    })

    this.factory.set(TYPES.ChangeVaultKeyOptions, () => {
      return new ChangeVaultKeyOptions(
        this.get<SyncService>(TYPES.SyncService),
        this.get<RotateVaultKey>(TYPES.RotateVaultKey),
        this.get<ChangeVaultStorageMode>(TYPES.ChangeVaultStorageMode),
      )
    })

    this.factory.set(TYPES.MoveItemsToVault, () => {
      return new MoveItemsToVault(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<FileService>(TYPES.FileService),
      )
    })

    this.factory.set(TYPES.CreateVault, () => {
      return new CreateVault(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<SyncService>(TYPES.SyncService),
      )
    })

    this.factory.set(TYPES.RemoveItemFromVault, () => {
      return new RemoveItemFromVault(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<FileService>(TYPES.FileService),
      )
    })

    this.factory.set(TYPES.DeleteVault, () => {
      return new DeleteVault(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<GetVaultItems>(TYPES.GetVaultItems),
      )
    })

    this.factory.set(TYPES.RotateVaultKey, () => {
      return new RotateVaultKey(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<NotifyVaultUsersOfKeyRotation>(TYPES.NotifyVaultUsersOfKeyRotation),
        this.get<IsVaultOwner>(TYPES.IsVaultOwner),
      )
    })

    this.factory.set(TYPES.ReuploadInvite, () => {
      return new ReuploadInvite(
        this.get<DecryptOwnMessage<AsymmetricMessageSharedVaultInvite>>(TYPES.DecryptOwnMessage),
        this.get<SendVaultInvite>(TYPES.SendVaultInvite),
        this.get<EncryptMessage>(TYPES.EncryptMessage),
      )
    })

    this.factory.set(TYPES.ReuploadAllInvites, () => {
      return new ReuploadAllInvites(
        this.get<ReuploadInvite>(TYPES.ReuploadInvite),
        this.get<FindContact>(TYPES.FindContact),
        this.get<SharedVaultInvitesServer>(TYPES.SharedVaultInvitesServer),
      )
    })

    this.factory.set(TYPES.ResendAllMessages, () => {
      return new ResendAllMessages(
        this.get<ResendMessage>(TYPES.ResendMessage),
        this.get<DecryptOwnMessage<AsymmetricMessagePayload>>(TYPES.DecryptOwnMessage),
        this.get<AsymmetricMessageServer>(TYPES.AsymmetricMessageServer),
        this.get<FindContact>(TYPES.FindContact),
      )
    })

    this.factory.set(TYPES.CreateSharedVault, () => {
      return new CreateSharedVault(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SharedVaultServer>(TYPES.SharedVaultServer),
        this.get<CreateVault>(TYPES.CreateVault),
        this.get<MoveItemsToVault>(TYPES.MoveItemsToVault),
        this.get<GetVaultItems>(TYPES.GetVaultItems),
      )
    })

    this.factory.set(TYPES.HandleKeyPairChange, () => {
      return new HandleKeyPairChange(
        this.get<SelfContactManager>(TYPES.SelfContactManager),
        this.get<SharedVaultInvitesServer>(TYPES.SharedVaultInvitesServer),
        this.get<AsymmetricMessageServer>(TYPES.AsymmetricMessageServer),
        this.get<ReuploadAllInvites>(TYPES.ReuploadAllInvites),
        this.get<ResendAllMessages>(TYPES.ResendAllMessages),
        this.get<GetAllContacts>(TYPES.GetAllContacts),
        this.get<SendOwnContactChangeMessage>(TYPES.SendOwnContactChangeMessage),
        this.get<CreateOrEditContact>(TYPES.CreateOrEditContact),
        this.get<Logger>(TYPES.Logger),
      )
    })

    this.factory.set(TYPES.NotifyVaultUsersOfKeyRotation, () => {
      return new NotifyVaultUsersOfKeyRotation(
        this.get<FindContact>(TYPES.FindContact),
        this.get<SendVaultKeyChangedMessage>(TYPES.SendVaultKeyChangedMessage),
        this.get<InviteToVault>(TYPES.InviteToVault),
        this.get<SharedVaultInvitesServer>(TYPES.SharedVaultInvitesServer),
        this.get<GetVaultContacts>(TYPES.GetVaultContacts),
        this.get<DecryptOwnMessage<AsymmetricMessageSharedVaultInvite>>(TYPES.DecryptOwnMessage),
        this.get<GetKeyPairs>(TYPES.GetKeyPairs),
      )
    })

    this.factory.set(TYPES.SendVaultKeyChangedMessage, () => {
      return new SendVaultKeyChangedMessage(
        this.get<UserService>(TYPES.UserService),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<EncryptMessage>(TYPES.EncryptMessage),
        this.get<FindContact>(TYPES.FindContact),
        this.get<SendMessage>(TYPES.SendMessage),
        this.get<GetVaultUsers>(TYPES.GetVaultUsers),
        this.get<GetKeyPairs>(TYPES.GetKeyPairs),
      )
    })

    this.factory.set(TYPES.SendVaultDataChangedMessage, () => {
      return new SendVaultDataChangedMessage(
        this.get<UserService>(TYPES.UserService),
        this.get<EncryptMessage>(TYPES.EncryptMessage),
        this.get<FindContact>(TYPES.FindContact),
        this.get<GetVaultUsers>(TYPES.GetVaultUsers),
        this.get<SendMessage>(TYPES.SendMessage),
        this.get<IsVaultOwner>(TYPES.IsVaultOwner),
        this.get<GetKeyPairs>(TYPES.GetKeyPairs),
      )
    })

    this.factory.set(TYPES.ReplaceContactData, () => {
      return new ReplaceContactData(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<FindContact>(TYPES.FindContact),
      )
    })

    this.factory.set(TYPES.GetTrustedPayload, () => {
      return new GetTrustedPayload(this.get<DecryptMessage>(TYPES.DecryptMessage))
    })

    this.factory.set(TYPES.GetUntrustedPayload, () => {
      return new GetUntrustedPayload(this.get<DecryptMessage>(TYPES.DecryptMessage))
    })

    this.factory.set(TYPES.GetVaultContacts, () => {
      return new GetVaultContacts(
        this.get<FindContact>(TYPES.FindContact),
        this.get<GetVaultUsers>(TYPES.GetVaultUsers),
      )
    })

    this.factory.set(TYPES.AcceptVaultInvite, () => {
      return new AcceptVaultInvite(
        this.get<SharedVaultInvitesServer>(TYPES.SharedVaultInvitesServer),
        this.get<ProcessAcceptedVaultInvite>(TYPES.ProcessAcceptedVaultInvite),
      )
    })

    this.factory.set(TYPES.InviteToVault, () => {
      return new InviteToVault(
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<EncryptMessage>(TYPES.EncryptMessage),
        this.get<SendVaultInvite>(TYPES.SendVaultInvite),
        this.get<ShareContactWithVault>(TYPES.ShareContactWithVault),
        this.get<GetKeyPairs>(TYPES.GetKeyPairs),
      )
    })

    this.factory.set(TYPES.SendVaultInvite, () => {
      return new SendVaultInvite(this.get<SharedVaultInvitesServer>(TYPES.SharedVaultInvitesServer))
    })

    this.factory.set(TYPES.DeleteThirdPartyVault, () => {
      return new DeleteThirdPartyVault(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<SyncService>(TYPES.SyncService),
        this.get<DiscardItemsLocally>(TYPES.DiscardItemsLocally),
      )
    })

    this.factory.set(TYPES.LeaveVault, () => {
      return new LeaveVault(
        this.get<UserService>(TYPES.UserService),
        this.get<SharedVaultUsersServer>(TYPES.SharedVaultUsersServer),
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<DeleteThirdPartyVault>(TYPES.DeleteThirdPartyVault),
      )
    })

    this.factory.set(TYPES.ShareContactWithVault, () => {
      return new ShareContactWithVault(
        this.get<UserService>(TYPES.UserService),
        this.get<FindContact>(TYPES.FindContact),
        this.get<EncryptMessage>(TYPES.EncryptMessage),
        this.get<SendMessage>(TYPES.SendMessage),
        this.get<GetVaultUsers>(TYPES.GetVaultUsers),
        this.get<GetKeyPairs>(TYPES.GetKeyPairs),
      )
    })

    this.factory.set(TYPES.ConvertToSharedVault, () => {
      return new ConvertToSharedVault(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SharedVaultServer>(TYPES.SharedVaultServer),
        this.get<MoveItemsToVault>(TYPES.MoveItemsToVault),
        this.get<GetVaultItems>(TYPES.GetVaultItems),
      )
    })

    this.factory.set(TYPES.DeleteSharedVault, () => {
      return new DeleteSharedVault(
        this.get<SharedVaultServer>(TYPES.SharedVaultServer),
        this.get<SyncService>(TYPES.SyncService),
        this.get<DeleteVault>(TYPES.DeleteVault),
      )
    })

    this.factory.set(TYPES.RemoveVaultMember, () => {
      return new RemoveVaultMember(this.get<SharedVaultUsersServer>(TYPES.SharedVaultUsersServer))
    })

    this.factory.set(TYPES.DesignateSurvivor, () => {
      return new DesignateSurvivor(this.get<SharedVaultUsersServerInterface>(TYPES.SharedVaultUsersServer))
    })

    this.factory.set(TYPES.GetVaultUsers, () => {
      return new GetVaultUsers(
        this.get<SharedVaultUsersServer>(TYPES.SharedVaultUsersServer),
        this.get<VaultUserCache>(TYPES.VaultUserCache),
      )
    })

    this.factory.set(TYPES.DecryptOwnMessage, () => {
      return new DecryptOwnMessage(this.get<EncryptionOperators>(TYPES.EncryptionOperators))
    })

    this.factory.set(TYPES.EncryptMessage, () => {
      return new EncryptMessage(this.get<EncryptionOperators>(TYPES.EncryptionOperators))
    })

    this.factory.set(TYPES.DecryptMessage, () => {
      return new DecryptMessage(this.get<EncryptionOperators>(TYPES.EncryptionOperators))
    })

    this.factory.set(TYPES.ResendMessage, () => {
      return new ResendMessage(this.get<SendMessage>(TYPES.SendMessage), this.get<EncryptMessage>(TYPES.EncryptMessage))
    })

    this.factory.set(TYPES.SendMessage, () => {
      return new SendMessage(this.get<AsymmetricMessageServer>(TYPES.AsymmetricMessageServer))
    })

    this.factory.set(TYPES.ProcessAcceptedVaultInvite, () => {
      return new ProcessAcceptedVaultInvite(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<CreateOrEditContact>(TYPES.CreateOrEditContact),
      )
    })

    this.factory.set(TYPES.HandleRootKeyChangedMessage, () => {
      return new HandleRootKeyChangedMessage(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<GetVault>(TYPES.GetVault),
        this.get<DecryptErroredPayloads>(TYPES.DecryptErroredPayloads),
      )
    })

    this.factory.set(TYPES.SendOwnContactChangeMessage, () => {
      return new SendOwnContactChangeMessage(
        this.get<EncryptMessage>(TYPES.EncryptMessage),
        this.get<SendMessage>(TYPES.SendMessage),
      )
    })

    this.factory.set(TYPES.GetOutboundMessages, () => {
      return new GetOutboundMessages(this.get<AsymmetricMessageServer>(TYPES.AsymmetricMessageServer))
    })

    this.factory.set(TYPES.GetInboundMessages, () => {
      return new GetInboundMessages(this.get<AsymmetricMessageServer>(TYPES.AsymmetricMessageServer))
    })

    this.factory.set(TYPES.CreateNewDefaultItemsKey, () => {
      return new CreateNewDefaultItemsKey(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<EncryptionOperators>(TYPES.EncryptionOperators),
        this.get<RootKeyManager>(TYPES.RootKeyManager),
      )
    })

    this.factory.set(TYPES.CreateNewItemsKeyWithRollback, () => {
      return new CreateNewItemsKeyWithRollback(
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<CreateNewDefaultItemsKey>(TYPES.CreateNewDefaultItemsKey),
        this.get<DiscardItemsLocally>(TYPES.DiscardItemsLocally),
        this.get<FindDefaultItemsKey>(TYPES.FindDefaultItemsKey),
      )
    })

    this.factory.set(TYPES.FindDefaultItemsKey, () => {
      return new FindDefaultItemsKey()
    })

    this.factory.set(TYPES.DecryptErroredTypeAPayloads, () => {
      return new DecryptErroredTypeAPayloads(
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<DecryptTypeAPayloadWithKeyLookup>(TYPES.DecryptTypeAPayloadWithKeyLookup),
      )
    })

    this.factory.set(TYPES.DecryptTypeAPayload, () => {
      return new DecryptTypeAPayload(this.get<EncryptionOperators>(TYPES.EncryptionOperators))
    })

    this.factory.set(TYPES.DecryptTypeAPayloadWithKeyLookup, () => {
      return new DecryptTypeAPayloadWithKeyLookup(
        this.get<EncryptionOperators>(TYPES.EncryptionOperators),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<RootKeyManager>(TYPES.RootKeyManager),
        this.get<Logger>(TYPES.Logger),
      )
    })

    this.factory.set(TYPES.EncryptTypeAPayload, () => {
      return new EncryptTypeAPayload(this.get<EncryptionOperators>(TYPES.EncryptionOperators))
    })

    this.factory.set(TYPES.EncryptTypeAPayloadWithKeyLookup, () => {
      return new EncryptTypeAPayloadWithKeyLookup(
        this.get<EncryptionOperators>(TYPES.EncryptionOperators),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<RootKeyManager>(TYPES.RootKeyManager),
      )
    })
  }

  private registerServiceMakers() {
    this.factory.set(TYPES.Logger, () => {
      return new Logger(this.options.identifier)
    })

    this.factory.set(TYPES.UserServer, () => {
      return new UserServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.RootKeyManager, () => {
      return new RootKeyManager(
        this.get<DeviceInterface>(TYPES.DeviceInterface),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<EncryptionOperators>(TYPES.EncryptionOperators),
        this.options.identifier,
        this.get<ReencryptTypeAItems>(TYPES.ReencryptTypeAItems),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ItemsEncryptionService, () => {
      return new ItemsEncryptionService(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<EncryptionOperators>(TYPES.EncryptionOperators),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<FindDefaultItemsKey>(TYPES.FindDefaultItemsKey),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.EncryptionOperators, () => {
      return new EncryptionOperators(this.get<PureCryptoInterface>(TYPES.Crypto))
    })

    this.factory.set(TYPES.SharedVaultInvitesServer, () => {
      return new SharedVaultInvitesServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.SharedVaultServer, () => {
      return new SharedVaultServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.AsymmetricMessageServer, () => {
      return new AsymmetricMessageServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.SharedVaultUsersServer, () => {
      return new SharedVaultUsersServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.VaultUserService, () => {
      return new VaultUserService(
        this.get<VaultService>(TYPES.VaultService),
        this.get<VaultLockService>(TYPES.VaultLockService),
        this.get<GetVaultUsers>(TYPES.GetVaultUsers),
        this.get<RemoveVaultMember>(TYPES.RemoveVaultMember),
        this.get<IsVaultOwner>(TYPES.IsVaultOwner),
        this.get<IsVaultAdmin>(TYPES.IsVaultAdmin),
        this.get<IsReadonlyVaultMember>(TYPES.IsReadonlyVaultMember),
        this.get<GetVault>(TYPES.GetVault),
        this.get<LeaveVault>(TYPES.LeaveVault),
        this.get<DesignateSurvivor>(TYPES.DesignateSurvivor),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.VaultUserCache, () => {
      return new VaultUserCache()
    })

    this.factory.set(TYPES.VaultInviteService, () => {
      return new VaultInviteService(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<VaultUserService>(TYPES.VaultUserService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<SharedVaultInvitesServer>(TYPES.SharedVaultInvitesServer),
        this.get<StatusService>(TYPES.StatusService),
        this.get<GetAllContacts>(TYPES.GetAllContacts),
        this.get<GetVault>(TYPES.GetVault),
        this.get<GetVaultContacts>(TYPES.GetVaultContacts),
        this.get<InviteToVault>(TYPES.InviteToVault),
        this.get<GetTrustedPayload>(TYPES.GetTrustedPayload),
        this.get<GetUntrustedPayload>(TYPES.GetUntrustedPayload),
        this.get<FindContact>(TYPES.FindContact),
        this.get<AcceptVaultInvite>(TYPES.AcceptVaultInvite),
        this.get<GetKeyPairs>(TYPES.GetKeyPairs),
        this.get<DecryptErroredPayloads>(TYPES.DecryptErroredPayloads),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.AsymmetricMessageService, () => {
      return new AsymmetricMessageService(
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<SyncService>(TYPES.SyncService),
        this.get<AsymmetricMessageServer>(TYPES.AsymmetricMessageServer),
        this.get<CreateOrEditContact>(TYPES.CreateOrEditContact),
        this.get<FindContact>(TYPES.FindContact),
        this.get<ReplaceContactData>(TYPES.ReplaceContactData),
        this.get<GetTrustedPayload>(TYPES.GetTrustedPayload),
        this.get<GetVault>(TYPES.GetVault),
        this.get<HandleRootKeyChangedMessage>(TYPES.HandleRootKeyChangedMessage),
        this.get<GetOutboundMessages>(TYPES.GetOutboundMessages),
        this.get<GetInboundMessages>(TYPES.GetInboundMessages),
        this.get<GetUntrustedPayload>(TYPES.GetUntrustedPayload),
        this.get<GetKeyPairs>(TYPES.GetKeyPairs),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SharedVaultService, () => {
      return new SharedVaultService(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<VaultUserService>(TYPES.VaultUserService),
        this.get<SyncLocalVaultsWithRemoteSharedVaults>(TYPES.SyncLocalVaultsWithRemoteSharedVaults),
        this.get<GetVault>(TYPES.GetVault),
        this.get<GetOwnedSharedVaults>(TYPES.GetOwnedSharedVaults),
        this.get<CreateSharedVault>(TYPES.CreateSharedVault),
        this.get<HandleKeyPairChange>(TYPES.HandleKeyPairChange),
        this.get<FindContact>(TYPES.FindContact),
        this.get<DeleteThirdPartyVault>(TYPES.DeleteThirdPartyVault),
        this.get<ShareContactWithVault>(TYPES.ShareContactWithVault),
        this.get<ConvertToSharedVault>(TYPES.ConvertToSharedVault),
        this.get<DeleteSharedVault>(TYPES.DeleteSharedVault),
        this.get<DiscardItemsLocally>(TYPES.DiscardItemsLocally),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.VaultLockService, () => {
      return new VaultLockService(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<KeySystemKeyManager>(TYPES.KeySystemKeyManager),
        this.get<GetVaults>(TYPES.GetVaults),
        this.get<DecryptErroredPayloads>(TYPES.DecryptErroredPayloads),
        this.get<RemoveItemsFromMemory>(TYPES.RemoveItemsFromMemory),
        this.get<GetVaultItems>(TYPES.GetVaultItems),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.VaultService, () => {
      return new VaultService(
        this.get<SyncService>(TYPES.SyncService),
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<VaultLockService>(TYPES.VaultLockService),
        this.get<AlertService>(TYPES.AlertService),
        this.get<GetVault>(TYPES.GetVault),
        this.get<GetVaults>(TYPES.GetVaults),
        this.get<ChangeVaultKeyOptions>(TYPES.ChangeVaultKeyOptions),
        this.get<MoveItemsToVault>(TYPES.MoveItemsToVault),
        this.get<CreateVault>(TYPES.CreateVault),
        this.get<RemoveItemFromVault>(TYPES.RemoveItemFromVault),
        this.get<DeleteVault>(TYPES.DeleteVault),
        this.get<RotateVaultKey>(TYPES.RotateVaultKey),
        this.get<SendVaultDataChangedMessage>(TYPES.SendVaultDataChangedMessage),
        this.get<IsVaultOwner>(TYPES.IsVaultOwner),
        this.get<ValidateVaultPassword>(TYPES.ValidateVaultPassword),
        this.get<AuthorizeVaultDeletion>(TYPES.AuthorizeVaultDeletion),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SelfContactManager, () => {
      return new SelfContactManager(
        this.get<SyncService>(TYPES.SyncService),
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<SingletonManager>(TYPES.SingletonManager),
      )
    })

    this.factory.set(TYPES.ContactService, () => {
      return new ContactService(
        this.get<SyncService>(TYPES.SyncService),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<PureCryptoInterface>(TYPES.Crypto),
        this.get<UserService>(TYPES.UserService),
        this.get<SelfContactManager>(TYPES.SelfContactManager),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<DeleteContact>(TYPES.DeleteContact),
        this.get<FindContact>(TYPES.FindContact),
        this.get<GetAllContacts>(TYPES.GetAllContacts),
        this.get<CreateOrEditContact>(TYPES.CreateOrEditContact),
        this.get<EditContact>(TYPES.EditContact),
        this.get<ValidateItemSigner>(TYPES.ValidateItemSigner),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SignInWithRecoveryCodes, () => {
      return new SignInWithRecoveryCodes(
        this.get<AuthManager>(TYPES.AuthManager),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<InMemoryStore>(TYPES.InMemoryStore),
        this.get<PureCryptoInterface>(TYPES.Crypto),
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.GetRecoveryCodes, () => {
      return new GetRecoveryCodes(
        this.get<AuthManager>(TYPES.AuthManager),
        this.get<SettingsService>(TYPES.SettingsService),
      )
    })

    this.factory.set(TYPES.AddAuthenticator, () => {
      return new AddAuthenticator(
        this.get<AuthenticatorManager>(TYPES.AuthenticatorManager),
        this.options.u2fAuthenticatorRegistrationPromptFunction,
      )
    })

    this.factory.set(TYPES.ListAuthenticators, () => {
      return new ListAuthenticators(this.get<AuthenticatorManager>(TYPES.AuthenticatorManager))
    })

    this.factory.set(TYPES.DeleteAuthenticator, () => {
      return new DeleteAuthenticator(this.get<AuthenticatorManager>(TYPES.AuthenticatorManager))
    })

    this.factory.set(TYPES.GetAuthenticatorAuthenticationOptions, () => {
      return new GetAuthenticatorAuthenticationOptions(this.get<AuthenticatorManager>(TYPES.AuthenticatorManager))
    })

    this.factory.set(TYPES.GetAuthenticatorAuthenticationResponse, () => {
      return new GetAuthenticatorAuthenticationResponse(
        this.get<GetAuthenticatorAuthenticationOptions>(TYPES.GetAuthenticatorAuthenticationOptions),
        this.options.u2fAuthenticatorVerificationPromptFunction,
      )
    })

    this.factory.set(TYPES.ListRevisions, () => {
      return new ListRevisions(this.get<RevisionManager>(TYPES.RevisionManager))
    })

    this.factory.set(TYPES.GetRevision, () => {
      return new GetRevision(
        this.get<RevisionManager>(TYPES.RevisionManager),
        this.get<EncryptionService>(TYPES.EncryptionService),
      )
    })

    this.factory.set(TYPES.DeleteRevision, () => {
      return new DeleteRevision(this.get<RevisionManager>(TYPES.RevisionManager))
    })

    this.factory.set(TYPES.RevisionServer, () => {
      return new RevisionServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.RevisionApiService, () => {
      return new RevisionApiService(this.get<RevisionServer>(TYPES.RevisionServer))
    })

    this.factory.set(TYPES.RevisionManager, () => {
      return new RevisionManager(
        this.get<RevisionApiService>(TYPES.RevisionApiService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.AuthServer, () => {
      return new AuthServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.AuthApiService, () => {
      return new AuthApiService(this.get<AuthServer>(TYPES.AuthServer), this.options.apiVersion)
    })

    this.factory.set(TYPES.AuthManager, () => {
      return new AuthManager(
        this.get<AuthApiService>(TYPES.AuthApiService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.AuthenticatorServer, () => {
      return new AuthenticatorServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.AuthenticatorApiService, () => {
      return new AuthenticatorApiService(this.get<AuthenticatorServer>(TYPES.AuthenticatorServer))
    })

    this.factory.set(TYPES.AuthenticatorManager, () => {
      return new AuthenticatorManager(
        this.get<AuthenticatorApiService>(TYPES.AuthenticatorApiService),
        this.get<PreferencesService>(TYPES.PreferencesService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ActionsService, () => {
      return new ActionsService(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<AlertService>(TYPES.AlertService),
        this.get<DeviceInterface>(TYPES.DeviceInterface),
        this.get<DeprecatedHttpService>(TYPES.DeprecatedHttpService),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<ChallengeService>(TYPES.ChallengeService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ListedService, () => {
      return new ListedService(
        this.get<LegacyApiService>(TYPES.LegacyApiService),
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<SettingsService>(TYPES.SettingsService),
        this.get<DeprecatedHttpService>(TYPES.DeprecatedHttpService),
        this.get<ProtectionService>(TYPES.ProtectionService),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.IntegrityService, () => {
      return new IntegrityService(
        this.get<LegacyApiService>(TYPES.LegacyApiService),
        this.get<LegacyApiService>(TYPES.LegacyApiService),
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<Logger>(TYPES.Logger),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.FileService, () => {
      return new FileService(
        this.get<LegacyApiService>(TYPES.LegacyApiService),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<ChallengeService>(TYPES.ChallengeService),
        this.get<HttpService>(TYPES.HttpService),
        this.get<AlertService>(TYPES.AlertService),
        this.get<PureCryptoInterface>(TYPES.Crypto),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
        this.get<Logger>(TYPES.Logger),
        this.get<FilesBackupService>(TYPES.FilesBackupService),
      )
    })

    this.factory.set(TYPES.MigrationService, () => {
      return new MigrationService({
        encryptionService: this.get<EncryptionService>(TYPES.EncryptionService),
        deviceInterface: this.get<DeviceInterface>(TYPES.DeviceInterface),
        storageService: this.get<DiskStorageService>(TYPES.DiskStorageService),
        sessionManager: this.get<SessionManager>(TYPES.SessionManager),
        challengeService: this.get<ChallengeService>(TYPES.ChallengeService),
        itemManager: this.get<ItemManager>(TYPES.ItemManager),
        mutator: this.get<MutatorService>(TYPES.MutatorService),
        singletonManager: this.get<SingletonManager>(TYPES.SingletonManager),
        featuresService: this.get<FeaturesService>(TYPES.FeaturesService),
        environment: this.options.environment,
        platform: this.options.platform,
        identifier: this.options.identifier,
        internalEventBus: this.get<InternalEventBus>(TYPES.InternalEventBus),
        legacySessionStorageMapper: this.get<LegacySessionStorageMapper>(TYPES.LegacySessionStorageMapper),
        backups: this.get<FilesBackupService>(TYPES.FilesBackupService),
        preferences: this.get<PreferencesService>(TYPES.PreferencesService),
      })
    })

    this.factory.set(TYPES.HomeServerService, () => {
      if (!isDesktopDevice(this.get<DeviceInterface>(TYPES.DeviceInterface))) {
        return undefined
      }

      return new HomeServerService(
        this.get<DesktopDeviceInterface>(TYPES.DeviceInterface),
        this.options.platform,
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.FilesBackupService, () => {
      if (!isDesktopDevice(this.get<DeviceInterface>(TYPES.DeviceInterface))) {
        return undefined
      }

      return new FilesBackupService(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<LegacyApiService>(TYPES.LegacyApiService),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<DesktopDeviceInterface>(TYPES.DeviceInterface),
        this.get<StatusService>(TYPES.StatusService),
        this.get<PureCryptoInterface>(TYPES.Crypto),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<HistoryManager>(TYPES.HistoryManager),
        this.get<DesktopDeviceInterface>(TYPES.DeviceInterface),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.StatusService, () => {
      return new StatusService(this.get<InternalEventBus>(TYPES.InternalEventBus))
    })

    this.factory.set(TYPES.MfaService, () => {
      return new MfaService(
        this.get<SettingsService>(TYPES.SettingsService),
        this.get<PureCryptoInterface>(TYPES.Crypto),
        this.get<FeaturesService>(TYPES.FeaturesService),
        this.get<ProtectionsClientInterface>(TYPES.ProtectionService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ComponentManager, () => {
      return new ComponentManager(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<FeaturesService>(TYPES.FeaturesService),
        this.get<PreferencesService>(TYPES.PreferencesService),
        this.get<AlertService>(TYPES.AlertService),
        this.options.environment,
        this.options.platform,
        this.get<DeviceInterface>(TYPES.DeviceInterface),
        this.get<Logger>(TYPES.Logger),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.FeaturesService, () => {
      return new FeaturesService(
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SubscriptionManager>(TYPES.SubscriptionManager),
        this.get<LegacyApiService>(TYPES.LegacyApiService),
        this.get<WebSocketsService>(TYPES.WebSocketsService),
        this.get<SettingsService>(TYPES.SettingsService),
        this.get<UserService>(TYPES.UserService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<AlertService>(TYPES.AlertService),
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<PureCryptoInterface>(TYPES.Crypto),
        this.get<Logger>(TYPES.Logger),
        this.get<IsApplicationUsingThirdPartyHost>(TYPES.IsApplicationUsingThirdPartyHost),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SettingsService, () => {
      return new SettingsService(
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<LegacyApiService>(TYPES.LegacyApiService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.PreferencesService, () => {
      return new PreferencesService(
        this.get<SingletonManager>(TYPES.SingletonManager),
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<StorageServiceInterface>(TYPES.DiskStorageService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SingletonManager, () => {
      return new SingletonManager(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<SyncService>(TYPES.SyncService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.KeyRecoveryService, () => {
      return new KeyRecoveryService(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<LegacyApiService>(TYPES.LegacyApiService),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<ChallengeService>(TYPES.ChallengeService),
        this.get<AlertService>(TYPES.AlertService),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<SyncService>(TYPES.SyncService),
        this.get<UserService>(TYPES.UserService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.UserService, () => {
      return new UserService(
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<SyncService>(TYPES.SyncService),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<AlertService>(TYPES.AlertService),
        this.get<ChallengeService>(TYPES.ChallengeService),
        this.get<ProtectionService>(TYPES.ProtectionService),
        this.get<UserApiService>(TYPES.UserApiService),
        this.get<ReencryptTypeAItems>(TYPES.ReencryptTypeAItems),
        this.get<DecryptErroredPayloads>(TYPES.DecryptErroredPayloads),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ProtectionService, () => {
      return new ProtectionService(
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<ChallengeService>(TYPES.ChallengeService),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.WebSocketsService, () => {
      return new WebSocketsService(
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.options.webSocketUrl,
        this.get<WebSocketApiService>(TYPES.WebSocketApiService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SyncFrequencyGuard, () => {
      return new SyncFrequencyGuard(
        this.options.syncCallsThresholdPerMinute ?? this.DEFAULT_SYNC_CALLS_THRESHOLD_PER_MINUTE,
      )
    })

    this.factory.set(TYPES.SyncBackoffService, () => {
      return new SyncBackoffService()
    })

    this.factory.set(TYPES.SyncService, () => {
      return new SyncService(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<LegacyApiService>(TYPES.LegacyApiService),
        this.get<HistoryManager>(TYPES.HistoryManager),
        this.get<DeviceInterface>(TYPES.DeviceInterface),
        this.options.identifier,
        {
          loadBatchSize: this.options.loadBatchSize,
          sleepBetweenBatches: this.options.sleepBetweenBatches,
        },
        this.get<Logger>(TYPES.Logger),
        this.get<WebSocketsService>(TYPES.WebSocketsService),
        this.get<SyncFrequencyGuardInterface>(TYPES.SyncFrequencyGuard),
        this.get<SyncBackoffServiceInterface>(TYPES.SyncBackoffService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.HistoryManager, () => {
      return new HistoryManager(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<DeviceInterface>(TYPES.DeviceInterface),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SubscriptionManager, () => {
      return new SubscriptionManager(
        this.get<SubscriptionApiService>(TYPES.SubscriptionApiService),
        this.get<SessionManager>(TYPES.SessionManager),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<IsApplicationUsingThirdPartyHost>(TYPES.IsApplicationUsingThirdPartyHost),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.SessionManager, () => {
      return new SessionManager(
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<LegacyApiService>(TYPES.LegacyApiService),
        this.get<UserApiService>(TYPES.UserApiService),
        this.get<AlertService>(TYPES.AlertService),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<PureCryptoInterface>(TYPES.Crypto),
        this.get<ChallengeService>(TYPES.ChallengeService),
        this.get<WebSocketsService>(TYPES.WebSocketsService),
        this.get<HttpService>(TYPES.HttpService),
        this.get<SessionStorageMapper>(TYPES.SessionStorageMapper),
        this.get<LegacySessionStorageMapper>(TYPES.LegacySessionStorageMapper),
        this.options.identifier,
        this.get<GetKeyPairs>(TYPES.GetKeyPairs),
        this.get<IsApplicationUsingThirdPartyHost>(TYPES.IsApplicationUsingThirdPartyHost),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.WebSocketApiService, () => {
      return new WebSocketApiService(this.get<WebSocketServer>(TYPES.WebSocketServer))
    })

    this.factory.set(TYPES.WebSocketServer, () => {
      return new WebSocketServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.SubscriptionApiService, () => {
      return new SubscriptionApiService(this.get<SubscriptionServer>(TYPES.SubscriptionServer), this.options.apiVersion)
    })

    this.factory.set(TYPES.UserApiService, () => {
      return new UserApiService(
        this.get<UserServer>(TYPES.UserServer),
        this.get<UserRequestServer>(TYPES.UserRequestServer),
        this.options.apiVersion,
      )
    })

    this.factory.set(TYPES.SubscriptionServer, () => {
      return new SubscriptionServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.UserRequestServer, () => {
      return new UserRequestServer(this.get<HttpService>(TYPES.HttpService))
    })

    this.factory.set(TYPES.InternalEventBus, () => {
      return new InternalEventBus()
    })

    this.factory.set(TYPES.PayloadManager, () => {
      return new PayloadManager(this.get<Logger>(TYPES.Logger), this.get<InternalEventBus>(TYPES.InternalEventBus))
    })

    this.factory.set(TYPES.ItemManager, () => {
      return new ItemManager(
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.MutatorService, () => {
      return new MutatorService(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<AlertService>(TYPES.AlertService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.DiskStorageService, () => {
      return new DiskStorageService(
        this.get<DeviceInterface>(TYPES.DeviceInterface),
        this.options.identifier,
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.NotificationService, () => {
      return new NotificationService(this.get<InternalEventBus>(TYPES.InternalEventBus))
    })

    this.factory.set(TYPES.InMemoryStore, () => {
      return new InMemoryStore()
    })

    this.factory.set(TYPES.KeySystemKeyManager, () => {
      return new KeySystemKeyManager(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<RemoveItemsFromMemory>(TYPES.RemoveItemsFromMemory),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.ChallengeService, () => {
      return new ChallengeService(
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.get<EncryptionService>(TYPES.EncryptionService),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.EncryptionService, () => {
      return new EncryptionService(
        this.get<ItemManager>(TYPES.ItemManager),
        this.get<MutatorService>(TYPES.MutatorService),
        this.get<PayloadManager>(TYPES.PayloadManager),
        this.get<EncryptionOperators>(TYPES.EncryptionOperators),
        this.get<ItemsEncryptionService>(TYPES.ItemsEncryptionService),
        this.get<RootKeyManager>(TYPES.RootKeyManager),
        this.get<PureCryptoInterface>(TYPES.Crypto),
        this.get<CreateNewItemsKeyWithRollback>(TYPES.CreateNewItemsKeyWithRollback),
        this.get<FindDefaultItemsKey>(TYPES.FindDefaultItemsKey),
        this.get<EncryptTypeAPayloadWithKeyLookup>(TYPES.EncryptTypeAPayloadWithKeyLookup),
        this.get<EncryptTypeAPayload>(TYPES.EncryptTypeAPayload),
        this.get<DecryptTypeAPayload>(TYPES.DecryptTypeAPayload),
        this.get<DecryptTypeAPayloadWithKeyLookup>(TYPES.DecryptTypeAPayloadWithKeyLookup),
        this.get<CreateNewDefaultItemsKey>(TYPES.CreateNewDefaultItemsKey),
        this.get<GetKeyPairs>(TYPES.GetKeyPairs),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.DeprecatedHttpService, () => {
      return new DeprecatedHttpService(
        this.options.environment,
        this.options.appVersion,
        this.get<InternalEventBus>(TYPES.InternalEventBus),
      )
    })

    this.factory.set(TYPES.HttpService, () => {
      return new HttpService(
        this.options.environment,
        this.options.appVersion,
        SnjsVersion,
        this.options.apiVersion,
        this.get<Logger>(TYPES.Logger),
      )
    })

    this.factory.set(TYPES.LegacyApiService, () => {
      return new LegacyApiService(
        this.get<HttpService>(TYPES.HttpService),
        this.get<DiskStorageService>(TYPES.DiskStorageService),
        this.options.defaultHost,
        this.get<InMemoryStore>(TYPES.InMemoryStore),
        this.get<PureCryptoInterface>(TYPES.Crypto),
        this.get<SessionStorageMapper>(TYPES.SessionStorageMapper),
        this.get<LegacySessionStorageMapper>(TYPES.LegacySessionStorageMapper),
        this.get<InternalEventBus>(TYPES.InternalEventBus),
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
