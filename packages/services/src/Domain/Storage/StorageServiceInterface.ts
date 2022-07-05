import { PayloadInterface, RootKeyInterface } from '@standardnotes/models'
import { StorageValueModes } from './StorageTypes'

export interface StorageServiceInterface {
  getValue<T>(key: string, mode?: StorageValueModes, defaultValue?: T): T

  canDecryptWithKey(key: RootKeyInterface): Promise<boolean>

  savePayload(payload: PayloadInterface): Promise<void>

  savePayloads(decryptedPayloads: PayloadInterface[]): Promise<void>

  setValue(key: string, value: unknown, mode?: StorageValueModes): void

  removeValue(key: string, mode?: StorageValueModes): Promise<void>
}
