import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { VaultKeyCopyContent } from './VaultKeyCopyContent'

export interface VaultKeyCopyInterface extends DecryptedItemInterface<VaultKeyCopyContent> {
  vaultSystemIdentifier: string

  vaultName?: string
  vaultDescription?: string

  key: string
  keyTimestamp: number
  keyVersion: ProtocolVersion

  get itemsKey(): string
}
