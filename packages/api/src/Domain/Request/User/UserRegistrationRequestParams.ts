import { AnyKeyParamsContent } from '@standardnotes/common'
import { ApiEndpointParam } from '../ApiEndpointParam'
import { ApiVersion } from '../../Api/ApiVersion'

export type UserRegistrationRequestParams = AnyKeyParamsContent & {
  [ApiEndpointParam.ApiVersion]: ApiVersion.v0
  password: string
  email: string
  ephemeral: boolean
  [additionalParam: string]: unknown
  pkcPublicKey?: string
  pkcEncryptedPrivateKey?: string
}
