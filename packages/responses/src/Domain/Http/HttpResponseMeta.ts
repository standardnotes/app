import { Role } from '@standardnotes/security'

export type HttpResponseMeta = {
  auth: {
    userUuid?: string
    roles?: Role[]
  }
  server: {
    filesServerUrl?: string
  }
}
