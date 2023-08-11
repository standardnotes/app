import { ProtocolVersion } from '@standardnotes/models'

type UserUuid = string
type KeySystemIdentifier = string
type SharedVaultUuid = string

export type ItemAuthenticatedData = {
  u: UserUuid
  v: ProtocolVersion
  ksi?: KeySystemIdentifier
  svu?: SharedVaultUuid
}
