import {
  VaultUserServiceInterface,
  VaultInviteServiceInterface,
  StorageServiceInterface,
  SyncServiceInterface,
  FullyResolvedApplicationOptions,
  ProtectionsClientInterface,
  ChangeAndSaveItem,
  GetHost,
  SetHost,
  LegacyApiServiceInterface,
  StatusServiceInterface,
  MfaServiceInterface,
  GenerateUuid,
  CreateDecryptedBackupFile,
} from '@standardnotes/services'
import { VaultLockServiceInterface } from './../VaultLock/VaultLockServiceInterface'
import { HistoryServiceInterface } from './../History/HistoryServiceInterface'
import { InternalEventBusInterface } from './../Internal/InternalEventBusInterface'
import { PreferenceServiceInterface } from './../Preferences/PreferenceServiceInterface'
import { AsymmetricMessageServiceInterface } from './../AsymmetricMessage/AsymmetricMessageServiceInterface'
import { ImportDataResult } from '../Import/ImportDataResult'
import { ChallengeServiceInterface } from './../Challenge/ChallengeServiceInterface'
import { VaultServiceInterface } from '../Vault/VaultServiceInterface'
import { BackupFile, Environment, Platform, PrefKey, PrefValue, ApplicationIdentifier } from '@standardnotes/models'
import { BackupServiceInterface, FilesClientInterface } from '@standardnotes/files'

import { AlertService } from '../Alert/AlertService'
import { ComponentManagerInterface } from '../Component/ComponentManagerInterface'
import { ApplicationEvent } from '../Event/ApplicationEvent'
import { ApplicationEventCallback } from '../Event/ApplicationEventCallback'
import { FeaturesClientInterface } from '../Feature/FeaturesClientInterface'
import { SubscriptionManagerInterface } from '../Subscription/SubscriptionManagerInterface'
import { DeviceInterface } from '../Device/DeviceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { MutatorClientInterface } from '../Mutator/MutatorClientInterface'
import { StorageValueModes } from '../Storage/StorageTypes'

import { DeinitMode } from './DeinitMode'
import { DeinitSource } from './DeinitSource'
import { UserServiceInterface } from '../User/UserServiceInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { HomeServerServiceInterface } from '../HomeServer/HomeServerServiceInterface'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'
import { Result } from '@standardnotes/domain-core'
import { CreateEncryptedBackupFile } from '../Import/CreateEncryptedBackupFile'

export interface ApplicationInterface {
  deinit(mode: DeinitMode, source: DeinitSource): void
  getDeinitMode(): DeinitMode
  isStarted(): boolean
  isLaunched(): boolean
  addEventObserver(callback: ApplicationEventCallback, singleEvent?: ApplicationEvent): () => void
  addSingleEventObserver(event: ApplicationEvent, callback: ApplicationEventCallback): () => void
  hasProtectionSources(): boolean
  hasPasscode(): boolean
  lock(): Promise<void>
  setValue(key: string, value: unknown, mode?: StorageValueModes): void
  getValue<T>(key: string, mode?: StorageValueModes): T
  removeValue(key: string, mode?: StorageValueModes): Promise<void>
  getPreference<K extends PrefKey>(key: K): PrefValue[K] | undefined
  getPreference<K extends PrefKey>(key: K, defaultValue: PrefValue[K]): PrefValue[K]
  getPreference<K extends PrefKey>(key: K, defaultValue?: PrefValue[K]): PrefValue[K] | undefined
  setPreference<K extends PrefKey>(key: K, value: PrefValue[K]): Promise<void>

  hasAccount(): boolean
  setCustomHost(host: string, websocketUrl?: string): Promise<void>
  isUsingHomeServer(): Promise<boolean>

  importData(data: BackupFile, awaitSync?: boolean): Promise<Result<ImportDataResult>>

  // Use cases
  get changeAndSaveItem(): ChangeAndSaveItem
  get createDecryptedBackupFile(): CreateDecryptedBackupFile
  get createEncryptedBackupFile(): CreateEncryptedBackupFile
  get generateUuid(): GenerateUuid
  get getHost(): GetHost
  get setHost(): SetHost

  // Services
  get alerts(): AlertService
  get asymmetric(): AsymmetricMessageServiceInterface
  get challenges(): ChallengeServiceInterface
  get componentManager(): ComponentManagerInterface
  get encryption(): EncryptionProviderInterface
  get events(): InternalEventBusInterface
  get features(): FeaturesClientInterface
  get fileBackups(): BackupServiceInterface | undefined
  get files(): FilesClientInterface
  get history(): HistoryServiceInterface
  get homeServer(): HomeServerServiceInterface | undefined
  get items(): ItemManagerInterface
  get legacyApi(): LegacyApiServiceInterface
  get mfa(): MfaServiceInterface
  get mutator(): MutatorClientInterface
  get preferences(): PreferenceServiceInterface
  get protections(): ProtectionsClientInterface
  get sessions(): SessionsClientInterface
  get status(): StatusServiceInterface
  get storage(): StorageServiceInterface
  get subscriptions(): SubscriptionManagerInterface
  get sync(): SyncServiceInterface
  get user(): UserServiceInterface
  get vaultInvites(): VaultInviteServiceInterface
  get vaultLocks(): VaultLockServiceInterface
  get vaults(): VaultServiceInterface
  get vaultUsers(): VaultUserServiceInterface

  readonly options: FullyResolvedApplicationOptions
  readonly environment: Environment
  readonly identifier: ApplicationIdentifier
  readonly platform: Platform
  device: DeviceInterface
}
