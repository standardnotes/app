import { VaultUserServiceInterface, VaultInviteServiceInterface } from '@standardnotes/services'
import { VaultLockServiceInterface } from './../VaultLock/VaultLockServiceInterface'
import { HistoryServiceInterface } from './../History/HistoryServiceInterface'
import { InternalEventBusInterface } from './../Internal/InternalEventBusInterface'
import { PreferenceServiceInterface } from './../Preferences/PreferenceServiceInterface'
import { AsymmetricMessageServiceInterface } from './../AsymmetricMessage/AsymmetricMessageServiceInterface'
import { SyncOptions } from './../Sync/SyncOptions'
import { ImportDataReturnType } from './../Mutator/ImportDataUseCase'
import { ChallengeServiceInterface } from './../Challenge/ChallengeServiceInterface'
import { VaultServiceInterface } from '../Vault/VaultServiceInterface'
import { ApplicationIdentifier } from '@standardnotes/common'
import {
  BackupFile,
  DecryptedItemInterface,
  DecryptedItemMutator,
  ItemStream,
  PayloadEmitSource,
  Platform,
  PrefKey,
  PrefValue,
} from '@standardnotes/models'
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
import { UserClientInterface } from '../User/UserClientInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { HomeServerServiceInterface } from '../HomeServer/HomeServerServiceInterface'
import { User } from '@standardnotes/responses'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'

export interface ApplicationInterface {
  deinit(mode: DeinitMode, source: DeinitSource): void
  getDeinitMode(): DeinitMode
  isStarted(): boolean
  isLaunched(): boolean
  addEventObserver(callback: ApplicationEventCallback, singleEvent?: ApplicationEvent): () => void
  addSingleEventObserver(event: ApplicationEvent, callback: ApplicationEventCallback): () => void
  hasProtectionSources(): boolean
  createEncryptedBackupFileForAutomatedDesktopBackups(): Promise<BackupFile | undefined>
  createEncryptedBackupFile(): Promise<BackupFile | undefined>
  createDecryptedBackupFile(): Promise<BackupFile | undefined>
  hasPasscode(): boolean
  lock(): Promise<void>
  softLockBiometrics(): void
  setValue(key: string, value: unknown, mode?: StorageValueModes): void
  getValue<T>(key: string, mode?: StorageValueModes): T
  removeValue(key: string, mode?: StorageValueModes): Promise<void>
  isLocked(): Promise<boolean>
  getPreference<K extends PrefKey>(key: K): PrefValue[K] | undefined
  getPreference<K extends PrefKey>(key: K, defaultValue: PrefValue[K]): PrefValue[K]
  getPreference<K extends PrefKey>(key: K, defaultValue?: PrefValue[K]): PrefValue[K] | undefined
  setPreference<K extends PrefKey>(key: K, value: PrefValue[K]): Promise<void>
  streamItems<I extends DecryptedItemInterface = DecryptedItemInterface>(
    contentType: string | string[],
    stream: ItemStream<I>,
  ): () => void

  getUser(): User | undefined
  hasAccount(): boolean
  setCustomHost(host: string): Promise<void>
  isThirdPartyHostUsed(): boolean
  isUsingHomeServer(): Promise<boolean>
  getNewSubscriptionToken(): Promise<string | undefined>

  importData(data: BackupFile, awaitSync?: boolean): Promise<ImportDataReturnType>
  /**
   * Mutates a pre-existing item, marks it as dirty, and syncs it
   */
  changeAndSaveItem<M extends DecryptedItemMutator = DecryptedItemMutator>(
    itemToLookupUuidFor: DecryptedItemInterface,
    mutate: (mutator: M) => void,
    updateTimestamps?: boolean,
    emitSource?: PayloadEmitSource,
    syncOptions?: SyncOptions,
  ): Promise<DecryptedItemInterface | undefined>

  /**
   * Mutates pre-existing items, marks them as dirty, and syncs
   */
  changeAndSaveItems<M extends DecryptedItemMutator = DecryptedItemMutator>(
    itemsToLookupUuidsFor: DecryptedItemInterface[],
    mutate: (mutator: M) => void,
    updateTimestamps?: boolean,
    emitSource?: PayloadEmitSource,
    syncOptions?: SyncOptions,
  ): Promise<void>

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
  get mutator(): MutatorClientInterface
  get preferences(): PreferenceServiceInterface
  get sessions(): SessionsClientInterface
  get subscriptions(): SubscriptionManagerInterface
  get user(): UserClientInterface
  get vaults(): VaultServiceInterface
  get vaultLocks(): VaultLockServiceInterface
  get vaultUsers(): VaultUserServiceInterface
  get vaultInvites(): VaultInviteServiceInterface

  readonly identifier: ApplicationIdentifier
  readonly platform: Platform
  device: DeviceInterface
}
