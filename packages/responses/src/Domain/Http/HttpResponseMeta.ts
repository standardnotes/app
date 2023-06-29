import { Role } from '@standardnotes/security'

export type HttpResponseMeta = {
  auth: {
    userUuid?: string
    publicKey?: string
    roles?: Role[]
  }
  server: {
    filesServerUrl?: string
  }
}
