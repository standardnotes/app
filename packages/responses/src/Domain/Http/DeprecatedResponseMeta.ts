import { Role } from '@standardnotes/security'

export type DeprecatedResponseMeta = {
  auth: {
    userUuid?: string
    roles?: Role[]
  }
  server: {
    filesServerUrl?: string
  }
}
