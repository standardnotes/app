import { DecryptedPayloadInterface, KeySystemRootKeyInterface, RootKeyInterface } from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export interface EncryptPayloadsDTO {
  payloads: DecryptedPayloadInterface[]
  key?: RootKeyInterface | KeySystemRootKeyInterface
  fallbackRootKey?: RootKeyInterface
  signingKeyPair?: PkcKeyPair
}
