import { UserRequestType } from '@standardnotes/common'

export type UserRequestRequestParams = {
  userUuid: string
  requestType: UserRequestType
  [additionalParam: string]: unknown
}
