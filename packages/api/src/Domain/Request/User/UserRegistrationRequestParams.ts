import { AnyKeyParamsContent } from '@standardnotes/common'
import { ApiEndpointParam } from '@standardnotes/responses'
import { ApiVersion } from '../../Api/ApiVersion'

export type UserRegistrationRequestParams = AnyKeyParamsContent & {
  [ApiEndpointParam.ApiVersion]: ApiVersion.v0
  [additionalParam: string]: unknown
  password: string
  email: string
  ephemeral: boolean
  public_key: string
  signing_public_key: string
}
