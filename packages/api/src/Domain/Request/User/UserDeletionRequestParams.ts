import { Uuid } from '@standardnotes/common'

export type UserDeletionRequestParams = {
  userUuid: Uuid
  [additionalParam: string]: unknown
}
