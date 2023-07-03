import { ApplicationIdentifier, ProtocolVersion } from '@standardnotes/common'
import { RootKeyContentSpecialized } from './RootKeyContent'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export type RawKeychainValue = Record<ApplicationIdentifier, NamespacedRootKeyInKeychain>

export interface NamespacedRootKeyInKeychain {
  version: ProtocolVersion
  masterKey: string
  dataAuthenticationKey?: string
  encryptionKeyPair: PkcKeyPair | undefined
  signingKeyPair: PkcKeyPair | undefined
}

export type RootKeyContentInStorage = RootKeyContentSpecialized
