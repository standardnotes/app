import { DecryptedPayloadInterface, EncryptedPayloadInterface } from '@standardnotes/models'

export interface EncryptionTypeSplit<T = EncryptedPayloadInterface | DecryptedPayloadInterface> {
  rootKeyEncryption?: T[]
  keySystemRootKeyEncryption?: T[]
  itemsKeyEncryption?: T[]
}
