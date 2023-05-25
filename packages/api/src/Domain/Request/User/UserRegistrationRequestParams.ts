import { AnyKeyParamsContent } from '@standardnotes/common'
import { ApiEndpointParam } from '@standardnotes/responses'
import { ApiVersion } from '../../Api/ApiVersion'

export type UserRegistrationRequestParams = AnyKeyParamsContent & {
  [ApiEndpointParam.ApiVersion]: ApiVersion.v0
  password: string
  email: string
  ephemeral: boolean
  [additionalParam: string]: unknown
  public_key?: string
  encrypted_private_key?: string
}
