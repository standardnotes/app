import { ApiEndpointParam } from '@standardnotes/responses'

export type UserUpdateRequestParams = {
  [ApiEndpointParam.ApiVersion]: string
  user_uuid: string
}
