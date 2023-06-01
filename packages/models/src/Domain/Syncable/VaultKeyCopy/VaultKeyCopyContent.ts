import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'

export type VaultKeyCopyContentSpecialized = {
  vaultSystemIdentifier: string
  vaultName: string
  vaultDescription?: string

  key: string
  keyTimestamp: number
  keyVersion: ProtocolVersion
}

export type VaultKeyCopyContent = VaultKeyCopyContentSpecialized & ItemContent
