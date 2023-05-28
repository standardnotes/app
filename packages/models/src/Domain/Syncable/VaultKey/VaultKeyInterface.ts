import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { VaultKeyContent } from './VaultKeyContent'

export interface VaultKeyInterface extends DecryptedItemInterface<VaultKeyContent> {
  vaultUuid: string
  vaultName?: string
  vaultDescription?: string
  vaultKey: string
  keyTimestamp: number
  keyVersion: ProtocolVersion

  get itemsKey(): string
}
