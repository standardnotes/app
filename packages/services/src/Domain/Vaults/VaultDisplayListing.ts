import { KeySystemIdentifier } from '@standardnotes/models'

export type VaultDisplayListing = {
  systemIdentifier: KeySystemIdentifier
  name: string
  description?: string
}
