import { EncryptedPayloadInterface, KeySystemRootKeyInterface, RootKeyInterface } from '@standardnotes/models'

export interface DecryptPayloadsDTO {
  payloads: EncryptedPayloadInterface[]
  key?: RootKeyInterface | KeySystemRootKeyInterface
  fallbackRootKey?: RootKeyInterface
}
