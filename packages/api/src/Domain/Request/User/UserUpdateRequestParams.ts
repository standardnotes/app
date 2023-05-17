import { AnyKeyParamsContent } from '@standardnotes/common'
import { ApiEndpointParam } from '@standardnotes/responses'
import { ApiVersion } from '../../Api/ApiVersion'

export type UserUpdateRequestParams = AnyKeyParamsContent & {
  [ApiEndpointParam.ApiVersion]: ApiVersion.v0
  userUuid: string
  publicKey?: string
  encryptedPrivateKey?: string
}
