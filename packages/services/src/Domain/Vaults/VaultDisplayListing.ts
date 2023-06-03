import { KeySystemIdentifier } from '@standardnotes/models'

export type VaultDisplayListing = {
  keySystemIdentifier: KeySystemIdentifier
  name: string
  description?: string
}
