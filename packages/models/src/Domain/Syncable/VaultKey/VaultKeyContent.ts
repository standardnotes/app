import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'

export type VaultKeyContentSpecialized = {
  vaultUuid: string
  vaultName?: string
  vaultDescription?: string
  vaultKey: string
  keyTimestamp: number
  keyVersion: ProtocolVersion
}

export type VaultKeyContent = VaultKeyContentSpecialized & ItemContent
