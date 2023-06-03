import { ProtocolVersion } from '@standardnotes/common'

type UserUuid = string
type KeySystemIdentifier = string

export type ItemAuthenticatedData = {
  u: UserUuid
  v: ProtocolVersion
  ksi?: KeySystemIdentifier
}
