import { Role } from '@standardnotes/security'

export type ResponseMeta = {
  auth: {
    userUuid?: string
    roles?: Role[]
  }
  server: {
    filesServerUrl?: string
  }
}
