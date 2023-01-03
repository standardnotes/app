import { ApplicationIdentifier, ProtocolVersion } from '@standardnotes/common'
import { RootKeyContentSpecialized } from './RootKeyContent'

export type RawKeychainValue = Record<ApplicationIdentifier, NamespacedRootKeyInKeychain>

export interface NamespacedRootKeyInKeychain {
  version: ProtocolVersion
  masterKey: string
  dataAuthenticationKey?: string
}

export type RootKeyContentInStorage = RootKeyContentSpecialized
