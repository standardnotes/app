import { Uuid } from '@standardnotes/common'

const UserPaths = {
  register: '/v1/users',
  deleteAccount: (userUuid: Uuid) => `/v1/users/${userUuid}`,
}

export const Paths = {
  v1: {
    ...UserPaths,
  },
}
