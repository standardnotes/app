import { UserRequestType, Uuid } from '@standardnotes/common'

export type UserRequestRequestParams = {
  userUuid: Uuid
  requestType: UserRequestType
  [additionalParam: string]: unknown
}
