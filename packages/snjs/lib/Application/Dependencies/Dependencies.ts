import { Container, interfaces } from 'inversify'
import { SNActionsService } from './../../Services/Actions/ActionsService'
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
import { SNMigrationService } from '../../Services/Migration/MigrationService'
import { SNMfaService } from '../../Services/Mfa/MfaService'
import { SNComponentManager } from '../../Services/ComponentManager/ComponentManager'
import { SNFeaturesService } from '@Lib/Services/Features/FeaturesService'
import { SNSettingsService } from '../../Services/Settings/SNSettingsService'
import { SNPreferencesService } from '../../Services/Preferences/PreferencesService'
import { SNSingletonManager } from '../../Services/Singleton/SingletonManager'
import { SNKeyRecoveryService } from '../../Services/KeyRecovery/KeyRecoveryService'
import { SNProtectionService } from '../../Services/Protection/ProtectionService'
import { SNSyncService } from '../../Services/Sync/SyncService'
import { SNHistoryManager } from '../../Services/History/HistoryManager'
import { SNSessionManager } from '../../Services/Session/SessionManager'
import { SNWebSocketsService } from '../../Services/Api/WebsocketsService'
import { SNApiService } from '../../Services/Api/ApiService'
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
  RemoveItemsLocally,
  RevisionManager,
  SelfContactManager,
  StatusService,
  SubscriptionManager,
  UserEventService,
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
  GetSharedVaultUsers,
  AsymmetricMessageService,
  ReplaceContactData,
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
  UserServer,
  WebSocketApiService,
  WebSocketServer,
} from '@standardnotes/api'
import { FullyResolvedApplicationOptions } from '../Options/ApplicationOptions'
import { TYPES } from './Types'
import { isDeinitable } from './isDeinitable'
import { DependencyInitOrder } from './DependencyInitOrder'

export class Dependencies {
  private container = new Container()

  constructor(private options: FullyResolvedApplicationOptions) {
    this.registerServiceMakers()
    this.registerUseCaseMakers()
    this.makeDependencies()
  }

  public deinit() {
    this.dependencyMakers.clear()

    const deps = this.container.getAll
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

  private registerUseCaseMakers() {
    this.container.bind(TYPES.ImportDataUseCase).toDynamicValue((context: interfaces.Context) => {
      return new ImportDataUseCase(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.ProtectionService),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.PayloadManager),
        context.container.get(TYPES.ChallengeService),
        context.container.get(TYPES.HistoryManager),
      )
    })
    this.container.bind(TYPES.RemoveItemsLocally).toDynamicValue((context: interfaces.Context) => {
      return new RemoveItemsLocally(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.DiskStorageService),
      )
    })

    this.container.bind(TYPES.FindContact).toDynamicValue((context: interfaces.Context) => {
      return new FindContact(context.container.get(TYPES.ItemManager))
    })
    this.container.bind(TYPES.EditContact).toDynamicValue((context: interfaces.Context) => {
      return new EditContact(context.container.get(TYPES.MutatorService), context.container.get(TYPES.SyncService))
    })
    this.container.bind(TYPES.GetAllContacts).toDynamicValue((context: interfaces.Context) => {
      return new GetAllContacts(context.container.get(TYPES.ItemManager))
    })
    this.container.bind(TYPES.ValidateItemSigner).toDynamicValue((context: interfaces.Context) => {
      return new ValidateItemSigner(context.container.get(TYPES.FindContact))
    })
    this.container.bind(TYPES.CreateOrEditContact).toDynamicValue((context: interfaces.Context) => {
      return new CreateOrEditContact(
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.FindContact),
        context.container.get(TYPES.EditContact),
      )
    })
    this.container.bind(TYPES.GetVault).toDynamicValue((context: interfaces.Context) => {
      return new GetVault(context.container.get(TYPES.ItemManager))
    })
    this.container.bind(TYPES.ChangeVaultKeyOptions).toDynamicValue((context: interfaces.Context) => {
      return new ChangeVaultKeyOptions(
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.GetVault),
      )
    })
    this.container.bind(TYPES.MoveItemsToVault).toDynamicValue((context: interfaces.Context) => {
      return new MoveItemsToVault(
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.FileService),
      )
    })
    this.container.bind(TYPES.CreateVault).toDynamicValue((context: interfaces.Context) => {
      return new CreateVault(
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.SyncService),
      )
    })
    this.container.bind(TYPES.RemoveItemFromVault).toDynamicValue((context: interfaces.Context) => {
      return new RemoveItemFromVault(
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.FileService),
      )
    })
    this.container.bind(TYPES.DeleteVault).toDynamicValue((context: interfaces.Context) => {
      return new DeleteVault(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.EncryptionService),
      )
    })
    this.container.bind(TYPES.RotateVaultKey).toDynamicValue((context: interfaces.Context) => {
      return new RotateVaultKey(
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.EncryptionService),
      )
    })
    this.container.bind(TYPES.ReuploadInvite).toDynamicValue((context: interfaces.Context) => {
      return new ReuploadInvite(
        context.container.get(TYPES.DecryptOwnMessage),
        context.container.get(TYPES.SendVaultInvite),
        context.container.get(TYPES.EncryptMessage),
      )
    })
    this.container.bind(TYPES.ReuploadAllInvites).toDynamicValue((context: interfaces.Context) => {
      return new ReuploadAllInvites(
        context.container.get(TYPES.ReuploadInvite),
        context.container.get(TYPES.FindContact),
        context.container.get(TYPES.SharedVaultInvitesServer),
      )
    })
    this.container.bind(TYPES.ResendAllMessages).toDynamicValue((context: interfaces.Context) => {
      return new ResendAllMessages(
        context.container.get(TYPES.ResendMessage),
        context.container.get(TYPES.MessageServer),
        context.container.get(TYPES.FindContact),
      )
    })
    this.container.bind(TYPES.CreateSharedVault).toDynamicValue((context: interfaces.Context) => {
      return new CreateSharedVault(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SharedVaultServer),
        context.container.get(TYPES.CreateVault),
        context.container.get(TYPES.MoveItemsToVault),
      )
    })
    this.container.bind(TYPES.HandleKeyPairChange).toDynamicValue((context: interfaces.Context) => {
      return new HandleKeyPairChange(
        context.container.get(TYPES.ReuploadAllInvites),
        context.container.get(TYPES.ResendAllMessages),
      )
    })
    this.container.bind(TYPES.NotifyVaultUsersOfKeyRotation).toDynamicValue((context: interfaces.Context) => {
      return new NotifyVaultUsersOfKeyRotation(
        context.container.get(TYPES.FindContact),
        context.container.get(TYPES.SendVaultDataChangedMessage),
        context.container.get(TYPES.InviteToVault),
        context.container.get(TYPES.SharedVaultInvitesServer),
        context.container.get(TYPES.GetVaultContacts),
        context.container.get(TYPES.DecryptOwnMessage),
      )
    })
    this.container.bind(TYPES.SendVaultDataChangedMessage).toDynamicValue((context: interfaces.Context) => {
      return new SendVaultDataChangedMessage(
        context.container.get(TYPES.EncryptMessage),
        context.container.get(TYPES.FindContact),
        context.container.get(TYPES.GetSharedVaultUsers),
        context.container.get(TYPES.SendMessage),
      )
    })
    this.container.bind(TYPES.ReplaceContactData).toDynamicValue((context: interfaces.Context) => {
      return new ReplaceContactData(
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.FindContact),
      )
    })
    this.container.bind(TYPES.GetTrustedPayload).toDynamicValue((context: interfaces.Context) => {
      return new GetTrustedPayload(context.container.get(TYPES.DecryptMessage))
    })
    this.container.bind(TYPES.GetUntrustedPayload).toDynamicValue((context: interfaces.Context) => {
      return new GetUntrustedPayload(context.container.get(TYPES.DecryptMessage))
    })
    this.container.bind(TYPES.GetVaultContacts).toDynamicValue((context: interfaces.Context) => {
      return new GetVaultContacts(
        context.container.get(TYPES.FindContact),
        context.container.get(TYPES.GetSharedVaultUsers),
      )
    })
    this.container.bind(TYPES.AcceptVaultInvite).toDynamicValue((context: interfaces.Context) => {
      return new AcceptVaultInvite(
        context.container.get(TYPES.SharedVaultInvitesServer),
        context.container.get(TYPES.ProcessAcceptedVaultInvite),
      )
    })
    this.container.bind(TYPES.InviteToVault).toDynamicValue((context: interfaces.Context) => {
      return new InviteToVault(
        context.container.get(TYPES.KeySystemKeyManager),
        context.container.get(TYPES.EncryptMessage),
        context.container.get(TYPES.SendVaultInvite),
      )
    })
    this.container.bind(TYPES.DeleteThirdPartyVault).toDynamicValue((context: interfaces.Context) => {
      return new DeleteThirdPartyVault(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.RemoveItemsLocally),
      )
    })
    this.container.bind(TYPES.LeaveVault).toDynamicValue((context: interfaces.Context) => {
      return new LeaveVault(
        context.container.get(TYPES.SharedVaultUsersServer),
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.DeleteThirdPartyVault),
      )
    })
    this.container.bind(TYPES.ShareContactWithVault).toDynamicValue((context: interfaces.Context) => {
      return new ShareContactWithVault(
        context.container.get(TYPES.FindContact),
        context.container.get(TYPES.EncryptMessage),
        context.container.get(TYPES.UserServer),
        context.container.get(TYPES.SendMessage),
      )
    })
    this.container.bind(TYPES.ConvertToSharedVault).toDynamicValue((context: interfaces.Context) => {
      return new ConvertToSharedVault(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SharedVaultServer),
        context.container.get(TYPES.MoveItemsToVault),
      )
    })
    this.container.bind(TYPES.DeleteSharedVault).toDynamicValue((context: interfaces.Context) => {
      return new DeleteSharedVault(
        context.container.get(TYPES.SharedVaultServer),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.DeleteVault),
      )
    })
    this.container.bind(TYPES.RemoveVaultMember).toDynamicValue((context: interfaces.Context) => {
      return new RemoveVaultMember(context.container.get(TYPES.SharedVaultUsersServer))
    })
    this.container.bind(TYPES.GetSharedVaultUsers).toDynamicValue((context: interfaces.Context) => {
      return new GetSharedVaultUsers(context.container.get(TYPES.SharedVaultUsersServer))
    })
  }

  private registerServiceMakers() {
    this.container.bind(TYPES.UserServer).toDynamicValue((context: interfaces.Context) => {
      return new UserServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.SharedVaultInvitesServer).toDynamicValue((context: interfaces.Context) => {
      return new SharedVaultInvitesServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.SharedVaultServer).toDynamicValue((context: interfaces.Context) => {
      return new SharedVaultServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.MessageServer).toDynamicValue((context: interfaces.Context) => {
      return new AsymmetricMessageServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.SharedVaultUsersServer).toDynamicValue((context: interfaces.Context) => {
      return new SharedVaultUsersServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.AsymmetricMessageService).toDynamicValue((context: interfaces.Context) => {
      return new AsymmetricMessageService(
        context.container.get(TYPES.MessageServer),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.CreateOrEditContact),
        context.container.get(TYPES.FindContact),
        context.container.get(TYPES.GetAllContacts),
        context.container.get(TYPES.ReplaceContactData),
        context.container.get(TYPES.GetTrustedPayload),
        context.container.get(TYPES.GetVault),
        context.container.get(TYPES.HandleRootKeyChangedMessage),
        context.container.get(TYPES.SendOwnContactChangeMessage),
        context.container.get(TYPES.GetOutboundMessages),
        context.container.get(TYPES.GetInboundMessages),
        context.container.get(TYPES.GetUntrustedPayload),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.SharedVaultService).toDynamicValue((context: interfaces.Context) => {
      return new SharedVaultService(
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.SessionManager),
        context.container.get(TYPES.VaultService),
        context.container.get(TYPES.SharedVaultInvitesServer),
        context.container.get(TYPES.GetVault),
        context.container.get(TYPES.CreateSharedVault),
        context.container.get(TYPES.HandleKeyPairChange),
        context.container.get(TYPES.NotifyVaultUsersOfKeyRotation),
        context.container.get(TYPES.SendVaultDataChangedMessage),
        context.container.get(TYPES.GetTrustedPayload),
        context.container.get(TYPES.GetUntrustedPayload),
        context.container.get(TYPES.FindContact),
        context.container.get(TYPES.GetAllContacts),
        context.container.get(TYPES.GetVaultContacts),
        context.container.get(TYPES.AcceptVaultInvite),
        context.container.get(TYPES.InviteToVault),
        context.container.get(TYPES.LeaveVault),
        context.container.get(TYPES.DeleteThirdPartyVault),
        context.container.get(TYPES.ShareContactWithVault),
        context.container.get(TYPES.ConvertToSharedVault),
        context.container.get(TYPES.DeleteSharedVault),
        context.container.get(TYPES.RemoveVaultMember),
        context.container.get(TYPES.GetSharedVaultUsers),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.VaultService).toDynamicValue((context: interfaces.Context) => {
      return new VaultService(
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.AlertService),
        context.container.get(TYPES.GetVault),
        context.container.get(TYPES.ChangeVaultKeyOptions),
        context.container.get(TYPES.MoveItemsToVault),
        context.container.get(TYPES.CreateVault),
        context.container.get(TYPES.RemoveItemFromVault),
        context.container.get(TYPES.DeleteVault),
        context.container.get(TYPES.RotateVaultKey),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.SelfContactManager).toDynamicValue((context: interfaces.Context) => {
      return new SelfContactManager(
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.SessionManager),
        context.container.get(TYPES.SingletonManager),
        context.container.get(TYPES.CreateOrEditContact),
      )
    })
    this.container.bind(TYPES.ContactService).toDynamicValue((context: interfaces.Context) => {
      return new ContactService(
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SessionManager),
        this.options.crypto,
        context.container.get(TYPES.UserService),
        context.container.get(TYPES.SelfContactManager),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.FindContact),
        context.container.get(TYPES.GetAllContacts),
        context.container.get(TYPES.CreateOrEditContact),
        context.container.get(TYPES.EditContact),
        context.container.get(TYPES.ValidateItemSigner),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.SignInWithRecoveryCodes).toDynamicValue((context: interfaces.Context) => {
      return new SignInWithRecoveryCodes(
        context.container.get(TYPES.AuthManager),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.InMemoryStore),
        this.options.crypto,
        context.container.get(TYPES.SessionManager),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.GetRecoveryCodes).toDynamicValue((context: interfaces.Context) => {
      return new GetRecoveryCodes(
        context.container.get(TYPES.AuthManager),
        context.container.get(TYPES.SettingsService),
      )
    })
    this.container.bind(TYPES.AddAuthenticator).toDynamicValue((context: interfaces.Context) => {
      return new AddAuthenticator(
        context.container.get(TYPES.AuthenticatorManager),
        this.options.u2fAuthenticatorRegistrationPromptFunction,
      )
    })
    this.container.bind(TYPES.ListAuthenticators).toDynamicValue((context: interfaces.Context) => {
      return new ListAuthenticators(context.container.get(TYPES.AuthenticatorManager))
    })
    this.container.bind(TYPES.DeleteAuthenticator).toDynamicValue((context: interfaces.Context) => {
      return new DeleteAuthenticator(context.container.get(TYPES.AuthenticatorManager))
    })
    this.container.bind(TYPES.GetAuthenticatorAuthenticationOptions).toDynamicValue((context: interfaces.Context) => {
      return new GetAuthenticatorAuthenticationOptions(context.container.get(TYPES.AuthenticatorManager))
    })
    this.container.bind(TYPES.GetAuthenticatorAuthenticationResponse).toDynamicValue((context: interfaces.Context) => {
      return new GetAuthenticatorAuthenticationResponse(
        context.container.get(TYPES.GetAuthenticatorAuthenticationOptions),
        this.options.u2fAuthenticatorVerificationPromptFunction,
      )
    })
    this.container.bind(TYPES.ListRevisions).toDynamicValue((context: interfaces.Context) => {
      return new ListRevisions(context.container.get(TYPES.RevisionManager))
    })
    this.container.bind(TYPES.GetRevision).toDynamicValue((context: interfaces.Context) => {
      return new GetRevision(
        context.container.get(TYPES.RevisionManager),
        context.container.get(TYPES.EncryptionService),
      )
    })
    this.container.bind(TYPES.DeleteRevision).toDynamicValue((context: interfaces.Context) => {
      return new DeleteRevision(context.container.get(TYPES.RevisionManager))
    })
    this.container.bind(TYPES.RevisionServer).toDynamicValue((context: interfaces.Context) => {
      return new RevisionServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.RevisionApiService).toDynamicValue((context: interfaces.Context) => {
      return new RevisionApiService(context.container.get(TYPES.RevisionServer))
    })
    this.container.bind(TYPES.RevisionManager).toDynamicValue((context: interfaces.Context) => {
      return new RevisionManager(
        context.container.get(TYPES.RevisionApiService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.AuthServer).toDynamicValue((context: interfaces.Context) => {
      return new AuthServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.AuthApiService).toDynamicValue((context: interfaces.Context) => {
      return new AuthApiService(context.container.get(TYPES.AuthServer))
    })
    this.container.bind(TYPES.AuthManager).toDynamicValue((context: interfaces.Context) => {
      return new AuthManager(context.container.get(TYPES.AuthApiService), context.container.get(TYPES.InternalEventBus))
    })
    this.container.bind(TYPES.AuthenticatorServer).toDynamicValue((context: interfaces.Context) => {
      return new AuthenticatorServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.AuthenticatorApiService).toDynamicValue((context: interfaces.Context) => {
      return new AuthenticatorApiService(context.container.get(TYPES.AuthenticatorServer))
    })
    this.container.bind(TYPES.AuthenticatorManager).toDynamicValue((context: interfaces.Context) => {
      return new AuthenticatorManager(
        context.container.get(TYPES.AuthenticatorApiService),
        context.container.get(TYPES.PreferencesService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.ActionsService).toDynamicValue((context: interfaces.Context) => {
      return new SNActionsService(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.AlertService),
        context.container.get(TYPES.DeviceInterface),
        context.container.get(TYPES.DeprecatedHttpService),
        context.container.get(TYPES.PayloadManager),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.ChallengeService),
        context.container.get(TYPES.ListedService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.ListedService).toDynamicValue((context: interfaces.Context) => {
      return new ListedService(
        context.container.get(TYPES.LegacyApiService),
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.SettingsService),
        context.container.get(TYPES.DeprecatedHttpService),
        context.container.get(TYPES.ProtectionService),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.IntegrityService).toDynamicValue((context: interfaces.Context) => {
      return new IntegrityService(
        context.container.get(TYPES.LegacyApiService),
        context.container.get(TYPES.LegacyApiService),
        context.container.get(TYPES.PayloadManager),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.FileService).toDynamicValue((context: interfaces.Context) => {
      return new FileService(
        context.container.get(TYPES.LegacyApiService),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.ChallengeService),
        context.container.get(TYPES.HttpService),
        context.container.get(TYPES.AlertService),
        this.options.crypto,
        context.container.get(TYPES.InternalEventBus),
        context.container.get(TYPES.FilesBackupService),
      )
    })
    this.container.bind(TYPES.MigrationService).toDynamicValue((context: interfaces.Context) => {
      return new SNMigrationService({
        encryptionService: context.container.get(TYPES.EncryptionService),
        deviceInterface: context.container.get(TYPES.DeviceInterface),
        storageService: context.container.get(TYPES.DiskStorageService),
        sessionManager: context.container.get(TYPES.SessionManager),
        challengeService: context.container.get(TYPES.ChallengeService),
        itemManager: context.container.get(TYPES.ItemManager),
        mutator: context.container.get(TYPES.MutatorService),
        singletonManager: context.container.get(TYPES.SingletonManager),
        featuresService: context.container.get(TYPES.FeaturesService),
        environment: this.options.environment,
        platform: this.options.platform,
        identifier: this.options.identifier,
        internalEventBus: context.container.get(TYPES.InternalEventBus),
        legacySessionStorageMapper: context.container.get(TYPES.LegacySessionStorageMapper),
        backups: context.container.get(TYPES.FilesBackupService),
        preferences: context.container.get(TYPES.PreferencesService),
      })
    })

    this.container.bind(TYPES.HomeServerService).toDynamicValue((context: interfaces.Context) => {
      if (!isDesktopDevice(context.container.get(TYPES.DeviceInterface))) {
        return undefined
      }

      return new HomeServerService(
        context.container.get(TYPES.DeviceInterface),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.FilesBackupService).toDynamicValue((context: interfaces.Context) => {
      if (!isDesktopDevice(context.container.get(TYPES.DeviceInterface))) {
        return undefined
      }

      return new FilesBackupService(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.LegacyApiService),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.DeviceInterface),
        context.container.get(TYPES.StatusService),
        this.options.crypto,
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.SessionManager),
        context.container.get(TYPES.PayloadManager),
        context.container.get(TYPES.HistoryManager),
        context.container.get(TYPES.DeviceInterface),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.StatusService).toDynamicValue((context: interfaces.Context) => {
      return new StatusService(context.container.get(TYPES.InternalEventBus))
    })
    this.container.bind(TYPES.MfaService).toDynamicValue((context: interfaces.Context) => {
      return new SNMfaService(
        context.container.get(TYPES.SettingsService),
        this.options.crypto,
        context.container.get(TYPES.FeaturesService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.ComponentManager).toDynamicValue((context: interfaces.Context) => {
      return new SNComponentManager(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.FeaturesService),
        context.container.get(TYPES.PreferencesService),
        context.container.get(TYPES.AlertService),
        this.options.environment,
        this.options.platform,
        context.container.get(TYPES.DeviceInterface),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.FeaturesService).toDynamicValue((context: interfaces.Context) => {
      return new SNFeaturesService(
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SubscriptionManager),
        context.container.get(TYPES.LegacyApiService),
        context.container.get(TYPES.WebSocketsService),
        context.container.get(TYPES.SettingsService),
        context.container.get(TYPES.UserService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.AlertService),
        context.container.get(TYPES.SessionManager),
        context.container.get(TYPES.Crypto),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.SettingsService).toDynamicValue((context: interfaces.Context) => {
      return new SNSettingsService(
        context.container.get(TYPES.SessionManager),
        context.container.get(TYPES.LegacyApiService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.PreferencesService).toDynamicValue((context: interfaces.Context) => {
      return new SNPreferencesService(
        context.container.get(TYPES.SingletonManager),
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.SingletonManager).toDynamicValue((context: interfaces.Context) => {
      return new SNSingletonManager(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.PayloadManager),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.KeyRecoveryService).toDynamicValue((context: interfaces.Context) => {
      return new SNKeyRecoveryService(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.PayloadManager),
        context.container.get(TYPES.UserApiService),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.ChallengeService),
        context.container.get(TYPES.AlertService),
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.UserService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.UserService).toDynamicValue((context: interfaces.Context) => {
      return new UserService(
        context.container.get(TYPES.SessionManager),
        context.container.get(TYPES.SyncService),
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.AlertService),
        context.container.get(TYPES.ChallengeService),
        context.container.get(TYPES.ProtectionService),
        context.container.get(TYPES.UserApiService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.ProtectionService).toDynamicValue((context: interfaces.Context) => {
      return new SNProtectionService(
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.ChallengeService),
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.SyncService).toDynamicValue((context: interfaces.Context) => {
      return new SNSyncService(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.SessionManager),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.PayloadManager),
        context.container.get(TYPES.LegacyApiService),
        context.container.get(TYPES.HistoryManager),
        context.container.get(TYPES.DeviceInterface),
        this.options.identifier,
        {
          loadBatchSize: this.options.loadBatchSize,
          sleepBetweenBatches: this.options.sleepBetweenBatches,
        },
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.HistoryManager).toDynamicValue((context: interfaces.Context) => {
      return new SNHistoryManager(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.DeviceInterface),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.SubscriptionManager).toDynamicValue((context: interfaces.Context) => {
      return new SubscriptionManager(
        context.container.get(TYPES.SubscriptionApiService),
        context.container.get(TYPES.SessionManager),
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.SessionManager).toDynamicValue((context: interfaces.Context) => {
      return new SNSessionManager(
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.LegacyApiService),
        context.container.get(TYPES.UserApiService),
        context.container.get(TYPES.AlertService),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.ChallengeService),
        context.container.get(TYPES.WebSocketsService),
        context.container.get(TYPES.HttpService),
        context.container.get(TYPES.SessionStorageMapper),
        context.container.get(TYPES.LegacySessionStorageMapper),
        this.options.identifier,
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.WebSocketsService).toDynamicValue((context: interfaces.Context) => {
      return new SNWebSocketsService(
        context.container.get(TYPES.DiskStorageService),
        this.options.webSocketUrl,
        context.container.get(TYPES.WebSocketApiService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.WebSocketApiService).toDynamicValue((context: interfaces.Context) => {
      return new WebSocketApiService(context.container.get(TYPES.WebSocketServer))
    })
    this.container.bind(TYPES.WebSocketServer).toDynamicValue((context: interfaces.Context) => {
      return new WebSocketServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.SubscriptionApiService).toDynamicValue((context: interfaces.Context) => {
      return new SubscriptionApiService(context.container.get(TYPES.SubscriptionServer))
    })
    this.container.bind(TYPES.UserApiService).toDynamicValue((context: interfaces.Context) => {
      return new UserApiService(context.container.get(TYPES.UserServer), context.container.get(TYPES.UserRequestServer))
    })
    this.container.bind(TYPES.SubscriptionServer).toDynamicValue((context: interfaces.Context) => {
      return new SubscriptionServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.UserRequestServer).toDynamicValue((context: interfaces.Context) => {
      return new UserServer(context.container.get(TYPES.HttpService))
    })
    this.container.bind(TYPES.InternalEventBus).toDynamicValue((_context: interfaces.Context) => {
      return new InternalEventBus()
    })
    this.container.bind(TYPES.PayloadManager).toDynamicValue((context: interfaces.Context) => {
      return new PayloadManager(context.container.get(TYPES.InternalEventBus))
    })
    this.container.bind(TYPES.ItemManager).toDynamicValue((context: interfaces.Context) => {
      return new ItemManager(context.container.get(TYPES.PayloadManager), context.container.get(TYPES.InternalEventBus))
    })
    this.container.bind(TYPES.MutatorService).toDynamicValue((context: interfaces.Context) => {
      return new MutatorService(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.PayloadManager),
        context.container.get(TYPES.AlertService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.DiskStorageService).toDynamicValue((context: interfaces.Context) => {
      return new DiskStorageService(
        context.container.get(TYPES.DeviceInterface),
        this.options.identifier,
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.UserEventService).toDynamicValue((context: interfaces.Context) => {
      return new UserEventService(context.container.get(TYPES.InternalEventBus))
    })
    this.container.bind(TYPES.InMemoryStore).toDynamicValue((_context: interfaces.Context) => {
      return new InMemoryStore()
    })
    this.container.bind(TYPES.KeySystemKeyManager).toDynamicValue((context: interfaces.Context) => {
      return new KeySystemKeyManager(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.ChallengeService).toDynamicValue((context: interfaces.Context) => {
      return new ChallengeService(
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.EncryptionService),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.EncryptionService).toDynamicValue((context: interfaces.Context) => {
      return new EncryptionService(
        context.container.get(TYPES.ItemManager),
        context.container.get(TYPES.MutatorService),
        context.container.get(TYPES.PayloadManager),
        context.container.get(TYPES.DeviceInterface),
        context.container.get(TYPES.DiskStorageService),
        context.container.get(TYPES.KeySystemKeyManager),
        this.options.identifier,
        context.container.get(TYPES.Crypto),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.DeprecatedHttpService).toDynamicValue((context: interfaces.Context) => {
      return new DeprecatedHttpService(
        this.options.environment,
        this.options.appVersion,
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.HttpService).toDynamicValue((_context: interfaces.Context) => {
      return new HttpService(this.options.environment, this.options.appVersion, SnjsVersion)
    })
    this.container.bind(TYPES.LegacyApiService).toDynamicValue((context: interfaces.Context) => {
      return new SNApiService(
        context.container.get(TYPES.HttpService),
        context.container.get(TYPES.DiskStorageService),
        this.options.defaultHost,
        context.container.get(TYPES.InMemoryStore),
        context.container.get(TYPES.Crypto),
        context.container.get(TYPES.SessionStorageMapper),
        context.container.get(TYPES.LegacySessionStorageMapper),
        context.container.get(TYPES.InternalEventBus),
      )
    })
    this.container.bind(TYPES.SessionStorageMapper).toDynamicValue((_context: interfaces.Context) => {
      return new SessionStorageMapper()
    })
    this.container.bind(TYPES.LegacySessionStorageMapper).toDynamicValue((_context: interfaces.Context) => {
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
