import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { KeySystemIdentifier } from '../../Utilities/Vault/KeySystemIdentifier'

export type VaultKeyCopyContentSpecialized = {
  keySystemIdentifier: KeySystemIdentifier
  vaultName: string
  vaultDescription?: string

  key: string
  keyTimestamp: number
  keyVersion: ProtocolVersion
}

export type VaultKeyCopyContent = VaultKeyCopyContentSpecialized & ItemContent
