import {
  FullyFormedPayloadInterface,
  PayloadInterface,
  RootKeyInterface,
  FullyFormedTransferPayload,
} from '@standardnotes/models'
import { StoragePersistencePolicies, StorageValueModes } from './StorageTypes'

export interface StorageServiceInterface {
  initializeFromDisk(): Promise<void>
  isStorageWrapped(): boolean
  decryptStorage(): Promise<void>
  getAllRawPayloads(): Promise<FullyFormedTransferPayload[]>
  getAllKeys(mode?: StorageValueModes): string[]
  getValue<T>(key: string, mode?: StorageValueModes, defaultValue?: T): T
  canDecryptWithKey(key: RootKeyInterface): Promise<boolean>
  setValue<T>(key: string, value: T, mode?: StorageValueModes): void
  removeValue(key: string, mode?: StorageValueModes): Promise<void>
  setPersistencePolicy(persistencePolicy: StoragePersistencePolicies): Promise<void>
  clearAllData(): Promise<void>

  getRawPayloads(uuids: string[]): Promise<FullyFormedTransferPayload[]>
  savePayload(payload: PayloadInterface): Promise<void>
  savePayloads(decryptedPayloads: PayloadInterface[]): Promise<void>
  deletePayloads(payloads: FullyFormedPayloadInterface[]): Promise<void>
  deletePayloadsWithUuids(uuids: string[]): Promise<void>

  clearAllPayloads(): Promise<void>
  isEphemeralSession(): boolean
}
