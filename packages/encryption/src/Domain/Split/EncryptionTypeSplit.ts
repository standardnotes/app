import { DecryptedPayloadInterface, EncryptedPayloadInterface } from '@standardnotes/models'

export interface EncryptionTypeSplit<T = EncryptedPayloadInterface | DecryptedPayloadInterface> {
  rootKeyEncryption?: T[]
  vaultKeyEncryption?: T[]
  itemsKeyEncryption?: T[]
}
