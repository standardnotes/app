import { AnyKeyParamsContent } from '@standardnotes/common'
import { ApiEndpointParam } from '@standardnotes/responses'

export type UserRegistrationRequestParams = AnyKeyParamsContent & {
  [ApiEndpointParam.ApiVersion]: string
  [additionalParam: string]: unknown
  password: string
  email: string
  hvm_token?: string
  ephemeral: boolean
}
