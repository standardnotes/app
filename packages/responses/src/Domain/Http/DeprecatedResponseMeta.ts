import { Role } from '../Temp/Role'

export type DeprecatedResponseMeta = {
  auth: {
    userUuid?: string
    roles?: Role[]
  }
  server: {
    filesServerUrl?: string
  }
}
