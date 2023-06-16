import { ApplicationIdentifier, ContentType } from '@standardnotes/common'
import { BackupFile, DecryptedItemInterface, ItemStream, Platform, PrefKey, PrefValue } from '@standardnotes/models'
import { BackupServiceInterface, FilesClientInterface } from '@standardnotes/files'

import { AlertService } from '../Alert/AlertService'
import { ComponentManagerInterface } from '../Component/ComponentManagerInterface'
import { ApplicationEvent } from '../Event/ApplicationEvent'
import { ApplicationEventCallback } from '../Event/ApplicationEventCallback'
import { FeaturesClientInterface } from '../Feature/FeaturesClientInterface'
import { SubscriptionClientInterface } from '../Subscription/SubscriptionClientInterface'
import { DeviceInterface } from '../Device/DeviceInterface'
import { ItemsClientInterface } from '../Item/ItemsClientInterface'
import { MutatorClientInterface } from '../Mutator/MutatorClientInterface'
import { StorageValueModes } from '../Storage/StorageTypes'

import { DeinitMode } from './DeinitMode'
import { DeinitSource } from './DeinitSource'
import { UserClientInterface } from '../User/UserClientInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { HomeServerServiceInterface } from '../HomeServer/HomeServerServiceInterface'

export interface ApplicationInterface {
  deinit(mode: DeinitMode, source: DeinitSource): void
  getDeinitMode(): DeinitMode
  isStarted(): boolean
  isLaunched(): boolean
  addEventObserver(callback: ApplicationEventCallback, singleEvent?: ApplicationEvent): () => void
  hasProtectionSources(): boolean
  createEncryptedBackupFileForAutomatedDesktopBackups(): Promise<BackupFile | undefined>
  createEncryptedBackupFile(): Promise<BackupFile | undefined>
  createDecryptedBackupFile(): Promise<BackupFile | undefined>
  hasPasscode(): boolean
  lock(): Promise<void>
  softLockBiometrics(): void
  setValue(key: string, value: unknown, mode?: StorageValueModes): void
  getValue(key: string, mode?: StorageValueModes): unknown
  removeValue(key: string, mode?: StorageValueModes): Promise<void>
  isLocked(): Promise<boolean>
  getPreference<K extends PrefKey>(key: K): PrefValue[K] | undefined
  getPreference<K extends PrefKey>(key: K, defaultValue: PrefValue[K]): PrefValue[K]
  getPreference<K extends PrefKey>(key: K, defaultValue?: PrefValue[K]): PrefValue[K] | undefined
  setPreference<K extends PrefKey>(key: K, value: PrefValue[K]): Promise<void>
  streamItems<I extends DecryptedItemInterface = DecryptedItemInterface>(
    contentType: ContentType | ContentType[],
    stream: ItemStream<I>,
  ): () => void
  hasAccount(): boolean
  setCustomHost(host: string): Promise<void>
  isUsingHomeServer(): Promise<boolean>
  get features(): FeaturesClientInterface
  get componentManager(): ComponentManagerInterface
  get items(): ItemsClientInterface
  get mutator(): MutatorClientInterface
  get user(): UserClientInterface
  get files(): FilesClientInterface
  get subscriptions(): SubscriptionClientInterface
  get fileBackups(): BackupServiceInterface | undefined
  get sessions(): SessionsClientInterface
  get homeServer(): HomeServerServiceInterface
  readonly identifier: ApplicationIdentifier
  readonly platform: Platform
  deviceInterface: DeviceInterface
  alertService: AlertService
}
