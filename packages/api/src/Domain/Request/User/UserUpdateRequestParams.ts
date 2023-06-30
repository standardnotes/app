import { ApiEndpointParam } from '@standardnotes/responses'
import { ApiVersion } from '../../Api/ApiVersion'

export type UserUpdateRequestParams = {
  [ApiEndpointParam.ApiVersion]: ApiVersion.v0
  user_uuid: string
}
