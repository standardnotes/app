import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { RootKeyParamsInterface } from '../KeyParams/RootKeyParamsInterface'
import { NamespacedRootKeyInKeychain, RootKeyContentInStorage } from './KeychainTypes'
import { RootKeyContent } from './RootKeyContent'
import { ProtocolVersion } from '../Protocol/ProtocolVersion'

export interface RootKeyInterface extends DecryptedItemInterface<RootKeyContent> {
  readonly keyParams: RootKeyParamsInterface

  get keyVersion(): ProtocolVersion
  get itemsKey(): string
  get masterKey(): string
  get serverPassword(): string | undefined
  get dataAuthenticationKey(): string | undefined

  get encryptionKeyPair(): PkcKeyPair | undefined
  get signingKeyPair(): PkcKeyPair | undefined

  compare(otherKey: RootKeyInterface): boolean
  persistableValueWhenWrapping(): RootKeyContentInStorage
  getKeychainValue(): NamespacedRootKeyInKeychain
}
