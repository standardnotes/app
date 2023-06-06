import { ApiEndpointParam } from '@standardnotes/responses'
import { ApiVersion } from '../../Api/ApiVersion'

export type UserUpdateRequestParams = {
  [ApiEndpointParam.ApiVersion]: ApiVersion.v0
  user_uuid: string
  public_key: string
  signing_public_key: string
}
