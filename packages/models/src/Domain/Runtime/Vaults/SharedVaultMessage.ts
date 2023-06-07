import { KeySystemRootKeyContentSpecialized } from '../../Syncable/KeySystemRootKey/KeySystemRootKeyContent'
import { TrustedContactContent } from '../../Syncable/TrustedContact/TrustedContactContent'

export enum SharedVaultMessageType {
  Contact = 'contact',
  RootKey = 'root_key',
}

export type SharedVaultMessageRootKey = {
  type: SharedVaultMessageType.RootKey
  data: KeySystemRootKeyContentSpecialized
}

export type SharedVaultMessageTrustedContact = {
  type: SharedVaultMessageType.Contact
  data: TrustedContactContent
}

export type SharedVaultMessage = SharedVaultMessageRootKey | SharedVaultMessageTrustedContact
