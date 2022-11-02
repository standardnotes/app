import { Uuid } from '@standardnotes/common'

const UserRequestPaths = {
  submitUserRequest: (userUuid: Uuid) => `/v1/users/${userUuid}/requests`,
}

export const Paths = {
  v1: {
    ...UserRequestPaths,
  },
}
