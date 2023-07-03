import {
  FullyFormedPayloadInterface,
  PayloadInterface,
  RootKeyInterface,
  FullyFormedTransferPayload,
} from '@standardnotes/models'
import { StoragePersistencePolicies, StorageValueModes } from './StorageTypes'

export interface StorageServiceInterface {
  getAllRawPayloads(): Promise<FullyFormedTransferPayload[]>
  getAllKeys(mode?: StorageValueModes): string[]
  getValue<T>(key: string, mode?: StorageValueModes, defaultValue?: T): T
  canDecryptWithKey(key: RootKeyInterface): Promise<boolean>
  savePayload(payload: PayloadInterface): Promise<void>
  savePayloads(decryptedPayloads: PayloadInterface[]): Promise<void>
  setValue<T>(key: string, value: T, mode?: StorageValueModes): void
  removeValue(key: string, mode?: StorageValueModes): Promise<void>
  setPersistencePolicy(persistencePolicy: StoragePersistencePolicies): Promise<void>
  clearAllData(): Promise<void>
  deletePayloads(payloads: FullyFormedPayloadInterface[]): Promise<void>
  deletePayloadsWithUuids(uuids: string[]): Promise<void>
  clearAllPayloads(): Promise<void>
}
