import { ProtocolVersion } from '@standardnotes/common'

type UserUuid = string
type VaultSystemIdentifier = string

export type ItemAuthenticatedData = {
  u: UserUuid
  v: ProtocolVersion
  vsi?: VaultSystemIdentifier
}
