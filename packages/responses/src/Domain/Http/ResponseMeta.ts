import { Role } from '@standardnotes/security'
import { Uuid } from '@standardnotes/common'

export type ResponseMeta = {
  auth: {
    userUuid?: Uuid
    roles?: Role[]
  }
  server: {
    filesServerUrl?: string
  }
}
