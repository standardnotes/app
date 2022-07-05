import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { RootKeyParamsInterface } from '../KeyParams/RootKeyParamsInterface'
import { NamespacedRootKeyInKeychain, RootKeyContentInStorage } from './KeychainTypes'
import { RootKeyContent } from './RootKeyContent'

export interface RootKeyInterface extends DecryptedItemInterface<RootKeyContent> {
  readonly keyParams: RootKeyParamsInterface
  get keyVersion(): ProtocolVersion
  get itemsKey(): string
  get masterKey(): string
  get serverPassword(): string | undefined
  get dataAuthenticationKey(): string | undefined
  compare(otherKey: RootKeyInterface): boolean
  persistableValueWhenWrapping(): RootKeyContentInStorage
  getKeychainValue(): NamespacedRootKeyInKeychain
}
