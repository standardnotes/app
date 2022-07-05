import { DecryptedPayloadInterface, EncryptedPayloadInterface } from '@standardnotes/models'

export interface EncryptionTypeSplit<T = EncryptedPayloadInterface | DecryptedPayloadInterface> {
  rootKeyEncryption?: T[]
  itemsKeyEncryption?: T[]
}
