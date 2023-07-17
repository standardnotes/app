import { Role } from '../Temp/Role'

export type HttpResponseMeta = {
  auth: {
    userUuid?: string
    roles?: Role[]
  }
  server: {
    filesServerUrl?: string
  }
}
