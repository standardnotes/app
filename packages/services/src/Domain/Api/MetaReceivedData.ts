import { Role } from '@standardnotes/security'

export type MetaReceivedData = {
  userUuid: string
  userRoles: Role[]
}
